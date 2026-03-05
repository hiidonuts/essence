import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { getRelativeTime } from "../utils/relativeTime";

interface ChatEntry {
  id: string;
  title: string;
  updatedAt: string;
}

interface ChatsViewProps {
  chatHistory: ChatEntry[];
  onLoadChat: (chatId: string) => void;
}

const ChatsView: React.FC<ChatsViewProps> = ({
  chatHistory,
  onLoadChat,
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chatHistory;
    const q = searchQuery.trim().toLowerCase();
    return chatHistory.filter(
      (chat) =>
        (chat.title || "").toLowerCase().includes(q)
    );
  }, [chatHistory, searchQuery]);

  return (
    <div className="flex-1 flex flex-col h-full bg-dark-900 overflow-hidden items-center pt-8">
      <div className="w-full max-w-2xl px-8 flex flex-col flex-1 mx-auto">
        <h1 className="text-3xl font-light text-slate-100 tracking-wide mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>
          {t("chats.title")}
        </h1>

        {/* Search bar */}
        <div className="mb-4">
          <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("chats.search_placeholder")}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-800/60 border border-slate-600/30 text-slate-200 placeholder-slate-500 outline-none focus:border-slate-500/50 transition-colors"
          />
        </div>
        </div>

        {/* Summary line */}
        <div className="pb-2 flex items-center gap-2">
        <span className="text-sm text-slate-400">
          {t("chats.summary", { count: filteredChats.length })}
        </span>
        <button className="text-sm text-blue-400 hover:text-blue-300 underline focus:outline-none focus:ring-0">
          {t("chats.select")}
        </button>
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto pb-8 min-h-0">
          <div className="space-y-0">
          {filteredChats.length === 0 ? (
            <p className="text-slate-500 text-sm py-8">
              {searchQuery.trim()
                ? t("chats.no_results")
                : t("chats.empty")}
            </p>
          ) : (
            filteredChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => onLoadChat(chat.id)}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-800/50 dark:hover:bg-slate-800/40 transition-colors group"
              >
                <div className="font-medium text-slate-100 truncate">
                  {!chat.title || chat.title.trim() === "" || chat.title === "New Chat"
                    ? t("sidebar.new_chat")
                    : chat.title}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {getRelativeTime(chat.updatedAt)}
                </div>
              </button>
            ))
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatsView;
