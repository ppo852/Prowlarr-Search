import { api } from './api';

interface User {
  id: string;
  username: string;
  is_admin: boolean;
  created_at: string;
  qbit_url?: string;
  qbit_username?: string;
  qbit_password?: string;
}

interface LoginResponse {
  token: string;
  user: User;
}

class DatabaseManager {
  async getAllUsers(): Promise<User[]> {
    try {
      return await api.getUsers();
    } catch (error) {
      console.error('Failed to fetch users:', error);
      return [];
    }
  }

  async createUser(username: string, password: string, isAdmin: boolean = false): Promise<void> {
    await api.createUser(username, password, isAdmin);
  }

  async deleteUser(userId: string): Promise<void> {
    await api.deleteUser(userId);
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    await api.updateUser(userId, updates);
  }

  async verifyUser(username: string, password: string): Promise<LoginResponse | null> {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  }
}

export const db = new DatabaseManager();