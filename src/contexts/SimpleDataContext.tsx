import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useSimpleAuth, getUserId, getUserKey, USER_IDS } from './SimpleAuthContext';
import { supabase } from '../lib/supabase';

interface ExerciseRecord {
  id: string;
  user_id: string;
  date: string;
  steps: number;
  partner_steps: number;
  exercises: Array<{ type: string; reps: number; notes?: string }>;
  created_at: string;
  updated_at: string;
}

interface MealRecord {
  id: string;
  user_id: string;
  date: string;
  breakfast?: string;
  lunch?: string;
  dinner?: string;
  snack?: string;
  created_at: string;
  updated_at: string;
}

interface WeightRecord {
  id: string;
  user_id: string;
  date: string;
  weight: number;
  created_at: string;
}

interface SupportRecord {
  id: string;
  from_user_id: string;
  to_user_id: string;
  type: 'like' | 'comment';
  message?: string;
  date: string;
  likes: number;
  liked_by: string[];
  created_at: string;
}

interface DailyMessage {
  id: string;
  user_id: string;
  date: string;
  message: string;
  created_at: string;
  updated_at: string;
}

interface TodayValues {
  steps: number;
  partnerSteps: number;
  exercises: Array<{ type: string; reps: number; notes?: string }>;
  weight: number | null;
  meals: {
    breakfast?: string;
    lunch?: string;
    dinner?: string;
    snack?: string;
  };
}

interface Settings {
  startDate: string;
  targetDate: string;
  targetWeight: number;
  weeklyGoal: number;
}

