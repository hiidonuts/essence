import React, { useState, useRef, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ChatMessage } from "../types/index";
import MessageBubble from "./MessageBubble";
import LoadingSpinner from "./LoadingSpinner";
import { getPeriodFromHour, getSmartGreeting, getGreetingSubtitle } from "../utils/greetings";

export const AI_MODELS = [
  { id: "default", name: "Essence (default)", description: "Best for everyday tasks" },
] as const;

interface ChatAreaProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  onRegenerateResponse?: (messages: ChatMessage[], chatId: string) => void;
  onUpdateMessages?: (messages: ChatMessage[]) => void;
  user?: {
    id: string;
    email: string;
    nickname?: string | null;
    displayName?: string | null;
  } | null;
  onLoginClick?: () => void;
  currentChatId: string | null;
  chatHistory: { id: string; title: string }[];
  onRenameChat: (chatId: string, title: string) => Promise<void>;
  onDeleteChat?: (chatId: string) => Promise<void> | void;
  referenceSavedMemories?: boolean;
}

const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  isLoading,
  onSendMessage,
  onRegenerateResponse,
  onUpdateMessages,
  currentChatId,
  chatHistory,
  onRenameChat,
  onDeleteChat: _onDeleteChat,
  user,
  referenceSavedMemories,
}) => {
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState<string>(AI_MODELS[0]?.id ?? "default");
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const maxHeight = messages.length === 0 ? 60 : 72;
    el.style.height = Math.min(el.scrollHeight, maxHeight) + "px";
  }, [inputMessage, messages.length]);

  const selectedModel = AI_MODELS.find((m) => m.id === selectedModelId) ?? AI_MODELS[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modelMenuRef.current && !modelMenuRef.current.contains(e.target as Node)) {
        setModelMenuOpen(false);
      }
    }
    if (modelMenuOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [modelMenuOpen]);

  const effectivelyLoading = isLoading || isRegenerating;

  const [timeOfDayKey, setTimeOfDayKey] = useState(() =>
    getPeriodFromHour(new Date().getHours()),
  );
  const [serverHour, setServerHour] = useState<number | undefined>(undefined);

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    fetch(`/api/time?timezone=${encodeURIComponent(tz)}`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data.hour === "number") {
          setTimeOfDayKey(getPeriodFromHour(data.hour));
          setServerHour(data.hour);
        }
      })
      .catch(() => {});
  }, []);

  const greeting = useMemo(
    () => getSmartGreeting(
      user ? (user.nickname || user.displayName || user.email.split("@")[0]) : undefined,
      serverHour,
      t,
    ),
    [timeOfDayKey, serverHour, user?.nickname, user?.displayName, user?.email, t],
  );
  const subtitle = useMemo(() => getGreetingSubtitle(serverHour, t, !!user), [timeOfDayKey, serverHour, t, !!user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, effectivelyLoading]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const isAtBottom =
        Math.abs(
          container.scrollHeight - container.scrollTop - container.clientHeight,
        ) < 50;
      setShowScrollButton(!isAtBottom);
    };

    container.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (currentChatId) {
      const chat = chatHistory.find((c) => c.id === currentChatId);
      setTitleInput(chat?.title || "New Chat");
    } else {
      setTitleInput("New Chat");
    }
    setIsEditingTitle(false);
  }, [currentChatId, chatHistory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() && !effectivelyLoading) {
      onSendMessage(inputMessage);
      setInputMessage("");
    }
  };

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    const messageIndex = messages.findIndex((m) => m.id === messageId);
    if (messageIndex === -1 || !currentChatId) return;

    setIsRegenerating(true);
    try {
      await fetch(`/api/chats/${currentChatId}/truncate-messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ afterMessageIndex: messageIndex + 1 }),
      });
    } catch (err) {
      console.error("Failed to truncate messages:", err);
    }

    const updatedMessages = messages.slice(0, messageIndex + 1);
    updatedMessages[messageIndex] = {
      ...updatedMessages[messageIndex],
      content: newContent,
    };
    onUpdateMessages?.(updatedMessages);

    try {
      const messagesForAPI = updatedMessages.map((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          messages: messagesForAPI,
          chatId: currentChatId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const aiContent =
          data.choices?.[0]?.message?.content || "(No response)";

        let memoryUpdated = false;
        let memorySummary: string | undefined;

        if (referenceSavedMemories && user) {
          try {
            const memoryRes = await fetch("/api/memories", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                userId: user.id,
                chatId: currentChatId,
                text: newContent,
              }),
            });
            if (memoryRes.ok) {
              const memoryData = await memoryRes.json();
              if (
                memoryData?.shouldSave &&
                typeof memoryData.summary === "string" &&
                memoryData.summary.trim()
              ) {
                memoryUpdated = true;
                memorySummary = memoryData.summary.trim();
              }
            }
          } catch (err) {
            console.error("Failed to save chat memory from edit:", err);
          }
        }

        const aiResponse: ChatMessage = {
          id: Date.now().toString(),
          content: aiContent,
          sender: "ai",
          timestamp: new Date(),
          memoryUpdated,
          memorySummary,
        };
        onUpdateMessages?.([...updatedMessages, aiResponse]);
      }
    } catch (err) {
      console.error("Failed to generate AI response:", err);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleRerunMessage = async (messageId: string) => {
    const aiMessageIndex = messages.findIndex((m) => m.id === messageId);
    if (aiMessageIndex === -1 || aiMessageIndex === 0 || !currentChatId) return;

    const userMessageIndex = aiMessageIndex - 1;
    const userMessage = messages[userMessageIndex];

    if (userMessage.sender !== "user") return;

    try {
      await fetch(`/api/chats/${currentChatId}/truncate-messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ afterMessageIndex: aiMessageIndex }),
      });
    } catch (err) {
      console.error("Failed to truncate messages:", err);
    }

    const updatedMessages = messages.slice(0, aiMessageIndex);
    onUpdateMessages?.(updatedMessages);

    onRegenerateResponse?.(updatedMessages, currentChatId);
  };

  return (
    <div className="flex-1 flex flex-col h-full transition-all duration-300 relative bg-dark-900">
      {currentChatId && (
        <div
          key={`header-${currentChatId}`}
          className="h-14 flex items-center border-b border-slate-700/10 view-transition-fade-in"
        >
          <div className="flex items-center pl-5 relative w-full max-w-3xl justify-start">
            {isEditingTitle ? (
              <div className="inline-flex items-center gap-2 dark:bg-dark-800/30 bg-slate-100 rounded-full px-3 py-1">
                <input
                  ref={titleInputRef}
                  className="bg-transparent dark:border-slate-600/20 border-slate-300 dark:text-slate-100 text-slate-900 border rounded px-2 py-0.5 text-sm outline-none"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onKeyDown={async (e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (currentChatId) {
                        await onRenameChat(
                          currentChatId,
                          titleInput.trim() || "Untitled",
                        );
                      }
                      setIsEditingTitle(false);
                    } else if (e.key === "Escape") {
                      const chat = chatHistory.find(
                        (c) => c.id === currentChatId,
                      );
                      setTitleInput(chat?.title || "New Chat");
                      setIsEditingTitle(false);
                    }
                  }}
                  onBlur={() => {
                    const chat = chatHistory.find(
                      (c) => c.id === currentChatId,
                    );
                    setTitleInput(chat?.title || "New Chat");
                    setIsEditingTitle(false);
                  }}
                />
              </div>
            ) : (
              <div className="inline-flex items-center gap-2">
                <h3
                  className="text-sm font-semibold dark:text-white text-slate-900 m-0 truncate max-w-xs cursor-text"
                  onClick={() => setIsEditingTitle(true)}
                >
                  {!titleInput || titleInput.trim() === '' || titleInput === 'New Chat'
                    ? t('sidebar.new_chat')
                    : titleInput}
                </h3>
              </div>
            )}
          </div>
        </div>
      )}

      <div
        ref={messagesContainerRef}
        className={`${messages.length === 0 ? "hidden" : "flex-1 overflow-y-auto p-6"}`}
      >
        <div
          key={currentChatId ?? "new"}
          className={
            messages.length === 0
              ? ""
              : "max-w-2xl mx-auto flex flex-col w-full space-y-6 view-transition-chat-content"
          }
        >
          {messages.length !== 0 && (
            <>
              {messages.map((message) => {
                if (
                  !message.sender ||
                  (message.sender !== "user" && message.sender !== "ai")
                ) {
                  console.warn("Invalid message sender:", message);
                  return null;
                }
                return (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    onEditMessage={handleEditMessage}
                    onRerunMessage={handleRerunMessage}
                  />
                );
              })}
              {effectivelyLoading && <LoadingSpinner />}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      <div
        className={`bg-dark-900 transition-all duration-500 ease-out relative ${messages.length === 0 ? "flex-1 flex flex-col items-center justify-center min-h-0 pb-[16vh]" : "flex flex-col items-center justify-center py-4"} px-8`}
      >
        {messages.length === 0 && (
          <div className="w-full max-w-2xl text-center mb-6 -translate-y-4 view-transition-chat-content">
            <div className="space-y-3">
              <div className="flex items-center justify-center mb-4">
                <style>{`
                  @keyframes rotateStar {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                  .essence-logo-main {
                    animation: rotateStar 8s linear infinite;
                  }
                `}</style>
                <img
                  src="/silver.png"
                  alt="Essence"
                  className="essence-logo-main w-20 h-20"
                />
              </div>
              <h3 className="text-3xl font-light text-slate-100 tracking-wide font-serif">
                {greeting}
              </h3>
              <p className="text-slate-400 font-light text-base">
                {subtitle}
              </p>
            </div>
          </div>
        )}
        {showScrollButton && messages.length > 0 && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-44 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white dark:bg-slate-700 border-2 border-slate-800 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-300 flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-md hover:shadow-lg z-10"
            title={t('chat.tooltip_scroll_bottom')}
            aria-label={t('chat.tooltip_scroll_bottom')}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </button>
        )}
        <div
          className={`${messages.length === 0 ? "w-full max-w-2xl -translate-y-2" : "max-w-2xl mx-auto w-full"}`}
        >
          <form onSubmit={handleSubmit}>
            <div
              className={`bg-slate-800/40 border border-slate-600/30 rounded-2xl transition-all duration-300 focus-within:border-slate-600/50 ${
                messages.length === 0 ? "p-4" : "px-3 py-2"
              }`}
            >
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e as unknown as React.FormEvent);
                  }
                }}
                placeholder={
                  messages.length === 0 ? t("chat.ask_anything") : t("chat.reply_placeholder")
                }
                className={`w-full bg-transparent text-slate-200 placeholder-slate-500 outline-none resize-none overflow-y-auto align-top ${
                  messages.length === 0
                    ? "text-base mb-3 px-0 pt-0"
                    : "text-sm min-h-[28px] py-0 px-0 pt-0.5 pb-0 leading-5"
                }`}
                disabled={effectivelyLoading}
                style={{
                  minHeight: messages.length === 0 ? "1.5rem" : "28px",
                  maxHeight: messages.length === 0 ? 60 : 72,
                }}
                rows={1}
                ref={textareaRef}
              />
              <div className="flex items-center justify-between gap-1 min-h-9">
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    className="text-slate-400 hover:text-slate-200 transition-all duration-200 p-1.5 font-light hover:bg-slate-700/30 rounded-md"
                    title={t("chat.tooltip_attach_media")}
                  >
                    <span className={messages.length === 0 ? "text-xl" : "text-base"}>+</span>
                  </button>
                </div>
                <div className="relative flex items-center gap-1.5" ref={modelMenuRef}>
                  <button
                    type="button"
                    onClick={() => setModelMenuOpen((o) => !o)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-slate-100 hover:bg-slate-700/40 border border-transparent hover:border-slate-600/40 transition-all duration-200 text-sm font-medium"
                    aria-expanded={modelMenuOpen}
                    aria-haspopup="true"
                  >
                    <span className="max-w-[120px] truncate">{selectedModel?.name ?? "Model"}</span>
                    <svg
                      className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${modelMenuOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {modelMenuOpen && (
                    <div
                      className="absolute bottom-full right-0 mb-1 w-52 rounded-lg dark:bg-dark-800 bg-white backdrop-blur-sm dark:border-slate-600/40 border border-slate-400 shadow-xl py-1.5 z-50"
                      role="menu"
                    >
                      {AI_MODELS.map((model) => (
                        <button
                          key={model.id}
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setSelectedModelId(model.id);
                            setModelMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2.5 flex items-start gap-3 dark:hover:bg-slate-700/40 hover:bg-slate-100 dark:text-slate-300 text-slate-800 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium dark:text-slate-100 text-slate-900">{model.name}</div>
                            <div className="text-xs dark:text-slate-400 text-slate-500 mt-0.5">{model.description}</div>
                          </div>
                          {selectedModelId === model.id && (
                            <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      ))}
                      <div className="border-t dark:border-slate-600/40 border-slate-400 mt-1 pt-1">
                        <button
                          type="button"
                          className="w-full text-left px-4 py-2 flex items-center gap-2 text-sm dark:text-slate-400 text-slate-600 dark:hover:text-slate-200 hover:text-slate-900 dark:hover:bg-slate-700/40 hover:bg-slate-50 transition-colors"
                        >
                          <span>{t("chat.more_models")}</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || effectivelyLoading}
                    className="text-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 p-2 rounded-lg focus:outline-none focus:ring-0"
                    title={t("chat.tooltip_send_message")}
                  >
                    <svg className="stroke-current fill-none w-4 h-4" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16.6915026,12.4744748 L3.50612381,13.2599618 C3.19218622,13.2599618 3.03521743,13.4170592 3.03521743,13.5741566 L1.15159189,20.0151496 C0.8376543,20.8006365 0.99,21.89 1.77946707,22.52 C2.41,22.99 3.50612381,23.1 4.13399899,22.9429026 L21.714504,14.0454487 C22.6563168,13.5741566 23.1272231,12.6315722 22.9702544,11.6889879 M16.6915026,12.4744748 L21.714504,9.95650473 C22.6563168,9.48520852 23.1272231,8.54261681 22.9702544,7.6 L4.13399899,0.0589671706 C3.34915502,-0.0581302318 2.40734225,0.0581302318 1.77946707,0.5294223602 C0.994623095,1.16080939 0.837654326,2.25015948 1.15159189,3.03563630 L3.03521743,9.4766292 C3.03521743,9.63372660 3.34915502,9.79081400 3.50612381,9.79081400 L16.6915026,10.5763009 C16.6915026,10.5763009 17.1624089,10.5763009 17.1624089,11.0475931 C17.1624089,11.5188852 16.6915026,12.4744748 16.6915026,12.4744748 Z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </form>
          <p className="text-xs text-slate-500 dark:text-slate-500 text-center mt-1 font-light">
            {t("chat.disclaimer")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
