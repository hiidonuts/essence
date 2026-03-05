import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ChatMessage } from "../types/index";
import ReactMarkdown from "react-markdown";

interface MessageBubbleProps {
  message: ChatMessage;
  onEditMessage?: (messageId: string, newContent: string) => void;
  onRerunMessage?: (messageId: string) => void;
  onDeleteMessage?: (messageId: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onEditMessage,
  onRerunMessage,
  onDeleteMessage,
}) => {
  const { t } = useTranslation();
  const isUser = message.sender === "user";
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const editDivRef = useRef<HTMLDivElement>(null);

  const formatTimestamp = (date: Date) => {
    const msgDate = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - msgDate.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 24) {
      return msgDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } else {
      return msgDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleEditStart = () => {
    setIsEditing(true);
    setTimeout(() => {
      if (editDivRef.current) {
        editDivRef.current.focus();
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(editDivRef.current);
        range.collapse(false);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }, 0);
  };

  const handleEditSave = () => {
    if (editedContent.trim() && editedContent !== message.content) {
      onEditMessage?.(message.id, editedContent.trim());
    }
    setIsEditing(false);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEditSave();
    }
  };

  useEffect(() => {
    if (isEditing && editDivRef.current) {
      editDivRef.current.focus();
      if (editDivRef.current.textContent !== editedContent) {
        editDivRef.current.textContent = editedContent;
      }
    }
  }, [isEditing]);

  const handleRerun = () => {
    onRerunMessage?.(message.id);
  };

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-6 group`}
    >
      <div
        className={`flex items-end gap-3 max-w-2xl ${isUser ? "flex-row-reverse" : "flex-row"}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Message Content */}
        <div
          className={`flex flex-col ${isUser ? "items-end" : "items-start"} min-w-0`}
        >
          {isUser ? (
            <div
              className={`
              px-5 py-2 rounded-2xl mb-2 transition-all duration-200
              dark:bg-slate-700 dark:text-slate-100 dark:border dark:border-slate-600/50
              bg-slate-300 text-slate-900 border border-slate-400/50
              ${isEditing ? "ring-2 dark:ring-slate-500 ring-slate-400" : ""}
              `}
            >
              {isEditing ? (
                <div
                  ref={editDivRef}
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={() => handleEditSave()}
                  onKeyDown={handleEditKeyDown}
                  onInput={(e) => {
                    setEditedContent(e.currentTarget.textContent || "");
                  }}
                  className="m-0 whitespace-pre-wrap break-words leading-snug text-base outline-none"
                  style={{ minHeight: "1.5em" }}
                  suppressHydrationWarning
                />
              ) : (
                <p className="m-0 whitespace-pre-wrap break-words leading-snug text-base">
                  {message.content}
                </p>
              )}
            </div>
          ) : (
            <div className="mb-2 prose prose-invert prose-sm max-w-none font-poppins">
              {message.memoryUpdated && (
                <p className="m-0 mb-2 text-xs italic text-emerald-300 flex items-center gap-1 font-poppins">
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                    ★
                  </span>
                  {t("message.chat_memories_updated") || "Chat memories updated"}
                </p>
              )}
              <ReactMarkdown
                components={{
                  p: ({ node, ...props }) => (
                    <p
                      className="m-0 text-slate-200 leading-relaxed text-sm font-poppins"
                      {...props}
                    />
                  ),
                  h1: ({ node, ...props }) => (
                    <h1
                      className="text-2xl font-semibold text-slate-50 mt-4 mb-3 font-poppins"
                      {...props}
                    />
                  ),
                  h2: ({ node, ...props }) => (
                    <h2
                      className="text-xl font-semibold text-slate-100 mt-3 mb-2.5 font-poppins"
                      {...props}
                    />
                  ),
                  h3: ({ node, ...props }) => (
                    <h3
                      className="text-lg font-semibold text-slate-100 mt-2.5 mb-2 font-poppins"
                      {...props}
                    />
                  ),
                  h4: ({ node, ...props }) => (
                    <h4
                      className="text-base font-semibold text-slate-100 mt-2 mb-1.5 font-poppins"
                      {...props}
                    />
                  ),
                  ul: ({ node, ...props }) => (
                    <ul
                      className="list-disc list-inside text-slate-200 my-2.5 space-y-1 font-poppins"
                      {...props}
                    />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol
                      className="list-decimal list-inside text-slate-200 my-2.5 space-y-1 font-poppins"
                      {...props}
                    />
                  ),
                  li: ({ node, ...props }) => (
                    <li
                      className="ml-1 text-slate-200 font-poppins"
                      {...props}
                    />
                  ),
                  code: ({ node, children, ...props }: any) => (
                    <code
                      className="bg-slate-700/60 px-2.5 py-1 rounded text-slate-100 text-xs font-mono"
                      {...props}
                    >
                      {children}
                    </code>
                  ),
                  pre: ({ node, ...props }) => (
                    <pre
                      className="bg-slate-700/50 p-4 rounded-lg overflow-auto text-xs my-3 border border-slate-600/30 font-mono"
                      {...props}
                    />
                  ),
                  blockquote: ({ node, ...props }) => (
                    <blockquote
                      className="border-l-4 border-slate-500 pl-4 text-slate-300 italic my-2.5 bg-slate-800/30 py-2 pr-3 rounded font-poppins"
                      {...props}
                    />
                  ),
                  a: ({ node, ...props }) => (
                    <a
                      className="text-slate-300 hover:text-slate-100 underline underline-offset-2 transition-colors font-poppins"
                      {...props}
                    />
                  ),
                  strong: ({ node, ...props }) => (
                    <strong
                      className="font-semibold text-slate-100"
                      {...props}
                    />
                  ),
                  em: ({ node, ...props }) => (
                    <em className="italic text-slate-300" {...props} />
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}

          {/* Timestamp and Actions */}
          <div className="flex items-center gap-2 whitespace-nowrap min-w-0">
            <p className={`text-xs text-slate-500`}>
              {formatTimestamp(message.timestamp)}
              {copyFeedback && !isUser && (
                <span className="ml-2 text-xs text-slate-400">Copied!</span>
              )}
            </p>

            {/* Hover Actions - Next to Timestamp - Always reserve space */}
            <div
              className={`flex gap-1 items-center ${isHovered && !isEditing ? "visible" : "invisible"}`}
            >
              {/* Copy button for both user and AI */}
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg hover:bg-slate-700/40 text-slate-400 hover:text-slate-200 transition-all"
                title={t('message.tooltip_copy')}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>

              {/* Edit button - only for user messages */}
              {isUser && (
                <button
                  onClick={handleEditStart}
                  className="p-1.5 rounded-lg hover:bg-slate-700/40 text-slate-400 hover:text-slate-200 transition-all"
                  title={t('message.tooltip_edit')}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
              )}

              {/* Rerun button - only for AI responses */}
              {!isUser && (
                <button
                  onClick={handleRerun}
                  className="p-1.5 rounded-lg hover:bg-slate-700/40 text-slate-400 hover:text-slate-200 transition-all"
                  title={t('message.tooltip_rerun')}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
