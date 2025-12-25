import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  phone: string;
  name: string;
  isAdmin: boolean;
  token?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (phone: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  forgotPassword: (phone: string) => Promise<{ success: boolean; error?: string; botLink?: string }>;
  resetPassword: (phone: string, code: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'texnokross_auth';

function getApiUrl() {
  return (import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    if (savedAuth) {
      try {
        const parsedUser = JSON.parse(savedAuth);
        setUser(parsedUser);
      } catch (e) {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const register = async (phone: string, password: string, name?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${getApiUrl()}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password, name })
      });
      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || 'Ro\'yxatdan o\'tishda xatolik' };
      }
      setUser(data.user);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data.user));
      return { success: true };
    } catch (err) {
      console.error('Register error:', err);
      return { success: false, error: 'Server bilan bog\'lanishda xatolik' };
    }
  };

  const login = async (phone: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${getApiUrl()}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password })
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 404) {
          return await register(phone, password);
        }
        return { success: false, error: data.error || 'Kirishda xatolik' };
      }
      setUser(data.user);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data.user));
      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: 'Server bilan bog\'lanishda xatolik' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const forgotPassword = async (phone: string): Promise<{ success: boolean; error?: string; botLink?: string }> => {
    try {
      const response = await fetch(`${getApiUrl()}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || 'Xatolik yuz berdi' };
      }
      return { success: true, botLink: data.bot_link };
    } catch (err) {
      console.error('Forgot password error:', err);
      return { success: false, error: 'Server bilan bog\'lanishda xatolik' };
    }
  };

  const resetPassword = async (phone: string, code: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${getApiUrl()}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code, newPassword })
      });
      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || 'Xatolik yuz berdi' };
      }
      return { success: true };
    } catch (err) {
      console.error('Reset password error:', err);
      return { success: false, error: 'Server bilan bog\'lanishda xatolik' };
    }
  };

  const changePassword = async (oldPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Foydalanuvchi topilmadi' };
    }
    try {
      const response = await fetch(`${getApiUrl()}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: user.phone, oldPassword, newPassword })
      });
      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || 'Xatolik yuz berdi' };
      }
      return { success: true };
    } catch (err) {
      console.error('Change password error:', err);
      return { success: false, error: 'Server bilan bog\'lanishda xatolik' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.isAdmin || false,
        login,
        register,
        logout,
        forgotPassword,
        resetPassword,
        changePassword,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
