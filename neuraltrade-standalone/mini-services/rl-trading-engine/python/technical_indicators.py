#!/usr/bin/env python3
"""Technical Indicators - Calculate RSI, MACD, Moving Averages, Bollinger Bands"""

import sys
import json
import yfinance as yf
import numpy as np
import pandas as pd
from datetime import datetime

def calculate_rsi(data, period=14):
    """Calculate Relative Strength Index"""
    delta = data.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    return rsi

def calculate_macd(data, fast=12, slow=26, signal=9):
    """Calculate MACD"""
    ema_fast = data.ewm(span=fast, adjust=False).mean()
    ema_slow = data.ewm(span=slow, adjust=False).mean()
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    histogram = macd_line - signal_line
    return macd_line, signal_line, histogram

def calculate_bollinger_bands(data, period=20, std_dev=2):
    """Calculate Bollinger Bands"""
    sma = data.rolling(window=period).mean()
    std = data.rolling(window=period).std()
    upper_band = sma + (std * std_dev)
    lower_band = sma - (std * std_dev)
    return upper_band, sma, lower_band

def calculate_moving_averages(data):
    """Calculate various moving averages"""
    ma_20 = data.rolling(window=20).mean()
    ma_50 = data.rolling(window=50).mean()
    ma_200 = data.rolling(window=200).mean()
    return ma_20, ma_50, ma_200

def calculate_stochastic(high, low, close, period=14):
    """Calculate Stochastic Oscillator"""
    lowest_low = low.rolling(window=period).min()
    highest_high = high.rolling(window=period).max()
    k_line = 100 * (close - lowest_low) / (highest_high - lowest_low)
    d_line = k_line.rolling(window=3).mean()
    return k_line, d_line

def calculate_atr(high, low, close, period=14):
    """Calculate Average True Range"""
    high_low = high - low
    high_close = np.abs(high - close.shift())
    low_close = np.abs(low - close.shift())
    tr = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
    atr = tr.rolling(window=period).mean()
    return atr

def calculate_vwap(high, low, close, volume):
    """Calculate Volume Weighted Average Price"""
    typical_price = (high + low + close) / 3
    vwap = (typical_price * volume).cumsum() / volume.cumsum()
    return vwap

