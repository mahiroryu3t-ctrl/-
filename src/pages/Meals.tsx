import React, { useState } from 'react';
import { Coffee, Sun, Moon, Cookie, Utensils } from 'lucide-react';
import { useSimpleAuth } from '../contexts/SimpleAuthContext';
import { useSimpleData } from '../contexts/SimpleDataContext';

const Meals = () => {
  const { isSupporter } = useSimpleAuth();
  const { todayValues, mealRecords, updateTodayMeal } = useSimpleData();
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [mealDescription, setMealDescription] = useState('');

  React.useEffect(() => {
    if (selectedMeal) {
      const currentContent = todayValues.meals[selectedMeal] || '';
      setMealDescription(currentContent);
    }
  }, [selectedMeal, todayValues.meals]);

  // 食事選択時に現在の内容を復元
  React.useEffect(() => {
    const handleDailyReset = () => {
      setSelectedMeal(null);
      setMealDescription('');
      console.log('✅ Meals page reset completed');
    };

    window.addEventListener('dailyReset', handleDailyReset);
    return () => window.removeEventListener('dailyReset', handleDailyReset);
  }, []);

  const mealTypes = [
    { key: 'breakfast', label: '朝食', icon: Coffee, color: 'bg-yellow-100 text-yellow-600', bgColor: 'bg-yellow-50' },
    { key: 'lunch', label: '昼食', icon: Sun, color: 'bg-orange-100 text-orange-600', bgColor: 'bg-orange-50' },
    { key: 'dinner', label: '夕食', icon: Moon, color: 'bg-purple-100 text-purple-600', bgColor: 'bg-purple-50' },
    { key: 'snack', label: '間食', icon: Cookie, color: 'bg-pink-100 text-pink-600', bgColor: 'bg-pink-50' }
  ] as const;

  const handleMealSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateTodayMeal(selectedMeal, mealDescription.trim())
      .then(() => {
        console.log('✅ Meal updated successfully');
        setMealDescription('');
        setSelectedMeal(null);
      })
      .catch((error) => {
        alert('記録の保存に失敗しました: ' + error.message);
        console.error('❌ Failed to update meal:', error);
      });
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center bg-white rounded-2xl p-6 shadow-sm">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <Utensils className="h-8 w-8 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          食事記録{isSupporter && ' (まいの記録)'}
        </h2>
        <p className="text-gray-600">
          {isSupporter ? 'まいの食事記録を確認できます' : 'バランスの良い食事を心がけましょう'}
        </p>
      </div>

      {/* Today's Meals */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          今日の食事{isSupporter && ' (まいの記録)'}
        </h3>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {mealTypes.map(({ key, label, icon: Icon, color, bgColor }) => {
            const mealData = todayValues.meals[key];
            return (
              <button
                key={key}
                onClick={() => !isSupporter && setSelectedMeal(key)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedMeal === key && !isSupporter
                    ? 'border-green-500 bg-green-50'
                    : mealData
                    ? 'border-green-200 bg-green-50'
                    : `border-gray-200 ${!isSupporter ? 'hover:border-gray-300' : 'cursor-default'}`
                }`}
              >
                <div className={`inline-flex items-center justify-center w-10 h-10 ${color} rounded-full mb-2`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-sm font-medium text-gray-900">{label}</div>
                {mealData && (
                  <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {mealData}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {selectedMeal && !isSupporter && (
          <form onSubmit={handleMealSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {mealTypes.find(m => m.key === selectedMeal)?.label}の内容
              </label>
              <textarea
                value={mealDescription}
                onChange={(e) => setMealDescription(e.target.value)}
                placeholder="何を食べましたか？"
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="flex-1 bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors font-medium"
              >
                記録する
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedMeal(null);
                  setMealDescription('');
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium"
              >
                キャンセル
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Meal History */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          食事履歴{isSupporter && ' (まいの記録)'}
        </h3>
        <div className="space-y-4">
          {mealRecords.filter(Boolean).slice(0, 3).map((record) => (
            <div key={record.id} className="border border-gray-200 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-900 mb-3">
                {new Date(record.date).toLocaleDateString('ja-JP')}
              </div>
              <div className="grid grid-cols-1 gap-2">
                {mealTypes.map(({ key, label, icon: Icon, color }) => {
                  const mealData = record?.[key];
                  if (!mealData) return null;
                  
                  return (
                    <div key={key} className="flex items-start space-x-3">
                      <div className={`inline-flex items-center justify-center w-6 h-6 ${color} rounded-full flex-shrink-0 mt-0.5`}>
                        <Icon className="h-3 w-3" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-700">{label}</div>
                        <div className="text-sm text-gray-600">{mealData}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default Meals;