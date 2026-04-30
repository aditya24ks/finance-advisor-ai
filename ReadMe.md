# Stock Sentiment Analysis Dashboard

A comprehensive stock analysis application that combines real-time market data, news sentiment analysis, and AI-powered insights to provide meaningful stock recommendations.

## Features

- **Real-time Stock Data**: Fetch live stock prices and historical data using Polygon API
- **News Sentiment Analysis**: Analyze recent news articles using TextBlob for sentiment scoring
- **AI-Powered Insights**: Get intelligent analysis and recommendations using Groq AI
- **Interactive Visualizations**: Candlestick charts, sentiment distribution, and key metrics
- **User-friendly Interface**: Clean Streamlit dashboard with configurable parameters

## APIs Used

1. **Polygon API**: Real-time and historical stock market data
2. **News API**: Recent news articles related to stocks
3. **Groq API**: AI-powered analysis and recommendations

## Setup Instructions

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Get API Keys

#### Polygon API (Stock Data)
- Visit [polygon.io](https://polygon.io/)
- Sign up for a free account
- Get your API key from the dashboard

#### News API (News Articles)
- Visit [newsapi.org](https://newsapi.org/)
- Sign up for a free account
- Get your API key

#### Groq API (AI Analysis)
- Visit [console.groq.com](https://console.groq.com/)
- Sign up for an account
- Get your API key

### 3. Configure Environment Variables
- Copy the `.env` file to your project directory
- Replace the placeholder values with your actual API keys:

```env
POLYGON_API_KEY=your_actual_polygon_api_key
NEWS_API_KEY=your_actual_news_api_key
GROQ_API_KEY=your_actual_groq_api_key
```

### 4. Run the Application
```bash
streamlit run app.py
```

## How It Works

1. **Data Collection**: The app fetches stock data from Polygon API and news articles from News API
2. **Sentiment Analysis**: News articles are analyzed using TextBlob to determine sentiment (Positive/Negative/Neutral)
3. **AI Analysis**: Combined data is sent to Groq AI for intelligent insights and recommendations
4. **Visualization**: Results are displayed in an interactive dashboard with charts and metrics

## Supported Stocks

The app works with any valid stock ticker symbol. Some popular examples:
- AAPL (Apple)
- GOOGL (Google/Alphabet)
- MSFT (Microsoft)
- TSLA (Tesla)
- AMZN (Amazon)
- META (Meta/Facebook)
- NVDA (NVIDIA)

## Key Features Explained

### Stock Data Analysis
- Candlestick charts showing price movements
- Key metrics: current price, price change, volume, highs/lows
- Configurable time ranges (7-90 days)

### News Sentiment Analysis
- Sentiment distribution pie chart
- Individual article sentiment scores
- Recent news articles with sentiment indicators

### AI-Powered Insights
- Market outlook based on combined data
- Risk and opportunity analysis
- Buy/Hold/Sell recommendations with reasoning

## Use Cases

- **Individual Investors**: Get comprehensive stock analysis before making investment decisions
- **Financial Analysts**: Combine technical and sentiment analysis for better insights
- **Researchers**: Study correlation between news sentiment and stock performance
- **Educational**: Learn how different data sources can be combined for financial analysis

## Limitations

- Free API tiers have rate limits
- News API free tier limits historical data to 1 month
- Polygon free tier has limited features
- AI analysis is based on available data and should not be the sole basis for investment decisions

## Disclaimer

This tool is for educational and informational purposes only. It should not be considered as financial advice. Always consult with qualified financial advisors before making investment decisions.