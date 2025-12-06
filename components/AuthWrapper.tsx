import React, { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';

const VALID_KEY = 'gold2024secret'; // Измените на свой ключ
const TWA_PACKAGE = 'app.vercel.gold_rate_tracker_theta.twa';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [key, setKey] = useState('');

  useEffect(() => {
    // Проверяем User-Agent (TWA приложение)
    const isTWA = navigator.userAgent.includes(TWA_PACKAGE);
    
    if (isTWA) {
      console.log('TWA приложение обнаружено, доступ разрешен');
      setIsAuthenticated(true);
      setLoading(false);
      return;
    }

    // Проверяем URL параметр
    const params = new URLSearchParams(window.location.search);
    const urlKey = params.get('key');
    
    // Проверяем localStorage
    const storedKey = localStorage.getItem('access_key');
    
    if (urlKey === VALID_KEY) {
      localStorage.setItem('access_key', VALID_KEY);
      setIsAuthenticated(true);
      
      // Убираем ключ из URL для безопасности
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (storedKey === VALID_KEY) {
      setIsAuthenticated(true);
    }
    
    setLoading(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (key === VALID_KEY) {
      localStorage.setItem('access_key', VALID_KEY);
      setIsAuthenticated(true);
    } else {
      alert('Неверный ключ доступа');
      setKey('');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_key');
    setIsAuthenticated(false);
    setKey('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 border border-slate-200">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-to-br from-green-100 to-green-200 rounded-full shadow-lg">
              <Lock className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-center text-slate-800 mb-2">
            Gold Rate Monitor
          </h1>
          <p className="text-center text-slate-600 mb-6">
            Введите ключ доступа для продолжения
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Ключ доступа"
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-green-500 focus:outline-none transition-colors font-mono"
                autoFocus
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-green-500 text-white font-semibold py-3 rounded-lg hover:bg-green-600 transition-colors shadow-md hover:shadow-lg"
            >
              Войти
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-xs text-center text-slate-500">
              Используйте мобильное приложение для автоматического доступа
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Добавляем кнопку выхода в шапку (опционально)
  return (
    <div className="relative">
      {children}
      
      {/* Кнопка выхода только для веб-версии */}
      {!navigator.userAgent.includes(TWA_PACKAGE) && (
        <button
          onClick={handleLogout}
          className="fixed bottom-4 right-4 p-3 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors z-50"
          title="Выйти"
        >
          <Lock className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};