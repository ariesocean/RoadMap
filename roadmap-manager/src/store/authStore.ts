import { create } from 'zustand';
import { loadFromLocalStorage, saveToLocalStorage, removeFromLocalStorage } from '@/utils/storage';

const USERNAME_STORAGE_KEY = 'username';
const USER_ID_KEY = 'userId';
const TOKEN_KEY = 'authToken';
const DEVICE_ID_KEY = 'deviceId';

function getOrCreateDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

export interface AuthState {
  username: string | null;
  userId: string | null;
  token: string | null;
  deviceId: string;
  isAuthenticated: boolean;
  userPort: number | null;
  
  setUsername: (username: string) => void;
  setUserId: (userId: string) => void;
  setToken: (token: string) => void;
  setUserPort: (port: number) => void;
  login: (username: string, userId: string, token: string) => void;
  logout: () => void;
  initAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  username: null,
  userId: null,
  token: null,
  deviceId: getOrCreateDeviceId(),
  isAuthenticated: false,
  userPort: null,

  setUsername: (username: string) => {
    set({ username });
    saveToLocalStorage(USERNAME_STORAGE_KEY, username);
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

  login: (username: string, userId: string, token: string) => {
    set({ username, userId, token, isAuthenticated: true });
    saveToLocalStorage(USERNAME_STORAGE_KEY, username);
    saveToLocalStorage(USER_ID_KEY, userId);
    saveToLocalStorage(TOKEN_KEY, token);
  },

  logout: () => {
    set({ username: null, userId: null, token: null, isAuthenticated: false, userPort: null });
    removeFromLocalStorage(USERNAME_STORAGE_KEY);
    removeFromLocalStorage(USER_ID_KEY);
    removeFromLocalStorage(TOKEN_KEY);
  },

  initAuth: () => {
    const savedUsername = loadFromLocalStorage(USERNAME_STORAGE_KEY);
    const savedUserId = loadFromLocalStorage(USER_ID_KEY);
    const savedToken = loadFromLocalStorage(TOKEN_KEY);
    const deviceId = getOrCreateDeviceId();
    
    set({ 
      username: savedUsername, 
      userId: savedUserId, 
      token: savedToken,
      deviceId,
      isAuthenticated: !!(savedUserId && savedToken)
    });
  },
}));
