import { create } from 'zustand';
import { loadFromLocalStorage, saveToLocalStorage, removeFromLocalStorage } from '@/utils/storage';

const USERNAME_STORAGE_KEY = 'username';
const EMAIL_STORAGE_KEY = 'email';
const USER_ID_KEY = 'userId';
const TOKEN_KEY = 'authToken';
const DEVICE_ID_KEY = 'deviceId';
const RESET_TOKEN_KEY = 'resetToken';
const RESET_TOKEN_EXPIRY_KEY = 'resetTokenExpiry';

function getOrCreateDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      deviceId = crypto.randomUUID();
    } else {
      deviceId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

export interface AuthState {
  username: string | null;
  email: string | null;
  userId: string | null;
  token: string | null;
  deviceId: string;
  isAuthenticated: boolean;
  userPort: number | null;
  resetToken: string | null;
  resetTokenExpiry: number | null;
  
  setUsername: (username: string) => void;
  setEmail: (email: string) => void;
  setUserId: (userId: string) => void;
  setToken: (token: string) => void;
  setUserPort: (port: number) => void;
  setResetToken: (token: string, expiry: number) => void;
  clearResetToken: () => void;
  login: (username: string, email: string, userId: string, token: string) => void;
  logout: () => void;
  initAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  username: null,
  email: null,
  userId: null,
  token: null,
  deviceId: getOrCreateDeviceId(),
  isAuthenticated: false,
  userPort: null,
  resetToken: null,
  resetTokenExpiry: null,

  setUsername: (username: string) => {
    set({ username });
    saveToLocalStorage(USERNAME_STORAGE_KEY, username);
  },

  setEmail: (email: string) => {
    set({ email });
    saveToLocalStorage(EMAIL_STORAGE_KEY, email);
  },

  setUserId: (userId: string) => {
    set({ userId });
    saveToLocalStorage(USER_ID_KEY, userId);
  },

  setToken: (token: string) => {
    set({ token });
    saveToLocalStorage(TOKEN_KEY, token);
  },

  setUserPort: (port: number) => {
    set({ userPort: port });
  },

  setResetToken: (token: string, expiry: number) => {
    set({ resetToken: token, resetTokenExpiry: expiry });
    saveToLocalStorage(RESET_TOKEN_KEY, token);
    saveToLocalStorage(RESET_TOKEN_EXPIRY_KEY, expiry.toString());
  },

  clearResetToken: () => {
    set({ resetToken: null, resetTokenExpiry: null });
    removeFromLocalStorage(RESET_TOKEN_KEY);
    removeFromLocalStorage(RESET_TOKEN_EXPIRY_KEY);
  },

  login: (username: string, email: string, userId: string, token: string) => {
    set({ username, email, userId, token, isAuthenticated: true });
    saveToLocalStorage(USERNAME_STORAGE_KEY, username);
    saveToLocalStorage(EMAIL_STORAGE_KEY, email);
    saveToLocalStorage(USER_ID_KEY, userId);
    saveToLocalStorage(TOKEN_KEY, token);
  },

  logout: () => {
    set({ username: null, email: null, userId: null, token: null, isAuthenticated: false, userPort: null });
    removeFromLocalStorage(USERNAME_STORAGE_KEY);
    removeFromLocalStorage(EMAIL_STORAGE_KEY);
    removeFromLocalStorage(USER_ID_KEY);
    removeFromLocalStorage(TOKEN_KEY);
  },

  initAuth: () => {
    const savedUsername = loadFromLocalStorage(USERNAME_STORAGE_KEY);
    const savedEmail = loadFromLocalStorage(EMAIL_STORAGE_KEY);
    const savedUserId = loadFromLocalStorage(USER_ID_KEY);
    const savedToken = loadFromLocalStorage(TOKEN_KEY);
    const savedResetToken = loadFromLocalStorage(RESET_TOKEN_KEY);
    const savedResetTokenExpiry = loadFromLocalStorage(RESET_TOKEN_EXPIRY_KEY);
    const deviceId = getOrCreateDeviceId();
    
    set({ 
      username: savedUsername,
      email: savedEmail,
      userId: savedUserId, 
      token: savedToken,
      resetToken: savedResetToken,
      resetTokenExpiry: savedResetTokenExpiry ? parseInt(savedResetTokenExpiry) : null,
      deviceId,
      isAuthenticated: !!(savedUserId && savedToken)
    });
  },
}));
