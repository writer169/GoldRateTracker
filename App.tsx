import React, { useState, useEffect, useCallback } from 'react';
import { formatDistanceToNow, differenceInHours } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { RateData, ApiResponse } from './types';
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

  // Sort rates: 999 -> 750 -> 585
  const getSortedRates = (rates: RateData[]) => {
    return [...rates].sort((a, b) => Number(b.code) - Number(a.code));
  };

  const isStale = (dateString?: string) => {
    if (!dateString) return true;
    const date = new Date(dateString);
    return differenceInHours(new Date(), date) >= 12;
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

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white shadow-xl flex flex-col relative">
      {/* Header / Status Bar */}
      <header 
        onClick={!loading ? loadData : undefined}
        className={`sticky top-0 z-50 px-4 py-3 flex items-center justify-between cursor-pointer transition-colors shadow-sm
          ${loading ? 'bg-slate-200' : isStale(data?.lastUpdated) ? 'bg-yellow-100 text-yellow-900' : 'bg-green-100 text-green-900'}
        `}
      >
        <div className="flex flex-col">
          <span className="text-xs font-bold uppercase opacity-70">
            {loading ? 'Обновление...' : isStale(data?.lastUpdated) ? 'Данные устарели' : 'Актуально'}
          </span>
          <span className="text-sm font-medium truncate">
            {data?.lastUpdated 
              ? formatDistanceToNow(new Date(data.lastUpdated), { addSuffix: true, locale: ru }) 
              : 'Нет данных'}
          </span>
        </div>
        <div className="p-2 rounded-full bg-white/20 backdrop-blur-sm">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
        </div>
      </header>

      <main className="flex-grow p-4 space-y-6">
        {/* Main Price Cards */}
        <div className="space-y-4">
          {currentRates.map((rate) => {
            const previousRate = prevRates.find(p => p.code === rate.code);
            return (
              <RateCard 
                key={rate.code} 
                rate={rate} 
                previousRate={previousRate} 
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
        <footer className="p-4 bg-slate-50 border-t border-slate-200 text-slate-400 text-xs">
          <p className="font-semibold mb-2 uppercase tracking-wider">Предыдущие цены</p>
          <div className="grid grid-cols-3 gap-2">
            {prevRates.map(r => (
              <div key={r.code} className="flex flex-col">
                <span className="font-mono text-[10px]">{r.label}</span>
                <span className="font-mono">{r.price.toLocaleString('ru-RU')} ₸</span>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center opacity-50">
             m-lombard.kz monitor
          </div>
        </footer>
      )}
    </div>
  );
};

export default App;