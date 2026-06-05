import { NextResponse } from 'next/server';

const RL_SERVICE_URL = 'http://localhost:3031';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'AAPL';

    // Try RL service first
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const response = await fetch(
        `${RL_SERVICE_URL}/api/stocks/indicators?symbol=${encodeURIComponent(symbol)}`,
        { next: { revalidate: 60 }, signal: controller.signal }
      );
      clearTimeout(timeoutId);
      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch {
      console.log('[API /stocks/indicators] RL service unavailable, using mock data');
    }

    // Fallback: generate mock indicators
    const basePrice: Record<string, number> = {
      AAPL: 310, TSLA: 436, NVDA: 216, MSFT: 452, GOOGL: 178, AMZN: 205, META: 612,
    };
    const currentPrice = (basePrice[symbol] || 150) + (Math.random() - 0.5) * 10;
    const rsi = 20 + Math.random() * 60;
    const macd = (Math.random() - 0.5) * 10;
    const macdSignal = macd + (Math.random() - 0.5) * 3;
    const ma20 = currentPrice * (0.92 + Math.random() * 0.1);
    const ma50 = currentPrice * (0.85 + Math.random() * 0.12);
    const bollingerMiddle = ma20;
    const bollingerUpper = bollingerMiddle * 1.06;
    const bollingerLower = bollingerMiddle * 0.94;

    const signals: { indicator: string; signal: string; value: number; reason: string }[] = [];
    signals.push({
      indicator: 'RSI', signal: rsi > 70 ? 'SELL' : rsi < 30 ? 'BUY' : 'HOLD',
      value: Math.round(rsi * 100) / 100,
      reason: rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : 'Neutral zone',
    });
    signals.push({
      indicator: 'MACD', signal: macd > macdSignal ? 'BUY' : 'SELL',
      value: Math.round(macd * 100) / 100,
      reason: macd > macdSignal ? 'Bullish crossover' : 'Bearish crossover',
    });
    signals.push({
      indicator: 'Bollinger', signal: currentPrice > bollingerUpper ? 'SELL' : currentPrice < bollingerLower ? 'BUY' : 'HOLD',
      value: Math.round(currentPrice * 100) / 100,
      reason: currentPrice > bollingerUpper ? 'Above upper band' : currentPrice < bollingerLower ? 'Below lower band' : 'Within bands',
    });
    signals.push({
      indicator: 'MA Crossover', signal: ma20 > ma50 ? 'BUY' : 'SELL',
      value: Math.round(ma20 * 100) / 100,
      reason: ma20 > ma50 ? 'Golden cross (uptrend)' : 'Death cross (downtrend)',
    });

    const buyCount = signals.filter(s => s.signal === 'BUY').length;
    const sellCount = signals.filter(s => s.signal === 'SELL').length;
    const overallSignal = buyCount > sellCount ? 'BUY' : sellCount > buyCount ? 'SELL' : 'HOLD';

    // Generate chart data
    const chartData = [];
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const p = currentPrice * (0.92 + Math.random() * 0.12);
      chartData.push({
        date: date.toISOString().split('T')[0],
        close: Math.round(p * 100) / 100,
        rsi: Math.round((20 + Math.random() * 60) * 100) / 100,
        macd: Math.round(((Math.random() - 0.5) * 10) * 10000) / 10000,
        macdSignal: Math.round(((Math.random() - 0.5) * 8) * 10000) / 10000,
        macdHist: Math.round(((Math.random() - 0.5) * 4) * 10000) / 10000,
        upperBand: Math.round((p * 1.03) * 100) / 100,
        middleBand: Math.round(p * 100) / 100,
        lowerBand: Math.round((p * 0.97) * 100) / 100,
        ma20: Math.round((p * (0.96 + Math.random() * 0.06)) * 100) / 100,
        ma50: Math.round((p * (0.9 + Math.random() * 0.08)) * 100) / 100,
        volume: Math.floor(20000000 + Math.random() * 60000000),
      });
    }

    return NextResponse.json({
      symbol,
      currentPrice: Math.round(currentPrice * 100) / 100,
      latest: {
        rsi: Math.round(rsi * 100) / 100,
        macd: Math.round(macd * 10000) / 10000,
        macdSignal: Math.round(macdSignal * 10000) / 10000,
        macdHistogram: Math.round((macd - macdSignal) * 10000) / 10000,
        bollingerUpper: Math.round(bollingerUpper * 100) / 100,
        bollingerMiddle: Math.round(bollingerMiddle * 100) / 100,
        bollingerLower: Math.round(bollingerLower * 100) / 100,
        ma20: Math.round(ma20 * 100) / 100,
        ma50: Math.round(ma50 * 100) / 100,
        stochK: Math.round((Math.random() * 100) * 100) / 100,
        stochD: Math.round((Math.random() * 100) * 100) / 100,
        atr: Math.round((currentPrice * 0.02) * 100) / 100,
        vwap: Math.round((currentPrice * 0.95) * 100) / 100,
      },
      signals: {
        individualSignals: signals,
        overallSignal,
        score: buyCount - sellCount,
        confidence: Math.round((30 + Math.random() * 40) * 100) / 100,
        totalIndicators: signals.length,
      },
      chartData,
    });
  } catch (error) {
    console.error('[API /stocks/indicators] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
