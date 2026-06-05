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
        `${RL_SERVICE_URL}/api/stocks/sentiment?symbol=${encodeURIComponent(symbol)}`,
        { next: { revalidate: 300 }, signal: controller.signal }
      );
      clearTimeout(timeoutId);
      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch {
      console.log('[API /stocks/sentiment] RL service unavailable, using mock data');
    }

    // Fallback: generate mock sentiment
    const overall = Math.round(((Math.random() - 0.3) * 0.8) * 100) / 100;
    const news = Math.round(((Math.random() - 0.3) * 0.8) * 100) / 100;
    const social = Math.round(((Math.random() - 0.3) * 0.8) * 100) / 100;
    const analyst = Math.round(((Math.random() - 0.3) * 0.8) * 100) / 100;

    return NextResponse.json({
      symbol,
      overall,
      breakdown: {
        news,
        social,
        analyst,
      },
      recommendation: overall > 0.3 ? 'BULLISH' : overall < -0.3 ? 'BEARISH' : 'NEUTRAL',
      confidence: Math.round((40 + Math.random() * 40) * 100) / 100,
      sources: [
        { type: 'news', sentiment: news, count: Math.floor(5 + Math.random() * 20) },
        { type: 'social', sentiment: social, count: Math.floor(50 + Math.random() * 200) },
        { type: 'analyst', sentiment: analyst, count: Math.floor(3 + Math.random() * 10) },
      ],
    });
  } catch (error) {
    console.error('[API /stocks/sentiment] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
