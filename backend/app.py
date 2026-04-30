from flask import Flask, request, jsonify
from flask_cors import CORS
import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
import requests
from textblob import TextBlob
import os
from dotenv import load_dotenv
from groq import Groq
import traceback

# Load environment variables
load_dotenv()
load_dotenv('../.env')

app = Flask(__name__)
CORS(app)

NEWS_API_KEY = os.getenv('NEWS_API_KEY')
GROQ_API_KEY = os.getenv('GROQ_API_KEY')

try:
    groq_client = Groq(api_key=GROQ_API_KEY)
except:
    groq_client = None

def get_exchange_rate():
    """Fetch the live USD to INR exchange rate."""
    try:
        ticker = yf.Ticker("USDINR=X")
        # Get latest price
        hist = ticker.history(period="1d")
        if not hist.empty:
            return hist['Close'].iloc[-1]
    except Exception as e:
        print(f"Error fetching exchange rate: {e}")
    # Fallback exchange rate if API fails
    return 83.50

def get_stock_data_yf(symbol, days=30, exchange_rate=1.0):
    """Fetch stock data using yfinance and convert to INR"""
    try:
        ticker = yf.Ticker(symbol)
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        hist = ticker.history(start=start_date.strftime('%Y-%m-%d'), end=end_date.strftime('%Y-%m-%d'))
        
        if hist.empty:
            return None
            
        df = hist.reset_index()
        df['date'] = df['Date'].dt.strftime('%Y-%m-%d')
        
        # Apply exchange rate if it's a US stock (or any non-INR stock if assuming all are USD for simplicity).
        # Actually, Indian stocks (like .NS or .BO) are ALREADY in INR!
        # We should only convert if it's not an Indian stock.
        is_indian = symbol.endswith('.NS') or symbol.endswith('.BO')
        multiplier = 1.0 if is_indian else exchange_rate
        
        df['open'] = df['Open'] * multiplier
        df['high'] = df['High'] * multiplier
        df['low'] = df['Low'] * multiplier
        df['close'] = df['Close'] * multiplier
        df['volume'] = df['Volume']
        
        return df[['date', 'open', 'high', 'low', 'close', 'volume']].to_dict('records')
    except Exception as e:
        print(f"Error fetching stock data for {symbol}: {e}")
        return None

def get_news_data(symbol, days=7):
    """Fetch news data from News API"""
    try:
        if not NEWS_API_KEY:
            return []
            
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # Extract company name from symbol if possible, or just use symbol
        search_query = symbol.split('.')[0]
        
        url = "https://newsapi.org/v2/everything"
        params = {
            'q': search_query,
            'from': start_date.strftime('%Y-%m-%d'),
            'to': end_date.strftime('%Y-%m-%d'),
            'sortBy': 'relevancy',
            'language': 'en',
            'apiKey': NEWS_API_KEY,
            'pageSize': 15
        }
        
        response = requests.get(url, params=params)
        data = response.json()
        
        if 'articles' in data:
            articles = []
            for article in data['articles']:
                if article['title'] and article['description']:
                    articles.append({
                        'title': article['title'],
                        'description': article['description'],
                        'url': article['url'],
                        'publishedAt': article['publishedAt'],
                        'source': article['source']['name'] if article.get('source') else 'Unknown'
                    })
            return articles
        return []
    except Exception as e:
        print(f"Error fetching news for {symbol}: {e}")
        return []

def analyze_sentiment(text):
    """Analyze sentiment using TextBlob"""
    try:
        blob = TextBlob(text)
        polarity = blob.sentiment.polarity
        if polarity > 0.1:
            return 'Positive', polarity
        elif polarity < -0.1:
            return 'Negative', polarity
        else:
            return 'Neutral', polarity
    except:
        return 'Neutral', 0.0

def get_groq_analysis(stock_data, news_sentiment, symbol, company_name=""):
    """Get AI analysis from Groq"""
    if not groq_client:
        return "Groq API not available or key is invalid."
    
    try:
        if not stock_data:
            return "Not enough stock data for analysis."
            
        latest_price = stock_data[-1]['close']
        first_price = stock_data[0]['close']
        price_change = ((latest_price - first_price) / first_price * 100)
        avg_volume = sum([d['volume'] for d in stock_data]) / len(stock_data)
        
        avg_sentiment = sum([s['sentiment_score'] for s in news_sentiment]) / len(news_sentiment) if news_sentiment else 0
        positive_news = len([s for s in news_sentiment if s['sentiment'] == 'Positive'])
        negative_news = len([s for s in news_sentiment if s['sentiment'] == 'Negative'])
        
        prompt = f"""
        Analyze the stock {company_name} ({symbol}) based on the following data:
        
        Stock Performance (in INR):
        - Current Price: ₹{latest_price:.2f}
        - Price Change (recent): {price_change:.2f}%
        - Trading Volume: {avg_volume:.0f} (average)
        
        News Sentiment Analysis:
        - Average Sentiment Score: {avg_sentiment:.3f} (range: -1 to 1)
        - Positive News Articles: {positive_news}
        - Negative News Articles: {negative_news}
        - Total Articles Analyzed: {len(news_sentiment)}
        
        Please provide:
        1. A summary of the stock's current standing and performance.
        2. Current events that could cause inflation in this stock's price.
        3. A recommendation (Hold/Buy/Sell) with reasoning. Start the recommendation line with exactly "RECOMMENDATION: [Buy/Sell/Hold]".
        
        Keep the analysis concise and professional.
        """
        
        chat_completion = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.1-8b-instant",
            temperature=0.3,
            max_tokens=400
        )
        
        return chat_completion.choices[0].message.content
    except Exception as e:
        print(f"Groq analysis error: {e}")
        return f"Error getting Groq analysis: {e}"

