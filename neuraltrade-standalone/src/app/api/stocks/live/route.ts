import { NextResponse } from 'next/server';

const RL_SERVICE_URL = 'http://localhost:3031';

const LIVE_PRICES: Record<string, { name: string; price: number; change: number; changePercent: number; volume: number }> = {
  AAPL: { name: 'Apple Inc.', price: 310.93, change: -0.9, changePercent: -0.29, volume: 18003093 },
  TSLA: { name: 'Tesla, Inc.', price: 436.43, change: -3.84, changePercent: -0.87, volume: 27867305 },
  NVDA: { name: 'NVIDIA Corporation', price: 216.40, change: 2.15, changePercent: 1.0, volume: 35000000 },
  MSFT: { name: 'Microsoft Corporation', price: 452.18, change: 1.34, changePercent: 0.3, volume: 22000000 },
  GOOGL: { name: 'Alphabet Inc.', price: 178.35, change: 0.87, changePercent: 0.49, volume: 15000000 },
  AMZN: { name: 'Amazon.com Inc.', price: 205.72, change: -1.23, changePercent: -0.59, volume: 19000000 },
  META: { name: 'Meta Platforms Inc.', price: 612.45, change: 3.67, changePercent: 0.6, volume: 12000000 },
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'AAPL';

    // Try RL service first
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const response = await fetch(
        `${RL_SERVICE_URL}/api/stocks/live?symbol=${encodeURIComponent(symbol)}`,
        { next: { revalidate: 0 }, signal: controller.signal }
      );
      clearTimeout(timeoutId);
      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch {
      console.log('[API /stocks/live] RL service unavailable, using mock data');
    }

    // Fallback: generate mock live data
    const mock = LIVE_PRICES[symbol];
    if (mock) {
      const priceVariation = (Math.random() - 0.5) * 2;
      const livePrice = Math.round((mock.price + priceVariation) * 100) / 100;
      return NextResponse.json({
        symbol,
        name: mock.name,
        price: livePrice,
        change: mock.change,
        changePercent: mock.changePercent,
        open: Math.round((livePrice - mock.change + (Math.random() - 0.5)) * 100) / 100,
        high: Math.round((livePrice + Math.random() * 3) * 100) / 100,
        low: Math.round((livePrice - Math.random() * 3) * 100) / 100,
        volume: mock.volume + Math.floor(Math.random() * 1000000),
        timestamp: new Date().toISOString(),
      });
    }

    // Unknown symbol - generate random data
    const basePrice = 50 + Math.random() * 400;
    return NextResponse.json({
      symbol,
      name: symbol,
      price: Math.round(basePrice * 100) / 100,
      change: Math.round((Math.random() - 0.5) * 10 * 100) / 100,
      changePercent: Math.round((Math.random() - 0.5) * 4 * 100) / 100,
      open: Math.round(basePrice * 100) / 100,
      high: Math.round((basePrice + Math.random() * 5) * 100) / 100,
      low: Math.round((basePrice - Math.random() * 5) * 100) / 100,
      volume: Math.floor(Math.random() * 50000000),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API /stocks/live] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
