import React from 'react';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { RateData } from '../types';

interface RateCardProps {
  rate: RateData;
  previousRate?: RateData;
}

export const RateCard: React.FC<RateCardProps> = ({ rate, previousRate }) => {
  const diff = previousRate ? rate.price - previousRate.price : 0;
  
  // Style config based on purity for visual hierarchy
  const isHighValue = rate.code === '999';
  const isMidValue = rate.code === '750';
  
  const containerClasses = `
    relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition-all
    ${isHighValue ? 'border-yellow-400 ring-4 ring-yellow-400/10' : 'border-slate-200'}
  `;

  return (
    <div className={containerClasses}>
      <div className="flex justify-between items-baseline mb-1">
        <span className={`font-black tracking-tighter text-slate-800 ${isHighValue ? 'text-5xl' : isMidValue ? 'text-4xl' : 'text-4xl'}`}>
          {rate.price.toLocaleString('ru-RU')}
        </span>
        <span className={`font-mono font-bold text-slate-400 ${isHighValue ? 'text-xl' : 'text-lg'}`}>
          {rate.label}
        </span>
      </div>

      <div className="flex items-center space-x-2 mt-2 h-6">
        {diff !== 0 ? (
          <>
            <div className={`
              flex items-center justify-center w-6 h-6 rounded-full 
              ${diff > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}
            `}>
              {diff > 0 ? <ArrowUp size={14} strokeWidth={3} /> : <ArrowDown size={14} strokeWidth={3} />}
            </div>
            <span className={`font-bold font-mono text-lg ${diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {Math.abs(diff).toLocaleString('ru-RU')} ₸
            </span>
          </>
        ) : (
          <div className="flex items-center text-slate-300 space-x-2">
             <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                <Minus size={14} />
             </div>
             <span className="text-sm font-medium">Без изменений</span>
          </div>
        )}
      </div>
    </div>
  );
};