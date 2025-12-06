import React, { useState, useEffect, useCallback } from 'react';
import { differenceInHours, format } from 'date-fns';
import ru from 'date-fns/locale/ru';
import { Loader2, AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { ApiResponse, RateData } from './types';
import { RateCard } from './components/RateCard';
import { DigitAnalysis } from './components/DigitAnalysis';
import { fetchRates, shouldUpdate, initializeDatabase } from './services/api';
import { useWakeLock } from './hooks/useWakeLock';
import { useAutoUpdate } from './hooks/useAutoUpdate';

const App: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useWakeLock();

  // Отслеживание онлайн/офлайн статуса
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadData = useCallback(async (forceUpdate = false) => {
    setLoading(true);
    setError(null);
    
    try {
      // Инициализируем БД если нужно
      await initializeDatabase();

      // Проверяем нужно ли обновление
      const needsUpdate = forceUpdate || await shouldUpdate();
      
      if (needsUpdate || !data) {
        const result = await fetchRates();
        setData(result);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка загрузки данных';
      setError(errorMessage);
      
      // Даже при ошибке пытаемся показать кэшированные данные
      try {
        const result = await fetchRates();
        if (result.current.length > 0) {
          setData(result);
          setError(null); // Убираем ошибку если есть кэш
        }
      } catch {
        // Игнорируем
      }
    } finally {
      setLoading(false);
    }
  }, [data]);

  // Начальная загрузка
  useEffect(() => {
    loadData();
  }, []);

  // Автообновление при возврате на страницу
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        const needsUpdate = await shouldUpdate();
        if (needsUpdate) {
          loadData(true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadData]);

  // Автоматическое обновление раз в день
  useAutoUpdate(async () => {
    const needsUpdate = await shouldUpdate();
    if (needsUpdate) {
      await loadData(true);
    }
  });

  const getSortedRates = (rates: RateData[]) => {
    return [...rates].sort((a, b) => Number(b.code) - Number(a.code));
  };

  const isStale = (dateString?: string) => {
    if (!dateString) return true;
    const date = new Date(dateString);
    return differenceInHours(new Date(), date) >= 12;
  };

  const formatKZDate = (dateString: string) => {
    const date = new Date(dateString);
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    const kzTime = new Date(utc + (3600000 * 5));
    return format(kzTime, 'dd.MM.yyyy HH:mm', { locale: ru });
  };

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-slate-100">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h1 className="text-xl font-bold text-center text-slate-800">{error}</h1>
        <button
          onClick={() => loadData(true)}
          className="mt-4 px-6 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  const currentRates = data ? getSortedRates(data.current) : [];
  const prevRates = data ? getSortedRates(data.previous) : [];
  const stale = isStale(data?.lastUpdated);

  const headerBaseClass = "sticky top-0 z-50 px-4 py-2 flex items-center justify-between cursor-pointer transition-colors shadow-sm";
  const headerColorClass = loading 
    ? 'bg-slate-200' 
    : stale 
      ? 'bg-yellow-100 text-yellow-900' 
      : 'bg-green-100 text-green-900';

  return (
    <div className="max-w-md mx-auto min-h-dvh bg-white shadow-xl flex flex-col relative">
      <header 
        onClick={!loading ? () => loadData(true) : undefined}
        className={`${headerBaseClass} ${headerColorClass}`}
      >
        <div className="flex flex-col">
          {!stale && !loading && (
            <span className="text-xs font-bold uppercase opacity-70">
              Актуально
            </span>
          )}
          <span className="text-lg font-bold truncate">
            {data?.lastUpdated 
              ? formatKZDate(data.lastUpdated)
              : 'Нет данных'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Индикатор онлайн/офлайн */}
          <div className="p-1.5 rounded-full bg-white/20">
            {isOnline ? (
              <Wifi className="w-4 h-4" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-600" />
            )}
          </div>
          <div className="p-2 rounded-full bg-white/20 backdrop-blur-sm">
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <RefreshCw className="w-5 h-5" />
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow p-3 space-y-4">
        <div className="space-y-2.5">
          {currentRates.map((rate) => {
            const previousRate = prevRates.find(p => p.code === rate.code);
            return (
              <RateCard 
                key={rate.code} 
                rate={rate} 
                previousRate={previousRate}
                isStale={stale}
              />
            );
          })}
        </div>

        {data && data.previous.length > 0 && (
          <div className="pt-3 border-t border-slate-200">
            <DigitAnalysis current={data.current} previous={data.previous} />
          </div>
        )}
      </main>

      {data && data.previous.length > 0 && (
        <footer className="p-3 bg-slate-50 border-t border-slate-200 text-xs">
          <div className="flex items-center justify-between mb-2">
            <p className="font-semibold uppercase tracking-wider text-slate-500">Предыдущие цены</p>
            {data.previousUpdated && (
              <p className="text-[11px] text-slate-400">
                {formatKZDate(data.previousUpdated)}
              </p>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 mb-2">
            {prevRates.map(r => (
              <div key={r.code} className="flex flex-col">
                <span className="font-mono text-xs font-medium text-slate-500 mb-0.5">{r.label}</span>
                <span className="font-mono text-lg font-bold text-slate-700">{r.price}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center opacity-70 font-bold text-slate-500 text-sm">
            Аванс Ломбард
          </div>
        </footer>
      )}
    </div>
  );
};

export default App;