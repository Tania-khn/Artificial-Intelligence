#!/usr/bin/env python3
"""Reinforcement Learning Trading Agent - Q-Learning Implementation"""

import sys
import json
import numpy as np
import yfinance as yf
import pandas as pd
from datetime import datetime
from collections import defaultdict

class TradingEnvironment:
    """Custom trading environment compatible with Gymnasium-style interface"""
    
    def __init__(self, data, initial_balance=100000):
        self.data = data.reset_index(drop=True)
        self.initial_balance = initial_balance
        self.balance = initial_balance
        self.position = 0  # Number of shares held
        self.entry_price = 0
        self.current_step = 0
        self.total_profit = 0
        self.trade_history = []
        self.max_drawdown = 0
        self.peak_balance = initial_balance
        
    def reset(self):
        self.balance = self.initial_balance
        self.position = 0
        self.entry_price = 0
        self.current_step = 0
        self.total_profit = 0
        self.trade_history = []
        self.max_drawdown = 0
        self.peak_balance = self.initial_balance
        return self._get_state()
    
    def _get_state(self):
        """Create state representation from market data"""
        if self.current_step >= len(self.data):
            return None
        
        window = min(10, self.current_step + 1)
        recent_data = self.data.iloc[max(0, self.current_step - window + 1):self.current_step + 1]
        
        closes = recent_data['Close'].values
        volumes = recent_data['Volume'].values
        
        # Price change features
        if len(closes) >= 2:
            price_change = (closes[-1] - closes[-2]) / closes[-2] * 100
        else:
            price_change = 0
        
        # Normalize price relative to recent window
        if len(closes) > 0:
            price_norm = (closes[-1] - np.min(closes)) / (np.max(closes) - np.min(closes) + 1e-8)
        else:
            price_norm = 0.5
        
        # Volume change
        if len(volumes) >= 2 and volumes[-2] > 0:
            vol_change = (volumes[-1] - volumes[-2]) / volumes[-2] * 100
        else:
            vol_change = 0
        
        # Position state
        has_position = 1 if self.position > 0 else 0
        unrealized_pnl = 0
        if self.position > 0 and len(closes) > 0:
            unrealized_pnl = (closes[-1] - self.entry_price) / self.entry_price * 100
        
        # Discretize state for Q-learning
        price_bin = min(4, max(0, int(price_norm * 4)))
        change_bin = min(2, max(0, int((price_change + 5) / 5)))  # -5% to +5% -> 0-2
        vol_bin = min(2, max(0, int(min(100, abs(vol_change)) / 50)))  # 0-2
        
        state = (price_bin, change_bin, vol_bin, has_position, 1 if unrealized_pnl > 0 else 0)
        return state
    
    def step(self, action):
        """Execute action: 0=HOLD, 1=BUY, 2=SELL"""
        if self.current_step >= len(self.data) - 1:
            return None, 0, True, {}
        
        current_price = self.data.iloc[self.current_step]['Close']
        reward = 0
        trade_info = None
        
        if action == 1:  # BUY
            if self.position == 0:
                # Buy with 90% of available balance
                shares = int((self.balance * 0.9) / current_price)
                if shares > 0:
                    cost = shares * current_price
                    self.position = shares
                    self.entry_price = current_price
                    self.balance -= cost
                    trade_info = {'action': 'BUY', 'shares': shares, 'price': current_price, 'step': self.current_step}
                    self.trade_history.append(trade_info)
        
        elif action == 2:  # SELL
            if self.position > 0:
                revenue = self.position * current_price
                profit = (current_price - self.entry_price) * self.position
                profit_pct = (current_price - self.entry_price) / self.entry_price * 100
                self.balance += revenue
                self.total_profit += profit
                trade_info = {'action': 'SELL', 'shares': self.position, 'price': current_price, 'profit': profit, 'profitPct': profit_pct, 'step': self.current_step}
                self.trade_history.append(trade_info)
                self.position = 0
                self.entry_price = 0
                
                # Reward based on profit
                reward = profit_pct / 5  # Scale reward
                
                # Extra penalty for losses
                if profit < 0:
                    reward *= 1.5
        
        elif action == 0:  # HOLD
            if self.position > 0:
                unrealized = (current_price - self.entry_price) / self.entry_price * 100
                reward = unrealized / 50  # Small reward for unrealized gains
        
        # Update drawdown tracking
        current_value = self.balance + self.position * current_price
        self.peak_balance = max(self.peak_balance, current_value)
        drawdown = (self.peak_balance - current_value) / self.peak_balance * 100
        self.max_drawdown = max(self.max_drawdown, drawdown)
        
        # Penalty for drawdown
        if drawdown > 10:
            reward -= 0.5
        
        self.current_step += 1
        next_state = self._get_state()
        done = self.current_step >= len(self.data) - 1
        
        # Final reward for closing position
        if done and self.position > 0:
            final_price = self.data.iloc[self.current_step]['Close']
            final_profit = (final_price - self.entry_price) * self.position
            self.balance += self.position * final_price
            self.total_profit += final_profit
            self.position = 0
        
        info = {
            'totalProfit': self.total_profit,
            'portfolioValue': self.balance + self.position * current_price,
            'trades': len([t for t in self.trade_history if t['action'] == 'BUY']),
            'maxDrawdown': self.max_drawdown,
            'tradeInfo': trade_info
        }
        
        return next_state, reward, done, info