def get_all_indicators(symbol):
    """Get all technical indicators for a stock"""
    try:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period='6mo')
        
        if hist.empty:
            return {'error': 'No data available', 'symbol': symbol}
        
        close = hist['Close']
        high = hist['High']
        low = hist['Low']
        volume = hist['Volume']
        
        # Calculate all indicators
        rsi = calculate_rsi(close)
        macd_line, signal_line, histogram = calculate_macd(close)
        upper_band, middle_band, lower_band = calculate_bollinger_bands(close)
        ma_20, ma_50, ma_200 = calculate_moving_averages(close)
        k_line, d_line = calculate_stochastic(high, low, close)
        atr = calculate_atr(high, low, close)
        vwap = calculate_vwap(high, low, close, volume)
        
        # Get latest values
        latest_rsi = rsi.iloc[-1] if not rsi.empty else None
        latest_macd = macd_line.iloc[-1] if not macd_line.empty else None
        latest_signal = signal_line.iloc[-1] if not signal_line.empty else None
        latest_histogram = histogram.iloc[-1] if not histogram.empty else None
        latest_upper = upper_band.iloc[-1] if not upper_band.empty else None
        latest_middle = middle_band.iloc[-1] if not middle_band.empty else None
        latest_lower = lower_band.iloc[-1] if not lower_band.empty else None
        latest_ma20 = ma_20.iloc[-1] if not ma_20.empty else None
        latest_ma50 = ma_50.iloc[-1] if not ma_50.empty else None
        latest_ma200 = ma_200.iloc[-1] if not ma_200.empty else None
        latest_k = k_line.iloc[-1] if not k_line.empty else None
        latest_d = d_line.iloc[-1] if not d_line.empty else None
        latest_atr = atr.iloc[-1] if not atr.empty else None
        latest_vwap = vwap.iloc[-1] if not vwap.empty else None
        
        # Build chart data (last 60 data points)
        chart_data = []
        for i in range(max(0, len(hist) - 60), len(hist)):
            idx = hist.index[i]
            chart_data.append({
                'date': idx.strftime('%Y-%m-%d'),
                'close': round(float(close.iloc[i]), 2),
                'rsi': round(float(rsi.iloc[i]), 2) if not pd.isna(rsi.iloc[i]) else None,
                'macd': round(float(macd_line.iloc[i]), 4) if not pd.isna(macd_line.iloc[i]) else None,
                'macdSignal': round(float(signal_line.iloc[i]), 4) if not pd.isna(signal_line.iloc[i]) else None,
                'macdHist': round(float(histogram.iloc[i]), 4) if not pd.isna(histogram.iloc[i]) else None,
                'upperBand': round(float(upper_band.iloc[i]), 2) if not pd.isna(upper_band.iloc[i]) else None,
                'middleBand': round(float(middle_band.iloc[i]), 2) if not pd.isna(middle_band.iloc[i]) else None,
                'lowerBand': round(float(lower_band.iloc[i]), 2) if not pd.isna(lower_band.iloc[i]) else None,
                'ma20': round(float(ma_20.iloc[i]), 2) if not pd.isna(ma_20.iloc[i]) else None,
                'ma50': round(float(ma_50.iloc[i]), 2) if not pd.isna(ma_50.iloc[i]) else None,
                'ma200': round(float(ma_200.iloc[i]), 2) if not pd.isna(ma_200.iloc[i]) else None,
                'volume': int(volume.iloc[i]),
            })
        
        # Generate signals
        signals = generate_signals(latest_rsi, latest_macd, latest_signal, 
                                    latest_upper, latest_lower, close.iloc[-1],
                                    latest_ma20, latest_ma50, latest_ma200, latest_k, latest_d)
        
        return {
            'symbol': symbol,
            'currentPrice': round(float(close.iloc[-1]), 2),
            'latest': {
                'rsi': round(float(latest_rsi), 2) if latest_rsi and not pd.isna(latest_rsi) else None,
                'macd': round(float(latest_macd), 4) if latest_macd and not pd.isna(latest_macd) else None,
                'macdSignal': round(float(latest_signal), 4) if latest_signal and not pd.isna(latest_signal) else None,
                'macdHistogram': round(float(latest_histogram), 4) if latest_histogram and not pd.isna(latest_histogram) else None,
                'bollingerUpper': round(float(latest_upper), 2) if latest_upper and not pd.isna(latest_upper) else None,
                'bollingerMiddle': round(float(latest_middle), 2) if latest_middle and not pd.isna(middle_band.iloc[-1]) else None,
                'bollingerLower': round(float(latest_lower), 2) if latest_lower and not pd.isna(latest_lower) else None,
                'ma20': round(float(latest_ma20), 2) if latest_ma20 and not pd.isna(latest_ma20) else None,
                'ma50': round(float(latest_ma50), 2) if latest_ma50 and not pd.isna(latest_ma50) else None,
                'ma200': round(float(latest_ma200), 2) if latest_ma200 and not pd.isna(latest_ma200) else None,
                'stochK': round(float(latest_k), 2) if latest_k and not pd.isna(latest_k) else None,
                'stochD': round(float(latest_d), 2) if latest_d and not pd.isna(latest_d) else None,
                'atr': round(float(latest_atr), 2) if latest_atr and not pd.isna(latest_atr) else None,
                'vwap': round(float(latest_vwap), 2) if latest_vwap and not pd.isna(latest_vwap) else None,
            },
            'signals': signals,
            'chartData': chart_data
        }
    except Exception as e:
        return {'error': str(e), 'symbol': symbol}

