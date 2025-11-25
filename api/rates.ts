import { createClient } from 'redis';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Types for the external API
interface ExternalRate {
  code: string;
  label: string;
  price: number;
}

// Redis Schema
interface RateRecord {
  rates: ExternalRate[];
  timestamp: string;
}

const expectedKey = process.env.SECRET_KEY || "dev-key";

// Функция для получения Redis клиента
async function getRedisClient() {
  const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } = process.env;
  
  if (!REDIS_HOST || !REDIS_PORT || !REDIS_PASSWORD) {
    throw new Error('Redis environment variables are not defined');
  }
  
  const redisPassword = encodeURIComponent(REDIS_PASSWORD);
  const redisUrl = `redis://default:${redisPassword}@${REDIS_HOST}:${REDIS_PORT}`;
  
  const client = createClient({ url: redisUrl });
  
  client.on('error', (err) => console.error('Redis Client Error:', err));
  
  await client.connect();
  
  return client;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { key } = req.query;

  // 1. Security Check
  if (key !== expectedKey) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  let client;

  try {
    client = await getRedisClient();

    // 2. Fetch External Data
    const extResponse = await fetch('https://m-lombard.kz/ru/api/admin/purities/?format=json');
    if (!extResponse.ok) {
      throw new Error('Failed to fetch from provider');
    }
    const currentRates: ExternalRate[] = await extResponse.json();

    // 3. Get Last Record from Redis to compare
    const lastRecordJson = await client.get('gold_rates:latest');
    const lastRecord: RateRecord | null = lastRecordJson ? JSON.parse(lastRecordJson) : null;

    let needsUpdate = false;
    
    if (!lastRecord) {
      needsUpdate = true;
    } else {
      // Compare logic
      const currentMap = new Map(currentRates.map(r => [r.code, r.price]));
      const prevMap = new Map(lastRecord.rates.map(r => [r.code, r.price]));
      
      if (currentMap.size !== prevMap.size) {
        needsUpdate = true;
      } else {
        for (const [code, price] of currentMap) {
          if (prevMap.get(code) !== price) {
            needsUpdate = true;
            break;
          }
        }
      }
    }

    // 4. Update Redis if needed
    if (needsUpdate) {
      const newRecord: RateRecord = {
        rates: currentRates,
        timestamp: new Date().toISOString()
      };

      // Move current to previous
      if (lastRecord) {
        await client.set('gold_rates:previous', JSON.stringify(lastRecord));
      }

      // Save new as current
      await client.set('gold_rates:latest', JSON.stringify(newRecord));
    }

    // 5. Fetch final 2 records for display
    const currentRecordJson = await client.get('gold_rates:latest');
    const previousRecordJson = await client.get('gold_rates:previous');

    const actualRecord: RateRecord | null = currentRecordJson ? JSON.parse(currentRecordJson) : null;
    const previousRecord: RateRecord | null = previousRecordJson ? JSON.parse(previousRecordJson) : null;

    // 6. Construct Response
    const responseData = {
      current: actualRecord ? actualRecord.rates : currentRates,
      previous: previousRecord ? previousRecord.rates : (actualRecord ? actualRecord.rates : []),
      lastUpdated: actualRecord ? actualRecord.timestamp : new Date().toISOString(),
      previousUpdated: previousRecord ? previousRecord.timestamp : undefined
    };

    res.status(200).json(responseData);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error', error: String(error) });
  } finally {
    // Закрываем соединение после использования
    if (client) {
      await client.quit();
    }
  }
}