import React from 'react';
import { ChatMessage } from '../types/index';
import { useTranslation } from 'react-i18next';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  messages: ChatMessage[];
  onPersonalizationClick: () => void;
  onSettingsClick: () => void;
  chatHistory: Array<{ id: string; title: string }>;
  onNewChat: () => void;
  onChatsClick?: () => void;
  chatsViewActive?: boolean;
  onLoadChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  onLoginClick?: () => void;
  user: { id: string; email: string; profilePicture?: string | null; displayName?: string | null } | null;
  onLogout: () => void;
  onSaveLanguagePreference?: (lang: string) => void;
}
const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, messages: _messages, onNewChat, onChatsClick, chatsViewActive, chatHistory, onLoadChat, onDeleteChat, onLoginClick, user, onLogout, onSettingsClick, onSaveLanguagePreference }) => {
  const expanded = isOpen;
  const sidebarWidth = expanded ? '16rem' : '3.5rem';

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm lg:hidden z-40"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed lg:relative z-50 h-full sidebar-glass transition-all duration-300 ease-in-out
        `}
        style={{
          width: sidebarWidth,
        }}
      >
        <SidebarInner
          expanded={expanded}
          onToggle={onToggle}
          onNewChat={onNewChat}
          onChatsClick={onChatsClick}
          chatsViewActive={chatsViewActive}
          chatHistory={chatHistory}
          onLoadChat={onLoadChat}
          onDeleteChat={onDeleteChat}
          onLoginClick={onLoginClick}
          user={user}
          onLogout={onLogout}
          onSettingsClick={onSettingsClick}
          onSaveLanguagePreference={onSaveLanguagePreference}
        />
      </div>
    </>
  );
}


const SidebarInner: React.FC<{
  expanded: boolean;
  onToggle: () => void;
  onNewChat: () => void;
  onChatsClick?: () => void;
  chatsViewActive?: boolean;
  chatHistory: Array<{ id: string; title: string }>;
  onLoadChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  onLoginClick?: () => void;
  user: { id: string; email: string; profilePicture?: string | null } | null;
  onLogout: () => void;
  onSettingsClick: () => void;
  onSaveLanguagePreference?: (lang: string) => void;
}> = ({ expanded, onToggle, onNewChat, onChatsClick, chatsViewActive, chatHistory, onLoadChat, onDeleteChat, onLoginClick, user, onLogout, onSettingsClick, onSaveLanguagePreference }) => {
  const { t, i18n } = useTranslation();
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const [languageMenuOpen, setLanguageMenuOpen] = React.useState(false);
  
  const languageMenuRef = React.useRef<HTMLDivElement>(null);
  const profileBtnRef = React.useRef<HTMLButtonElement>(null);
  const popupRef = React.useRef<HTMLDivElement>(null);
  const languageCloseTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (userMenuOpen) {
        const clickedInsidePopup = popupRef.current && popupRef.current.contains(target);
        const clickedProfileBtn = profileBtnRef.current && profileBtnRef.current.contains(target);
        if (!clickedInsidePopup && !clickedProfileBtn) setUserMenuOpen(false);
      }
      if (languageMenuOpen) {
        const clickedInsideLanguage = languageMenuRef.current && languageMenuRef.current.contains(target);
        const clickedInsidePopup = popupRef.current && popupRef.current.contains(target);
        if (!clickedInsideLanguage && !clickedInsidePopup) {
          if (languageCloseTimeoutRef.current) clearTimeout(languageCloseTimeoutRef.current);
          languageCloseTimeoutRef.current = null;
          setLanguageMenuOpen(false);
        }
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [userMenuOpen, languageMenuOpen]);

  React.useEffect(() => () => {
    if (languageCloseTimeoutRef.current) clearTimeout(languageCloseTimeoutRef.current);
  }, []);

  return (
  <div
    className="h-full flex flex-col"
    style={{
      width: expanded ? '16rem' : '3.5rem',
      transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
      overflow: 'visible',
    }}
  >
    {/* Header - Esoteric Eye Logo or Toggle */}
      <div className="p-3 flex items-center justify-between">
      <div className="flex items-center justify-center lg:justify-start flex-1">
        {expanded && (
          <>
            <style>{`
              @keyframes rotateStar {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              .essence-logo {
                animation: rotateStar 8s linear infinite;
              }
            `}</style>
            <img src="/silver.png" alt="Essence" className="essence-logo w-6 h-6 flex-shrink-0" />
            <span className="ml-3 text-base font-light text-slate-200" style={{ fontFamily: "'Playfair Display', serif" }}>Essence</span>
          </>
        )}
      </div>
      <button
        onClick={onToggle}
        className="flex-shrink-0 rounded transition-all p-2 text-slate-400 hover:text-slate-200 hover:shadow-lg group relative z-40 flex items-center"
      >
        <img
          src="/sidebar-toggle.png"
          alt={expanded ? t('sidebar.close_sidebar') : t('sidebar.open_sidebar')}
          className="w-5 h-5 transition-transform duration-300 group-hover:scale-110 object-contain dark:invert"
        />
        {/* Tooltip - same line as logo, like other sidebar buttons */}
        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 hidden group-hover:flex tooltip-custom z-50 pointer-events-none items-center">
          <span className="text-xs">{expanded ? t('sidebar.close_sidebar') : t('sidebar.open_sidebar')}</span>
        </div>
      </button>
    </div>

    {/* Navigation */}
    <div className="p-3 mt-4 space-y-3">
      <NavItem 
        label={t('sidebar.new_chat')} 
        expanded={expanded} 
        onClick={onNewChat}
        icon="plus"
      />
      <NavItem
        label={t('sidebar.chats')}
        expanded={expanded}
        onClick={onChatsClick ?? (() => {})}
        icon="chat"
        active={chatsViewActive}
      />
      
      {expanded && (
        <>
          <div className="my-3 border-t border-slate-700/20" />
          <h3 className="text-sm font-semibold text-slate-100 mb-2 mt-3 px-1">{t('sidebar.history')}</h3>
        </>
      )}
    </div>

    {/* Spacer for collapsed state */}
    {!expanded && <div className="flex-1" />}

    {/* Recent Chats */}
    {expanded && chatHistory.length > 0 && (
      <div className="px-3 pb-4 flex-1 overflow-y-auto">
        <div className="space-y-1">
          {chatHistory.map((chat) => (
            <div
              key={chat.id}
              className="p-2 rounded cursor-pointer transition-all duration-200 hover:bg-slate-800/40 group flex items-center justify-between"
              onClick={() => onLoadChat(chat.id)}
            >
              <p className="text-sm text-slate-400 hover:text-slate-300 truncate flex-1">
                {!chat.title || chat.title.trim() === '' || chat.title === 'New Chat' ? t('sidebar.new_chat') : chat.title}
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteChat(chat.id);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-red-400"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Profile / Auth Section at Bottom */}
    {user ? (
      <div className={`${expanded ? 'mt-auto' : ''} p-3 border-t border-slate-700/20 relative overflow-visible`}>
        <button
          ref={profileBtnRef}
          className="w-full flex items-center justify-center gap-2 rounded-full transition-all hover:bg-slate-800/40 p-1.5 group"
          onClick={(e) => { 
            e.stopPropagation(); 
            setUserMenuOpen((s) => !s);
          }}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600/50 flex items-center justify-center flex-shrink-0 group-hover:border-slate-400/50 transition-colors overflow-hidden">
            {user.profilePicture ? (
              <img 
                src={user.profilePicture} 
                alt={user.email}
                className="w-full h-full object-cover"
              />
            ) : (
              <svg className="w-5 h-5 text-slate-400 group-hover:text-slate-200" viewBox="0 0 64 64" fill="none">
                <ellipse cx="32" cy="32" rx="16" ry="18" stroke="currentColor" strokeWidth="1.2"/>
                <circle cx="32" cy="32" r="9" stroke="currentColor" strokeWidth="1.2"/>
                <circle cx="32" cy="32" r="4" fill="currentColor"/>
              </svg>
            )}
          </div>
          {(() => {
            const rawName = (user as any).displayName || user.email || '';
            const derived = rawName && rawName.endsWith('@github.placeholder') ? rawName.split('@')[0] : rawName;
            return (
              <>
                {expanded && (
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm text-slate-400 truncate">{derived}</p>
                  </div>
                )}
              </>
            );
          })()}
        </button>

        {userMenuOpen && (
          <div
            ref={popupRef}
            className={`absolute dark:bg-dark-800 bg-white backdrop-blur-sm dark:border-slate-600/40 border border-slate-400 rounded-lg shadow-xl z-50 ${
                expanded ? 'left-1/2 transform -translate-x-1/2 bottom-full mb-2 w-56' : 'top-full left-full ml-2 w-48'
              }`}
              style={{ transform: expanded ? 'translateX(-50%)' : undefined }}
          >
            <button
              className="w-full text-left px-4 py-3 dark:hover:bg-slate-700/40 hover:bg-slate-100 dark:text-slate-300 text-slate-800 flex items-center gap-3 first:rounded-t-lg border border-transparent dark:hover:border-slate-600/40 hover:border-slate-300 rounded-md"
              onClick={() => { onSettingsClick(); setUserMenuOpen(false); }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              <span className="text-sm">{t('sidebar.settings')}</span>
            </button>
            <button
              className="w-full text-left px-4 py-3 dark:hover:bg-slate-700/40 hover:bg-slate-100 dark:text-slate-300 text-slate-800 flex items-center justify-between gap-3 first:rounded-t-lg border border-transparent dark:hover:border-slate-600/40 hover:border-slate-300 rounded-md group"
              onMouseEnter={() => setLanguageMenuOpen(true)}
            >
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M2.05 12h19.9" />
                  <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M12 2.05v19.9" />
                  <path strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" d="M16 7a20 20 0 010 10M8 7a20 20 0 000 10" />
                </svg>
                <span className="text-sm">{t('sidebar.language')}</span>
              </div>
              <svg className={`w-4 h-4 dark:text-slate-500 text-slate-600 transition-transform duration-200 ${languageMenuOpen ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 6l6 6-6 6" />
              </svg>
            </button>

            {languageMenuOpen && (
              <div 
                ref={languageMenuRef} 
                className="absolute left-full ml-1 top-3 dark:bg-dark-800 bg-white backdrop-blur-sm dark:border-slate-600/40 border border-slate-400 rounded-lg shadow-xl w-56 py-1 animate-in fade-in duration-200 z-50 pointer-events-auto"
                onMouseEnter={() => {
                  if (languageCloseTimeoutRef.current) {
                    clearTimeout(languageCloseTimeoutRef.current);
                    languageCloseTimeoutRef.current = null;
                  }
                }}
                onMouseLeave={() => setLanguageMenuOpen(false)}
              >
                {[
                  { code: 'en', label: 'English (United States)' },
                  { code: 'zh', label: '中文 (Simplified Chinese)' },
                  { code: 'fr', label: 'Français (France)' },
                  { code: 'nl', label: 'Nederlands (Netherlands)' },
                ].map((lang) => (
                  <button
                    key={lang.code}
                    className={`w-full text-left px-4 py-2 text-sm transition-all border border-transparent dark:hover:border-slate-600/40 hover:border-slate-300 rounded-md ${
                      i18n.language === lang.code
                        ? 'dark:bg-slate-700/60 bg-slate-200 dark:text-slate-100 text-slate-900 font-medium'
                        : 'dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700/40 text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                    onClick={() => {
                      i18n.changeLanguage(lang.code);
                      onSaveLanguagePreference?.(lang.code);
                      setLanguageMenuOpen(false);
                    }}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
            <button
              className="w-full text-left px-3 py-2 dark:text-slate-300 text-slate-800 dark:hover:bg-slate-700/40 hover:bg-slate-100 flex items-center gap-3 last:rounded-b-lg border border-transparent dark:hover:border-slate-600/40 hover:border-slate-300 rounded-md"
              onClick={() => { onLogout(); setUserMenuOpen(false); }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
              <span className="text-sm">{t('sidebar.log_out')}</span>
            </button>
          </div>
        )}
      </div>
    ) : (
      <div className={`${expanded ? 'mt-auto' : ''} p-3 border-t border-slate-700/20 relative z-10`}>
        <button
          onClick={() => onLoginClick?.()}
          className="w-full flex items-center justify-center gap-2 rounded transition-all hover:bg-slate-800/40 p-2 text-slate-300 hover:text-slate-200"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 17l5-5-5-5v10z" />
          </svg>
          {expanded && <span className="text-sm font-light">{t('sidebar.log_in')}</span>}
        </button>
      </div>
    )}

  </div>
  );
};

const NavItem: React.FC<{
  label: string;
  active?: boolean;
  onClick?: () => void;
  expanded?: boolean;
  icon?: 'plus' | 'chat';
}> = ({ label, active, onClick, expanded, icon = 'plus' }) => (
  <button
    onClick={onClick}
    className={`
      w-full flex items-center gap-2 px-2 py-1.5 rounded transition-all duration-200 group relative
      ${active 
        ? 'bg-slate-700/40 text-slate-100' 
        : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/30'
      }
      ${!expanded ? 'justify-center' : ''}
    `}
  >
    {icon === 'plus' ? (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ) : (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    )}
    {expanded && <span className="text-sm font-semibold">{label}</span>}
    {!expanded && (
      <div className="absolute left-full ml-2 hidden group-hover:flex tooltip-custom z-50 pointer-events-none">
        <span className="text-xs">{label}</span>
      </div>
    )}
  </button>
);

export default Sidebar;