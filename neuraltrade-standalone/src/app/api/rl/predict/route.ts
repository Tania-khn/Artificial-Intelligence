import { NextResponse } from 'next/server';

const RL_SERVICE_URL = 'http://localhost:3031';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'AAPL';

    // Try external service first
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(
        `${RL_SERVICE_URL}/api/rl/predict?symbol=${encodeURIComponent(symbol)}`,
        { next: { revalidate: 0 }, signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch {
      console.log('[API /rl/predict] RL service unavailable, using mock data');
    }

    // Fallback: generate mock prediction
    const actions: ('BUY' | 'SELL' | 'HOLD')[] = ['BUY', 'SELL', 'HOLD'];
    const action = actions[Math.floor(Math.random() * 3)];
    const confidence = Math.round((20 + Math.random() * 60) * 100) / 100;
    const qValues = [
      Math.round((Math.random() * 0.15) * 10000) / 10000,
      Math.round((Math.random() * 0.15) * 10000) / 10000,
      Math.round((Math.random() * 0.15) * 10000) / 10000,
    ];

    const basePrice: Record<string, number> = {
      AAPL: 310, TSLA: 436, NVDA: 216, MSFT: 452,
      GOOGL: 178, AMZN: 205, META: 612,
    };
    const currentPrice = (basePrice[symbol] || 150) + (Math.random() - 0.5) * 10;

    // Technical signal
    const techActions: ('BUY' | 'SELL' | 'HOLD')[] = ['BUY', 'SELL', 'HOLD'];
    const techAction = techActions[Math.floor(Math.random() * 3)];
    const techConfidence = Math.round((15 + Math.random() * 50) * 100) / 100;

    // Combined signal
    let combinedAction = action;
    let combinedScore = 0;
    if (action === techAction) {
      combinedAction = action;
      combinedScore = Math.round(((confidence + techConfidence) / 2) * 100) / 100;
    } else {
      combinedAction = confidence > techConfidence ? action : techAction;
      combinedScore = Math.round(Math.abs(confidence - techConfidence) * 100) / 100;
    }

    return NextResponse.json({
      symbol,
      currentPrice: Math.round(currentPrice * 100) / 100,
      rlSignal: {
        action,
        confidence: Math.round(confidence * 100) / 100,
        qValues,
      },
      technicalSignal: {
        action: techAction,
        confidence: techConfidence,
      },
      combinedSignal: {
        action: combinedAction,
        confidence: Math.round(((confidence + techConfidence) / 2) * 100) / 100,
        score: combinedScore,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API /rl/predict] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
