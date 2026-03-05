import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface SettingsProps {
  user: {
    id: string;
    email: string;
    profilePicture?: string | null;
    displayName?: string | null;
    nickname?: string | null;
    personalPreferences?: string;
  } | null;
  onSaveProfile: (data: ProfileData) => Promise<void>;
  colorMode: 'light' | 'dark' | 'auto';
  onColorModeChange: (mode: 'light' | 'dark' | 'auto') => void;
  onBackToChat?: () => void;
  referenceSavedMemories: boolean;
  onReferenceSavedMemoriesChange: (enabled: boolean) => void;
  memoryUsagePercent: number;
  onMemoryUsageChange: (usage: number) => void;
}

export interface ProfileData {
  displayName: string;
  nickname: string;
  profilePicture?: string | null;
  personalPreferences: string;
}

const Settings: React.FC<SettingsProps> = ({
  user,
  onSaveProfile,
  colorMode,
  onColorModeChange,
  onBackToChat,
  referenceSavedMemories,
  onReferenceSavedMemoriesChange,
  memoryUsagePercent,
  onMemoryUsageChange,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'general' | 'account' | 'memories' | 'privacy' | 'billing'>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [isChatHistoryEnabled, setIsChatHistoryEnabled] = useState(true);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [isLoadingMemories, setIsLoadingMemories] = useState(false);
  const [memorySearch, setMemorySearch] = useState('');
  const [memories, setMemories] = useState<
    { id: string; summary: string; createdAt?: string }[]
  >([]);

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [personalPreferences, setPersonalPreferences] = useState(user?.personalPreferences || '');
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(
    user?.profilePicture || null
  );
  
  const initialDisplayName = user?.displayName || '';
  const initialNickname = user?.nickname || '';
  const initialPersonalPreferences = user?.personalPreferences || '';
  const initialProfilePicture = user?.profilePicture || null;
  
  useEffect(() => {
    setDisplayName(user?.displayName || '');
    setNickname(user?.nickname || '');
    setPersonalPreferences(user?.personalPreferences || '');
    setProfilePicturePreview(user?.profilePicture || null);
  }, [user?.displayName, user?.nickname, user?.personalPreferences, user?.profilePicture]);
  
  const hasProfileChanges = 
    displayName !== initialDisplayName || 
    nickname !== initialNickname || 
    personalPreferences !== initialPersonalPreferences || 
    profilePicturePreview !== initialProfilePicture;

  if (!user) return null;

  const loadMemories = async () => {
    setIsLoadingMemories(true);
    try {
      const res = await fetch('/api/memories', {
        method: 'GET',
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.items)) {
          setMemories(
            data.items.map((item: any) => ({
              id: String(item.id),
              summary: String(item.summary ?? ''),
              createdAt: item.createdAt,
            })),
          );
        }
        if (typeof data.usagePercent === 'number') {
          onMemoryUsageChange(Math.min(100, Math.max(0, data.usagePercent)));
        }
      }
    } catch (err) {
      console.error('Failed to load memories', err);
    } finally {
      setIsLoadingMemories(false);
    }
  };

  const handleOpenMemoryModal = () => {
    setIsMemoryModalOpen(true);
    loadMemories();
  };

  const handleDeleteMemory = async (id: string) => {
    try {
      const res = await fetch(`/api/memories/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setMemories((prev) => prev.filter((m) => m.id !== id));
        loadMemories();
      }
    } catch (err) {
      console.error('Failed to delete memory', err);
    }
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setProfilePicturePreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await onSaveProfile({
        displayName,
        nickname,
        profilePicture: profilePicturePreview,
        personalPreferences,
      });
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-dark-900 items-center justify-start pt-8">
      {/* Settings Layout: Left Sidebar + Right Content */}
      <div className="flex w-full max-w-6xl">
        {/* Left Sidebar */}
        <div className="w-64 px-8 pt-6 pb-8">
          <h1 className="text-3xl font-light text-slate-100 tracking-wide mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>
            {t('settings.title')}
          </h1>

          {/* Sidebar Tabs */}
          <div className="space-y-2">
            <button
              onClick={() => setActiveTab('general')}
              className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                activeTab === 'general'
                  ? 'bg-slate-700/40 text-slate-100 border border-slate-600/40'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/20'
              }`}
            >
              <span className="text-sm font-light">{t('settings.general')}</span>
            </button>
            <button
              onClick={() => setActiveTab('account')}
              className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                activeTab === 'account'
                  ? 'bg-slate-700/40 text-slate-100 border border-slate-600/40'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/20'
              }`}
            >
              <span className="text-sm font-light">{t('settings.account')}</span>
            </button>
            <div className="my-4 border-t border-slate-700/20" />
            <button
              onClick={() => setActiveTab('privacy')}
              className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                activeTab === 'privacy'
                  ? 'bg-slate-700/40 text-slate-100 border border-slate-600/40'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/20'
              }`}
            >
              <span className="text-sm font-light">{t('settings.privacy')}</span>
            </button>
            <button
              onClick={() => setActiveTab('memories')}
              className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                activeTab === 'memories'
                  ? 'bg-slate-700/40 text-slate-100 border border-slate-600/40'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/20'
              }`}
            >
              <span className="text-sm font-light">{t('Memories')}</span>
            </button>
            <button
              onClick={() => setActiveTab('billing')}
              className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                activeTab === 'billing'
                  ? 'bg-slate-700/40 text-slate-100 border border-slate-600/40'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/20'
              }`}
            >
              <span className="text-sm font-light">{t('settings.billing')}</span>
            </button>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 px-8 py-8 pb-8">
          <div className="max-w-4xl">
          {activeTab === 'general' && (
            <div className="space-y-8">
              {/* Profile Section */}
              <div>
                <h2 className="text-lg font-light text-slate-100 mb-6 pb-4 border-b border-slate-700/20">
                  {t('settings.profile')}
                </h2>

                {/* Profile Picture */}
                <div className="mb-8">
                  <label className="block text-xs font-semibold text-slate-400 mb-4 uppercase tracking-wider">
                    {t('settings.profile_picture')}
                  </label>
                  <div className="flex items-start gap-6">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600/50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {profilePicturePreview ? (
                        <img
                          src={profilePicturePreview}
                          alt={t('settings.profile')}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg className="w-12 h-12 text-slate-500" viewBox="0 0 64 64" fill="none">
                          <ellipse
                            cx="32"
                            cy="32"
                            rx="16"
                            ry="18"
                            stroke="currentColor"
                            strokeWidth="1.2"
                          />
                          <circle cx="32" cy="32" r="9" stroke="currentColor" strokeWidth="1.2" />
                          <circle cx="32" cy="32" r="4" fill="currentColor" />
                        </svg>
                      )}
                    </div>
                    <div className="flex flex-col gap-3 justify-center">
                      <label className="cursor-pointer px-4 py-2 rounded-lg bg-slate-700/40 border border-slate-600/40 text-slate-300 hover:bg-slate-700/60 hover:text-slate-200 transition-all text-sm font-light inline-block w-fit">
                        {t('settings.upload_photo')}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePictureChange}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-slate-500">
                        {t('settings.image_hint')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Full Name and Nickname - Same Row */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                      {t('settings.full_name')}
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-dark-800 border border-slate-600/30 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-400/60 focus:ring-1 focus:ring-slate-400/30 transition-all"
                      placeholder={t('settings.full_name_placeholder')}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                      {t('settings.nickname_label')}
                    </label>
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="w-full bg-dark-800 border border-slate-600/30 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-400/60 focus:ring-1 focus:ring-slate-400/30 transition-all"
                      placeholder={t('settings.nickname_placeholder')}
                    />
                  </div>
                </div>
              </div>

              {/* Personal Preferences Section */}
              <div>
                <h2 className="text-lg font-light text-slate-100 mb-6 pb-4 border-b border-slate-700/20">
                  {t('settings.preferences')}
                </h2>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                    {t('settings.preferences_label')}
                  </label>
                  <p className="text-xs text-slate-500 mb-3">
                    {t('settings.preferences_hint')}
                  </p>
                  <textarea
                    value={personalPreferences}
                    onChange={(e) => setPersonalPreferences(e.target.value)}
                    className="w-full bg-dark-800 border border-slate-600/30 rounded-lg px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-400/60 focus:ring-1 focus:ring-slate-400/30 transition-all resize-none h-32"
                    placeholder={t('settings.preferences_placeholder')}
                  />
                </div>
              </div>

              {/* Appearance Section */}
              <div>
                <h2 className="text-lg font-light text-slate-100 mb-6 pb-4 border-b border-slate-700/20">
                  {t('settings.appearance')}
                </h2>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-4 uppercase tracking-wider">
                    {t('settings.color_mode')}
                  </label>
                  <div className="grid grid-cols-3 gap-4 max-w-lg">
                    {(['light', 'auto', 'dark'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => onColorModeChange(mode)}
                        className={`p-2 rounded-xl border transition-all ${
                          colorMode === mode
                            ? 'border-blue-400/80 ring-2 ring-blue-400/40'
                            : 'border-slate-600/30 hover:border-slate-600/50'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-2">
                          {/* UI Preview */}
                          <div className={`w-full h-20 rounded-lg border overflow-hidden ${
                            mode === 'light' ? 'bg-gray-100 border-gray-300' :
                            mode === 'auto' ? 'bg-gradient-to-r from-gray-100 to-gray-800' :
                            'bg-gray-900 border-gray-700'
                          }`}>
                            {/* Header bar */}
                            <div className={`h-1/3 ${
                              mode === 'light' ? 'bg-gray-200' :
                              mode === 'auto' ? 'bg-gradient-to-r from-gray-200 to-gray-700' :
                              'bg-gray-800'
                            }`} />
                            
                            {/* Content area */}
                            <div className="h-1/3 px-1 py-1 flex flex-col gap-0.5">
                              <div className={`h-1 rounded ${
                                mode === 'light' ? 'bg-gray-300' :
                                mode === 'auto' ? 'bg-gradient-to-r from-gray-300 to-gray-600' :
                                'bg-gray-700'
                              }`} />
                              <div className={`h-0.5 rounded w-3/4 ${
                                mode === 'light' ? 'bg-gray-200' :
                                mode === 'auto' ? 'bg-gradient-to-r from-gray-200 to-gray-600' :
                                'bg-gray-800'
                              }`} />
                            </div>
                          </div>
                          
                          <span className="text-xs font-medium text-slate-300 capitalize">
                            {t(`settings.${mode}`)}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-700/20">
                {hasProfileChanges && (
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="px-6 py-2 rounded-lg bg-gradient-to-r from-slate-600 to-slate-700 border border-slate-500/40 text-slate-100 hover:from-slate-500 hover:to-slate-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? t('settings.saving') : t('settings.save_changes')}
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-lg font-light text-slate-100 mb-6 pb-4 border-b border-slate-700/20">
                  {t('settings.account_info')}
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                      {t('settings.email')}
                    </label>
                    <div className="px-4 py-2 rounded-lg bg-dark-800/40 border border-slate-600/20 text-slate-400">
                      {user?.email}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      {t('settings.email_readonly')}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                      {t('settings.account_status')}
                    </label>
                    <div className="px-4 py-2 rounded-lg bg-dark-800/40 border border-slate-600/20 text-slate-400">
                      {t('settings.active')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-lg font-light text-slate-100 mb-6 pb-4 border-b border-slate-700/20">
                  {t('settings.privacy_settings')}
                </h2>
                <p className="text-slate-400 text-sm">
                  {t('settings.privacy_coming_soon')}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'memories' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-lg font-light text-slate-100 mb-2 pb-4 border-b border-slate-700/20">
                  {t('settings.memories')}
                </h2>
                <p className="text-slate-400 text-sm mb-6">
                  {t('settings.memories_description') ||
                    'Control how this assistant remembers key facts about you and your projects across conversations.'}
                </p>

                {/* Memory usage summary */}
                <div className="flex items-center justify-between rounded-xl border border-slate-600/40 bg-gradient-to-r from-slate-800/80 to-slate-900/80 px-5 py-4 mb-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-slate-100">
                        {t('settings.memories_header') || 'Memory'}
                      </span>
                  <span className="text-xs text-amber-300/90 font-medium bg-amber-900/30 border border-amber-500/40 rounded-full px-2 py-0.5">
                    {`${Math.min(100, Math.max(0, Math.round(memoryUsagePercent)))}% ${t('settings.memory_full') || 'full'}`}
                  </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden mb-2">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-amber-300 to-amber-500"
                        style={{ width: `${Math.min(100, Math.max(0, memoryUsagePercent))}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-400 max-w-md">
                      {t('settings.memories_summary') ||
                        'Key details from your conversations can be stored and used to personalize future replies. You stay in control of what is remembered.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenMemoryModal}
                    className="ml-4 whitespace-nowrap px-3 py-1.5 text-xs rounded-lg border border-slate-500/60 text-slate-200 hover:bg-slate-700/60 transition-colors"
                  >
                    {t('settings.manage_memories') || 'Manage'}
                  </button>
                </div>

                {/* Toggles */}
                <div className="space-y-5">
                  {/* Reference saved memories */}
                  <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-700/40 bg-dark-800/80 px-5 py-4">
                    <div>
                      <p className="text-sm text-slate-100 mb-1">
                        {t('settings.reference_saved_memories_title') || 'Reference saved memories'}
                      </p>
                      <p className="text-xs text-slate-500 max-w-md">
                        {t('settings.reference_saved_memories_description') ||
                          'Allow the assistant to save important facts about you (like projects, preferences, and goals) and use them to improve future responses.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-pressed={referenceSavedMemories}
                      onClick={() => onReferenceSavedMemoriesChange(!referenceSavedMemories)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full border transition-colors ${
                        referenceSavedMemories
                          ? 'bg-blue-500 border-blue-400'
                          : 'bg-slate-700 border-slate-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                          referenceSavedMemories ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Reference chat history */}
                  <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-700/40 bg-dark-800/80 px-5 py-4">
                    <div>
                      <p className="text-sm text-slate-100 mb-1">
                        {t('settings.reference_chat_history_title') || 'Reference chat history'}
                      </p>
                      <p className="text-xs text-slate-500 max-w-md">
                        {t('settings.reference_chat_history_description') ||
                          'Let the assistant look back at previous messages in this workspace to keep context across turns without needing to re-explain everything.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-pressed={isChatHistoryEnabled}
                      onClick={() => setIsChatHistoryEnabled((prev) => !prev)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full border transition-colors ${
                        isChatHistoryEnabled
                          ? 'bg-blue-500 border-blue-400'
                          : 'bg-slate-700 border-slate-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                          isChatHistoryEnabled ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-lg font-light text-slate-100 mb-6 pb-4 border-b border-slate-700/20">
                  {t('settings.billing_info')}
                </h2>
                <p className="text-slate-400 text-sm">
                  {t('settings.billing_coming_soon')}
                </p>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Memories manager modal */}
      {isMemoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-xl max-h-[80vh] bg-dark-900 border border-slate-700/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700/60 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-100">
                  {t('settings.saved_memories') || 'Saved memories'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {t('settings.saved_memories_hint') ||
                    'Delete older memories to free up space. When memory is full, new memories will not be saved until you make room.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMemoryModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-800/80 text-slate-400 hover:text-slate-100 transition-colors"
              >
                <span className="sr-only">Close</span>
                <svg className="w-4 h-4" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth={1.7}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <div className="px-6 pt-3 pb-2 border-b border-slate-800/80">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <span className="font-medium">
                    {`${Math.min(100, Math.max(0, Math.round(memoryUsagePercent)))}% ${t('settings.memory_full') || 'full'}`}
                  </span>
                </div>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                  🔍
                </span>
                <input
                  value={memorySearch}
                  onChange={(e) => setMemorySearch(e.target.value)}
                  placeholder={t('settings.search_memories') || 'Search memories'}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-dark-800 border border-slate-700/70 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500/60 focus:border-slate-500/60"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-3 space-y-3">
              {isLoadingMemories ? (
                <p className="text-xs text-slate-400">Loading memories…</p>
              ) : memories.length === 0 ? (
                <p className="text-xs text-slate-500">
                  {t('settings.no_memories') || 'No memories saved yet.'}
                </p>
              ) : (
                memories
                  .filter((m) =>
                    memorySearch.trim()
                      ? m.summary.toLowerCase().includes(memorySearch.trim().toLowerCase())
                      : true,
                  )
                  .map((memory) => (
                    <div
                      key={memory.id}
                      className="border border-slate-700/60 rounded-xl px-4 py-3 bg-dark-800/80 flex items-start gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-100 leading-relaxed">
                          {memory.summary}
                        </p>
                        {memory.createdAt && (
                          <p className="mt-1 text-[10px] text-slate-500">
                            {new Date(memory.createdAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteMemory(memory.id)}
                        className="p-1.5 rounded-lg hover:bg-slate-700/60 text-slate-400 hover:text-red-300 transition-colors flex-shrink-0"
                        title={t('settings.delete_memory') || 'Delete memory'}
                      >
                        <svg
                          className="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.7}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 6h18" />
                          <path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" />
                          <path d="M10 10v6" />
                          <path d="M14 10v6" />
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                      </button>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;

