#!/usr/bin/env python3
"""Auto Trading Engine - Fully AI-based autonomous trading system

Features:
- Real-time market monitoring
- AI-driven buy/sell/hold decisions
- Risk management (stop loss, take profit, max daily loss)
- Multi-stock analysis
- Continuous learning from trade outcomes
"""

import sys
import json
import time
import numpy as np
import yfinance as yf
import pandas as pd
from datetime import datetime
from collections import defaultdict

class AutoTrader:
    """Autonomous AI Trading Agent"""
    
    def __init__(self, config):
        self.config = config
        self.symbols = config.get('symbols', ['AAPL', 'TSLA', 'NVDA'])
        self.max_position_size = config.get('maxPositionSize', 5000)
        self.stop_loss_pct = config.get('stopLossPercent', 5)
        self.take_profit_pct = config.get('takeProfitPercent', 10)
        self.max_daily_loss = config.get('maxDailyLoss', 2000)
        self.confidence_threshold = config.get('confidenceThreshold', 0.7)
        self.strategy = config.get('strategy', 'combined')
        self.risk_level = config.get('riskLevel', 'moderate')
        
        # State
        self.balance = config.get('balance', 100000)
        self.initial_balance = self.balance
        self.positions = {}  # symbol -> {quantity, entry_price, entry_time}
        self.trade_history = []
        self.daily_pl = 0
        self.total_trades = 0
        self.winning_trades = 0
        self.losing_trades = 0
        self.ai_decisions = []
        self.equity_curve = []
        
        # Risk level adjustments
        risk_multipliers = {
            'conservative': {'position_pct': 0.05, 'stop_loss': 3, 'take_profit': 6, 'conf': 0.8},
            'moderate': {'position_pct': 0.10, 'stop_loss': 5, 'take_profit': 10, 'conf': 0.7},
            'aggressive': {'position_pct': 0.20, 'stop_loss': 8, 'take_profit': 15, 'conf': 0.6},
        }
        rm = risk_multipliers.get(self.risk_level, risk_multipliers['moderate'])
        self.position_pct = rm['position_pct']
        self.stop_loss_pct = rm['stop_loss']
        self.take_profit_pct = rm['take_profit']
        self.confidence_threshold = rm['conf']
        
        # Q-table for learning
        self.q_table = defaultdict(lambda: np.zeros(3))
        self.epsilon = 0.3 if self.risk_level != 'conservative' else 0.15
        
    def analyze_symbol(self, symbol):
        """Comprehensive AI analysis of a stock symbol"""
        try:
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period='3mo')
            
            if hist.empty or len(hist) < 20:
                return None
            
            close = hist['Close']
            high = hist['High']
            low = hist['Low']
            volume = hist['Volume']
            
            # ─── Technical Indicators ────────────────
            signals = []
            scores = []
            
            # RSI
            delta = close.diff()
            gain = delta.where(delta > 0, 0).rolling(14).mean()
            loss = -delta.where(delta < 0, 0).rolling(14).mean()
            rs = gain / (loss + 1e-8)
            rsi = 100 - (100 / (1 + rs))
            current_rsi = float(rsi.iloc[-1]) if not pd.isna(rsi.iloc[-1]) else 50
            
            if current_rsi < 30:
                signals.append(('RSI', 'STRONG_BUY', current_rsi))
                scores.append(2)
            elif current_rsi < 40:
                signals.append(('RSI', 'BUY', current_rsi))
                scores.append(1)
            elif current_rsi > 70:
                signals.append(('RSI', 'STRONG_SELL', current_rsi))
                scores.append(-2)
            elif current_rsi > 60:
                signals.append(('RSI', 'SELL', current_rsi))
                scores.append(-1)
            else:
                signals.append(('RSI', 'HOLD', current_rsi))
                scores.append(0)
            
            # MACD
            ema12 = close.ewm(span=12, adjust=False).mean()
            ema26 = close.ewm(span=26, adjust=False).mean()
            macd_line = ema12 - ema26
            signal_line = macd_line.ewm(span=9, adjust=False).mean()
            
            if not pd.isna(macd_line.iloc[-1]) and not pd.isna(signal_line.iloc[-1]):
                if macd_line.iloc[-1] > signal_line.iloc[-1]:
                    signals.append(('MACD', 'BUY', float(macd_line.iloc[-1])))
                    scores.append(1)
                else:
                    signals.append(('MACD', 'SELL', float(macd_line.iloc[-1])))
                    scores.append(-1)
            
            # Moving Averages
            sma20 = close.rolling(20).mean()
            sma50 = close.rolling(50).mean()
            current_price = float(close.iloc[-1])
            
            if not pd.isna(sma20.iloc[-1]) and not pd.isna(sma50.iloc[-1]):
                if current_price > sma20.iloc[-1] and sma20.iloc[-1] > sma50.iloc[-1]:
                    signals.append(('MA', 'BUY', float(sma20.iloc[-1])))
                    scores.append(1)
                elif current_price < sma20.iloc[-1] and sma20.iloc[-1] < sma50.iloc[-1]:
                    signals.append(('MA', 'SELL', float(sma20.iloc[-1])))
                    scores.append(-1)
                else:
                    signals.append(('MA', 'HOLD', float(sma20.iloc[-1])))
                    scores.append(0)
            
            # Bollinger Bands
            bb_sma = close.rolling(20).mean()
            bb_std = close.rolling(20).std()
            bb_upper = bb_sma + 2 * bb_std
            bb_lower = bb_sma - 2 * bb_std
            
            if not pd.isna(bb_upper.iloc[-1]) and not pd.isna(bb_lower.iloc[-1]):
                if current_price < bb_lower.iloc[-1]:
                    signals.append(('Bollinger', 'STRONG_BUY', current_price))
                    scores.append(2)
                elif current_price > bb_upper.iloc[-1]:
                    signals.append(('Bollinger', 'STRONG_SELL', current_price))
                    scores.append(-2)
                else:
                    signals.append(('Bollinger', 'HOLD', current_price))
                    scores.append(0)
            
            # ─── Q-Learning State & Action ──────────
            price_norm = (current_price - float(close.iloc[-20:].min())) / (float(close.iloc[-20:].max()) - float(close.iloc[-20:].min()) + 1e-8)
            price_change = (current_price - float(close.iloc[-2])) / float(close.iloc[-2]) * 100
            has_position = 1 if symbol in self.positions else 0
            
            state = (
                min(4, max(0, int(price_norm * 4))),
                min(2, max(0, int((price_change + 5) / 5))),
                has_position,
                1 if current_rsi > 50 else 0,
            )
            
            # Q-learning action
            q_values = self.q_table[state]
            if np.random.random() < self.epsilon:
                rl_action = np.random.randint(0, 3)
            else:
                rl_action = int(np.argmax(q_values))
            rl_score = [-1, 1, 0][rl_action]  # HOLD=-1 idx=0, BUY=1 idx=1, SELL=0 idx=2
            scores.append(rl_score * 1.5)  # RL has higher weight
            
            # ─── Combined Signal ────────────────────
            total_score = sum(scores)
            num_indicators = len(scores)
            
            if total_score >= 3:
                action = 'STRONG_BUY'
            elif total_score >= 1:
                action = 'BUY'
            elif total_score <= -3:
                action = 'STRONG_SELL'
            elif total_score <= -1:
                action = 'SELL'
            else:
                action = 'HOLD'
            
            confidence = min(1.0, abs(total_score) / (num_indicators * 1.5 + 1e-8))
            
            return {
                'symbol': symbol,
                'currentPrice': round(current_price, 2),
                'action': action,
                'confidence': round(confidence, 3),
                'score': round(total_score, 2),
                'signals': signals,
                'rsi': round(current_rsi, 1),
                'state': str(state),
                'rlAction': ['HOLD', 'BUY', 'SELL'][rl_action],
            }
        except Exception as e:
            return {'error': str(e), 'symbol': symbol}
    
    def check_risk_management(self, symbol, current_price):
        """Check stop loss and take profit for existing positions"""
        if symbol not in self.positions:
            return None
        
        pos = self.positions[symbol]
        entry_price = pos['entry_price']
        pnl_pct = (current_price - entry_price) / entry_price * 100
        
        # Stop Loss
        if pnl_pct <= -self.stop_loss_pct:
            return 'STOP_LOSS'
        
        # Take Profit
        if pnl_pct >= self.take_profit_pct:
            return 'TAKE_PROFIT'
        
        return None
    
    def execute_trade(self, symbol, action, analysis):
        """Execute a trade based on AI analysis"""
        current_price = analysis.get('currentPrice', 0)
        confidence = analysis.get('confidence', 0)
        
        # Skip if confidence too low
        if action in ['BUY', 'SELL', 'STRONG_BUY', 'STRONG_SELL'] and confidence < self.confidence_threshold:
            return {
                'id': f'auto-{int(time.time()*1000)}',
                'timestamp': datetime.now().isoformat(),
                'symbol': symbol,
                'action': 'HOLD',
                'quantity': 0,
                'price': current_price,
                'confidence': confidence,
                'reason': f'Confidence {confidence:.0%} below threshold {self.confidence_threshold:.0%}',
                'status': 'skipped',
            }
        
        # Check daily loss limit
        if self.daily_pl <= -self.max_daily_loss and action in ['BUY', 'STRONG_BUY']:
            return {
                'id': f'auto-{int(time.time()*1000)}',
                'timestamp': datetime.now().isoformat(),
                'symbol': symbol,
                'action': 'HOLD',
                'quantity': 0,
                'price': current_price,
                'confidence': confidence,
                'reason': f'Daily loss limit reached (${self.daily_pl:.2f})',
                'status': 'skipped',
            }
        
        # Execute BUY
        if action in ['BUY', 'STRONG_BUY'] and symbol not in self.positions:
            position_value = min(self.max_position_size, self.balance * self.position_pct)
            quantity = int(position_value / current_price) if current_price > 0 else 0
            
            if quantity > 0 and self.balance >= quantity * current_price:
                cost = quantity * current_price
                self.balance -= cost
                self.positions[symbol] = {
                    'quantity': quantity,
                    'entry_price': current_price,
                    'entry_time': datetime.now().isoformat(),
                }
                self.total_trades += 1
                
                return {
                    'id': f'auto-{int(time.time()*1000)}',
                    'timestamp': datetime.now().isoformat(),
                    'symbol': symbol,
                    'action': 'BUY',
                    'quantity': quantity,
                    'price': current_price,
                    'confidence': confidence,
                    'reason': f'AI Signal: {action} (conf: {confidence:.0%}, score: {analysis.get("score", 0)})',
                    'status': 'executed',
                }
        
        # Execute SELL
        elif action in ['SELL', 'STRONG_SELL'] and symbol in self.positions:
            pos = self.positions[symbol]
            quantity = pos['quantity']
            entry_price = pos['entry_price']
            revenue = quantity * current_price
            profit = (current_price - entry_price) * quantity
            
            self.balance += revenue
            self.daily_pl += profit
            
            if profit > 0:
                self.winning_trades += 1
            else:
                self.losing_trades += 1
            
            del self.positions[symbol]
            self.total_trades += 1
            
            # Update Q-table (reward based on profit)
            state = eval(analysis.get('state', '(0,0,0,0)'))
            sell_action = 2  # SELL index
            reward = profit / (entry_price * quantity) * 100  # percentage reward
            best_next = np.max(self.q_table[state])
            self.q_table[state][sell_action] += 0.1 * (reward + 0.95 * best_next - self.q_table[state][sell_action])
            
            return {
                'id': f'auto-{int(time.time()*1000)}',
                'timestamp': datetime.now().isoformat(),
                'symbol': symbol,
                'action': 'SELL',
                'quantity': quantity,
                'price': current_price,
                'confidence': confidence,
                'reason': f'AI Signal: {action} (conf: {confidence:.0%}, P/L: ${profit:.2f})',
                'profitLoss': round(profit, 2),
                'status': 'executed',
            }
        
        # Risk management sell (stop loss / take profit)
        risk_signal = self.check_risk_management(symbol, current_price)
        if risk_signal and symbol in self.positions:
            pos = self.positions[symbol]
            quantity = pos['quantity']
            entry_price = pos['entry_price']
            profit = (current_price - entry_price) * quantity
            
            self.balance += quantity * current_price
            self.daily_pl += profit
            
            if profit > 0:
                self.winning_trades += 1
            else:
                self.losing_trades += 1
            
            del self.positions[symbol]
            self.total_trades += 1
            
            return {
                'id': f'auto-{int(time.time()*1000)}',
                'timestamp': datetime.now().isoformat(),
                'symbol': symbol,
                'action': 'SELL',
                'quantity': quantity,
                'price': current_price,
                'confidence': 1.0,
                'reason': f'{risk_signal} triggered at P/L: ${profit:.2f} ({(current_price-entry_price)/entry_price*100:.1f}%)',
                'profitLoss': round(profit, 2),
                'status': 'executed',
            }
        
        # HOLD
        return {
            'id': f'auto-{int(time.time()*1000)}',
            'timestamp': datetime.now().isoformat(),
            'symbol': symbol,
            'action': 'HOLD',
            'quantity': 0,
            'price': current_price,
            'confidence': confidence,
            'reason': f'No action needed. AI: {action}, Conf: {confidence:.0%}',
            'status': 'skipped',
        }
    
    def run_cycle(self):
        """Run one auto trading cycle - analyze all symbols and execute trades"""
        cycle_results = []
        
        for symbol in self.symbols:
            # Analyze
            analysis = self.analyze_symbol(symbol)
            if not analysis or 'error' in analysis:
                continue
            
            action = analysis['action']
            
            # Check risk management first
            risk_signal = self.check_risk_management(symbol, analysis['currentPrice'])
            if risk_signal:
                action = 'SELL'
            
            # Execute trade
            trade = self.execute_trade(symbol, action, analysis)
            if trade:
                self.trade_history.append(trade)
                cycle_results.append(trade)
            
            # Record AI decision
            self.ai_decisions.append({
                'symbol': symbol,
                'action': analysis['action'],
                'confidence': analysis['confidence'],
                'timestamp': datetime.now().isoformat(),
            })
        
        # Update equity curve
        positions_value = sum(
            pos['quantity'] * self.get_current_price(sym) 
            for sym, pos in self.positions.items()
        )
        total_value = self.balance + positions_value
        
        self.equity_curve.append({
            'time': datetime.now().isoformat(),
            'value': round(total_value, 2),
        })
        
        # Decay epsilon (learn over time)
        self.epsilon = max(0.05, self.epsilon * 0.995)
        
        return {
            'cycleResults': cycle_results,
            'status': self.get_status(),
        }
    
    def get_current_price(self, symbol):
        """Get current price for a position"""
        if symbol in self.positions:
            try:
                ticker = yf.Ticker(symbol)
                return float(ticker.fast_info.last_price)
            except:
                return self.positions[symbol]['entry_price']
        return 0
    
    def get_status(self):
        """Get current auto trading status"""
        positions_list = []
        for symbol, pos in self.positions.items():
            current_price = self.get_current_price(symbol)
            positions_list.append({
                'symbol': symbol,
                'quantity': pos['quantity'],
                'entryPrice': pos['entry_price'],
                'currentPrice': current_price,
                'unrealizedPL': round((current_price - pos['entry_price']) * pos['quantity'], 2),
            })
        
        positions_value = sum(p['currentPrice'] * p['quantity'] for p in positions_list)
        total_value = self.balance + positions_value
        
        return {
            'isRunning': True,
            'startedAt': datetime.now().isoformat(),
            'balance': round(self.balance, 2),
            'totalValue': round(total_value, 2),
            'totalTrades': self.total_trades,
            'winningTrades': self.winning_trades,
            'losingTrades': self.losing_trades,
            'winRate': round(self.winning_trades / max(1, self.total_trades) * 100, 1),
            'totalProfitLoss': round(total_value - self.initial_balance, 2),
            'dailyPL': round(self.daily_pl, 2),
            'currentPositions': positions_list,
            'lastCheck': datetime.now().isoformat(),
            'aiDecisions': self.ai_decisions[-20:],
            'equityCurve': self.equity_curve[-60:],
            'epsilon': round(self.epsilon, 4),
            'qTableSize': len(self.q_table),
        }


def run_auto_trade_cycle(config):
    """Run a single auto trading cycle"""
    try:
        trader = AutoTrader(config)
        result = trader.run_cycle()
        return result
    except Exception as e:
        return {'error': str(e)}


def get_auto_analysis(config):
    """Get AI analysis for all configured symbols without trading"""
    try:
        trader = AutoTrader(config)
        analyses = []
        for symbol in config.get('symbols', ['AAPL']):
            analysis = trader.analyze_symbol(symbol)
            if analysis and 'error' not in analysis:
                analyses.append(analysis)
        return {'analyses': analyses}
    except Exception as e:
        return {'error': str(e)}


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No command specified'}))
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == 'cycle':
        config = {}
        if len(sys.argv) > 2:
            try:
                config = json.loads(sys.argv[2])
            except:
                config = {'symbols': ['AAPL']}
        result = run_auto_trade_cycle(config)
        print(json.dumps(result))
    elif command == 'analyze':
        config = {}
        if len(sys.argv) > 2:
            try:
                config = json.loads(sys.argv[2])
            except:
                config = {'symbols': ['AAPL']}
        result = get_auto_analysis(config)
        print(json.dumps(result))
    else:
        print(json.dumps({'error': f'Unknown command: {command}'}))
