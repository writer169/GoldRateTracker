import React from 'react';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { RateData } from '../types';

interface RateCardProps {
  rate: RateData;
  previousRate?: RateData;
  isStale: boolean;
}

export const RateCard: React.FC<RateCardProps> = ({ rate, previousRate, isStale }) => {
  const diff = previousRate ? rate.price - previousRate.price : 0;
  
  // Border color depends on freshness (isStale), not code
  const borderColorClass = isStale 
    ? 'border-yellow-400 ring-4 ring-yellow-400/10 bg-yellow-50/50' 
    : 'border-green-500 ring-4 ring-green-500/10 bg-green-50/50';

  const containerClasses = `
    relative overflow-hidden rounded-2xl border-2 p-3 shadow-sm transition-all
    ${borderColorClass}
  `;

  return (
    <div className={containerClasses}>
      <div className="flex justify-between items-baseline">
        {/* Уменьшенный размер цифр расценок */}
        <span className="font-black tracking-tighter text-slate-800 text-4xl">
          {rate.price.toLocaleString('ru-RU')}
        </span>
        <span className="font-mono font-bold text-slate-500 text-xl">
          {rate.label}
        </span>
      </div>

      <div className="flex items-center space-x-2 mt-0.5 h-5">
        {diff !== 0 ? (
          <>
            <div className={`
              flex items-center justify-center w-5 h-5 rounded-full 
              ${diff > 0 ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'}
            `}>
              {diff > 0 ? <ArrowUp size={12} strokeWidth={3} /> : <ArrowDown size={12} strokeWidth={3} />}
            </div>
            <span className={`font-bold font-mono text-base ${diff > 0 ? 'text-green-700' : 'text-red-700'}`}>
              {Math.abs(diff).toLocaleString('ru-RU')} ₸
            </span>
          </>
        ) : (
          <div className="flex items-center text-slate-400 space-x-2">
             <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center">
                <Minus size={12} />
             </div>
             <span className="text-sm font-medium">Без изменений</span>
          </div>
        )}
      </div>
    </div>
  );
};
