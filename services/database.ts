import { RateData } from '../types';

interface RateRecord {
  id: string; // 'current' или 'previous'
  rates: RateData[];
  timestamp: string;
}

const DB_NAME = 'GoldRateDB';
const DB_VERSION = 1;
const STORE_NAME = 'rates';

class Database {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
    });
  }

  async saveRecord(id: string, rates: RateData[]): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const record: RateRecord = {
        id,
        rates,
        timestamp: new Date().toISOString()
      };

      const request = store.put(record);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getRecord(id: string): Promise<RateRecord | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getCurrentRates(): Promise<RateRecord | null> {
    return this.getRecord('current');
  }

  async getPreviousRates(): Promise<RateRecord | null> {
    return this.getRecord('previous');
  }

  async updateRates(newRates: RateData[]): Promise<boolean> {
    const currentRecord = await this.getCurrentRates();
    
    let hasChanged = false;

    if (!currentRecord) {
      // Первый запуск - сохраняем как текущие
      await this.saveRecord('current', newRates);
      hasChanged = true;
    } else {
      // Сравниваем цены
      const currentMap = new Map(currentRecord.rates.map(r => [r.code, r.price]));
      const newMap = new Map(newRates.map(r => [r.code, r.price]));

      if (currentMap.size !== newMap.size) {
        hasChanged = true;
      } else {
        for (const [code, price] of newMap) {
          if (currentMap.get(code) !== price) {
            hasChanged = true;
            break;
          }
        }
      }

      if (hasChanged) {
        // Перемещаем текущие в предыдущие
        await this.saveRecord('previous', currentRecord.rates);
        // Сохраняем новые как текущие
        await this.saveRecord('current', newRates);
      }
    }

    return hasChanged;
  }

  async getLastUpdateTime(): Promise<Date | null> {
    const record = await this.getCurrentRates();
    return record ? new Date(record.timestamp) : null;
  }
}

export const db = new Database();