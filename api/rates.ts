import { MongoClient } from 'mongodb';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Types for the external API
interface ExternalRate {
  code: string;
  label: string;
  price: number;
}

// DB Schema
interface RateDocument {
  rates: ExternalRate[];
  timestamp: Date;
}

const uri = process.env.MONGODB_URI || "";
const expectedKey = process.env.SECRET_KEY || "dev-key";

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!process.env.MONGODB_URI) {
  console.error("Please add your Mongo URI to .env.local");
}

// Connection caching for Serverless
if (!global._mongoClientPromise) {
  client = new MongoClient(uri);
  global._mongoClientPromise = client.connect();
}
clientPromise = global._mongoClientPromise;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { key } = req.query;

  // 1. Security Check
  if (key !== expectedKey) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const mongoClient = await clientPromise;
    const db = mongoClient.db("gold_rates_db");
    const collection = db.collection<RateDocument>("history");

    // 2. Fetch External Data
    const extResponse = await fetch('https://m-lombard.kz/ru/api/admin/purities/?format=json');
    if (!extResponse.ok) {
      throw new Error('Failed to fetch from provider');
    }
    const currentRates: ExternalRate[] = await extResponse.json();

    // 3. Get Last Record
    const lastRecord = await collection.findOne({}, { sort: { timestamp: -1 } });

    // 4. Compare and Update
    let needsUpdate = false;
    if (!lastRecord) {
      needsUpdate = true;
    } else {
      // Check if any price changed
      const currentMap = new Map(currentRates.map(r => [r.code, r.price]));
      const prevMap = new Map(lastRecord.rates.map(r => [r.code, r.price]));
      
      for (const [code, price] of currentMap) {
        if (prevMap.get(code) !== price) {
          needsUpdate = true;
          break;
        }
      }
      if (currentMap.size !== prevMap.size) needsUpdate = true;
    }

    if (needsUpdate) {
      await collection.insertOne({
        rates: currentRates,
        timestamp: new Date()
      });
    }

    // 5. Construct Response
    const responseData = {
      current: currentRates,
      previous: lastRecord ? lastRecord.rates : [],
      // Return current time as lastUpdated to indicate "Freshness" of the check (Green status)
      // The history logic handles the actual price changes
      lastUpdated: new Date().toISOString()
    };

    res.status(200).json(responseData);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error', error: String(error) });
  }
}

// Global declaration for TS to handle the cached client
declare global {
  var _mongoClientPromise: Promise<MongoClient>;
}