class QLearningAgent:
    """Q-Learning Agent for Stock Trading"""
    
    def __init__(self, learning_rate=0.1, discount_factor=0.95, epsilon=1.0, epsilon_decay=0.995, epsilon_min=0.01):
        self.lr = learning_rate
        self.gamma = discount_factor
        self.epsilon = epsilon
        self.epsilon_decay = epsilon_decay
        self.epsilon_min = epsilon_min
        self.q_table = defaultdict(lambda: np.zeros(3))  # 3 actions: HOLD, BUY, SELL
        self.training_history = []
    
    def get_action(self, state, training=True):
        """Epsilon-greedy action selection"""
        if training and np.random.random() < self.epsilon:
            return np.random.randint(0, 3)
        return int(np.argmax(self.q_table[state]))
    
    def get_confident_action(self, state):
        """Get action with confidence level"""
        q_values = self.q_table[state]
        action = int(np.argmax(q_values))
        confidence = self._calculate_confidence(q_values)
        return action, confidence
    
    def _calculate_confidence(self, q_values):
        """Calculate confidence based on Q-value differences"""
        sorted_q = np.sort(q_values)[::-1]
        if sorted_q[0] == 0:
            return 0.3  # Low confidence for unexplored states
        diff = sorted_q[0] - sorted_q[1]
        confidence = min(1.0, diff / (abs(sorted_q[0]) + 1e-8))
        return round(confidence, 3)
    
    def update(self, state, action, reward, next_state):
        """Update Q-value using Bellman equation"""
        best_next = np.max(self.q_table[next_state]) if next_state else 0
        td_target = reward + self.gamma * best_next
        td_error = td_target - self.q_table[state][action]
        self.q_table[state][action] += self.lr * td_error
    
    def decay_epsilon(self):
        """Decay exploration rate"""
        self.epsilon = max(self.epsilon_min, self.epsilon * self.epsilon_decay)
    
    def save_q_table(self):
        """Export Q-table for persistence"""
        table = {}
        for state, values in self.q_table.items():
            key = str(state)
            table[key] = values.tolist()
        return table
    
    def load_q_table(self, table):
        """Import Q-table"""
        for key, values in table.items():
            state = eval(key)  # Convert string back to tuple
            self.q_table[state] = np.array(values)


def train_agent(symbol, episodes=50, config=None):
    """Train the Q-Learning agent on historical data"""
    try:
        config = config or {}
        episodes = config.get('episodes', episodes)
        lr = config.get('learningRate', 0.1)
        gamma = config.get('discountFactor', 0.95)
        
        # Fetch training data
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period='1y')
        
        if hist.empty:
            return {'error': f'No data available for {symbol}'}
        
        # Create environment and agent
        env = TradingEnvironment(hist)
        agent = QLearningAgent(learning_rate=lr, discount_factor=gamma)
        
        training_log = []
        best_reward = -float('inf')
        
        for episode in range(episodes):
            state = env.reset()
            total_reward = 0
            steps = 0
            
            while state is not None:
                action = agent.get_action(state, training=True)
                next_state, reward, done, info = env.step(action)
                
                if next_state is not None:
                    agent.update(state, action, reward, next_state)
                
                state = next_state
                total_reward += reward
                steps += 1
                
                if done:
                    break
            
            agent.decay_epsilon()
            
            # Track training progress
            episode_data = {
                'episode': episode + 1,
                'totalReward': round(total_reward, 4),
                'epsilon': round(agent.epsilon, 4),
                'portfolioValue': round(info.get('portfolioValue', 0), 2),
                'totalProfit': round(info.get('totalProfit', 0), 2),
                'trades': info.get('trades', 0),
                'maxDrawdown': round(info.get('maxDrawdown', 0), 2),
                'steps': steps
            }
            training_log.append(episode_data)
            
            if total_reward > best_reward:
                best_reward = total_reward
        
        # Calculate training metrics
        rewards = [e['totalReward'] for e in training_log]
        profits = [e['totalProfit'] for e in training_log]
        
        return {
            'symbol': symbol,
            'episodes': episodes,
            'trainingLog': training_log[-20:],  # Last 20 episodes
            'finalMetrics': {
                'totalProfit': round(env.total_profit, 2),
                'finalPortfolioValue': round(env.balance, 2),
                'totalTrades': len([t for t in env.trade_history if t['action'] == 'BUY']),
                'maxDrawdown': round(env.max_drawdown, 2),
                'winRate': round(len([t for t in env.trade_history if t.get('profit', 0) > 0]) / max(1, len([t for t in env.trade_history if t['action'] == 'SELL'])) * 100, 1),
                'avgReward': round(np.mean(rewards), 4),
                'bestReward': round(best_reward, 4),
                'finalEpsilon': round(agent.epsilon, 4),
            },
            'qTableSize': len(agent.q_table),
            'tradeHistory': env.trade_history[-10:],
            'timestamp': datetime.now().isoformat()
        }
    except Exception as e:
        return {'error': str(e), 'symbol': symbol}


