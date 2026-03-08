import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSimpleAuth } from '../contexts/SimpleAuthContext';
import { Home, Activity, Utensils, Scale, Heart } from 'lucide-react';

const SimpleNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useSimpleAuth();

  const allNavItems = [
    { path: '/dashboard', icon: Home, label: 'ホーム' },
    { path: '/exercise', icon: Activity, label: '運動' },
    { path: '/meals', icon: Utensils, label: '食事' },
    { path: '/weight', icon: Scale, label: '体重' },
    { path: '/support', icon: Heart, label: '応援' },
  ];

  // Filter navigation items based on user role
  const navItems = allNavItems.filter(item => {
    if (item.path === '/weight' && currentUser?.role === 'supporter') {
      return false; // Hide weight tracking for supporters
    }
    return true;
  });

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-pink-100">
      <div className="max-w-md mx-auto px-2 py-2">
        <div className="flex justify-around">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-pink-100 text-pink-600'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default SimpleNavigation;