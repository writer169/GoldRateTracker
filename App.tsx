import React, { useState, useEffect, useCallback } from 'react';
import { differenceInHours, format } from 'date-fns';
import ru from 'date-fns/locale/ru';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { ApiResponse, RateData } from './types';
import { RateCard } from './components/RateCard';
import { DigitAnalysis } from './components/DigitAnalysis';
import { fetchRates } from './services/api';

const App: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [key, setKey] = useState<string>('');

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const apiKey = searchParams.get('key');
    if (apiKey) {
      setKey(apiKey);
    } else {
      setError('Доступ запрещен: Отсутствует ключ безопасности');
      setLoading(false);
    }
  }, []);

  const loadData = useCallback(async () => {
    if (!key) return;
    
    setLoading(true);
    setError(null);
    try {
      const result = await fetchRates(key);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }, [key]);

  useEffect(() => {
    if (key) {
      loadData();
    }
  }, [key, loadData]);

  // Автоматическая перезагрузка при возврате на страницу
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && key) {
        loadData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [key, loadData]);

  // Sort rates: 999 -> 750 -> 585
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
    // Get UTC time in ms
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    // Add 5 hours for KZ
    const kzTime = new Date(utc + (3600000 * 5));
    return format(kzTime, 'dd.MM.yyyy HH:mm', { locale: ru });
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-slate-100">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h1 className="text-xl font-bold text-center text-slate-800">{error}</h1>
        {!key && <p className="mt-2 text-slate-500">Добавьте ?key=ВАШ_КЛЮЧ в адресную строку</p>}
      </div>
    );
  }

  const currentRates = data ? getSortedRates(data.current) : [];
  const prevRates = data ? getSortedRates(data.previous) : [];
  const stale = isStale(data?.lastUpdated);

  // Header styles based on state
  const headerBaseClass = "sticky top-0 z-50 px-4 py-3 flex items-center justify-between cursor-pointer transition-colors shadow-sm";
  const headerColorClass = loading 
    ? 'bg-slate-200' 
    : stale 
      ? 'bg-yellow-100 text-yellow-900' 
      : 'bg-green-100 text-green-900';

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white shadow-xl flex flex-col relative">
      {/* Header / Status Bar */}
      <header 
        onClick={!loading ? loadData : undefined}
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
        <div className="p-2 rounded-full bg-white/20 backdrop-blur-sm">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
        </div>
      </header>

      <main className="flex-grow p-4 space-y-6">
        {/* Main Price Cards */}
        <div className="space-y-3">
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

        {/* Digit Analysis */}
        {data && data.previous.length > 0 && (
          <div className="pt-4 border-t border-slate-200">
            <DigitAnalysis current={data.current} previous={data.previous} />
          </div>
        )}
      </main>

      {/* Footer History */}
      {data && data.previous.length > 0 && (
        <footer className="p-4 bg-slate-50 border-t border-slate-200 text-xs">
          <p className="font-semibold mb-3 uppercase tracking-wider text-slate-500">Предыдущие цены</p>
          <div className="grid grid-cols-3 gap-3 mb-3">
            {prevRates.map(r => (
              <div key={r.code} className="flex flex-col">
                <span className="font-mono text-xs font-medium text-slate-500 mb-1">{r.label}</span>
                <span className="font-mono text-xl font-bold text-slate-700">{r.price}</span>
              </div>
            ))}
          </div>
          {data.previous.length > 0 && data.previous[0] && (
            <p className="text-[11px] text-slate-400 mt-2">
              Дата записи: {formatKZDate(data.lastUpdated)}
            </p>
          )}
          <div className="mt-6 text-center opacity-70 font-bold text-slate-500 text-sm">
             Аванс Ломбард
          </div>
        </footer>
      )}
    </div>
  );
};

export default App;
