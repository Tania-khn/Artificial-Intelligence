import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 }
      );
    }

    const [holdings, user] = await Promise.all([
      db.portfolio.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      }),
      db.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, balance: true },
      }),
    ]);

    // Calculate portfolio stats
    const totalInvested = holdings.reduce(
      (sum, h) => sum + h.avgPrice * h.quantity,
      0
    );
    const totalCurrentValue = holdings.reduce(
      (sum, h) => sum + h.currentPrice * h.quantity,
      0
    );
    const totalProfitLoss = totalCurrentValue - totalInvested;
    const totalProfitLossPercent =
      totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

    return NextResponse.json({
      user,
      holdings,
      summary: {
        totalHoldings: holdings.length,
        totalInvested,
        totalCurrentValue,
        totalProfitLoss,
        totalProfitLossPercent,
        availableBalance: user?.balance || 0,
      },
    });
  } catch (error) {
    console.error('[API /portfolio] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