interface SimpleDataContextType {
  exerciseRecords: ExerciseRecord[];
  mealRecords: MealRecord[];
  weightRecords: WeightRecord[];
  supportRecords: SupportRecord[];
  dailyMessages: DailyMessage[];
  todayValues: TodayValues;
  settings: Settings;
  isLoading: boolean;
  addExerciseRecord: (record: Omit<ExerciseRecord, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateExerciseRecord: (id: string, record: Partial<ExerciseRecord>) => Promise<void>;
  deleteExerciseRecord: (id: string) => Promise<void>;
  addMealRecord: (record: Omit<MealRecord, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  addWeightRecord: (record: Omit<WeightRecord, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  addSupportRecord: (record: Omit<SupportRecord, 'id' | 'from_user_id' | 'created_at'>) => Promise<void>;
  likeSupportRecord: (id: string, userId: string) => Promise<void>;
  addDailyMessage: (userId: string, messageText: string) => Promise<void>;
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
  getRecordsByDate: (date: string) => {
    exercise?: ExerciseRecord;
    meal?: MealRecord;
    weight?: WeightRecord;
    dailyMessage?: DailyMessage;
  };
  performDailyReset: () => Promise<void>;
  updateTodaySteps: (steps: number, isPartner?: boolean) => Promise<void>;
  updateTodayWeight: (weight: number) => Promise<void>;
  updateTodayMeal: (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack', content: string) => Promise<void>;
  addTodayExercise: (exercise: { type: string; reps: number; notes?: string }) => Promise<void>;
  removeTodayExercise: (index: number) => Promise<void>;
}

const SimpleDataContext = createContext<SimpleDataContextType | undefined>(undefined);

export const useSimpleData = () => {
  const context = useContext(SimpleDataContext);
  if (context === undefined) {
    throw new Error('useSimpleData must be used within a SimpleDataProvider');
  }
  return context;
};

// JST（日本時間）での今日の日付を取得
const getTodayJST = (): string => {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().split('T')[0];
};

const LAST_RESET_KEY = 'last_daily_reset_jst';
const SETTINGS_KEY = 'diet_settings';

export const SimpleDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useSimpleAuth();
  const [exerciseRecords, setExerciseRecords] = useState<ExerciseRecord[]>([]);
  const [mealRecords, setMealRecords] = useState<MealRecord[]>([]);
  const [weightRecords, setWeightRecords] = useState<WeightRecord[]>([]);
  const [supportRecords, setSupportRecords] = useState<SupportRecord[]>([]);
  const [dailyMessages, setDailyMessages] = useState<DailyMessage[]>([]);
  const [todayValues, setTodayValues] = useState<TodayValues>({
    steps: 0, partnerSteps: 0, exercises: [], weight: null, meals: {}
  });
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    startDate: '2024-01-01',
    targetDate: '2024-03-14',
    targetWeight: 50.0,
    weeklyGoal: 70000,
  });

  // サブスクリプションのクリーンアップ用ref
  const subscriptionsRef = useRef<Array<{ unsubscribe: () => void }>>([]);

  // -------------------------
  // 今日の値をレコードから導出
  // -------------------------
  const deriveTodayValues = (
    exRecords: ExerciseRecord[],
    meRecords: MealRecord[],
    weRecords: WeightRecord[]
  ): TodayValues => {
    const today = getTodayJST();
    const ex = exRecords.find(r => r.date === today);
    const me = meRecords.find(r => r.date === today);
    const we = weRecords.find(r => r.date === today);
    return {
      steps: ex?.steps ?? 0,
      partnerSteps: ex?.partner_steps ?? 0,
      exercises: ex?.exercises ?? [],
      weight: we?.weight ?? null,
      meals: {
        breakfast: me?.breakfast,
        lunch: me?.lunch,
        dinner: me?.dinner,
        snack: me?.snack,
      },
    };
  };

  useEffect(() => {
    setTodayValues(deriveTodayValues(exerciseRecords, mealRecords, weightRecords));
  }, [exerciseRecords, mealRecords, weightRecords]);

  // -------------------------
  // 設定: profilesテーブルと同期
  // -------------------------
  const loadSettingsFromProfile = async () => {
    if (!currentUser) return;
    const { data } = await supabase
      .from('profiles')
      .select('target_weight, start_date, target_date')
      .eq('id', currentUser.id)
      .single();

    if (data) {
      const savedLocal = localStorage.getItem(SETTINGS_KEY);
      const localSettings = savedLocal ? JSON.parse(savedLocal) : {};
      setSettings(prev => ({
        ...prev,
        targetWeight: data.target_weight ?? prev.targetWeight,
        startDate: data.start_date ?? prev.startDate,
        targetDate: data.target_date ?? prev.targetDate,
        weeklyGoal: localSettings.weeklyGoal ?? prev.weeklyGoal,
      }));
    }
  };

  const updateSettings = async (newSettings: Partial<Settings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    // weeklyGoalはlocalStorageに保存
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ weeklyGoal: updated.weeklyGoal }));

    // target_weight, start_date, target_dateはprofilesテーブルに保存
    if (!currentUser) return;
    const profileUpdate: Record<string, unknown> = {};
    if (newSettings.targetWeight !== undefined) profileUpdate.target_weight = newSettings.targetWeight;
    if (newSettings.startDate !== undefined) profileUpdate.start_date = newSettings.startDate;
    if (newSettings.targetDate !== undefined) profileUpdate.target_date = newSettings.targetDate;

    if (Object.keys(profileUpdate).length > 0) {
      // 両ユーザーのプロフィールを更新（カップルで共有する設定のため）
      const { error } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .in('id', [USER_IDS.mai, USER_IDS.mahiro]);
      if (error) console.error('Failed to update profile settings:', error.message);
    }
  };

  // -------------------------
  // データ読み込み
  // -------------------------
  const loadAllData = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      await Promise.all([
        loadExerciseRecords(),
        loadMealRecords(),
        loadWeightRecords(),
        loadSupportRecords(),
        loadDailyMessages(),
        loadSettingsFromProfile(),
      ]);
    } catch (e) {
      console.error('Error loading data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadExerciseRecords = async () => {
    const { data, error } = await supabase
      .from('exercise_records')
      .select('*')
      .order('date', { ascending: false });
    if (error) { console.error('exercise_records load error:', error.message); return; }
    setExerciseRecords(data ?? []);
  };

  const loadMealRecords = async () => {
    const { data, error } = await supabase
      .from('meal_records')
      .select('*')
      .order('date', { ascending: false });
    if (error) { console.error('meal_records load error:', error.message); return; }
    setMealRecords(data ?? []);
  };

  const loadWeightRecords = async () => {
    const { data, error } = await supabase
      .from('weight_records')
      .select('*')
      .order('date', { ascending: false });
    if (error) { console.error('weight_records load error:', error.message); return; }
    setWeightRecords(data ?? []);
  };

  const loadSupportRecords = async () => {
    const { data, error } = await supabase
      .from('support_records')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { console.error('support_records load error:', error.message); return; }
    setSupportRecords(data ?? []);
  };

  const loadDailyMessages = async () => {
    const { data, error } = await supabase
      .from('daily_messages')
      .select('*')
      .order('date', { ascending: false });
    if (error) { console.error('daily_messages load error:', error.message); return; }
    setDailyMessages(data ?? []);
  };

  // -------------------------
  // リアルタイム購読
  // -------------------------
  const setupRealtimeSubscriptions = () => {
    // 既存のサブスクリプションをクリーンアップ
    subscriptionsRef.current.forEach(s => s.unsubscribe());
    subscriptionsRef.current = [];

    const tables = [
      { table: 'exercise_records', reload: loadExerciseRecords },
      { table: 'meal_records',     reload: loadMealRecords },
      { table: 'weight_records',   reload: loadWeightRecords },
      { table: 'support_records',  reload: loadSupportRecords },
      { table: 'daily_messages',   reload: loadDailyMessages },
    ];

    tables.forEach(({ table, reload }) => {
      const channel = supabase
        .channel(`${table}_channel`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
          reload();
        })
        .subscribe();
      subscriptionsRef.current.push(channel);
    });
  };

  useEffect(() => {
    if (currentUser) {
      loadAllData();
      setupRealtimeSubscriptions();
    }
    return () => {
      subscriptionsRef.current.forEach(s => s.unsubscribe());
    };
  }, [currentUser]);

  // -------------------------
  // 日次リセット
  // -------------------------
  const performDailyReset = async (): Promise<void> => {
    const today = getTodayJST();
    localStorage.setItem(LAST_RESET_KEY, today);
    setTodayValues(deriveTodayValues(exerciseRecords, mealRecords, weightRecords));
    window.dispatchEvent(new CustomEvent('dailyReset', { detail: { date: today } }));
  };

  const checkAndPerformDailyReset = async () => {
    const today = getTodayJST();
    const last = localStorage.getItem(LAST_RESET_KEY);
    if (last !== today) await performDailyReset();
  };

  useEffect(() => {
    checkAndPerformDailyReset();
    const interval = setInterval(checkAndPerformDailyReset, 5 * 60 * 1000);
    const onVisible = () => { if (!document.hidden) checkAndPerformDailyReset(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  // -------------------------
  // 書き込み操作
  // -------------------------

  // まいのuser_idを取得（exercise/stepsはまいのレコードに記録）
  const maiId = USER_IDS.mai;

  const updateTodaySteps = async (steps: number, isPartner = false): Promise<void> => {
    const today = getTodayJST();
    const record = {
      user_id: maiId,
      date: today,
      steps: isPartner ? todayValues.steps : steps,
      partner_steps: isPartner ? steps : todayValues.partnerSteps,
      exercises: todayValues.exercises,
    };
    const { error } = await supabase
      .from('exercise_records')
      .upsert(record, { onConflict: 'user_id,date' });
    if (error) throw new Error(error.message);
    await loadExerciseRecords();
  };

  const updateTodayWeight = async (weight: number): Promise<void> => {
    if (!currentUser) throw new Error('No user selected');
    const today = getTodayJST();
    const { error } = await supabase
      .from('weight_records')
      .upsert({ user_id: currentUser.id, date: today, weight }, { onConflict: 'user_id,date' });
    if (error) throw new Error(error.message);
    await loadWeightRecords();
  };

  const updateTodayMeal = async (
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
    content: string
  ): Promise<void> => {
    if (!currentUser) throw new Error('No user selected');
    const today = getTodayJST();
    const record = {
      user_id: currentUser.id,
      date: today,
      ...todayValues.meals,
      [mealType]: content,
    };
    const { error } = await supabase
      .from('meal_records')
      .upsert(record, { onConflict: 'user_id,date' });
    if (error) throw new Error(error.message);
    await loadMealRecords();
  };

  const addTodayExercise = async (exercise: { type: string; reps: number; notes?: string }): Promise<void> => {
    const today = getTodayJST();
    const newExercises = [...todayValues.exercises, exercise];
    const { error } = await supabase
      .from('exercise_records')
      .upsert({
        user_id: maiId,
        date: today,
        steps: todayValues.steps,
        partner_steps: todayValues.partnerSteps,
        exercises: newExercises,
      }, { onConflict: 'user_id,date' });
    if (error) throw new Error(error.message);
    await loadExerciseRecords();
  };

  const removeTodayExercise = async (index: number): Promise<void> => {
    const today = getTodayJST();
    const newExercises = todayValues.exercises.filter((_, i) => i !== index);
    const { error } = await supabase
      .from('exercise_records')
      .upsert({
        user_id: maiId,
        date: today,
        steps: todayValues.steps,
        partner_steps: todayValues.partnerSteps,
        exercises: newExercises,
      }, { onConflict: 'user_id,date' });
    if (error) throw new Error(error.message);
    await loadExerciseRecords();
  };

  const addExerciseRecord = async (
    record: Omit<ExerciseRecord, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ) => {
    const { error } = await supabase
      .from('exercise_records')
      .upsert({ user_id: maiId, ...record }, { onConflict: 'user_id,date' });
    if (error) throw new Error(error.message);
    await loadExerciseRecords();
  };

  const updateExerciseRecord = async (id: string, updates: Partial<ExerciseRecord>) => {
    const { error } = await supabase.from('exercise_records').update(updates).eq('id', id);
    if (error) throw new Error(error.message);
    await loadExerciseRecords();
  };

  const deleteExerciseRecord = async (id: string) => {
    const { error } = await supabase.from('exercise_records').delete().eq('id', id);
    if (error) throw new Error(error.message);
    await loadExerciseRecords();
  };

  const addMealRecord = async (
    record: Omit<MealRecord, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ) => {
    if (!currentUser) throw new Error('No user selected');
    const { error } = await supabase
      .from('meal_records')
      .upsert({ user_id: currentUser.id, ...record }, { onConflict: 'user_id,date' });
    if (error) throw new Error(error.message);
    await loadMealRecords();
  };

  const addWeightRecord = async (record: Omit<WeightRecord, 'id' | 'user_id' | 'created_at'>) => {
    if (!currentUser) throw new Error('No user selected');
    const { error } = await supabase
      .from('weight_records')
      .upsert({ user_id: currentUser.id, ...record }, { onConflict: 'user_id,date' });
    if (error) throw new Error(error.message);
    await loadWeightRecords();
  };

  const addSupportRecord = async (
    record: Omit<SupportRecord, 'id' | 'from_user_id' | 'created_at'>
  ) => {
    if (!currentUser) throw new Error('No user selected');
    const { error } = await supabase
      .from('support_records')
      .insert({ from_user_id: currentUser.id, ...record, likes: 0, liked_by: [] });
    if (error) throw new Error(error.message);
    await loadSupportRecords();
  };

  const likeSupportRecord = async (id: string, userId: string) => {
    const record = supportRecords.find(r => r.id === id);
    if (!record) return;
    const hasLiked = record.liked_by.includes(userId);
    const newLikedBy = hasLiked
      ? record.liked_by.filter(uid => uid !== userId)
      : [...record.liked_by, userId];
    const { error } = await supabase
      .from('support_records')
      .update({ likes: newLikedBy.length, liked_by: newLikedBy })
      .eq('id', id);
    if (error) throw new Error(error.message);
    setSupportRecords(prev =>
      prev.map(r => r.id === id ? { ...r, likes: newLikedBy.length, liked_by: newLikedBy } : r)
    );
  };

  // addDailyMessage: user_idとmessageテキストを直接受け取る（型安全）
  const addDailyMessage = async (userId: string, messageText: string) => {
    const today = getTodayJST();
    const { error } = await supabase
      .from('daily_messages')
      .upsert(
        { user_id: userId, date: today, message: messageText },
        { onConflict: 'user_id,date' }
      );
    if (error) throw new Error(error.message);
    await loadDailyMessages();
  };

  const getRecordsByDate = (date: string) => ({
    exercise:     exerciseRecords.find(r => r.date === date),
    meal:         mealRecords.find(r => r.date === date),
    weight:       weightRecords.find(r => r.date === date),
    dailyMessage: dailyMessages.find(r => r.date === date),
  });

  return (
    <SimpleDataContext.Provider value={{
      exerciseRecords, mealRecords, weightRecords, supportRecords, dailyMessages,
      todayValues, settings, isLoading,
      addExerciseRecord, updateExerciseRecord, deleteExerciseRecord,
      addMealRecord, addWeightRecord, addSupportRecord, likeSupportRecord,
      addDailyMessage, updateSettings, getRecordsByDate, performDailyReset,
      updateTodaySteps, updateTodayWeight, updateTodayMeal,
      addTodayExercise, removeTodayExercise,
    }}>
      {children}
    </SimpleDataContext.Provider>
  );
};