def generate_signals(rsi, macd, macd_signal, upper_bb, lower_bb, current_price, ma20, ma50, ma200, stoch_k, stoch_d):
    """Generate buy/sell signals based on technical indicators"""
    signals = []
    score = 0  # -5 to +5 scale
    total_indicators = 0
    
    # RSI Signal
    if rsi and not pd.isna(rsi):
        total_indicators += 1
        if rsi < 30:
            signals.append({'indicator': 'RSI', 'signal': 'STRONG_BUY', 'value': round(float(rsi), 2), 'reason': f'RSI at {rsi:.1f} indicates oversold conditions'})
            score += 2
        elif rsi < 40:
            signals.append({'indicator': 'RSI', 'signal': 'BUY', 'value': round(float(rsi), 2), 'reason': f'RSI at {rsi:.1f} approaching oversold'})
            score += 1
        elif rsi > 70:
            signals.append({'indicator': 'RSI', 'signal': 'STRONG_SELL', 'value': round(float(rsi), 2), 'reason': f'RSI at {rsi:.1f} indicates overbought conditions'})
            score -= 2
        elif rsi > 60:
            signals.append({'indicator': 'RSI', 'signal': 'SELL', 'value': round(float(rsi), 2), 'reason': f'RSI at {rsi:.1f} approaching overbought'})
            score -= 1
        else:
            signals.append({'indicator': 'RSI', 'signal': 'HOLD', 'value': round(float(rsi), 2), 'reason': f'RSI at {rsi:.1f} is neutral'})
    
    # MACD Signal
    if macd is not None and macd_signal is not None and not pd.isna(macd) and not pd.isna(macd_signal):
        total_indicators += 1
        if macd > macd_signal:
            signals.append({'indicator': 'MACD', 'signal': 'BUY', 'value': round(float(macd), 4), 'reason': 'MACD line above signal line - bullish'})
            score += 1
        else:
            signals.append({'indicator': 'MACD', 'signal': 'SELL', 'value': round(float(macd), 4), 'reason': 'MACD line below signal line - bearish'})
            score -= 1
    
    # Bollinger Bands Signal
    if upper_bb and lower_bb and not pd.isna(upper_bb) and not pd.isna(lower_bb):
        total_indicators += 1
        bb_width = upper_bb - lower_bb
        if current_price < lower_bb:
            signals.append({'indicator': 'Bollinger', 'signal': 'STRONG_BUY', 'value': round(float(current_price), 2), 'reason': 'Price below lower Bollinger Band - oversold'})
            score += 2
        elif current_price > upper_bb:
            signals.append({'indicator': 'Bollinger', 'signal': 'STRONG_SELL', 'value': round(float(current_price), 2), 'reason': 'Price above upper Bollinger Band - overbought'})
            score -= 2
        else:
            signals.append({'indicator': 'Bollinger', 'signal': 'HOLD', 'value': round(float(current_price), 2), 'reason': 'Price within Bollinger Bands'})
    
    # Moving Average Signal
    if ma20 and ma50 and not pd.isna(ma20) and not pd.isna(ma50):
        total_indicators += 1
        if current_price > ma20 and ma20 > ma50:
            signals.append({'indicator': 'MA Crossover', 'signal': 'BUY', 'value': round(float(ma20), 2), 'reason': 'Price above MA20, MA20 above MA50 - uptrend'})
            score += 1
        elif current_price < ma20 and ma20 < ma50:
            signals.append({'indicator': 'MA Crossover', 'signal': 'SELL', 'value': round(float(ma20), 2), 'reason': 'Price below MA20, MA20 below MA50 - downtrend'})
            score -= 1
        else:
            signals.append({'indicator': 'MA Crossover', 'signal': 'HOLD', 'value': round(float(ma20), 2), 'reason': 'Mixed moving average signals'})
    
    # Stochastic Signal
    if stoch_k is not None and stoch_d is not None and not pd.isna(stoch_k) and not pd.isna(stoch_d):
        total_indicators += 1
        if stoch_k < 20:
            signals.append({'indicator': 'Stochastic', 'signal': 'BUY', 'value': round(float(stoch_k), 2), 'reason': f'Stochastic K at {stoch_k:.1f} - oversold'})
            score += 1
        elif stoch_k > 80:
            signals.append({'indicator': 'Stochastic', 'signal': 'SELL', 'value': round(float(stoch_k), 2), 'reason': f'Stochastic K at {stoch_k:.1f} - overbought'})
            score -= 1
        else:
            signals.append({'indicator': 'Stochastic', 'signal': 'HOLD', 'value': round(float(stoch_k), 2), 'reason': f'Stochastic K at {stoch_k:.1f} - neutral'})
    
    # Overall signal
    if score >= 3:
        overall = 'STRONG_BUY'
    elif score >= 1:
        overall = 'BUY'
    elif score <= -3:
        overall = 'STRONG_SELL'
    elif score <= -1:
        overall = 'SELL'
    else:
        overall = 'HOLD'
    
    confidence = min(100, abs(score) / max(total_indicators, 1) * 100) if total_indicators > 0 else 50
    
    return {
        'individualSignals': signals,
        'overallSignal': overall,
        'score': score,
        'confidence': round(confidence, 1),
        'totalIndicators': total_indicators
    }

if __name__ == '__main__':
    symbol = sys.argv[1] if len(sys.argv) > 1 else 'AAPL'
    result = get_all_indicators(symbol)
    print(json.dumps(result))
