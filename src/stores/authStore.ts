import { create } from 'zustand';
import { db } from '../lib/db';

interface User {
  id: string;
  username: string;
  isAdmin: boolean;
  qbit_url?: string;
  qbit_username?: string;
  qbit_password?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('auth_token'),

  login: async (username: string, password: string) => {
    try {
      const response = await db.verifyUser(username, password);
      
      if (!response) {
        return false;
      }

      const { token, user } = response;
      localStorage.setItem('auth_token', token);

      set({
        token,
        user: {
          id: user.id,
          username: user.username,
          isAdmin: user.is_admin,
          qbit_url: user.qbit_url,
          qbit_username: user.qbit_username,
          qbit_password: user.qbit_password
        }
      });

      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    set({ user: null, token: null });
  },
}));