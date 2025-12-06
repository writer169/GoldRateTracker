import { useEffect, useRef } from 'react';

// Хук для автоматического обновления раз в день
export const useAutoUpdate = (updateFn: () => Promise<void>) => {
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Функция для расчета времени до следующего обновления
    const getMillisecondsUntilNextUpdate = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0); // Обновление в 9:00 следующего дня
      
      let msUntilUpdate = tomorrow.getTime() - now.getTime();
      
      // Если уже после 9:00 сегодня, обновляем завтра
      if (msUntilUpdate < 0) {
        tomorrow.setDate(tomorrow.getDate() + 1);
        msUntilUpdate = tomorrow.getTime() - now.getTime();
      }
      
      return msUntilUpdate;
    };

    // Планируем первое обновление
    const scheduleNextUpdate = () => {
      const msUntilUpdate = getMillisecondsUntilNextUpdate();
      
      if (intervalRef.current !== null) {
        clearTimeout(intervalRef.current);
      }
      
      console.log(`Следующее обновление через ${Math.round(msUntilUpdate / 1000 / 60)} минут`);
      
      intervalRef.current = window.setTimeout(async () => {
        console.log('Запуск автоматического обновления...');
        await updateFn();
        scheduleNextUpdate(); // Планируем следующее обновление
      }, msUntilUpdate);
    };

    scheduleNextUpdate();

    return () => {
      if (intervalRef.current !== null) {
        clearTimeout(intervalRef.current);
      }
    };
  }, [updateFn]);
};