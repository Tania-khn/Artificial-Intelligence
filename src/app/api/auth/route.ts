import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface AuthRequestBody {
  action: 'login' | 'signup';
  email: string;
  password: string;
  name?: string;
}

export async function POST(request: Request) {
  try {
    const body: AuthRequestBody = await request.json();
    const { action, email, password, name } = body;

    if (!action || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields: action, email, password' },
        { status: 400 }
      );
    }

    if (!['login', 'signup'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "login" or "signup"' },
        { status: 400 }
      );
    }

    if (action === 'signup') {
      // Check if user already exists
      const existingUser = await db.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        );
      }

      // Create new user
      const user = await db.user.create({
        data: {
          email,
          password, // In production, this should be hashed
          name: name || email.split('@')[0],
          balance: 100000, // Default starting balance
        },
      });

      // Create welcome notification
      await db.notification.create({
        data: {
          userId: user.id,
          title: 'Welcome to AI Trading Bot!',
          message: 'Your account has been created with $100,000 virtual balance. Start exploring the markets!',
          type: 'SYSTEM',
        },
      });

      return NextResponse.json(
        {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            balance: user.balance,
            avatar: user.avatar,
            riskTolerance: user.riskTolerance,
            createdAt: user.createdAt,
          },
        },
        { status: 201 }
      );
    }

    if (action === 'login') {
      // Find user by email
      const user = await db.user.findUnique({
        where: { email },
      });

      if (!user) {
        return NextResponse.json(
          { error: 'No account found with this email' },
          { status: 404 }
        );
      }

      if (user.password !== password) {
        return NextResponse.json(
          { error: 'Invalid password' },
          { status: 401 }
        );
      }

      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          balance: user.balance,
          avatar: user.avatar,
          riskTolerance: user.riskTolerance,
          createdAt: user.createdAt,
        },
      });
    }

    // Should not reach here due to validation above
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[API /auth] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