def predict_signal(symbol):
    """Get AI trading signal for a stock using trained Q-Learning agent"""
    try:
        # Fetch recent data
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period='3mo')
        
        if hist.empty:
            return {'error': f'No data available for {symbol}'}
        
        # Create and partially train agent
        env = TradingEnvironment(hist)
        agent = QLearningAgent()
        
        # Quick training
        for _ in range(30):
            state = env.reset()
            while state is not None:
                action = agent.get_action(state, training=True)
                next_state, reward, done, info = env.step(action)
                if next_state is not None:
                    agent.update(state, action, reward, next_state)
                state = next_state
                if done:
                    break
            agent.decay_epsilon()
        
        # Get prediction for current state
        env2 = TradingEnvironment(hist)
        state = env2._get_state()
        
        if state is None:
            return {'error': 'Could not generate state'}
        
        action, confidence = agent.get_confident_action(state)
        
        action_names = {0: 'HOLD', 1: 'BUY', 2: 'SELL'}
        signal_names = {0: 'HOLD', 1: 'STRONG_BUY', 2: 'STRONG_SELL'}
        
        current_price = float(hist['Close'].iloc[-1])
        
        # Also get quick indicators for combined signal
        from technical_indicators import get_all_indicators
        indicators = get_all_indicators(symbol)
        
        # Combine RL signal with technical analysis
        rl_signal = action_names[action]
        ta_signal = 'HOLD'
        ta_confidence = 0
        
        if 'signals' in indicators:
            ta_signal = indicators['signals'].get('overallSignal', 'HOLD')
            ta_confidence = indicators['signals'].get('confidence', 0)
        
        # Weighted combination (60% RL, 40% TA)
        signal_scores = {'STRONG_BUY': 2, 'BUY': 1, 'HOLD': 0, 'SELL': -1, 'STRONG_SELL': -2}
        rl_score = signal_scores.get(signal_names.get(action, 'HOLD'), 0) * 0.6
        ta_score = signal_scores.get(ta_signal, 0) * 0.4
        combined_score = rl_score + ta_score
        
        if combined_score >= 1.5:
            combined_signal = 'STRONG_BUY'
        elif combined_score >= 0.5:
            combined_signal = 'BUY'
        elif combined_score <= -1.5:
            combined_signal = 'STRONG_SELL'
        elif combined_score <= -0.5:
            combined_signal = 'SELL'
        else:
            combined_signal = 'HOLD'
        
        combined_confidence = round(min(100, (confidence * 60 + ta_confidence * 0.4)), 1)
        
        return {
            'symbol': symbol,
            'currentPrice': current_price,
            'rlSignal': {
                'action': rl_signal,
                'confidence': round(confidence * 100, 1),
                'qValues': agent.q_table[state].tolist()
            },
            'technicalSignal': {
                'action': ta_signal,
                'confidence': ta_confidence
            },
            'combinedSignal': {
                'action': combined_signal,
                'confidence': combined_confidence,
                'score': round(combined_score, 3)
            },
            'timestamp': datetime.now().isoformat()
        }
    except Exception as e:
        # Fallback to just RL signal without technical indicators
        try:
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period='3mo')
            env = TradingEnvironment(hist)
            agent = QLearningAgent()
            for _ in range(20):
                state = env.reset()
                while state is not None:
                    action = agent.get_action(state, training=True)
                    next_state, reward, done, info = env.step(action)
                    if next_state:
                        agent.update(state, action, reward, next_state)
                    state = next_state
                    if done:
                        break
                agent.decay_epsilon()
            
            env2 = TradingEnvironment(hist)
            state = env2._get_state()
            action, confidence = agent.get_confident_action(state)
            action_names = {0: 'HOLD', 1: 'BUY', 2: 'SELL'}
            current_price = float(hist['Close'].iloc[-1]) if not hist.empty else 0
            
            return {
                'symbol': symbol,
                'currentPrice': current_price,
                'rlSignal': {'action': action_names[action], 'confidence': round(confidence * 100, 1)},
                'technicalSignal': {'action': 'N/A', 'confidence': 0},
                'combinedSignal': {'action': action_names[action], 'confidence': round(confidence * 100, 1), 'score': 0},
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e2:
            return {'error': str(e2), 'symbol': symbol}

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No command specified'}))
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == 'train':
        config = {}
        if len(sys.argv) > 2:
            try:
                config = json.loads(sys.argv[2])
            except:
                config = {'symbol': sys.argv[2]}
        symbol = config.get('symbol', 'AAPL')
        result = train_agent(symbol, config=config)
        print(json.dumps(result))
    elif command == 'predict':
        symbol = sys.argv[2] if len(sys.argv) > 2 else 'AAPL'
        result = predict_signal(symbol)
        print(json.dumps(result))
    else:
        print(json.dumps({'error': f'Unknown command: {command}'}))
