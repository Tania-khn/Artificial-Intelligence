#!/usr/bin/env python3
"""Sentiment Analysis - Analyze market sentiment using news and data"""

import sys
import json
import numpy as np
import yfinance as yf
from datetime import datetime

def get_sentiment(symbol):
    """Analyze market sentiment for a stock"""
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info
        news = ticker.news if hasattr(ticker, 'news') else []
        
        # Analyze news sentiment
        sentiment_scores = []
        news_items = []
        
        for article in news[:10]:
            title = article.get('title', '')
            sentiment = analyze_text_sentiment(title)
            sentiment_scores.append(sentiment)
            
            news_items.append({
                'title': title,
                'publisher': article.get('publisher', 'Unknown'),
                'sentiment': sentiment,
                'sentimentLabel': get_sentiment_label(sentiment),
                'date': datetime.fromtimestamp(article.get('providerPublishTime', 0)).strftime('%Y-%m-%d') if article.get('providerPublishTime') else 'N/A',
                'url': article.get('link', '')
            })
        
        # Calculate overall sentiment
        if sentiment_scores:
            avg_sentiment = np.mean(sentiment_scores)
            sentiment_distribution = {
                'positive': len([s for s in sentiment_scores if s > 0.2]),
                'neutral': len([s for s in sentiment_scores if -0.2 <= s <= 0.2]),
                'negative': len([s for s in sentiment_scores if s < -0.2])
            }
        else:
            avg_sentiment = 0
            sentiment_distribution = {'positive': 0, 'neutral': 0, 'negative': 0}
        
        # Get recommendation from analyst
        recommendations = info.get('recommendationKey', 'none')
        target_price = info.get('targetMeanPrice', 0)
        current_price = info.get('currentPrice', 0) or getattr(ticker.fast_info, 'last_price', 0)
        
        # Combine news sentiment with analyst data
        analyst_sentiment = 0
        if recommendations in ['strong_buy', 'buy']:
            analyst_sentiment = 0.5
        elif recommendations == 'hold':
            analyst_sentiment = 0
        elif recommendations in ['sell', 'strong_sell']:
            analyst_sentiment = -0.5
        
        # Price target sentiment
        price_target_sentiment = 0
        if target_price and current_price:
            price_target_sentiment = (target_price - current_price) / current_price
        
        # Combined sentiment (50% news, 30% analyst, 20% price target)
        combined = avg_sentiment * 0.5 + analyst_sentiment * 0.3 + min(1, max(-1, price_target_sentiment)) * 0.2
        
        return {
            'symbol': symbol,
            'overallSentiment': round(float(combined), 3),
            'sentimentLabel': get_sentiment_label(combined),
            'confidence': round(min(100, len(sentiment_scores) * 15 + 30), 1),
            'newsSentiment': round(float(avg_sentiment), 3),
            'analystSentiment': round(float(analyst_sentiment), 3),
            'priceTargetSentiment': round(float(price_target_sentiment), 3),
            'sentimentDistribution': sentiment_distribution,
            'recommendationKey': recommendations,
            'targetPrice': round(float(target_price), 2) if target_price else None,
            'currentPrice': round(float(current_price), 2) if current_price else None,
            'news': news_items,
            'timestamp': datetime.now().isoformat()
        }
    except Exception as e:
        return {'error': str(e), 'symbol': symbol}

def analyze_text_sentiment(text):
    """Simple rule-based sentiment analysis"""
    positive_words = ['surge', 'soar', 'rally', 'gain', 'profit', 'beat', 'exceed', 'growth', 
                      'upgrade', 'bullish', 'positive', 'strong', 'record', 'high', 'boom',
                      'outperform', 'buy', 'optimistic', 'recovery', 'jump', 'rise', 'climb']
    negative_words = ['crash', 'plunge', 'drop', 'fall', 'loss', 'miss', 'decline', 'downgrade',
                      'bearish', 'negative', 'weak', 'low', 'bust', 'underperform', 'sell',
                      'pessimistic', 'recession', 'slump', 'tumble', 'dive', 'cut', 'fear']
    
    text_lower = text.lower()
    words = text_lower.split()
    
    score = 0
    for word in words:
        if word in positive_words:
            score += 1
        elif word in negative_words:
            score -= 1
    
    # Normalize to -1 to 1
    if len(words) > 0:
        return max(-1, min(1, score / max(1, len(words) / 2)))
    return 0

def get_sentiment_label(score):
    """Convert sentiment score to label"""
    if score > 0.5:
        return 'VERY_POSITIVE'
    elif score > 0.2:
        return 'POSITIVE'
    elif score > -0.2:
        return 'NEUTRAL'
    elif score > -0.5:
        return 'NEGATIVE'
    else:
        return 'VERY_NEGATIVE'

if __name__ == '__main__':
    symbol = sys.argv[1] if len(sys.argv) > 1 else 'AAPL'
    result = get_sentiment(symbol)
    print(json.dumps(result))
