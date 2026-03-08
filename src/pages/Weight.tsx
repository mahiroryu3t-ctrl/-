import React, { useState } from 'react';
import { useSimpleData } from '../contexts/SimpleDataContext';
import { useSimpleAuth } from '../contexts/SimpleAuthContext';
import { Scale, TrendingDown, Target, AlertCircle, Edit3, Save, X } from 'lucide-react';

const Weight: React.FC = () => {
  const { currentUser } = useSimpleAuth();
  const [error, setError] = useState('');
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [isCalendarEditMode, setIsCalendarEditMode] = useState(false);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editWeight, setEditWeight] = useState('');
  const { 
    weightRecords, 
    todayValues,
    settings, 
    updateSettings, 
    performDailyReset,
    updateTodayWeight
  } = useSimpleData();
  const [weightInput, setWeightInput] = useState('');
  const [targetWeightInput, setTargetWeightInput] = useState(settings.targetWeight.toString());

  // Only allow main users to access weight tracking
  if (currentUser?.role !== 'main_user') {
    return (
      <div className="p-4">
        <div className="max-w-sm mx-auto mt-20">
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">アクセス制限</h2>
            <p className="text-gray-600 text-sm">
              体重記録は本人のみアクセス可能です
            </p>
          </div>
        </div>
      </div>
    );
  }

  const targetWeight = settings.targetWeight;
  // 今日の体重があれば使用、なければ最新の履歴から取得
  const currentWeight = todayValues.weight || (weightRecords.length > 0 ? Number(weightRecords[0].weight) : null);
  const weightLoss = currentWeight ? currentWeight - targetWeight : 0;

  const handleWeightSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const weightValue = parseFloat(weightInput);

    if (isNaN(weightValue) || weightValue <= 0 || weightValue > 200) {
      setError('正しい体重を入力してください');
      return;
    }
    console.log('Submitting weight:', {
      weightValue
    });

    updateTodayWeight(weightValue)
      .then(() => {
        console.log('✅ Weight submitted successfully');
        setWeightInput('');
        setError('');
      })
      .catch(error => {
        console.error('❌ Failed to update weight:', error);
        alert('記録の保存に失敗しました: ' + error.message);
        setError('記録の保存に失敗しました');
      });
  };

  const handleTargetWeightSave = () => {
    const newTarget = parseFloat(targetWeightInput);
    if (newTarget > 0 && newTarget <= 200) {
      updateSettings({ targetWeight: newTarget });
      setIsEditingTarget(false);
    }
  };

  const handleDateClick = (dateString: string) => {
    if (!isCalendarEditMode) return;
    
    const existingRecord = weightRecords.find(r => r.date === dateString);
    setEditingDate(dateString);
    setEditWeight(existingRecord ? existingRecord.weight.toString() : '');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDate || !editWeight) return;

    const weightValue = parseFloat(editWeight);
    if (isNaN(weightValue) || weightValue <= 0 || weightValue > 200) {
      setError('正しい体重を入力してください');
      return;
    }

    console.log('Submitting weight edit:', {
      weightValue
    });

    updateTodayWeight(weightValue)
      .then(() => {
        console.log('✅ Weight edit submitted successfully');
        setEditingDate(null);
        setEditWeight('');
        setError('');
      })
      .catch(error => {
        console.error('❌ Failed to update weight:', error);
        alert('記録の保存に失敗しました: ' + error.message);
        setError('記録の保存に失敗しました');
      });
  };

  const handleEditCancel = () => {
    setEditingDate(null);
    setEditWeight('');
  };

  // Listen for daily reset events
  React.useEffect(() => {
    const handleDailyReset = (event: any) => {
      console.log('🔄 Weight page received daily reset event:', event.detail);
      setWeightInput('');
    };
    window.addEventListener('dailyReset', handleDailyReset);
    return () => window.removeEventListener('dailyReset', handleDailyReset);
  }, []);

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center bg-white rounded-2xl p-6 shadow-sm">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
          <Scale className="h-8 w-8 text-purple-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">体重記録</h2>
        <p className="text-gray-600">継続が大切です</p>
      </div>

      {/* Current Status */}
      {currentWeight && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">現在の状況</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {currentWeight} kg
              </div>
              <div className="text-sm text-gray-600">現在の体重</div>
            </div>
            <div className="text-center p-4 bg-pink-50 rounded-lg">
              <div className="flex items-center justify-center space-x-2 mb-1">
                <div className="text-2xl font-bold text-pink-600">
                  {targetWeight} kg
                </div>
                {!isEditingTarget ? (
                  <button
                    onClick={() => {
                      setIsEditingTarget(true);
                      setTargetWeightInput(targetWeight.toString());
                    }}
                    className="text-pink-500 hover:text-pink-600"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                ) : (
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      step="0.1"
                      value={targetWeightInput}
                      onChange={(e) => setTargetWeightInput(e.target.value)}
                      className="w-16 px-2 py-1 text-sm border border-pink-300 rounded focus:ring-1 focus:ring-pink-500"
                    />
                    <button
                      onClick={handleTargetWeightSave}
                      className="text-green-600 hover:text-green-700"
                    >
                      <Save className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => setIsEditingTarget(false)}
                      className="text-gray-500 hover:text-gray-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
              <div className="text-sm text-gray-600">目標体重</div>
            </div>
          </div>
          
          {weightLoss > 0 && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg text-center">
              <div className="flex items-center justify-center space-x-2">
                <TrendingDown className="h-5 w-5 text-green-600" />
                <span className="text-green-600 font-medium">
                  目標まで あと {weightLoss.toFixed(1)} kg
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Weight Input */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">体重を記録</h3>
          <Target className="h-5 w-5 text-purple-500" />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleWeightSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              今日の体重
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                placeholder="体重を入力"
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500">
                kg
              </div>
            </div>
          </div>
          
          <button
            type="submit"
            className="w-full bg-purple-500 text-white py-3 px-4 rounded-lg hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors font-medium"
          >
            記録する
          </button>
        </form>
      </div>

      {/* Weight History */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">体重推移</h3>
        
        {/* Weight Statistics */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-lg font-bold text-purple-600">
              {weightRecords.length > 0 ? weightRecords[0].weight : '-'}kg
            </div>
            <div className="text-xs text-gray-600">最新体重</div>
          </div>
          <div className="text-center p-3 bg-pink-50 rounded-lg">
            <div className="text-lg font-bold text-pink-600">
              {targetWeight}kg
            </div>
            <div className="text-xs text-gray-600">目標体重</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-600">
              {weightRecords.length > 1 
                ? (weightRecords[1].weight - weightRecords[0].weight > 0 ? '+' : '') + 
                  (weightRecords[1].weight - weightRecords[0].weight).toFixed(1)
                : '0.0'
              }kg
            </div>
            <div className="text-xs text-gray-600">前回比</div>
          </div>
        </div>

        {/* Calendar with Line Chart Overlay */}
        <div className="relative bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-medium text-gray-800">体重推移カレンダー</h4>
            <button
              onClick={() => setIsCalendarEditMode(!isCalendarEditMode)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                isCalendarEditMode
                  ? 'bg-purple-500 text-white'
                  : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
              }`}
            >
              {isCalendarEditMode ? '編集完了' : '編集'}
            </button>
          </div>
          
          <div className="relative overflow-hidden">
            {/* Calendar Header */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs mb-1">
              {['日', '月', '火', '水', '木', '金', '土'].map(day => (
                <div key={day} className="font-medium text-gray-500 py-2">{day}</div>
              ))}
            </div>
            
            {/* Calendar Grid with Chart Overlay */}
            <div className="relative">
              <div className="grid grid-cols-7 gap-1">
              {(() => {
                const today = new Date();
                const todayString = today.toISOString().split('T')[0];
                const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                const startDate = new Date(firstDay);
                startDate.setDate(startDate.getDate() - firstDay.getDay());
                
                const days = [];
                for (let i = 0; i < 42; i++) {
                  const currentDate = new Date(startDate);
                  currentDate.setDate(startDate.getDate() + i);
                  
                  if (currentDate > lastDay && days.length >= 28) break;
                  
                  const dateString = currentDate.toISOString().split('T')[0];
                  
                  const weightRecord = weightRecords.find(r => r.date === dateString);
                  const isCurrentMonth = currentDate.getMonth() === today.getMonth();
                  const isToday = dateString === todayString;
                  
                  // Simple background color based on weight record
                  let bgColorClass = '';
                  if (weightRecord && isCurrentMonth) {
                    bgColorClass = 'bg-purple-100 border-purple-300';
                  }
                  
                  days.push(
                    <div
                      key={dateString}
                      onClick={() => isCurrentMonth && isCalendarEditMode && handleDateClick(dateString)}
                      className={`relative p-2 text-xs transition-all min-h-[3.5rem] border ${
                        !isCurrentMonth
                          ? 'text-gray-300 border-transparent'
                          : isToday
                          ? 'bg-gradient-to-br from-purple-200 to-pink-200 text-purple-800 font-medium border-2 border-purple-400 shadow-md ring-2 ring-purple-300 ring-opacity-50'
                          : weightRecord
                          ? `${bgColorClass} text-gray-800 font-medium ${isCalendarEditMode ? 'cursor-pointer hover:opacity-80' : ''}`
                          : `text-gray-600 border-gray-200 border-opacity-30 ${isCalendarEditMode ? 'cursor-pointer hover:bg-gray-50' : ''}`
                      } ${isCurrentMonth && isCalendarEditMode ? 'hover:shadow-sm' : ''}`}
                    >
                      {isToday && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-pink-500 rounded-full animate-pulse"></div>
                      )}
                      {isCalendarEditMode && isCurrentMonth && (
                        <div className="absolute top-1 right-1 w-2 h-2 bg-purple-400 rounded-full opacity-60"></div>
                      )}
                      <div className="relative z-10">
                        <div className="font-medium">{currentDate.getDate()}</div>
                        {weightRecord && (
                          <div className={`text-xs mt-1 font-medium ${isToday ? 'text-purple-800' : 'text-purple-700'}`}>
                            <div className="leading-tight">
                              <span>{weightRecord.weight}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                
                return days;
              })()}
              </div>
            </div>
          </div>
          
          {isCalendarEditMode && (
            <div className="mt-3 p-3 bg-purple-100 rounded-lg">
              <p className="text-sm text-purple-700 text-center">
                📝 編集モード: 日付をタップして体重を記録・編集できます
              </p>
            </div>
          )}
        </div>

        {/* Edit Weight Modal */}
        {editingDate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                体重を{weightRecords.find(r => r.date === editingDate) ? '編集' : '記録'}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {new Date(editingDate).toLocaleDateString('ja-JP')}
              </p>
              
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    体重
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={editWeight}
                      onChange={(e) => setEditWeight(e.target.value)}
                      placeholder="体重を入力"
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      autoFocus
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500">
                      kg
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 bg-purple-500 text-white py-3 px-4 rounded-lg hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors font-medium"
                  >
                    {weightRecords.find(r => r.date === editingDate) ? '更新' : '記録'}
                  </button>
                  <button
                    type="button"
                    onClick={handleEditCancel}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium"
                  >
                    キャンセル
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default Weight;