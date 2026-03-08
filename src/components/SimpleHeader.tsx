import React from 'react';
import { useSimpleAuth } from '../contexts/SimpleAuthContext';
import { Heart, LogOut } from 'lucide-react';

const SimpleHeader: React.FC = () => {
  const { currentUser } = useSimpleAuth();

  const logout = () => {
    localStorage.removeItem('selected_user');
    window.location.reload();
  };

  return (
    <header className="bg-white shadow-sm border-b border-pink-100">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Heart className="h-6 w-6 text-pink-500" />
          <h1 className="text-lg font-bold text-gray-800">まいちゃん最強かわいい計画</h1>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="text-sm text-gray-600">{currentUser?.name}</div>
          </div>
          <button
            onClick={logout}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            title="ログアウト"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default SimpleHeader;