import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  name: string;
  role: 'main_user' | 'supporter';
  partner_id?: string;
  target_weight?: number;
  start_date?: string;
  target_date?: string;
}

interface SimpleAuthContextType {
  currentUser: User | null;
  selectUser: (userKey: 'mai' | 'mahiro') => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const SimpleAuthContext = createContext<SimpleAuthContextType | undefined>(undefined);

export const useSimpleAuth = () => {
  const context = useContext(SimpleAuthContext);
  if (context === undefined) {
    throw new Error('useSimpleAuth must be used within a SimpleAuthProvider');
  }
  return context;
};

// 事前定義されたユーザーID（Supabase profilesテーブルに登録済み）
export const USER_IDS = {
  mai:    'dce5a6c7-4ae6-4d84-962d-d345dd7f553a',
  mahiro: '5c6bba7d-4bb2-4181-b788-30a219e902c1',
} as const;

export const getUserId = (userKey: 'mai' | 'mahiro'): string => USER_IDS[userKey];

export const getUserKey = (userId: string): 'mai' | 'mahiro' | null => {
  if (userId === USER_IDS.mai) return 'mai';
  if (userId === USER_IDS.mahiro) return 'mahiro';
  return null;
};

const STORAGE_KEY = 'selected_user';

export const SimpleAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // profilesテーブルからユーザー情報を取得
  const fetchProfile = async (userKey: 'mai' | 'mahiro'): Promise<User | null> => {
    const userId = USER_IDS[userKey];
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, role, partner_id, target_weight, start_date, target_date')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Failed to fetch profile:', error.message);
      return null;
    }
    return data as User;
  };

  // 起動時: localStorageに保存済みのユーザーをprofilesテーブルから復元
  useEffect(() => {
    const restore = async () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY) as 'mai' | 'mahiro' | null;
        if (saved && (saved === 'mai' || saved === 'mahiro')) {
          const profile = await fetchProfile(saved);
          if (profile) {
            setCurrentUser(profile);
          } else {
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch (e) {
        console.error('Error restoring user:', e);
      } finally {
        setIsLoading(false);
      }
    };
    restore();
  }, []);

  const selectUser = async (userKey: 'mai' | 'mahiro') => {
    setIsLoading(true);
    setError(null);
    try {
      const profile = await fetchProfile(userKey);
      if (!profile) {
        setError('ユーザー情報の取得に失敗しました。Supabaseの接続設定を確認してください。');
        return;
      }
      setCurrentUser(profile);
      localStorage.setItem(STORAGE_KEY, userKey);
    } catch (e) {
      console.error('Error selecting user:', e);
      setError('ユーザーの選択に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <SimpleAuthContext.Provider value={{ currentUser, selectUser, logout, isLoading, error }}>
      {children}
    </SimpleAuthContext.Provider>
  );
};
