import { NextResponse } from 'next/server';

const RL_SERVICE_URL = 'http://localhost:3031';

const MOCK_STOCKS: Record<string, { name: string; price: number; change: number; changePercent: number; marketCap: number; peRatio: number; week52High: number; week52Low: number }> = {
  AAPL: { name: 'Apple Inc.', price: 310.93, change: -0.9, changePercent: -0.29, marketCap: 4566812721152, peRatio: 37.69, week52High: 315, week52Low: 195.07 },
  TSLA: { name: 'Tesla, Inc.', price: 436.43, change: -3.84, changePercent: -0.87, marketCap: 1638979076096, peRatio: 393.15, week52High: 498.83, week52Low: 273.21 },
  NVDA: { name: 'NVIDIA Corporation', price: 216.40, change: 2.15, changePercent: 1.0, marketCap: 5300000000000, peRatio: 42.5, week52High: 230, week52Low: 86.5 },
  MSFT: { name: 'Microsoft Corporation', price: 452.18, change: 1.34, changePercent: 0.3, marketCap: 3360000000000, peRatio: 36.2, week52High: 468, week52Low: 309 },
  GOOGL: { name: 'Alphabet Inc.', price: 178.35, change: 0.87, changePercent: 0.49, marketCap: 2180000000000, peRatio: 24.8, week52High: 185, week52Low: 130 },
  AMZN: { name: 'Amazon.com Inc.', price: 205.72, change: -1.23, changePercent: -0.59, marketCap: 2150000000000, peRatio: 32.1, week52High: 215, week52Low: 151 },
  META: { name: 'Meta Platforms Inc.', price: 612.45, change: 3.67, changePercent: 0.6, marketCap: 1560000000000, peRatio: 28.9, week52High: 625, week52Low: 414 },
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbols = searchParams.get('symbols') || 'AAPL,TSLA,NVDA,MSFT,GOOGL';

    // Try external service first
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(
        `${RL_SERVICE_URL}/api/stocks/multi?symbols=${encodeURIComponent(symbols)}`,
        { next: { revalidate: 0 }, signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch {
      console.log('[API /stocks/multi] RL service unavailable, using mock data');
    }

    // Fallback: generate mock data
    const symbolList = symbols.split(',');
    const now = new Date().toISOString();
    const stocks = symbolList.map(sym => {
      const mock = MOCK_STOCKS[sym];
      if (!mock) {
        const basePrice = 50 + Math.random() * 400;
        return {
          symbol: sym,
          name: sym,
          price: Math.round(basePrice * 100) / 100,
          previousClose: Math.round((basePrice + (Math.random() - 0.5) * 5) * 100) / 100,
          change: Math.round((Math.random() - 0.5) * 10 * 100) / 100,
          changePercent: Math.round((Math.random() - 0.5) * 4 * 100) / 100,
          open: Math.round(basePrice * 100) / 100,
          high: Math.round((basePrice + Math.random() * 5) * 100) / 100,
          low: Math.round((basePrice - Math.random() * 5) * 100) / 100,
          volume: Math.floor(Math.random() * 50000000 + 5000000),
          marketCap: Math.floor(Math.random() * 2000000000000 + 500000000000),
          peRatio: Math.round((15 + Math.random() * 40) * 100) / 100,
          week52High: Math.round((basePrice + Math.random() * 50) * 100) / 100,
          week52Low: Math.round((basePrice - Math.random() * 50) * 100) / 100,
          timestamp: now,
        };
      }
      const priceVariation = (Math.random() - 0.5) * 2;
      const currentPrice = Math.round((mock.price + priceVariation) * 100) / 100;
      return {
        symbol: sym,
        name: mock.name,
        price: currentPrice,
        previousClose: Math.round((currentPrice - mock.change) * 100) / 100,
        change: Math.round(mock.change * 100) / 100,
        changePercent: Math.round(mock.changePercent * 100) / 100,
        open: Math.round((currentPrice + (Math.random() - 0.5) * 3) * 100) / 100,
        high: Math.round((currentPrice + Math.random() * 5) * 100) / 100,
        low: Math.round((currentPrice - Math.random() * 5) * 100) / 100,
        volume: Math.floor(Math.random() * 50000000 + 5000000),
        marketCap: mock.marketCap,
        peRatio: mock.peRatio,
        week52High: mock.week52High,
        week52Low: mock.week52Low,
        timestamp: now,
      };
    });

    return NextResponse.json({ stocks });
  } catch (error) {
    console.error('[API /stocks/multi] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
