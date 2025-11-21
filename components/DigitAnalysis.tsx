import React, { useMemo } from 'react';
import { RateData, DigitCounts } from '../types';

interface DigitAnalysisProps {
  current: RateData[];
  previous: RateData[];
}

export const DigitAnalysis: React.FC<DigitAnalysisProps> = ({ current, previous }) => {
  
  const diffs = useMemo(() => {
    // Helper: Treat '9' as '6'
    const normalizeDigit = (char: string) => char === '9' ? '6' : char;

    const countDigits = (rates: RateData[]) => {
      const counts: DigitCounts = { '0': 0, '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7': 0, '8': 0 }; 
      // Note: no '9' key needed in initial object if we strictly normalize, 
      // but types might expect string indexing.
      
      rates.forEach(r => {
        const strPrice = r.price.toString();
        for (const char of strPrice) {
          const d = normalizeDigit(char);
          if (counts[d] === undefined) counts[d] = 0;
          counts[d]++;
        }
      });
      return counts;
    };

    const currentCounts = countDigits(current);
    const prevCounts = countDigits(previous);
    
    const needed: { digit: string; count: number }[] = [];

    // Check 0-8 (since 9 is merged into 6)
    const digitsToCheck = ['0', '1', '2', '3', '4', '5', '6', '7', '8'];
    
    for (const d of digitsToCheck) {
      const diff = (currentCounts[d] || 0) - (prevCounts[d] || 0);
      if (diff > 0) {
        needed.push({ digit: d, count: diff });
      }
    }

    return { needed };
  }, [current, previous]);

  if (diffs.needed.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 border-b border-slate-100 pb-2">
        Обновление Табло (Добавить)
      </h3>
      
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          {diffs.needed.map(({ digit, count }) => (
            <div key={digit} className="flex flex-col items-center bg-slate-50 border border-slate-200 rounded-lg p-2 min-w-[50px]">
              <span className="text-2xl font-black text-slate-800 leading-none">{digit}</span>
              <span className="text-sm font-bold text-green-600 mt-1">+{count} шт</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-400 italic">* Цифры 6 и 9 взаимозаменяемы (посчитаны как 6)</p>
      </div>
    </div>
  );
};