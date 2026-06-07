import { NextResponse } from 'next/server';

const RL_SERVICE_URL = 'http://localhost:3031';

const STOCK_DATABASE = [
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
  { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Automotive' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Semiconductors' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'E-Commerce' },
  { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Social Media' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Financial' },
  { symbol: 'V', name: 'Visa Inc.', sector: 'Financial' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare' },
  { symbol: 'WMT', name: 'Walmart Inc.', sector: 'Retail' },
  { symbol: 'AMD', name: 'Advanced Micro Devices', sector: 'Semiconductors' },
  { symbol: 'NFLX', name: 'Netflix Inc.', sector: 'Entertainment' },
  { symbol: 'PYPL', name: 'PayPal Holdings', sector: 'Fintech' },
  { symbol: 'UBER', name: 'Uber Technologies', sector: 'Transportation' },
  { symbol: 'COIN', name: 'Coinbase Global', sector: 'Crypto' },
  { symbol: 'BABA', name: 'Alibaba Group', sector: 'E-Commerce' },
  { symbol: 'NIO', name: 'NIO Inc.', sector: 'EV' },
  { symbol: 'SPY', name: 'S&P 500 ETF', sector: 'Index ETF' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', sector: 'Index ETF' },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    if (!query.trim()) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    // Try RL service first
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const response = await fetch(
        `${RL_SERVICE_URL}/api/stocks/search?q=${encodeURIComponent(query)}`,
        { next: { revalidate: 0 }, signal: controller.signal }
      );
      clearTimeout(timeoutId);
      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch {
      console.log('[API /stocks/search] RL service unavailable, using local data');
    }

    // Fallback: search local database
    const upperQuery = query.toUpperCase();
    const results = STOCK_DATABASE.filter(stock =>
      stock.symbol.includes(upperQuery) ||
      stock.name.toUpperCase().includes(upperQuery) ||
      stock.sector.toUpperCase().includes(upperQuery)
    );

    return NextResponse.json({ results, query, count: results.length });
  } catch (error) {
    console.error('[API /stocks/search] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
