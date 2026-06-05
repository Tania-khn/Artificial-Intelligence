#!/usr/bin/env python3
"""Market Data Fetcher - Fetches live and historical stock data using Yahoo Finance"""

import sys
import json
import yfinance as yf
from datetime import datetime, timedelta

def get_live_price(symbol):
    """Get current/live price data for a stock"""
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info
        
        # Get fast info for current price
        fast_info = ticker.fast_info
        
        current_price = getattr(fast_info, 'last_price', None) or info.get('currentPrice', 0)
        prev_close = getattr(fast_info, 'previous_close', None) or info.get('previousClose', 0)
        
        change = current_price - prev_close if prev_close else 0
        change_pct = (change / prev_close * 100) if prev_close else 0
        
        return {
            'symbol': symbol,
            'name': info.get('shortName', symbol),
            'price': round(current_price, 2),
            'previousClose': round(prev_close, 2),
            'change': round(change, 2),
            'changePercent': round(change_pct, 2),
            'open': round(getattr(fast_info, 'open', 0) or info.get('open', 0), 2),
            'high': round(getattr(fast_info, 'day_high', 0) or info.get('dayHigh', 0), 2),
            'low': round(getattr(fast_info, 'day_low', 0) or info.get('dayLow', 0), 2),
            'volume': getattr(fast_info, 'last_volume', 0) or info.get('volume', 0),
            'marketCap': info.get('marketCap', 0),
            'peRatio': info.get('trailingPE', None),
            'week52High': round(getattr(fast_info, 'yearly_high', 0) or info.get('fiftyTwoWeekHigh', 0), 2),
            'week52Low': round(getattr(fast_info, 'yearly_low', 0) or info.get('fiftyTwoWeekLow', 0), 2),
            'timestamp': datetime.now().isoformat()
        }
    except Exception as e:
        return {'error': str(e), 'symbol': symbol}

def get_historical_data(symbol, period='1mo'):
    """Get historical OHLCV data"""
    try:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period=period)
        
        if hist.empty:
            return {'error': 'No data available', 'symbol': symbol}
        
        data = []
        for index, row in hist.iterrows():
            data.append({
                'date': index.strftime('%Y-%m-%d'),
                'open': round(float(row['Open']), 2),
                'high': round(float(row['High']), 2),
                'low': round(float(row['Low']), 2),
                'close': round(float(row['Close']), 2),
                'volume': int(row['Volume']),
            })
        
        return {
            'symbol': symbol,
            'period': period,
            'data': data
        }
    except Exception as e:
        return {'error': str(e), 'symbol': symbol}

def get_multi_stock_data(symbols_str):
    """Get live data for multiple stocks"""
    symbols = [s.strip() for s in symbols_str.split(',')]
    results = []
    for symbol in symbols[:10]:  # Limit to 10 stocks
        result = get_live_price(symbol)
        results.append(result)
    return {'stocks': results}

def search_stocks(query):
    """Search for stocks by name/symbol"""
    try:
        # Use a predefined list of popular stocks for search
        popular_stocks = {
            'AAPL': 'Apple Inc.',
            'TSLA': 'Tesla, Inc.',
            'NVDA': 'NVIDIA Corporation',
            'MSFT': 'Microsoft Corporation',
            'GOOGL': 'Alphabet Inc.',
            'AMZN': 'Amazon.com, Inc.',
            'META': 'Meta Platforms, Inc.',
            'NFLX': 'Netflix, Inc.',
            'AMD': 'Advanced Micro Devices, Inc.',
            'INTC': 'Intel Corporation',
            'BA': 'The Boeing Company',
            'JPM': 'JPMorgan Chase & Co.',
            'V': 'Visa Inc.',
            'WMT': 'Walmart Inc.',
            'DIS': 'The Walt Disney Company',
            'PYPL': 'PayPal Holdings, Inc.',
            'SBUX': 'Starbucks Corporation',
            'NKE': 'NIKE, Inc.',
            'CRM': 'Salesforce, Inc.',
            'UBER': 'Uber Technologies, Inc.',
            'COIN': 'Coinbase Global, Inc.',
            'SQ': 'Block, Inc.',
            'SNAP': 'Snap Inc.',
            'SPOT': 'Spotify Technology S.A.',
            'ZOOM': 'Zoom Video Communications',
        }
        
        query_upper = query.upper()
        matches = []
        for sym, name in popular_stocks.items():
            if query_upper in sym or query_upper in name.upper():
                matches.append({'symbol': sym, 'name': name})
        
        return {'results': matches[:10]}
    except Exception as e:
        return {'error': str(e)}

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No command specified'}))
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == 'live':
        symbol = sys.argv[2] if len(sys.argv) > 2 else 'AAPL'
        print(json.dumps(get_live_price(symbol)))
    elif command == 'history':
        symbol = sys.argv[2] if len(sys.argv) > 2 else 'AAPL'
        period = sys.argv[3] if len(sys.argv) > 3 else '1mo'
        print(json.dumps(get_historical_data(symbol, period)))
    elif command == 'multi':
        symbols = sys.argv[2] if len(sys.argv) > 2 else 'AAPL,TSLA,NVDA'
        print(json.dumps(get_multi_stock_data(symbols)))
    elif command == 'search':
        query = sys.argv[2] if len(sys.argv) > 2 else ''
        print(json.dumps(search_stocks(query)))
    else:
        print(json.dumps({'error': f'Unknown command: {command}'}))
