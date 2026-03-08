import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SimpleAuthProvider, useSimpleAuth } from './contexts/SimpleAuthContext';
import { SimpleDataProvider } from './contexts/SimpleDataContext';
import UserSelector from './components/UserSelector';
import SimpleLayout from './components/SimpleLayout';
import Dashboard from './pages/Dashboard';
import Exercise from './pages/Exercise';
import Meals from './pages/Meals';
import Weight from './pages/Weight';
import Support from './pages/Support';

const AppContent: React.FC = () => {
  const { currentUser, isLoading } = useSimpleAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-4 border-pink-500 mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <UserSelector />;
  }

  return (
    <SimpleDataProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<SimpleLayout><Dashboard /></SimpleLayout>} />
        <Route path="/exercise" element={<SimpleLayout><Exercise /></SimpleLayout>} />
        <Route path="/meals" element={<SimpleLayout><Meals /></SimpleLayout>} />
        <Route path="/weight" element={<SimpleLayout><Weight /></SimpleLayout>} />
        <Route path="/support" element={<SimpleLayout><Support /></SimpleLayout>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </SimpleDataProvider>
  );
};

function App() {
  return (
    <SimpleAuthProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
          <AppContent />
        </div>
      </Router>
    </SimpleAuthProvider>
  );
}

export default App;