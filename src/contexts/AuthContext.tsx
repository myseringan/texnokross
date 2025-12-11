import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  phone: string;
  name: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Админ номер телефона
const ADMIN_PHONE = '998907174447';
const ADMIN_PASSWORD = 'Texno@2025!';

// Хранение пользователей в localStorage
const USERS_STORAGE_KEY = 'texnokross_users';
const AUTH_STORAGE_KEY = 'texnokross_auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Проверяем сохранённую сессию
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

  const getUsers = (): Record<string, { password: string; name: string }> => {
    try {
      const users = localStorage.getItem(USERS_STORAGE_KEY);
      return users ? JSON.parse(users) : {};
    } catch {
      return {};
    }
  };

  const saveUsers = (users: Record<string, { password: string; name: string }>) => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  };

  const login = async (phone: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Нормализуем номер телефона
    const normalizedPhone = phone.replace(/\D/g, '');
    
    if (normalizedPhone.length < 9) {
      return { success: false, error: 'Telefon raqami noto\'g\'ri' };
    }

    // Проверяем если это админ номер
    const isAdminPhone = normalizedPhone === ADMIN_PHONE || 
                         normalizedPhone === '907174447' ||
                         normalizedPhone.endsWith('907174447');

    if (isAdminPhone) {
      // Проверяем пароль админа
      if (password === ADMIN_PASSWORD) {
        const adminUser: User = {
          id: 'admin',
          phone: ADMIN_PHONE,
          name: 'Administrator',
          isAdmin: true,
        };
        setUser(adminUser);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(adminUser));
        return { success: true };
      } else {
        return { success: false, error: 'Parol noto\'g\'ri' };
      }
    }

    // Обычный пользователь
    const users = getUsers();
    
    if (users[normalizedPhone]) {
      if (users[normalizedPhone].password === password) {
        const loggedUser: User = {
          id: normalizedPhone,
          phone: normalizedPhone,
          name: users[normalizedPhone].name,
          isAdmin: false,
        };
        setUser(loggedUser);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(loggedUser));
        return { success: true };
      } else {
        return { success: false, error: 'Parol noto\'g\'ri' };
      }
    } else {
      // Регистрируем нового пользователя
      users[normalizedPhone] = {
        password,
        name: `Foydalanuvchi ${normalizedPhone.slice(-4)}`,
      };
      saveUsers(users);
      
      const newUser: User = {
        id: normalizedPhone,
        phone: normalizedPhone,
        name: users[normalizedPhone].name,
        isAdmin: false,
      };
      setUser(newUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
      return { success: true };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.isAdmin || false,
        login,
        logout,
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
