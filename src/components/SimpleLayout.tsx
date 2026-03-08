import React from 'react';
import { useSimpleData } from '../contexts/SimpleDataContext';
import { useSimpleAuth } from '../contexts/SimpleAuthContext';
import { useLocation } from 'react-router-dom';
import SimpleHeader from './SimpleHeader';
import SimpleNavigation from './SimpleNavigation';

interface SimpleLayoutProps {
  children: React.ReactNode;
}

const SimpleLayout: React.FC<SimpleLayoutProps> = ({ children }) => {
  const { isLoading: dataLoading } = useSimpleData();
  const { isLoading: authLoading } = useSimpleAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-4 border-pink-500 mb-4"></div>
          <p className="text-gray-600">初期化中...</p>
        </div>
      </div>
    );
  }

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
        <SimpleHeader />
        <main className="pb-20 flex items-center justify-center min-h-[calc(100vh-140px)]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-4 border-pink-500 mb-4"></div>
            <p className="text-gray-600">データを読み込み中...</p>
          </div>
        </main>
        <SimpleNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <SimpleHeader />
      <main className="pb-20">
        {children}
      </main>
      <SimpleNavigation />
    </div>
  );
};

export default SimpleLayout;