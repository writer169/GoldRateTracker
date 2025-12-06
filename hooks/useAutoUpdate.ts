import { useEffect, useRef } from 'react';

// Хук для автоматического обновления 3 раза в день: 9:00, 12:00, 18:00
export const useAutoUpdate = (updateFn: () => Promise<void>) => {
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    const UPDATE_HOURS = [9, 12, 18]; // Часы обновления

    const getMillisecondsUntilNextUpdate = () => {
      const now = new Date();
      const currentHour = now.getHours();
      
      // Находим следующий час обновления
      let nextHour = UPDATE_HOURS.find(hour => hour > currentHour);
      
      // Если не нашли (уже после 18:00), берем первый час завтрашнего дня
      if (nextHour === undefined) {
        nextHour = UPDATE_HOURS[0];
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(nextHour, 0, 0, 0);
        return tomorrow.getTime() - now.getTime();
      }
      
      // Вычисляем время до следующего обновления сегодня
      const nextUpdate = new Date(now);
      nextUpdate.setHours(nextHour, 0, 0, 0);
      return nextUpdate.getTime() - now.getTime();
    };

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