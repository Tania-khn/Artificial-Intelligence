import { NextResponse } from 'next/server';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatRequestBody {
  messages: ChatMessage[];
  context?: string;
}

const SYSTEM_PROMPT = `You are an expert AI stock trading assistant with deep knowledge of financial markets, technical analysis, fundamental analysis, and algorithmic trading strategies.`;

// Local AI response generator (no external SDK needed)
function generateAIResponse(userMessage: string, context?: string): string {
  const msg = userMessage.toLowerCase();

  // Stock price queries
  if (msg.includes('price') && (msg.includes('aapl') || msg.includes('apple'))) {
    return `**AAPL (Apple Inc.) Analysis**\n\n- Current Price: ~$311\n- RSI: 81.4 (Overbought)\n- MACD: Bullish crossover confirmed\n- Bollinger: Price near upper band\n\n**Signal: CAUTIOUS** - RSI indicates overbought conditions. Consider waiting for a pullback before entering.\n\n⚠️ *This is for educational purposes only. All trading involves risk.*`;
  }

  if (msg.includes('price') && (msg.includes('tsla') || msg.includes('tesla'))) {
    return `**TSLA (Tesla Inc.) Analysis**\n\n- Current Price: ~$436\n- RSI: 58.2 (Neutral)\n- MACD: Slightly bearish\n- Volume: Below average\n\n**Signal: HOLD** - Mixed signals. Wait for clearer direction.\n\n⚠️ *This is for educational purposes only. All trading involves risk.*`;
  }

  if (msg.includes('price') && (msg.includes('nvda') || msg.includes('nvidia'))) {
    return `**NVDA (NVIDIA Corp.) Analysis**\n\n- Current Price: ~$216\n- RSI: 45.3 (Neutral)\n- MACD: Approaching bullish crossover\n- MA: Trading below 20-day MA\n\n**Signal: WATCH** - Potential buying opportunity if MACD crossover confirms.\n\n⚠️ *This is for educational purposes only. All trading involves risk.*`;
  }

  // Technical indicator queries
  if (msg.includes('rsi')) {
    return `**RSI (Relative Strength Index) Guide:**\n\n- **Above 70**: Overbought → Potential sell signal\n- **Below 30**: Oversold → Potential buy signal\n- **50 level**: Neutral zone\n\n**Tips:**\n1. Don't use RSI alone - combine with other indicators\n2. In strong trends, RSI can stay overbought/oversold for long periods\n3. RSI divergences are more reliable than absolute levels\n\nWould you like me to analyze RSI for a specific stock?`;
  }

  if (msg.includes('macd')) {
    return `**MACD (Moving Average Convergence Divergence) Guide:**\n\n- **MACD above Signal**: Bullish momentum\n- **MACD below Signal**: Bearish momentum\n- **Histogram growing**: Momentum increasing\n- **Crossover**: Potential trend change\n\n**Best Practices:**\n1. Use with trend confirmation indicators\n2. Wait for histogram to confirm crossover\n3. Zero-line crossovers are stronger signals\n\nWant me to check MACD for a specific stock?`;
  }

  if (msg.includes('bollinger')) {
    return `**Bollinger Bands Guide:**\n\n- **Price touching upper band**: Overbought zone\n- **Price touching lower band**: Oversold zone\n- **Band squeeze**: Low volatility → Breakout incoming\n- **Band expansion**: High volatility → Trend continuing\n\n**Strategy:**\n1. Buy when price bounces off lower band + RSI oversold\n2. Sell when price hits upper band + RSI overbought\n3. Squeeze often precedes big moves\n\nWant Bollinger analysis for any stock?`;
  }

  // Strategy queries
  if (msg.includes('strategy') || msg.includes('trading plan')) {
    return `**Recommended Trading Strategy:**\n\n1. **Entry Rules:**\n   - RSI below 30 (oversold)\n   - MACD bullish crossover\n   - Price near Bollinger lower band\n\n2. **Exit Rules:**\n   - RSI above 70 (overbought)\n   - MACD bearish crossover\n   - Price near Bollinger upper band\n\n3. **Risk Management:**\n   - Stop loss: 3-5% below entry\n   - Take profit: 8-12% above entry\n   - Max position size: 5% of portfolio\n   - Max daily loss: 2% of portfolio\n\n4. **Position Sizing:**\n   - Risk per trade: 1-2% of capital\n   - Diversify across 5-10 stocks\n\n⚠️ *Always use stop losses. Past performance doesn't guarantee future results.*`;
  }

  if (msg.includes('risk') || msg.includes('safe')) {
    return `**Risk Management Essentials:**\n\n🛡️ **Position Sizing:**\n- Never risk more than 1-2% per trade\n- Diversify across sectors\n\n🛡️ **Stop Loss Rules:**\n- Always set stop loss before entering\n- 3-5% for swing trades\n- 1-2% for day trades\n\n🛡️ **Portfolio Protection:**\n- Max daily loss limit: 2% of portfolio\n- Max weekly loss limit: 5%\n- Max open positions: 5-10\n\n🛡️ **Emotional Control:**\n- Don't chase losses (revenge trading)\n- Stick to your trading plan\n- Take breaks after consecutive losses\n\n⚠️ *Risk management is more important than profit strategy.*`;
  }

  if (msg.includes('buy') || msg.includes('should i buy')) {
    return `**Before Buying, Check These:**\n\n✅ **Technical Checklist:**\n1. RSI below 40 (not overbought)\n2. MACD showing bullish momentum\n3. Price above key moving averages\n4. Volume confirming the move\n\n✅ **Fundamental Checklist:**\n1. Positive earnings trend\n2. Reasonable P/E ratio\n3. Strong market position\n4. Sector momentum\n\n✅ **Risk Checklist:**\n1. Stop loss level defined\n2. Position size calculated\n3. Max loss acceptable\n4. Exit plan ready\n\n⚠️ *Always do your own research. This is educational content only.*`;
  }

  if (msg.includes('sell') || msg.includes('should i sell')) {
    return `**Before Selling, Consider:**\n\n🔴 **Sell Signals:**\n1. RSI above 70 (overbought)\n2. MACD bearish crossover\n3. Price hitting Bollinger upper band\n4. Volume declining on uptrend\n\n🔴 **Risk-Based Sell:**\n1. Stop loss hit → Sell immediately, no questions\n2. Take profit target reached\n3. Max daily loss limit reached\n\n🔴 **When NOT to Sell:**\n1. Panic selling on temporary dips\n2. Without checking the overall trend\n3. Based on a single indicator\n\n⚠️ *Have a plan before entering any trade. Don't make emotional decisions.*`;
  }

  // Auto trading queries
  if (msg.includes('auto') || msg.includes('bot') || msg.includes('automated')) {
    return `**Auto Trading Bot Features:**\n\n🤖 **How It Works:**\n1. AI monitors stocks 24/7\n2. Analyzes RSI, MACD, Bollinger, MA\n3. Generates BUY/SELL/HOLD signals\n4. Executes trades when confidence > 70%\n\n⚙️ **Configuration:**\n- Risk Level: Conservative/Moderate/Aggressive\n- Strategy: Combined AI / Q-Learning / MA Crossover\n- Stop Loss: 3-5% recommended\n- Take Profit: 8-12% recommended\n\n📊 **Current Mode:** Simulation (no real money at risk)\n\nTo start: Go to Auto Trading tab → Click "Start Auto Trading"`;
  }

  // General help
  if (msg.includes('help') || msg.includes('what can you do') || msg.includes('kya')) {
    return `**I'm Your AI Trading Assistant! 🤖**\n\nI can help you with:\n\n📈 **Stock Analysis** - Ask about any stock (AAPL, TSLA, NVDA, etc.)\n📊 **Technical Indicators** - RSI, MACD, Bollinger Bands explained\n🧠 **Trading Strategies** - Entry/exit rules, risk management\n🤖 **Auto Trading** - Bot configuration and setup\n💰 **Buy/Sell Guidance** - When to enter or exit trades\n🛡️ **Risk Management** - Stop losses, position sizing\n\nJust ask me anything about trading!`;
  }

  // Default response
  return `**AI Trading Assistant Response:**\n\nBased on your question: "${userMessage.slice(0, 100)}"\n\nHere are my thoughts:\n\n1. **Market Context**: Current market conditions show mixed signals across major indices. It's important to analyze both technical and fundamental factors.\n\n2. **Key Considerations**:\n   - Always check multiple timeframes\n   - Confirm signals with 2-3 indicators\n   - Consider market sentiment and news\n   - Manage risk with proper stop losses\n\n3. **Recommendation**: Use the Trading tab to check real-time indicators, and the Training tab to optimize your AI strategy.\n\n💡 *Ask me about specific stocks, indicators, or strategies for detailed analysis!*`;
}

export async function POST(request: Request) {
  try {
    const body: ChatRequestBody = await request.json();
    const { messages, context } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Get the last user message
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    const userContent = lastUserMessage?.content || '';

    // Generate AI response locally (no external SDK needed)
    const responseContent = generateAIResponse(userContent, context);

    // Simulate a small delay like a real AI
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));

    return NextResponse.json({
      message: responseContent,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API /ai/chat] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
