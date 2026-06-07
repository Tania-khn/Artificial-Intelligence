import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface ExecuteTradeRequestBody {
  userId: string;
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  quantity: number;
  price: number;
  aiSignal?: string;
  confidence?: number;
  strategy?: string;
}

export async function POST(request: Request) {
  try {
    const body: ExecuteTradeRequestBody = await request.json();
    const { userId, symbol, action, quantity, price, aiSignal, confidence, strategy } = body;

    // Validate required fields
    if (!userId || !symbol || !action || !quantity || !price) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, symbol, action, quantity, price' },
        { status: 400 }
      );
    }

    if (!['BUY', 'SELL', 'HOLD'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be BUY, SELL, or HOLD' },
        { status: 400 }
      );
    }

    const totalValue = quantity * price;

    // Check if user exists in database
    const dbUser = await db.user.findUnique({ where: { id: userId } });

    if (!dbUser) {
      // User doesn't exist in DB - return a simulated trade response
      // This handles demo users and users who haven't signed up yet
      let profitLoss = 0;

      return NextResponse.json({
        success: true,
        trade: {
          id: `trade-${Date.now()}`,
          userId,
          symbol: symbol.toUpperCase(),
          action,
          quantity,
          price,
          totalValue,
          profitLoss,
          aiSignal: aiSignal || null,
          confidence: confidence || 0,
          strategy: strategy || null,
          createdAt: new Date().toISOString(),
        },
      }, { status: 201 });
    }

    // Calculate profit/loss for SELL trades
    let profitLoss = 0;
    if (action === 'SELL') {
      const portfolio = await db.portfolio.findUnique({
        where: { userId_symbol: { userId, symbol } },
      });
      if (portfolio) {
        profitLoss = (price - portfolio.avgPrice) * quantity;
      }
    }

    // Create the trade record
    const trade = await db.trade.create({
      data: {
        userId,
        symbol: symbol.toUpperCase(),
        action,
        quantity,
        price,
        totalValue,
        profitLoss,
        aiSignal: aiSignal || null,
        confidence: confidence || 0,
        strategy: strategy || null,
      },
    });

    // Update portfolio
    if (action === 'BUY') {
      const existing = await db.portfolio.findUnique({
        where: { userId_symbol: { userId, symbol: symbol.toUpperCase() } },
      });

      if (existing) {
        const newQuantity = existing.quantity + quantity;
        const newAvgPrice = (existing.avgPrice * existing.quantity + price * quantity) / newQuantity;
        await db.portfolio.update({
          where: { id: existing.id },
          data: {
            quantity: newQuantity,
            avgPrice: newAvgPrice,
            currentPrice: price,
          },
        });
      } else {
        await db.portfolio.create({
          data: {
            userId,
            symbol: symbol.toUpperCase(),
            name: symbol.toUpperCase(),
            quantity,
            avgPrice: price,
            currentPrice: price,
          },
        });
      }

      // Deduct from user balance
      await db.user.update({
        where: { id: userId },
        data: { balance: { decrement: totalValue } },
      });
    } else if (action === 'SELL') {
      const existing = await db.portfolio.findUnique({
        where: { userId_symbol: { userId, symbol: symbol.toUpperCase() } },
      });

      if (existing) {
        const newQuantity = existing.quantity - quantity;
        if (newQuantity <= 0) {
          await db.portfolio.delete({
            where: { id: existing.id },
          });
        } else {
          await db.portfolio.update({
            where: { id: existing.id },
            data: {
              quantity: newQuantity,
              currentPrice: price,
            },
          });
        }
      }

      // Add to user balance
      await db.user.update({
        where: { id: userId },
        data: { balance: { increment: totalValue } },
      });
    }

    // Create notification for the trade
    await db.notification.create({
      data: {
        userId,
        title: `Trade Executed: ${action} ${symbol.toUpperCase()}`,
        message: `${action} ${quantity} shares of ${symbol.toUpperCase()} at $${price.toFixed(2)}. Total: $${totalValue.toFixed(2)}${profitLoss !== 0 ? ` | P/L: $${profitLoss.toFixed(2)}` : ''}`,
        type: 'TRADE',
      },
    });

    return NextResponse.json({ success: true, trade }, { status: 201 });
  } catch (error) {
    console.error('[API /trading/execute] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