def process_single_stock(symbol, days_stock=30, days_news=7, exchange_rate=1.0):
    """Core logic to process a single stock"""
    symbol = symbol.upper()
    
    # 1. Fetch Company Info
    company_info = {}
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info
        company_info = {
            "longName": info.get("longName", symbol),
            "sector": info.get("sector", "Unknown"),
            "industry": info.get("industry", "Unknown"),
            "marketCap": info.get("marketCap", 0),
            "longBusinessSummary": info.get("longBusinessSummary", "No description available.")
        }
        
        # Convert Market Cap to INR if it's a US stock
        is_indian = symbol.endswith('.NS') or symbol.endswith('.BO')
        if not is_indian and company_info["marketCap"]:
            company_info["marketCap"] = company_info["marketCap"] * exchange_rate
            
    except Exception as e:
        print(f"Failed to fetch info for {symbol}: {e}")
        company_info = {
            "longName": symbol, "sector": "Unknown", "industry": "Unknown", 
            "marketCap": 0, "longBusinessSummary": "No description available."
        }

    # 2. Fetch Stock Data
    stock_data = get_stock_data_yf(symbol, days_stock, exchange_rate)
    if not stock_data:
        return {"error": f"Could not fetch data for symbol {symbol}"}
        
    # 3. Fetch News Data
    news_articles = get_news_data(symbol, days_news)
    news_with_sentiment = []
    for article in news_articles:
        text = f"{article['title']} {article['description']}"
        sentiment, score = analyze_sentiment(text)
        news_with_sentiment.append({
            **article,
            'sentiment': sentiment,
            'sentiment_score': score
        })
        
    # 4. Fetch AI Analysis
    ai_analysis = get_groq_analysis(stock_data, news_with_sentiment, symbol, company_info['longName'])
    
    # Extract recommendation
    recommendation = "Hold"
    if ai_analysis:
        for line in ai_analysis.split('\n'):
            if line.strip().upper().startswith('RECOMMENDATION:'):
                rec_text = line.split(':')[1].strip().lower()
                if 'buy' in rec_text: recommendation = 'Buy'
                elif 'sell' in rec_text: recommendation = 'Sell'
                else: recommendation = 'Hold'
                break
                
    return {
        "symbol": symbol,
        "company_info": company_info,
        "stock_data": stock_data,
        "news": news_with_sentiment,
        "ai_analysis": ai_analysis,
        "recommendation": recommendation
    }

@app.route('/api/search', methods=['GET'])
def search_stocks():
    query = request.args.get('q', '')
    if not query:
        return jsonify([])
        
    url = f"https://query2.finance.yahoo.com/v1/finance/search"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    params = {'q': query, 'quotesCount': 8, 'newsCount': 0}
    
    try:
        res = requests.get(url, params=params, headers=headers)
        data = res.json()
        results = []
        if 'quotes' in data:
            for q in data['quotes']:
                # Filter out irrelevant types if needed, or keep all
                if q.get('quoteType') in ['EQUITY', 'ETF']:
                    results.append({
                        "symbol": q.get('symbol'),
                        "name": q.get('shortname', q.get('longname', 'Unknown'))
                    })
        return jsonify(results)
    except Exception as e:
        print(f"Error searching: {e}")
        return jsonify([])

@app.route('/api/analyze/<symbol>', methods=['GET'])
def analyze(symbol):
    days_stock = int(request.args.get('days_stock', 30))
    days_news = int(request.args.get('days_news', 7))
    
    exchange_rate = get_exchange_rate()
    
    result = process_single_stock(symbol, days_stock, days_news, exchange_rate)
    if "error" in result:
        return jsonify(result), 400
    return jsonify(result)

@app.route('/api/screen', methods=['POST'])
def screen_stocks():
    data = request.json
    stocks_to_screen = data.get('stocks', ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA', 'RELIANCE.NS', 'TCS.NS'])
    min_sentiment = float(data.get('min_sentiment', 0.0))
    require_buy = data.get('require_buy', False)
    min_price_change = float(data.get('min_price_change', -100.0))
    
    exchange_rate = get_exchange_rate()
    results = []
    
    for symbol in stocks_to_screen:
        try:
            stock_data = get_stock_data_yf(symbol, days=30, exchange_rate=exchange_rate)
            if not stock_data or len(stock_data) < 2:
                continue
                
            first_price = stock_data[0]['close']
            latest_price = stock_data[-1]['close']
            price_change = ((latest_price - first_price) / first_price * 100)
            
            if price_change < min_price_change:
                continue
                
            news_articles = get_news_data(symbol, days=7)
            sentiment_scores = [analyze_sentiment(f"{a['title']} {a['description']}")[1] for a in news_articles]
            avg_sentiment = sum(sentiment_scores) / len(sentiment_scores) if sentiment_scores else 0
            
            if avg_sentiment < min_sentiment:
                continue
                
            full_data = process_single_stock(symbol, days_stock=30, days_news=7, exchange_rate=exchange_rate)
            if "error" in full_data:
                continue
                
            rec = full_data.get('recommendation', 'Hold')
            if require_buy and rec != 'Buy':
                continue
                
            results.append({
                "symbol": symbol,
                "latest_price": latest_price,
                "price_change": price_change,
                "avg_sentiment": avg_sentiment,
                "recommendation": rec,
                "ai_analysis": full_data.get('ai_analysis')
            })
            
        except Exception as e:
            print(f"Error screening {symbol}: {e}")
            continue
            
    return jsonify({"screened_stocks": results})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
