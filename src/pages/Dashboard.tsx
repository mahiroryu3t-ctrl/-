import React from 'react';
import { useState, useEffect } from 'react';
import { useSimpleAuth, getUserId, getUserKey } from '../contexts/SimpleAuthContext';
import { useSimpleData } from '../contexts/SimpleDataContext';
import CircularProgress from '../components/CircularProgress';
import { Calendar, Trophy, Heart, Sparkles, Target, Edit3, Save, X, Send, MessageSquare, Clock } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { currentUser } = useSimpleAuth();
  const { 
    exerciseRecords, 
    supportRecords, 
    mealRecords, 
    todayValues,
    settings, 
    updateSettings, 
    likeSupportRecord, 
    addSupportRecord, 
    dailyMessages, 
    addDailyMessage, 
    performDailyReset 
  } = useSimpleData();
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(settings.weeklyGoal.toString());
  const [isEditingDates, setIsEditingDates] = useState(false);
  const [startDateInput, setStartDateInput] = useState(settings.startDate);
  const [targetDateInput, setTargetDateInput] = useState(settings.targetDate);
  const [isEditingWeight, setIsEditingWeight] = useState(false);
  const [targetWeightInput, setTargetWeightInput] = useState(settings.targetWeight.toString());
  const [dailyMessageText, setDailyMessageText] = useState('');

  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    setGoalInput(settings.weeklyGoal.toString());
    setStartDateInput(settings.startDate);
    setTargetDateInput(settings.targetDate);
    setTargetWeightInput(settings.targetWeight.toString());
  }, [settings]);

  // Update current date and time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Calculate continuation days
  const startDate = new Date(settings.startDate);
  const today = new Date();
  const continuationDays = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Calculate days until target date
  const targetDate = new Date(settings.targetDate);
  const daysUntilTarget = Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const totalDays = Math.floor((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const progressPercentage = Math.min(((totalDays - daysUntilTarget) / totalDays) * 100, 100);

  // 今日の値は todayValues から取得
  const { steps: todaySteps, partnerSteps: todayPartnerSteps } = todayValues;

  // Weekly goal calculation
  const currentWeek = new Date();
  const dayOfWeek = currentWeek.getDay();
  const startOfWeek = new Date(currentWeek.setDate(currentWeek.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)));
  const userSteps = currentUser?.role === 'main_user' ? 'steps' : 'partner_steps';
  const weeklySteps = exerciseRecords
    .filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= startOfWeek;
    })
    .reduce((total, record) => total + (record[userSteps as keyof typeof record] as number || 0), 0);
  const weeklyProgress = Math.min((weeklySteps / settings.weeklyGoal) * 100, 100);

  // Calculate workout streak (consecutive days with exercises)
  const calculateWorkoutStreak = () => {
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < exerciseRecords.length; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateString = checkDate.toISOString().split('T')[0];
      
      const record = exerciseRecords.find(r => r.date === dateString);
      if (record && record.exercises.length > 0) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const workoutStreak = calculateWorkoutStreak();
  // Get partner's today message
  const partnerUserId = getUserKey(currentUser?.id || '') === 'mai' ? getUserId('mahiro') : getUserId('mai');
  const myLatestMessage = dailyMessages.find(msg => 
    msg.user_id === (currentUser?.id || getUserId('mai'))
  );
  const partnerLatestMessage = dailyMessages.find(msg => 
    msg.user_id === partnerUserId
  );

  const handleGoalSave = () => {
    const newGoal = parseInt(goalInput);
    if (newGoal > 0 && newGoal <= 200000) {
      updateSettings({ weeklyGoal: newGoal });
      setIsEditingGoal(false);
    }
  };

  const handleDatesSave = () => {
    if (startDateInput && targetDateInput && new Date(startDateInput) < new Date(targetDateInput)) {
      updateSettings({ 
        startDate: startDateInput,
        targetDate: targetDateInput
      });
      setIsEditingDates(false);
    }
  };

  const handleWeightSave = () => {
    const newWeight = parseFloat(targetWeightInput);
    if (newWeight > 0 && newWeight <= 200) {
      updateSettings({ targetWeight: newWeight });
      setIsEditingWeight(false);
    }
  };

  const handleDailyMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (dailyMessageText.trim()) {
      addDailyMessage(currentUser?.id || getUserId('mai'), dailyMessageText.trim()).catch(console.error);
      setDailyMessageText('');
    }
  };

  // Get today's messages
  const myTodayMessage = dailyMessages.find(msg => 
    msg.user_id === (currentUser?.id || getUserId('mai')) &&
    new Date(msg.updated_at).toDateString() === today.toDateString()
  );

  // Show supporter dashboard only for supporters
  if (currentUser?.role === 'supporter') {
    return (
      <div className="p-4 space-y-6">
        {/* Date and Time Display */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <div className="text-lg font-bold text-gray-900">
                  {currentDateTime.toLocaleDateString('ja-JP', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    weekday: 'short'
                  })}
                </div>
                <div className="text-sm text-gray-600">
                  {currentDateTime.toLocaleTimeString('ja-JP', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center bg-white rounded-2xl p-6 shadow-sm">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full mb-4">
            <Sparkles className="h-10 w-10 text-pink-500" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            応援 {continuationDays}日目！
          </h2>
          <p className="text-gray-600">いつも応援してくれてありがとう ✨</p>
        </div>

        {/* Date Countdown */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">デートまでのカウントダウン</h3>
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-pink-500" />
              {!isEditingDates ? (
                <button
                  onClick={() => setIsEditingDates(true)}
                  className="text-pink-500 hover:text-pink-600"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleDatesSave}
                    className="text-green-600 hover:text-green-700"
                  >
                    <Save className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setIsEditingDates(false)}
                    className="text-gray-500 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
          {isEditingDates ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">開始日</label>
                <input
                  type="date"
                  value={startDateInput}
                  onChange={(e) => setStartDateInput(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">目標日</label>
                <input
                  type="date"
                  value={targetDateInput}
                  onChange={(e) => setTargetDateInput(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                />
              </div>
            </div>
          ) : (
            <div>
              {/* Main countdown display */}
              <div className="text-center mb-6">
                <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-2xl p-8 mb-4">
                  <div className="text-6xl font-bold text-pink-600 mb-2">{daysUntilTarget}日</div>
                </div>
              </div>
              
              {/* Date display */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">開始日</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {new Date(settings.startDate).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })}
                  </div>
                </div>
                <div className="text-center p-4 bg-pink-50 rounded-lg">
                  <div className="text-sm text-pink-600 mb-1">デート予定日</div>
                  <div className="text-lg font-semibold text-pink-700">
                    {new Date(settings.targetDate).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Today's Progress - まいの頑張り */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">まいの今日の頑張り</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <span className="text-gray-700">歩数</span>
              <span className="text-blue-600 font-semibold">{todaySteps.toLocaleString()} 歩</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <span className="text-gray-700">運動</span>
              <span className="text-green-600 font-semibold">
                {todayValues.exercises.length} 種目
              </span>
            </div>
            
            {/* 今日の運動詳細 */}
            <div className="mt-4">
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
                  <div className="text-gray-400 text-xs mt-1">運動ページで記録を追加してください</div>
                </div>
              )}
            </div>
            
            {/* 今日の食事 */}
            <div className="mt-6">
              <h4 className="text-md font-medium text-gray-800 mb-3">今日の食事</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <div className="text-sm font-medium text-yellow-700 mb-1">朝食</div>
                  <div className="text-xs text-gray-600">
                    {todayValues.meals.breakfast || '未記録'}
                  </div>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <div className="text-sm font-medium text-orange-700 mb-1">昼食</div>
                  <div className="text-xs text-gray-600">
                    {todayValues.meals.lunch || '未記録'}
                  </div>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="text-sm font-medium text-purple-700 mb-1">夕食</div>
                  <div className="text-xs text-gray-600">
                    {todayValues.meals.dinner || '未記録'}
                  </div>
                </div>
                <div className="p-3 bg-pink-50 rounded-lg">
                  <div className="text-sm font-medium text-pink-700 mb-1">間食</div>
                  <div className="text-xs text-gray-600">
                    {todayValues.meals.snack || '未記録'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* まひろの今日の歩数 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">まひろの今日の歩数</h3>
          <div className="p-4 bg-purple-50 rounded-lg text-center">
            <div className="text-3xl font-bold text-purple-600 mb-1">
              {(todayValues.partnerSteps || 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">歩</div>
          </div>
        </div>

        {/* Today's Messages */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">今日の一言</h3>
            <MessageSquare className="h-5 w-5 text-blue-500" />
          </div>
          
          <div className="space-y-4">
            {/* My message */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-600">まひろの一言</span>
                <span className="text-xs text-gray-500">
                  {myLatestMessage ? new Date(myLatestMessage.updated_at).toLocaleDateString('ja-JP') : ''}
                </span>
              </div>
              {myLatestMessage ? (
                <p className="text-gray-700">{myLatestMessage.message}</p>
              ) : (
                <form onSubmit={handleDailyMessageSubmit} className="space-y-3">
                  <textarea
                    value={dailyMessageText}
                    onChange={(e) => setDailyMessageText(e.target.value)}
                    placeholder="今日の一言を入力..."
                    rows={2}
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
                  />
                  <button
                    type="submit"
                    disabled={!dailyMessageText.trim()}
                    className="w-full bg-blue-500 text-white py-2 px-3 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                  >
                    投稿する
                  </button>
                </form>
              )}
            </div>

            {/* Partner's message */}
            <div className="p-4 bg-pink-50 rounded-lg border border-pink-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-pink-600">まいの一言</span>
                <span className="text-xs text-gray-500">
                  {partnerLatestMessage ? new Date(partnerLatestMessage.updated_at).toLocaleDateString('ja-JP') : ''}
                </span>
              </div>
              {partnerLatestMessage ? (
                <p className="text-gray-700">{partnerLatestMessage.message}</p>
              ) : (
                <p className="text-gray-400 text-sm italic">まだ投稿されていません</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main user dashboard
  return (
    <div className="p-4 space-y-6">
      {/* Date and Time Display */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-pink-100 rounded-full">
              <Clock className="h-5 w-5 text-pink-500" />
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">
                {currentDateTime.toLocaleDateString('ja-JP', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  weekday: 'short'
                })}
              </div>
              <div className="text-sm text-gray-600">
                {currentDateTime.toLocaleTimeString('ja-JP', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="text-center bg-white rounded-2xl p-6 shadow-sm">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full mb-4">
          <Sparkles className="h-10 w-10 text-pink-500" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          ダイエット {continuationDays}日目！
        </h2>
        <p className="text-gray-600">今日も頑張りましょう ✨</p>
      </div>

      {/* Date Countdown */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">デートまでのカウントダウン</h3>
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-pink-500" />
            {!isEditingDates ? (
              <button
                onClick={() => setIsEditingDates(true)}
                className="text-pink-500 hover:text-pink-600"
              >
                <Edit3 className="h-4 w-4" />
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleDatesSave}
                  className="text-green-600 hover:text-green-700"
                >
                  <Save className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsEditingDates(false)}
                  className="text-gray-500 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
        
        {isEditingDates ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ダイエット開始日</label>
              <input
                type="date"
                value={startDateInput}
                onChange={(e) => setStartDateInput(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">デート予定日</label>
              <input
                type="date"
                value={targetDateInput}
                onChange={(e) => setTargetDateInput(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
            </div>
          </div>
        ) : (
          <div>
            {/* Main countdown display */}
            <div className="text-center mb-6">
              <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-2xl p-8 mb-4">
                <div className="text-6xl font-bold text-pink-600 mb-2">{daysUntilTarget}日</div>
              </div>
            </div>
            
            {/* Date display */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">開始日</div>
                <div className="text-lg font-semibold text-gray-900">
                  {new Date(settings.startDate).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })}
                </div>
              </div>
              <div className="text-center p-4 bg-pink-50 rounded-lg">
                <div className="text-sm text-pink-600 mb-1">デート予定日</div>
                <div className="text-lg font-semibold text-pink-700">
                  {new Date(settings.targetDate).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>


      {/* Today's Progress */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">今週の歩数進捗</h3>
        <div className="space-y-4">
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-gray-700 font-medium">今週の歩数</span>
                {!isEditingGoal ? (
                  <button
                    onClick={() => {
                      setIsEditingGoal(true);
                      setGoalInput(settings.weeklyGoal.toString());
                    }}
                    className="text-purple-500 hover:text-purple-600"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={goalInput}
                      onChange={(e) => setGoalInput(e.target.value)}
                      className="w-20 px-2 py-1 text-xs border border-purple-300 rounded focus:ring-1 focus:ring-purple-500"
                    />
                    <button
                      onClick={handleGoalSave}
                      className="text-green-600 hover:text-green-700 text-xs"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => setIsEditingGoal(false)}
                      className="text-gray-500 hover:text-gray-600 text-xs"
                    >
                      キャンセル
                    </button>
                  </div>
                )}
              </div>
              <span className="text-purple-600 font-semibold">
                {weeklySteps.toLocaleString()}/{settings.weeklyGoal.toLocaleString()}歩
              </span>
            </div>
            <div className="w-full bg-purple-200 rounded-full h-3">
              <div
                className="bg-purple-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${weeklyProgress}%` }}
              />
            </div>
            <div className="mt-2 text-center">
              <span className="text-sm text-purple-600 font-medium">
                {Math.round(weeklyProgress)}% 達成
              </span>
            </div>
          </div>
        </div>
      </div>


      {/* Today's Messages */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">今日の一言</h3>
          <MessageSquare className="h-5 w-5 text-blue-500" />
        </div>
        
        <div className="space-y-4">
          {/* My message */}
          <div className="p-4 bg-pink-50 rounded-lg border border-pink-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-pink-600">まいの一言</span>
              <span className="text-xs text-gray-500">
                {myLatestMessage ? new Date(myLatestMessage.updated_at).toLocaleDateString('ja-JP') : ''}
              </span>
            </div>
            {myLatestMessage ? (
              <p className="text-gray-700">{myLatestMessage.message}</p>
            ) : (
              <p className="text-gray-400 text-sm italic">まだ投稿されていません</p>
            )}
          </div>

          {/* Partner's message */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-600">まひろの一言</span>
              <span className="text-xs text-gray-500">
                {partnerLatestMessage ? new Date(partnerLatestMessage.updated_at).toLocaleDateString('ja-JP') : ''}
              </span>
            </div>
            {partnerLatestMessage ? (
              <p className="text-gray-700">{partnerLatestMessage.message}</p>
            ) : (
              <p className="text-gray-400 text-sm italic">まだ投稿されていません</p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;