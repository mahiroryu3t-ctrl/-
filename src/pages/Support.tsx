import React, { useState } from 'react';
import { useSimpleAuth, getUserId, getUserKey } from '../contexts/SimpleAuthContext';
import { useSimpleData } from '../contexts/SimpleDataContext';
import { Heart, MessageSquare, Trophy, Sparkles, MessageCircle } from 'lucide-react';

const Support: React.FC = () => {
  const { currentUser } = useSimpleAuth();
  const { dailyMessages, addDailyMessage, supportRecords, likeSupportRecord } = useSimpleData();
  const [dailyMessageText, setDailyMessageText] = useState('');

  // Get partner's today message
  const partnerUserId = getUserKey(currentUser?.id || '') === 'mai' ? getUserId('mahiro') : getUserId('mai');
  const myLatestMessage = dailyMessages.find(msg => 
    msg.user_id === (currentUser?.id || getUserId('mai'))
  );
  const partnerLatestMessage = dailyMessages.find(msg => 
    msg.user_id === partnerUserId
  );

  const handleLikeComment = (supportId: string) => {
    likeSupportRecord(supportId, currentUser?.id || getUserId('mai'));
  };

  const handleDailyMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dailyMessageText.trim()) return;

    addDailyMessage({
      date: new Date().toISOString().split('T')[0],
      message: dailyMessageText.trim()
    })
      .then(() => {
        console.log('✅ Daily message submitted successfully');
        setDailyMessageText('');
      })
      .catch(error => {
        console.error('❌ Failed to add daily message:', error);
        alert('メッセージの保存に失敗しました: ' + error.message);
      });
  };

  if (currentUser?.role === 'main_user') {
    return (
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="text-center bg-white rounded-2xl p-6 shadow-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 rounded-full mb-4">
            <Heart className="h-8 w-8 text-pink-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">応援メッセージ</h2>
          <p className="text-gray-600">いつも応援してくれてありがとう！</p>
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
                <>
                  <p className="text-gray-700 mb-3">{myLatestMessage.message}</p>
                  <form onSubmit={handleDailyMessageSubmit} className="space-y-3">
                    <textarea
                      value={dailyMessageText}
                      onChange={(e) => setDailyMessageText(e.target.value)}
                      placeholder="新しい一言を入力..."
                      rows={2}
                      className="w-full px-3 py-2 border border-pink-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 resize-none text-sm"
                    />
                    <button
                      type="submit"
                      disabled={!dailyMessageText.trim()}
                      className="w-full bg-pink-500 text-white py-2 px-3 rounded-lg hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                    >
                      更新する
                    </button>
                  </form>
                </>
              ) : (
                <form onSubmit={handleDailyMessageSubmit} className="space-y-3">
                  <textarea
                    value={dailyMessageText}
                    onChange={(e) => setDailyMessageText(e.target.value)}
                    placeholder="今日の一言を入力..."
                    rows={2}
                    className="w-full px-3 py-2 border border-pink-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 resize-none text-sm"
                  />
                  <button
                    type="submit"
                    disabled={!dailyMessageText.trim()}
                    className="w-full bg-pink-500 text-white py-2 px-3 rounded-lg hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                  >
                    投稿する
                  </button>
                </form>
              )}
            </div>

            {/* Partner message */}
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

        {/* Support Messages */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">応援履歴</h3>
            <Trophy className="h-5 w-5 text-yellow-500" />
          </div>
          
          <div className="space-y-4">
            {supportRecords.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Sparkles className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>まだ応援メッセージがありません</p>
              </div>
            ) : (
              supportRecords.slice(0, 3).map((support) => (
                <div
                  key={support.id}
                  className={`p-4 rounded-lg ${
                    support.type === 'like'
                      ? 'bg-red-50 border border-red-100'
                      : 'bg-pink-50 border border-pink-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                    {support.type === 'like' ? (
                      <Heart className="h-5 w-5 text-red-500 fill-current" />
                    ) : (
                      <MessageCircle className="h-5 w-5 text-pink-500" />
                    )}
                    <span className="font-medium text-gray-900">まひろ</span>
                    <span className="text-sm text-gray-500">
                      {new Date(support.date).toLocaleDateString('ja-JP')}
                    </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleLikeComment(support.id)}
                        className={`flex items-center space-x-1 px-2 py-1 rounded-full transition-colors ${
                          support.liked_by?.includes(currentUser?.id || getUserId('mai'))
                            ? 'bg-red-100 text-red-600'
                            : 'bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500'
                        }`}
                      >
                        <Heart className={`h-4 w-4 ${
                          support.liked_by?.includes(currentUser?.id || getUserId('mai')) ? 'fill-current' : ''
                        }`} />
                        <span className="text-sm">{support.likes || 0}</span>
                      </button>
                    </div>
                  </div>
                  {support.message && (
                    <p className="text-gray-700">{support.message}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center bg-white rounded-2xl p-6 shadow-sm">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 rounded-full mb-4">
          <Heart className="h-8 w-8 text-pink-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">応援する</h2>
        <p className="text-gray-600">頑張ってる彼女を応援しましょう！</p>
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
              <>
                <p className="text-gray-700 mb-3">{myLatestMessage.message}</p>
                <form onSubmit={handleDailyMessageSubmit} className="space-y-3">
                  <textarea
                    value={dailyMessageText}
                    onChange={(e) => setDailyMessageText(e.target.value)}
                    placeholder="新しい一言を入力..."
                    rows={2}
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
                  />
                  <button
                    type="submit"
                    disabled={!dailyMessageText.trim()}
                    className="w-full bg-blue-500 text-white py-2 px-3 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                  >
                    更新する
                  </button>
                </form>
              </>
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

          {/* Partner message */}
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
};

export default Support;