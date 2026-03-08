import React from 'react';
import { useSimpleAuth } from '../contexts/SimpleAuthContext';
import { User, Users, Heart, AlertCircle } from 'lucide-react';

const UserSelector: React.FC = () => {
  const { selectUser, isLoading, error } = useSimpleAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <div className="bg-white rounded-3xl p-8 shadow-xl max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full mb-4">
            <Heart className="h-10 w-10 text-pink-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">まいちゃん最強かわいい計画</h1>
          <p className="text-gray-600">どちらのユーザーですか？</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          <button
            onClick={() => selectUser('mai')}
            disabled={isLoading}
            className="group p-6 rounded-2xl border-2 border-pink-200 hover:border-pink-500 hover:bg-pink-50 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center space-x-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-pink-100 rounded-full group-hover:bg-pink-200 transition-colors">
                <User className="h-6 w-6 text-pink-600" />
              </div>
              <div className="text-left">
                <div className="text-xl font-bold text-gray-900">まい</div>
                <div className="text-sm text-gray-600">本人（ダイエットする方）</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => selectUser('mahiro')}
            disabled={isLoading}
            className="group p-6 rounded-2xl border-2 border-blue-200 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center space-x-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-left">
                <div className="text-xl font-bold text-gray-900">まひろ</div>
                <div className="text-sm text-gray-600">応援者（パートナー）</div>
              </div>
            </div>
          </button>
        </div>

        {isLoading && (
          <div className="mt-6 text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500"></div>
            <p className="text-sm text-gray-500 mt-2">読み込み中...</p>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">選択したユーザー情報は次回も記憶されます</p>
        </div>
      </div>
    </div>
  );
};

export default UserSelector;
