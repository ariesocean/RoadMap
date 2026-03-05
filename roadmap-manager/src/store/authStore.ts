import { create } from 'zustand';
import { loadFromLocalStorage, saveToLocalStorage, removeFromLocalStorage } from '@/utils/storage';

const USERNAME_STORAGE_KEY = 'username';

export interface AuthState {
  username: string | null;
  setUsername: (username: string) => void;
  updateUsername: (username: string) => void;
  clearUsername: () => void;
  initUsername: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  username: null,

  setUsername: (username: string) => {
    set({ username });
    saveToLocalStorage(USERNAME_STORAGE_KEY, username);
  },

  updateUsername: (username: string) => {
    set({ username });
    saveToLocalStorage(USERNAME_STORAGE_KEY, username);
  },

  clearUsername: () => {
    set({ username: null });
    removeFromLocalStorage(USERNAME_STORAGE_KEY);
  },

  // Initialize username from localStorage
  initUsername: () => {
    const savedUsername = loadFromLocalStorage(USERNAME_STORAGE_KEY);
    if (savedUsername) {
      set({ username: savedUsername });
    }
  },
}));
