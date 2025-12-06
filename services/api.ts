import { RateData, ApiResponse } from '../types';
import { db } from './database';

// API источника данных
const EXTERNAL_API = 'https://m-lombard.kz/ru/api/admin/purities/?format=json';

export const fetchRates = async (): Promise<ApiResponse> => {
  try {
    // Получаем данные из локальной БД
    const currentRecord = await db.getCurrentRates();
    const previousRecord = await db.getPreviousRates();

    // Пытаемся получить свежие данные
    try {
      const response = await fetch(EXTERNAL_API);
      if (response.ok) {
        const newRates: RateData[] = await response.json();
        
        // Обновляем локальную БД
        const hasChanged = await db.updateRates(newRates);
        
        if (hasChanged) {
          console.log('Цены изменились, обновлены в БД');
        }

        // Получаем обновленные данные из БД
        const updatedCurrent = await db.getCurrentRates();
        const updatedPrevious = await db.getPreviousRates();

        return {
          current: updatedCurrent?.rates || newRates,
          previous: updatedPrevious?.rates || [],
          lastUpdated: updatedCurrent?.timestamp || new Date().toISOString(),
          previousUpdated: updatedPrevious?.timestamp
        };
      }
    } catch (fetchError) {
      console.warn('Не удалось получить данные с сервера, используем кэш:', fetchError);
    }

    // Если не удалось получить с сервера, возвращаем из БД
    if (currentRecord) {
      return {
        current: currentRecord.rates,
        previous: previousRecord?.rates || [],
        lastUpdated: currentRecord.timestamp,
        previousUpdated: previousRecord?.timestamp
      };
    }

    throw new Error('Нет данных. Проверьте подключение к интернету.');
  } catch (error) {
    console.error('Ошибка в fetchRates:', error);
    throw error;
  }
};

// Инициализация БД при загрузке
export const initializeDatabase = async (): Promise<void> => {
  await db.init();
};