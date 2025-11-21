import React, { useMemo } from 'react';
import { RateData, DigitCounts } from '../types';

interface DigitAnalysisProps {
  current: RateData[];
  previous: RateData[];
}

export const DigitAnalysis: React.FC<DigitAnalysisProps> = ({ current, previous }) => {
  
  const diffs = useMemo(() => {
    const countDigits = (rates: RateData[]) => {
      const counts: DigitCounts = { '0': 0, '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7': 0, '8': 0, '9': 0 };
      rates.forEach(r => {
        const strPrice = r.price.toString();
        for (const char of strPrice) {
          if (counts[char] !== undefined) {
            counts[char]++;
          }
        }
      });
      return counts;
    };

    const currentCounts = countDigits(current);
    const prevCounts = countDigits(previous);
    
    const needed: { digit: string; count: number }[] = [];
    const extra: { digit: string; count: number }[] = [];

    for (let i = 0; i <= 9; i++) {
      const d = i.toString();
      const diff = (currentCounts[d] || 0) - (prevCounts[d] || 0);
      if (diff > 0) {
        needed.push({ digit: d, count: diff });
      } else if (diff < 0) {
        extra.push({ digit: d, count: Math.abs(diff) });
      }
    }

    return { needed, extra };
  }, [current, previous]);

  if (diffs.needed.length === 0 && diffs.extra.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-800 text-white rounded-xl p-4 shadow-lg">
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 border-b border-slate-700 pb-2">
        Обновление Табло
      </h3>
      
      <div className="space-y-4">
        {/* Missing Digits */}
        <div>
          <span className="text-xs text-green-400 font-bold block mb-1">ДОБАВИТЬ ЦИФРЫ:</span>
          {diffs.needed.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {diffs.needed.map(({ digit, count }) => (
                <div key={digit} className="bg-green-600 text-white font-bold font-mono px-2 py-1 rounded text-sm min-w-[32px] text-center border border-green-400 shadow-sm">
                  {digit} <span className="opacity-70 text-[10px] ml-1">x{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <span className="text-xs text-slate-500 italic">Нет недостающих цифр</span>
          )}
        </div>

        {/* Extra Digits */}
        <div>
          <span className="text-xs text-red-400 font-bold block mb-1">УБРАТЬ ЦИФРЫ:</span>
          {diffs.extra.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {diffs.extra.map(({ digit, count }) => (
                <div key={digit} className="bg-red-900/50 text-red-200 font-bold font-mono px-2 py-1 rounded text-sm min-w-[32px] text-center border border-red-900/50">
                  {digit} <span className="opacity-70 text-[10px] ml-1">x{count}</span>
                </div>
              ))}
            </div>
          ) : (
             <span className="text-xs text-slate-500 italic">Нет лишних цифр</span>
          )}
        </div>
      </div>
    </div>
  );
};