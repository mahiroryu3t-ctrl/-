import React, { useState } from 'react';
import { useSimpleAuth } from '../contexts/SimpleAuthContext';
import { useSimpleData } from '../contexts/SimpleDataContext';
import { Activity, Plus, Trash2, Target } from 'lucide-react';

const Exercise: React.FC = () => {
  const { currentUser, isSupporter } = useSimpleAuth();
  const { 
    todayValues, 
    exerciseRecords, 
    updateTodaySteps, 
    addTodayExercise, 
    removeTodayExercise 
  } = useSimpleData();
  
  const [stepsInput, setStepsInput] = useState('');
  const [partnerStepsInput, setPartnerStepsInput] = useState('');
  const [exerciseType, setExerciseType] = useState('');
  const [exerciseReps, setExerciseReps] = useState('');
  const [exerciseNotes, setExerciseNotes] = useState('');
  const [error, setError] = useState('');

  // Listen for daily reset events
  React.useEffect(() => {
    const handleDailyReset = () => {
      setStepsInput('');
      setPartnerStepsInput('');
      setExerciseType('');
      setExerciseReps('');
      setExerciseNotes('');
      console.log('✅ Exercise page reset completed');
    };

    window.addEventListener('dailyReset', handleDailyReset);
    return () => window.removeEventListener('dailyReset', handleDailyReset);
  }, []);

  const handleStepsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const steps = parseInt(stepsInput);

    if (isNaN(steps) || steps < 0 || steps > 100000) {
      setError('正しい歩数を入力してください（0-100,000）');
      return;
    }

    console.log('Submitting steps:', {
      steps,
      isPartner: false
    });

    updateTodaySteps(steps, false)
      .then(() => {
        console.log('✅ Steps submitted successfully');
        setStepsInput('');
        setError('');
      })
      .catch(error => {
        console.error('❌ Failed to update steps:', error);
        alert('記録の保存に失敗しました: ' + error.message);
        setError('記録の保存に失敗しました');
      });
  };

  const handlePartnerStepsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const steps = parseInt(partnerStepsInput);

    if (isNaN(steps) || steps < 0 || steps > 100000) {
      setError('正しい歩数を入力してください（0-100,000）');
      return;
    }

    console.log('Submitting partner steps:', {
      steps,
      isPartner: true
    });

    updateTodaySteps(steps, true)
      .then(() => {
        console.log('✅ Partner steps submitted successfully');
        setPartnerStepsInput('');
        setError('');
      })
      .catch(error => {
        console.error('❌ Failed to update partner steps:', error);
        alert('記録の保存に失敗しました: ' + error.message);
        setError('記録の保存に失敗しました');
      });
  };

  const handleExerciseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const reps = parseInt(exerciseReps);

    if (!exerciseType.trim()) {
      setError('運動の種類を入力してください');
      return;
    }

    if (isNaN(reps) || reps <= 0 || reps > 1000) {
      setError('正しい回数を入力してください（1-1000）');
      return;
    }

    const exercise = {
      type: exerciseType.trim(),
      reps: reps,
      notes: exerciseNotes.trim() || undefined
    };

    console.log('Submitting exercise:', exercise);

    addTodayExercise(exercise)
      .then(() => {
        console.log('✅ Exercise submitted successfully');
        setExerciseType('');
        setExerciseReps('');
        setExerciseNotes('');
        setError('');
      })
      .catch(error => {
        console.error('❌ Failed to add exercise:', error);
        alert('記録の保存に失敗しました: ' + error.message);
        setError('記録の保存に失敗しました');
      });
  };

  const handleRemoveExercise = (index: number) => {
    console.log('Removing exercise at index:', index);
    
    removeTodayExercise(index)
      .then(() => {
        console.log('✅ Exercise removed successfully');
      })
      .catch(error => {
        console.error('❌ Failed to remove exercise:', error);
        alert('削除に失敗しました: ' + error.message);
      });
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center bg-white rounded-2xl p-6 shadow-sm">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <Activity className="h-8 w-8 text-blue-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          運動記録{isSupporter && ' (まいの記録)'}
        </h2>
        <p className="text-gray-600">
          {isSupporter ? 'まいの運動記録を確認できます' : '今日も元気に運動しましょう！'}
        </p>
      </div>

      {/* Today's Progress */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          今日の運動{isSupporter && ' (まいの記録)'}
        </h3>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {todayValues.steps.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">まいの歩数</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {todayValues.partnerSteps.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">まひろの歩数</div>
          </div>
        </div>

        {/* Today's Exercises */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-800 mb-3">今日の運動内容</h4>
          {todayValues.exercises.length > 0 ? (
            <div className="space-y-2">
              {todayValues.exercises.map((exercise, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-gray-900">{exercise.type}</span>
                      <span className="text-gray-600 ml-2">{exercise.reps}回</span>
                    </div>
                    {!isSupporter && (
                      <button
                        onClick={() => handleRemoveExercise(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {exercise.notes && (
                    <div className="text-sm text-gray-600 mt-1">{exercise.notes}</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <div className="text-gray-400 text-sm">まだ運動記録がありません</div>
              {!isSupporter && (
                <div className="text-gray-400 text-xs mt-1">下のフォームから運動を記録してください</div>
              )}
            </div>
          )}
        </div>
      </div>

      {!isSupporter && (
        <>
          {/* Steps Input */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">歩数を記録</h3>
              <Target className="h-5 w-5 text-blue-500" />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              <form onSubmit={handleStepsSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    まいの歩数
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={stepsInput}
                      onChange={(e) => setStepsInput(e.target.value)}
                      placeholder="今日の歩数を入力"
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500">
                      歩
                    </div>
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
                >
                  記録する
                </button>
              </form>

              <form onSubmit={handlePartnerStepsSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    まひろの歩数
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={partnerStepsInput}
                      onChange={(e) => setPartnerStepsInput(e.target.value)}
                      placeholder="まひろの歩数を入力"
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500">
                      歩
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
          </div>

          {/* Exercise Input */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">運動を記録</h3>
              <Plus className="h-5 w-5 text-green-500" />
            </div>

            <form onSubmit={handleExerciseSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  運動の種類
                </label>
                <input
                  type="text"
                  value={exerciseType}
                  onChange={(e) => setExerciseType(e.target.value)}
                  placeholder="例: 腕立て伏せ、スクワット"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  回数
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={exerciseReps}
                    onChange={(e) => setExerciseReps(e.target.value)}
                    placeholder="回数を入力"
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500">
                    回
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  メモ（任意）
                </label>
                <textarea
                  value={exerciseNotes}
                  onChange={(e) => setExerciseNotes(e.target.value)}
                  placeholder="運動の詳細やメモ"
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                />
              </div>
              
              <button
                type="submit"
                className="w-full bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors font-medium"
              >
                運動を追加
              </button>
            </form>
          </div>
        </>
      )}

      {/* Exercise History */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          運動履歴{isSupporter && ' (まいの記録)'}
        </h3>
        <div className="space-y-4">
          {exerciseRecords.slice(0, 3).map((record) => (
            <div key={record.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium text-gray-900">
                  {new Date(record.date).toLocaleDateString('ja-JP')}
                </div>
                <div className="text-sm text-gray-600">
                  {record.steps.toLocaleString()}歩
                </div>
              </div>
              {record.exercises.length > 0 && (
                <div className="space-y-2">
                  {record.exercises.map((exercise, index) => (
                    <div key={index} className="text-sm text-gray-700">
                      <span className="font-medium">{exercise.type}</span>
                      <span className="text-gray-600 ml-2">{exercise.reps}回</span>
                      {exercise.notes && (
                        <div className="text-xs text-gray-500 mt-1">{exercise.notes}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Exercise;