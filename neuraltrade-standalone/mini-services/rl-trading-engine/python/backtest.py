#!/usr/bin/env python3
"""Backtesting System - Test trading strategies on historical data"""

import sys
import json
import numpy as np
import yfinance as yf
import pandas as pd
from datetime import datetime

class Backtester:
    """Backtesting engine for trading strategies"""
    
    def __init__(self, data, initial_balance=100000, commission=0.001):
        self.data = data.reset_index(drop=True)
        self.initial_balance = initial_balance
        self.commission = commission  # 0.1% commission
        self.results = None
    
    def run_backtest(self, strategy='q_learning'):
        """Run backtest with specified strategy"""
        balance = self.initial_balance
        position = 0
        entry_price = 0
        trades = []
        equity_curve = [balance]
        peak = balance
        max_drawdown = 0
        
        for i in range(1, len(self.data)):
            current_price = self.data.iloc[i]['Close']
            prev_price = self.data.iloc[i-1]['Close']
            
            # Simple strategy simulation
            action = self._get_strategy_action(strategy, i, self.data)
            
            if action == 'BUY' and position == 0:
                shares = int((balance * 0.9) / current_price)
                if shares > 0:
                    cost = shares * current_price * (1 + self.commission)
                    balance -= cost
                    position = shares
                    entry_price = current_price
                    trades.append({
                        'step': i,
                        'date': str(self.data.index[i]) if hasattr(self.data.index[i], 'strftime') else str(i),
                        'action': 'BUY',
                        'shares': shares,
                        'price': round(current_price, 2),
                        'cost': round(cost, 2)
                    })
            
            elif action == 'SELL' and position > 0:
                revenue = position * current_price * (1 - self.commission)
                profit = (current_price - entry_price) * position - (position * current_price * self.commission * 2)
                balance += revenue
                trades.append({
                    'step': i,
                    'date': str(self.data.index[i]) if hasattr(self.data.index[i], 'strftime') else str(i),
                    'action': 'SELL',
                    'shares': position,
                    'price': round(current_price, 2),
                    'revenue': round(revenue, 2),
                    'profit': round(profit, 2),
                    'profitPct': round((current_price - entry_price) / entry_price * 100, 2)
                })
                position = 0
                entry_price = 0
            
            # Track equity
            equity = balance + position * current_price
            equity_curve.append(equity)
            
            # Track drawdown
            peak = max(peak, equity)
            drawdown = (peak - equity) / peak * 100
            max_drawdown = max(max_drawdown, drawdown)
        
        # Close remaining position
        if position > 0:
            final_price = self.data.iloc[-1]['Close']
            balance += position * final_price * (1 - self.commission)
            position = 0
        
        # Calculate metrics
        final_balance = balance
        total_return = (final_balance - self.initial_balance) / self.initial_balance * 100
        
        # Win rate
        sell_trades = [t for t in trades if t['action'] == 'SELL']
        winning_trades = [t for t in sell_trades if t.get('profit', 0) > 0]
        win_rate = len(winning_trades) / max(1, len(sell_trades)) * 100
        
        # Sharpe ratio (simplified)
        returns = pd.Series(equity_curve).pct_change().dropna()
        sharpe_ratio = (returns.mean() / returns.std()) * np.sqrt(252) if returns.std() > 0 else 0
        
        # Max consecutive wins/losses
        trade_results = [1 if t.get('profit', 0) > 0 else -1 for t in sell_trades]
        max_consec_wins = self._max_consecutive(trade_results, 1)
        max_consec_losses = self._max_consecutive(trade_results, -1)
        
        self.results = {
            'initialBalance': self.initial_balance,
            'finalBalance': round(final_balance, 2),
            'totalReturn': round(total_return, 2),
            'totalProfit': round(final_balance - self.initial_balance, 2),
            'sharpeRatio': round(float(sharpe_ratio), 3),
            'maxDrawdown': round(max_drawdown, 2),
            'winRate': round(win_rate, 1),
            'totalTrades': len(trades),
            'buyTrades': len([t for t in trades if t['action'] == 'BUY']),
            'sellTrades': len(sell_trades),
            'avgProfit': round(np.mean([t.get('profit', 0) for t in sell_trades]), 2) if sell_trades else 0,
            'maxConsecutiveWins': max_consec_wins,
            'maxConsecutiveLosses': max_consec_losses,
            'equityCurve': [round(e, 2) for e in equity_curve[::max(1, len(equity_curve)//60)]],  # Sample 60 points
            'trades': trades[-20:],  # Last 20 trades
        }
        
        return self.results
    
    def _get_strategy_action(self, strategy, step, data):
        """Get action based on strategy type"""
        if strategy == 'q_learning':
            return self._q_learning_action(step, data)
        elif strategy == 'moving_average':
            return self._ma_crossover_action(step, data)
        elif strategy == 'rsi':
            return self._rsi_action(step, data)
        elif strategy == 'macd':
            return self._macd_action(step, data)
        elif strategy == 'bollinger':
            return self._bollinger_action(step, data)
        else:
            return 'HOLD'
    
    def _q_learning_action(self, step, data):
        """Simulated Q-Learning strategy based on momentum and mean reversion"""
        if step < 10:
            return 'HOLD'
        
        window = data.iloc[max(0, step-10):step+1]
        closes = window['Close'].values
        
        # Simple momentum + mean reversion heuristic
        sma5 = np.mean(closes[-5:])
        sma10 = np.mean(closes[-10:])
        current = closes[-1]
        
        # RSI-like calculation
        delta = np.diff(closes)
        gains = delta[delta > 0].mean() if len(delta[delta > 0]) > 0 else 0
        losses = -delta[delta < 0].mean() if len(delta[delta < 0]) > 0 else 0.001
        rs = gains / (losses + 1e-8)
        rsi = 100 - (100 / (1 + rs))
        
        # Q-Learning inspired: buy on oversold + uptrend, sell on overbought + downtrend
        if current > sma5 and sma5 > sma10 and rsi < 70:
            return 'BUY'
        elif current < sma5 and sma5 < sma10 and rsi > 30:
            return 'SELL'
        elif rsi < 30:
            return 'BUY'
        elif rsi > 70:
            return 'SELL'
        return 'HOLD'
    
    def _ma_crossover_action(self, step, data):
        """Moving Average Crossover strategy"""
        if step < 50:
            return 'HOLD'
        
        ma20 = data.iloc[step-20:step+1]['Close'].mean()
        ma50 = data.iloc[step-50:step+1]['Close'].mean()
        prev_ma20 = data.iloc[step-21:step]['Close'].mean()
        prev_ma50 = data.iloc[step-51:step-1]['Close'].mean()
        
        if ma20 > ma50 and prev_ma20 <= prev_ma50:
            return 'BUY'
        elif ma20 < ma50 and prev_ma20 >= prev_ma50:
            return 'SELL'
        return 'HOLD'
    
    def _rsi_action(self, step, data):
        """RSI-based strategy"""
        if step < 14:
            return 'HOLD'
        
        delta = data.iloc[step-14:step+1]['Close'].diff().dropna()
        gains = delta[delta > 0].mean()
        losses = -delta[delta < 0].mean()
        rs = gains / (losses + 1e-8)
        rsi = 100 - (100 / (1 + rs))
        
        if rsi < 30:
            return 'BUY'
        elif rsi > 70:
            return 'SELL'
        return 'HOLD'
    
    def _macd_action(self, step, data):
        """MACD-based strategy"""
        if step < 26:
            return 'HOLD'
        
        closes = data.iloc[max(0, step-50):step+1]['Close']
        ema12 = closes.ewm(span=12, adjust=False).mean()
        ema26 = closes.ewm(span=26, adjust=False).mean()
        macd = ema12 - ema26
        signal = macd.ewm(span=9, adjust=False).mean()
        
        if len(macd) >= 2 and len(signal) >= 2:
            if macd.iloc[-1] > signal.iloc[-1] and macd.iloc[-2] <= signal.iloc[-2]:
                return 'BUY'
            elif macd.iloc[-1] < signal.iloc[-1] and macd.iloc[-2] >= signal.iloc[-2]:
                return 'SELL'
        return 'HOLD'
    
    def _bollinger_action(self, step, data):
        """Bollinger Bands strategy"""
        if step < 20:
            return 'HOLD'
        
        window = data.iloc[step-20:step+1]['Close']
        sma = window.mean()
        std = window.std()
        upper = sma + 2 * std
        lower = sma - 2 * std
        current = data.iloc[step]['Close']
        
        if current < lower:
            return 'BUY'
        elif current > upper:
            return 'SELL'
        return 'HOLD'
    
    def _max_consecutive(self, results, target):
        """Calculate max consecutive wins or losses"""
        max_count = 0
        current_count = 0
        for r in results:
            if r == target:
                current_count += 1
                max_count = max(max_count, current_count)
            else:
                current_count = 0
        return max_count


def run_backtest(config):
    """Run backtest with configuration"""
    try:
        symbol = config.get('symbol', 'AAPL')
        strategy = config.get('strategy', 'q_learning')
        period = config.get('period', '1y')
        initial_balance = config.get('initialBalance', 100000)
        
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period=period)
        
        if hist.empty:
            return {'error': f'No data available for {symbol}'}
        
        backtester = Backtester(hist, initial_balance=initial_balance)
        results = backtester.run_backtest(strategy=strategy)
        
        results['symbol'] = symbol
        results['strategy'] = strategy
        results['period'] = period
        results['dataPoints'] = len(hist)
        results['startDate'] = hist.index[0].strftime('%Y-%m-%d')
        results['endDate'] = hist.index[-1].strftime('%Y-%m-%d')
        results['timestamp'] = datetime.now().isoformat()
        
        return results
    except Exception as e:
        return {'error': str(e), 'symbol': config.get('symbol', 'UNKNOWN')}

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No config provided'}))
        sys.exit(1)
    
    try:
        config = json.loads(sys.argv[1])
    except:
        config = {'symbol': sys.argv[1]}
    
    result = run_backtest(config)
    print(json.dumps(result))
