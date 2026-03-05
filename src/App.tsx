import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import ChatsView from './components/ChatsView';
import Settings, { ProfileData } from './components/Settings';
import { ChatMessage } from './types/index';
import i18n from './i18n';

interface User {
  id: string;
  email: string;
  profilePicture?: string | null;
  displayName?: string | null;
  nickname?: string | null;
  personalPreferences?: string;
  preferredLanguage?: string | null;
}

interface UserPreferences {
  interests: string[];
  skillLevel: string;
  timeAvailable: string;
  preferredComplexity: string;
  learningStyle: string;
}

function PersonalizationModal({
  isOpen,
  onClose,
  preferences,
  onSave
}: {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onSave: (p: UserPreferences) => void;
}) {
  if (!isOpen) return null;

  const [localPrefs, setLocalPrefs] = useState<UserPreferences>(preferences);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50">
      <div className="luxury-card rounded-2xl p-8 w-full max-w-lg border border-slate-600/40">
        <h2 className="text-2xl font-light text-slate-100 mb-6 tracking-wide">Personalization</h2>

        <div className="mb-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Interests (comma separated)</label>
            <input
              className="w-full bg-dark-800 border border-slate-600/30 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-400/60 focus:ring-1 focus:ring-slate-400/30 transition-all"
              value={localPrefs.interests.join(', ')}
              onChange={e => setLocalPrefs({ ...localPrefs, interests: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Skill Level</label>
            <select
              className="w-full bg-dark-800 border border-slate-600/30 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-slate-400/60 focus:ring-1 focus:ring-slate-400/30 transition-all"
              value={localPrefs.skillLevel}
              onChange={e => setLocalPrefs({ ...localPrefs, skillLevel: e.target.value as UserPreferences['skillLevel'] })}
            >
              <option>Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-8">
          <button 
            className="px-6 py-2 rounded-lg bg-slate-700/40 border border-slate-600/40 text-slate-300 hover:bg-slate-700/60 hover:text-slate-200 transition-all"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-slate-600 to-slate-700 border border-slate-500/40 text-slate-100 hover:from-slate-500 hover:to-slate-600 transition-all"
            onClick={() => { onSave(localPrefs); onClose(); }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function LoginModal({
  isOpen,
  onClose,
  onLogin
}: {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string) => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [step, setStep] = useState<'login' | 'confirm'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Email and password required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/send-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        setStep('confirm');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to send confirmation email');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationCode.trim()) {
      setError('Confirmation code required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, confirmationCode })
      });

      if (res.ok) {
        onLogin(email);
        setEmail('');
        setPassword('');
        setConfirmationCode('');
        setStep('login');
        onClose();
      } else {
        const data = await res.json();
        setError(data.error || 'Invalid confirmation code');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthClick = (provider: string) => {
    window.location.href = `/api/auth/${provider.toLowerCase()}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-[60]">
      <div className="luxury-card rounded-2xl p-8 w-full max-w-md border border-slate-600/40 bg-dark-800/80">
        <div className="flex justify-center mb-6">
          <style>{`
            @keyframes rotateStar {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            .star-animation {
              animation: rotateStar 8s linear infinite;
            }
          `}</style>
          <img 
            src="/silver.png" 
            alt="Essence Logo" 
            className="star-animation w-16 h-16 object-contain"
          />
        </div>

        <h2 className="text-2xl font-light text-slate-100 mb-6 tracking-wide text-center" style={{ fontFamily: "'Playfair Display', serif" }}>Login to Essence</h2>

        {step === 'login' ? (
          <>
            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleOAuthClick('Google')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-600/40 text-slate-300 hover:bg-slate-800/40 hover:text-slate-200 transition-all"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </button>
              <button
                onClick={() => handleOAuthClick('GitHub')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-600/40 text-slate-300 hover:bg-slate-800/40 hover:text-slate-200 transition-all"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </button>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700/30"/>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-dark-900 text-slate-500">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full bg-dark-800 border border-slate-600/30 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-400/60 focus:ring-1 focus:ring-slate-400/30 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-dark-800 border border-slate-600/30 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-400/60 focus:ring-1 focus:ring-slate-400/30 transition-all"
                />
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button 
                  type="button"
                  className="px-6 py-2 rounded-lg bg-slate-700/40 border border-slate-600/40 text-slate-300 hover:bg-slate-700/60 hover:text-slate-200 transition-all"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !email.trim() || !password.trim()}
                  className="px-6 py-2 rounded-lg bg-gradient-to-r from-slate-600 to-slate-700 border border-slate-500/40 text-slate-100 hover:from-slate-500 hover:to-slate-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Sending...' : 'Continue'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <form onSubmit={handleConfirmation} className="space-y-4">
            <p className="text-sm text-slate-400 mb-4">
              We've sent a confirmation code to <strong className="text-slate-300">{email}</strong>
            </p>
            
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Confirmation Code</label>
              <input
                type="text"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
                placeholder="Enter 6-digit code"
                className="w-full bg-dark-800 border border-slate-600/30 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-400/60 focus:ring-1 focus:ring-slate-400/30 transition-all text-center tracking-widest"
              />
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button 
                type="button"
                className="px-6 py-2 rounded-lg bg-slate-700/40 border border-slate-600/40 text-slate-300 hover:bg-slate-700/60 hover:text-slate-200 transition-all"
                onClick={() => {
                  setStep('login');
                  setConfirmationCode('');
                  setError('');
                }}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isLoading || !confirmationCode.trim()}
                className="px-6 py-2 rounded-lg bg-gradient-to-r from-slate-600 to-slate-700 border border-slate-500/40 text-slate-100 hover:from-slate-500 hover:to-slate-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Verifying...' : 'Confirm'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

async function fetchAIResponse(
  messages: ChatMessage[],
  chatId?: string,
  onChunk?: (delta: string) => void,
): Promise<string> {
  const formattedMessages = messages.map(m => ({
    role: m.sender === 'user' ? 'user' : 'assistant',
    content: m.content
  }));
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ 
      messages: formattedMessages,
      chatId
    })
  });
  if (!res.ok) throw new Error('AI API error');

  const contentType = res.headers.get('Content-Type') || '';

  if (onChunk && res.body && /^(text\/|application\/json\+stream)/i.test(contentType) && !/application\/json/i.test(contentType)) {
    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      if (!chunk) continue;
      fullText += chunk;
      onChunk(chunk);
    }

    return fullText.trim() || '(No response)';
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '(No response)';
}

interface ChatHistory {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'chat' | 'chats' | 'settings'>('chat');
  const [colorMode, setColorMode] = useState<'light' | 'dark' | 'auto'>(() => {
    const savedMode = localStorage.getItem('colorMode') as 'light' | 'dark' | 'auto' | null;
    return savedMode || 'dark';
  });
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPersonalizationOpen, setIsPersonalizationOpen] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    interests: [],
    skillLevel: 'intermediate',
    timeAvailable: '1-2 hours',
    preferredComplexity: 'mixed',
    learningStyle: 'visual'
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [referenceSavedMemories, setReferenceSavedMemories] = useState<boolean>(() => {
    const stored = localStorage.getItem('referenceSavedMemories');
    return stored === null ? true : stored === 'true';
  });
  const [memoryUsagePercent, setMemoryUsagePercent] = useState<number>(0);

  const clearUserSession = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const params = new URLSearchParams(window.location.search);
    const hasOAuthCallback = params.get('userId') && params.get('email');

    if (savedUser && !hasOAuthCallback) {
      const parsed = JSON.parse(savedUser) as User;
      setUser(parsed);
      if (parsed?.preferredLanguage) {
        i18n.changeLanguage(parsed.preferredLanguage);
      }
      (async () => {
        try {
          const res = await fetch('/api/auth/user', { credentials: 'include' });
          if (res.status === 401 || !res.ok) {
            clearUserSession();
            return;
          }
          const data = await res.json();
          if (!data.success || !data.user) {
            clearUserSession();
            return;
          }
          const serverUser: User = {
            id: data.user.id,
            email: data.user.email,
            profilePicture: data.user.profilePicture ?? null,
            displayName: data.user.displayName ?? null,
            nickname: data.user.nickname ?? null,
            personalPreferences: data.user.personalPreferences ?? null,
            preferredLanguage: data.user.preferredLanguage ?? null,
          };
          setUser(serverUser);
          localStorage.setItem('user', JSON.stringify(serverUser));
          if (serverUser.preferredLanguage) {
            i18n.changeLanguage(serverUser.preferredLanguage);
          }
        } catch {
          clearUserSession();
        }
      })();
    }

    // Check for OAuth callback in URL
    const userId = params.get('userId');
    const email = params.get('email');
    const error = params.get('error');

    if (userId && email) {
      const newUser: User = { 
        id: userId, 
        email,
        profilePicture: null
      };
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
      
      (async () => {
        try {
          const res = await fetch('/api/auth/user', { credentials: 'include' });
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.user) {
              const completeUser: User = {
                id: data.user.id,
                email: data.user.email,
                profilePicture: data.user.profilePicture ?? null,
                displayName: data.user.displayName ?? null,
                nickname: data.user.nickname ?? null,
                personalPreferences: data.user.personalPreferences ?? null,
                preferredLanguage: data.user.preferredLanguage ?? null,
              };
              setUser(completeUser);
              localStorage.setItem('user', JSON.stringify(completeUser));
              if (completeUser.preferredLanguage) {
                i18n.changeLanguage(completeUser.preferredLanguage);
              }
            }
          }
          await fetch('/api/chats/migrate-legacy', { method: 'POST', credentials: 'include' });
          await loadChatHistory();
        } catch (err) {
          console.error('Failed to fetch user or migrate chats:', err);
        }
      })();
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (error) {
      console.error('OAuth error:', error);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const savedMode = localStorage.getItem('colorMode') as 'light' | 'dark' | 'auto' | null;
    const modeToApply = savedMode || 'dark';
    const isDark = modeToApply === 'auto'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : modeToApply === 'dark';
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.backgroundColor = '#0a0a0a';
      document.body.style.backgroundColor = '#0a0a0a';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.backgroundColor = '#f5f5f5';
      document.body.style.backgroundColor = '#f5f5f5';
    }
  }, []);

  useEffect(() => {
    loadChatHistory();
  }, [user]);

  const handleLogin = async (email: string) => {
    try {
      const res = await fetch('/api/auth/user', {
        credentials: 'include'
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          const user: User = {
            id: data.user.id,
            email: data.user.email,
            profilePicture: data.user.profilePicture,
            displayName: data.user.displayName,
            nickname: data.user.nickname,
            personalPreferences: data.user.personalPreferences,
            preferredLanguage: data.user.preferredLanguage ?? null,
          };
          setUser(user);
          localStorage.setItem('user', JSON.stringify(user));
          if (user.preferredLanguage) {
            i18n.changeLanguage(user.preferredLanguage);
          }
          return;
        }
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
    }
    
    const newUser: User = {
      id: email,
      email,
      profilePicture: null,
      displayName: null
    };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (err) {
      console.error('Logout request failed:', err);
    }
    i18n.changeLanguage('en');
    setUser(null);
    localStorage.removeItem('user');
    setMessages([]);
    setCurrentChatId(null);
  };

  const handleSaveLanguagePreference = async (preferredLanguage: string) => {
    if (!user) return;
    try {
      const res = await fetch('/api/auth/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ preferredLanguage }),
      });
      if (res.ok) {
        setUser((prev) => (prev ? { ...prev, preferredLanguage } : null));
        const updated = user ? { ...user, preferredLanguage } : null;
        if (updated) localStorage.setItem('user', JSON.stringify(updated));
      }
    } catch (err) {
      console.error('Failed to save language preference:', err);
    }
  };

  const loadChatHistory = async () => {
    if (!user) {
      setChatHistory([]);
      return;
    }
    try {
      const res = await fetch('/api/chats', { credentials: 'include' });
      if (res.status === 401) {
        clearUserSession();
        setChatHistory([]);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        const chats = data.map((chat: any) => ({
          id: chat._id,
          title: chat.title,
          createdAt: chat.createdAt,
          updatedAt: chat.updatedAt
        }));
        setChatHistory(chats);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  };

  const handleRenameChat = async (chatId: string, title: string) => {
    try {
      const res = await fetch(`/api/chats/${chatId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title })
      });
      if (res.ok) {
        await loadChatHistory();
      }
    } catch (err) {
      console.error('Failed to rename chat:', err);
    }
  };

  const smartTitleFromMessage = (text: string) => {
    const trimmed = (text || '').trim();
    if (!trimmed) return 'New Chat';
    const first = trimmed.split(/[\n\.\?!]/)[0];
    const words = first.split(/\s+/).slice(0, 8);
    let title = words.join(' ');
    if (title.length > 50) title = title.slice(0, 50).trim() + '...';
    return title.charAt(0).toUpperCase() + title.slice(1);
  };

  const handleNewChat = async () => {
    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (res.ok) {
        const newChat = await res.json();
        setCurrentChatId(newChat.id);
        setMessages([]);
        loadChatHistory();
        setCurrentView('chat');
      }
    } catch (err) {
      console.error('Failed to create new chat:', err);
    }
  };

  const handleLoadChat = async (chatId: string) => {
    try {
      console.log('Loading chat:', chatId);
      const res = await fetch(`/api/chats/${chatId}`, { credentials: 'include' });
      if (res.ok) {
        const chat = await res.json();
        console.log('Chat loaded:', chat);
        setCurrentChatId(chatId);
        // Convert timestamp strings to Date objects
        const messagesWithDates = (chat.messages || []).map((msg: any) => ({
          ...msg,
          timestamp: typeof msg.timestamp === 'string' ? new Date(msg.timestamp) : msg.timestamp
        }));
        console.log('Messages converted:', messagesWithDates);
        setMessages(messagesWithDates);
        setCurrentView('chat');
      } else {
        console.error('Failed to load chat, status:', res.status);
      }
    } catch (err) {
      console.error('Failed to load chat:', err);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      await fetch(`/api/chats/${chatId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      loadChatHistory();
      if (currentChatId === chatId) {
        setCurrentChatId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to delete chat:', err);
    }
  };

  const maybeSaveMemory = async (
    userText: string,
    chatId?: string,
  ): Promise<{ memoryUpdated: boolean; memorySummary?: string }> => {
    if (!referenceSavedMemories || !user) {
      return { memoryUpdated: false };
    }

    try {
      // Do not attempt to save if memory is full
      if (memoryUsagePercent >= 100) {
        return { memoryUpdated: false };
      }

      const res = await fetch('/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: user.id,
          chatId,
          text: userText,
        }),
      });

      if (!res.ok) {
        return { memoryUpdated: false };
      }

      const data = await res.json();
      if (data?.shouldSave && typeof data.summary === 'string' && data.summary.trim()) {
        if (typeof data.usagePercent === 'number') {
          setMemoryUsagePercent(Math.min(100, Math.max(0, data.usagePercent)));
        }
        return {
          memoryUpdated: true,
          memorySummary: data.summary.trim(),
        };
      }
    } catch (err) {
      console.error('Failed to save chat memory:', err);
    }

    return { memoryUpdated: false };
  };

  const handleSendMessage = async (message: string) => {
    let chatId = currentChatId;
    if (!chatId) {
      try {
        const res = await fetch('/api/chats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });
        if (res.status === 401) {
          clearUserSession();
          return;
        }
        if (res.ok) {
          const newChat = await res.json();
          chatId = newChat.id;
          setCurrentChatId(chatId);
          try {
            const title = smartTitleFromMessage(message);
            if (chatId) await handleRenameChat(chatId, title);
          } catch (err) {
            console.error('Smart title creation failed:', err);
          }
          loadChatHistory();
        } else {
          console.error('Failed to create chat:', res.status);
          return;
        }
      } catch (err) {
        console.error('Failed to create chat:', err);
        return;
      }
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: message,
      sender: 'user',
      timestamp: new Date()
    };
    const aiMessageId = (Date.now() + 1).toString();
    const aiTimestamp = new Date();

    setMessages(prev => [
      ...prev,
      userMessage,
      {
        id: aiMessageId,
        content: '',
        sender: 'ai',
        timestamp: aiTimestamp,
      },
    ]);
    setIsLoading(true);

    try {
      let accumulated = '';
      const aiContent = await fetchAIResponse(
        [...messages, userMessage],
        chatId || undefined,
        (delta) => {
          accumulated += delta;
          const chunk = delta;
          if (!chunk) return;
          setMessages(prev =>
            prev.map(m =>
              m.id === aiMessageId
                ? { ...m, content: (m.content || '') + chunk }
                : m,
            ),
          );
        },
      );

      const finalContent = accumulated || aiContent;
      const memoryResult = await maybeSaveMemory(message, chatId || undefined);

      setMessages(prev =>
        prev.map(m =>
          m.id === aiMessageId
            ? {
                ...m,
                content: finalContent,
                memoryUpdated: memoryResult.memoryUpdated,
                memorySummary: memoryResult.memorySummary,
              }
            : m,
        ),
      );
      await loadChatHistory();
    } catch (err) {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, there was an error getting a response from the AI.",
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
    }
    setIsLoading(false);
  };

  const handleRegenerateResponse = async (messagesForApi: ChatMessage[], chatId: string) => {
    setIsLoading(true);
    const lastUserMessage = [...messagesForApi].reverse().find((m) => m.sender === 'user');

    try {
      const aiMessageId = (Date.now() + 1).toString();
      const aiTimestamp = new Date();

      setMessages([
        ...messagesForApi,
        {
          id: aiMessageId,
          content: '',
          sender: 'ai',
          timestamp: aiTimestamp,
        },
      ]);

      let accumulated = '';
      const aiContent = await fetchAIResponse(
        messagesForApi,
        chatId,
        (delta) => {
          accumulated += delta;
          const chunk = delta;
          if (!chunk) return;
          setMessages(prev =>
            prev.map(m =>
              m.id === aiMessageId
                ? { ...m, content: (m.content || '') + chunk }
                : m,
            ),
          );
        },
      );

      const finalContent = accumulated || aiContent;
      const memoryResult = lastUserMessage
        ? await maybeSaveMemory(lastUserMessage.content, chatId)
        : { memoryUpdated: false as const };

      setMessages(prev =>
        prev.map(m =>
          m.id === aiMessageId
            ? {
                ...m,
                content: finalContent,
                memoryUpdated: memoryResult.memoryUpdated,
                memorySummary: memoryResult.memorySummary,
              }
            : m,
        ),
      );
      await loadChatHistory();
    } catch (err) {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, there was an error getting a response from the AI.',
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages([...messagesForApi, aiResponse]);
    }
    setIsLoading(false);
  };

  const handleSaveProfile = async (profileData: ProfileData) => {
    if (!user) return;

    try {
      const formData = new FormData();
      formData.append('displayName', profileData.displayName);
      formData.append('nickname', profileData.nickname);
      formData.append('personalPreferences', profileData.personalPreferences);

      if (profileData.profilePicture && profileData.profilePicture.startsWith('data:')) {
        const response = await fetch(profileData.profilePicture);
        const blob = await response.blob();
        formData.append('profilePicture', blob, 'profile.jpg');
      }

      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        credentials: 'include',
        body: formData
      });

      if (res.ok) {
        const updatedUser = await res.json();
        const newUser: User = {
          ...user,
          displayName: updatedUser.displayName || user.displayName,
          nickname: updatedUser.nickname,
          personalPreferences: updatedUser.personalPreferences,
          profilePicture: updatedUser.profilePicture || user.profilePicture
        };
        setUser(newUser);
        localStorage.setItem('user', JSON.stringify(newUser));
      } else {
        const error = await res.text();
        throw new Error(error || 'Failed to save profile');
      }
    } catch (err) {
      console.error('Failed to save profile:', err);
      throw err;
    }
  };

  const handleColorModeChange = (mode: 'light' | 'dark' | 'auto') => {
    setColorMode(mode);
    localStorage.setItem('colorMode', mode);
    const isDark = mode === 'auto'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : mode === 'dark';
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.backgroundColor = '#0a0a0a';
      document.body.style.backgroundColor = '#0a0a0a';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.backgroundColor = '#f5f5f5';
      document.body.style.backgroundColor = '#f5f5f5';
    }
  };

  return (
    <div className="min-h-screen bg-dark-900">
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLogin={handleLogin}
      />
      <div className="flex h-screen bg-dark-900">
        <Sidebar 
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          onPersonalizationClick={() => setIsPersonalizationOpen(true)}
          onSettingsClick={() => setCurrentView('settings')}
          messages={messages}
          onNewChat={handleNewChat}
          onChatsClick={() => setCurrentView('chats')}
          chatsViewActive={currentView === 'chats'}
          chatHistory={chatHistory}
          onLoadChat={handleLoadChat}
          onDeleteChat={handleDeleteChat}
          onLoginClick={() => setIsLoginOpen(true)}
          user={user}
          onLogout={handleLogout}
          onSaveLanguagePreference={handleSaveLanguagePreference}
        />
        
        <div className="flex-1 flex min-w-0 relative overflow-hidden">
          <div
            className={`view-panel absolute inset-0 flex flex-col z-10 ${
              currentView === 'settings' ? 'view-panel-settings-hidden' : ''
            }`}
            aria-hidden={currentView === 'settings'}
          >
            {currentView === 'chat' && (
            <ChatArea
              messages={messages}
              isLoading={isLoading}
              onSendMessage={handleSendMessage}
              onRegenerateResponse={handleRegenerateResponse}
              onUpdateMessages={setMessages}
              user={user}
              currentChatId={currentChatId}
              chatHistory={chatHistory}
              onRenameChat={handleRenameChat}
              onDeleteChat={handleDeleteChat}
            referenceSavedMemories={referenceSavedMemories}
            />
            )}
            {currentView === 'chats' && (
              <ChatsView
                chatHistory={chatHistory.map((c) => ({
                  id: c.id,
                  title: c.title,
                  updatedAt: c.updatedAt || c.createdAt || new Date().toISOString(),
                }))}
                onLoadChat={handleLoadChat}
              />
            )}

            <PersonalizationModal
              isOpen={isPersonalizationOpen}
              onClose={() => setIsPersonalizationOpen(false)}
              preferences={userPreferences}
              onSave={setUserPreferences}
            />
          </div>
          <div
            className={`view-panel absolute inset-0 flex z-10 ${
              currentView !== 'settings' ? 'view-panel-hidden' : ''
            }`}
            aria-hidden={currentView !== 'settings'}
          >
            <Settings
              user={user}
              onSaveProfile={handleSaveProfile}
              colorMode={colorMode}
              onColorModeChange={handleColorModeChange}
              onBackToChat={() => setCurrentView('chat')}
              referenceSavedMemories={referenceSavedMemories}
              onReferenceSavedMemoriesChange={(enabled) => {
                setReferenceSavedMemories(enabled);
                localStorage.setItem('referenceSavedMemories', String(enabled));
              }}
              memoryUsagePercent={memoryUsagePercent}
              onMemoryUsageChange={setMemoryUsagePercent}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;