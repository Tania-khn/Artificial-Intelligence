import { NextResponse } from 'next/server';

const RL_SERVICE_URL = 'http://localhost:3031';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'AAPL';
    const period = searchParams.get('period') || '1y';

    // Try RL service first
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const response = await fetch(
        `${RL_SERVICE_URL}/api/stocks/history?symbol=${encodeURIComponent(symbol)}&period=${encodeURIComponent(period)}`,
        { next: { revalidate: 60 }, signal: controller.signal }
      );
      clearTimeout(timeoutId);
      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch {
      console.log('[API /stocks/history] RL service unavailable, using mock data');
    }

    // Fallback: generate mock historical data
    const basePrice: Record<string, number> = {
      AAPL: 310, TSLA: 436, NVDA: 216, MSFT: 452, GOOGL: 178, AMZN: 205, META: 612,
    };
    const base = basePrice[symbol] || 150;
    const days = period === '1mo' ? 30 : period === '3mo' ? 90 : period === '6mo' ? 180 : 365;
    const history = [];
    let price = base * 0.85;

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      price = price + (Math.random() - 0.45) * (base * 0.015);
      price = Math.max(price, base * 0.6);
      const open = price + (Math.random() - 0.5) * 2;
      const high = Math.max(price, open) + Math.random() * 3;
      const low = Math.min(price, open) - Math.random() * 3;
      const volume = Math.floor(20000000 + Math.random() * 60000000);

      history.push({
        date: date.toISOString().split('T')[0],
        open: Math.round(open * 100) / 100,
        high: Math.round(high * 100) / 100,
        low: Math.round(low * 100) / 100,
        close: Math.round(price * 100) / 100,
        volume,
      });
    }

    return NextResponse.json({ symbol, period, history });
  } catch (error) {
    console.error('[API /stocks/history] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
