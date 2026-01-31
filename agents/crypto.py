import json
import os
from typing import Iterator
from dotenv import load_dotenv
from agno.agent import Agent
from agno.team import Team
from agno.models.openrouter import OpenRouter
from agno.models.xai import xAI
from agno.tools.duckduckgo import DuckDuckGoTools

# Load environment variables from .env file
load_dotenv()


def get_coingecko_market_data(symbols: str) -> str:
  """Fetch market data (price, market cap, 24h change) from CoinGecko. Pass comma-separated ticker symbols e.g. hype, btc, eth or HYPE, BTC, ETH (lowercased for API)."""
  try:
    import requests
  except ImportError:
    return "Error: requests not installed (pip install requests). Report to user: market data unavailable."
  symbol_list = [s.strip().lower() for s in symbols.split(",") if s.strip()]
  if not symbol_list:
    return "Error: No symbols provided. Use ticker symbols e.g. hype, btc, eth."
  base = "https://api.coingecko.com/api/v3"
  params = {"vs_currency": "usd", "symbols": ",".join(symbol_list[:20])}
  headers = {}
  api_key = os.getenv("COINGECKO_API_KEY")
  if api_key:
    headers["x-cg-demo-api-key"] = api_key
  try:
    r = requests.get(f"{base}/coins/markets", params=params, headers=headers or None, timeout=10)
    r.raise_for_status()
    data = r.json()
  except Exception as e:
    return f"Error: CoinGecko request failed ({e}). Report to user: unable to fetch market data (rate limit or service issue); try again later."
  if not data or not isinstance(data, list):
    return f"Error: No coin found on CoinGecko for '{symbols}'. Report to user: no market data for that symbol—check ticker at coingecko.com or try a different symbol."
  return json.dumps(data, indent=2)


def safe_search_for_sentiment(query: str, max_results: int = 10) -> str:
  """Search the web for crypto/X posts. Use simple queries like 'AVAX crypto twitter' or 'AVAX cryptocurrency'. Avoid site: or complex operators. Returns search results or a message if search failed (e.g. rate limit)."""
  try:
    from ddgs import DDGS  # pip install ddgs (was duckduckgo-search)
  except ImportError:
    return "Search not available."
  try:
    with DDGS() as ddgs:
      results = ddgs.text(query=query, max_results=max_results)
    return json.dumps(results, indent=2) if results else "No results found. Report: no recent news or developments."
  except Exception:
    return "No results (search failed or rate limited). Report: no recent news or developments."


def collect_crypto_details():
  """Collect crypto analysis details through multi-step questions"""
  crypto_details = {}

  # Question 1: Assets
  assets = input("Which crypto assets are you interested in? (e.g. BTC, ETH, SOL): ").strip()
  if not assets:
    return None
  crypto_details['assets'] = assets

  # Question 2: Timeframe
  timeframe = input("What timeframe? (e.g. daily, weekly, monthly): ").strip().lower()
  crypto_details['timeframe'] = timeframe or "daily"

  # Question 3: Goal
  goal = input("What's your goal? (hold, trade, research, learn): ").strip().lower()
  crypto_details['goal'] = goal

  return crypto_details


def build_agent_details(crypto_details, agent_name):
  """Get the details for a specific agent"""
  assets = crypto_details['assets']
  timeframe = crypto_details['timeframe']
  goal = crypto_details['goal']

  if agent_name == "market_agent":
    details = f"""I'm analyzing {assets} with a {timeframe} view. Goal: {goal}.

    Please help with:
    - Price context and recent moves
    - Key levels or support/resistance if relevant
    - Summary suited to my goal"""

    return details

  elif agent_name == "news_agent":
    return f"Find recent news and sentiment for {assets}. Timeframe: {timeframe}."

  elif agent_name == "technical_agent":
    return f"Technical analysis for {assets} on {timeframe} timeframe. Goal: {goal}."

  elif agent_name == "sentiment_agent":
    return f"""Collect sentiment from X (Twitter) for: {assets}.

Search convention: On X, people refer to coins with the $ prefix (e.g. $AVAX for AVAX) or sometimes the ticker alone (AVAX). When searching, use both: $TICKER and TICKER for each asset ({assets}).
Rules:
- Only use posts that explicitly mention the crypto ticker(s) (with $ or without).
- Ignore any post that contains more than 2 hashtags; treat multiple hashtags as spam.
- Look across many X posts to summarize overall sentiment (bullish, bearish, neutral, fearful, greedy).
- If you find very few relevant posts or almost no recent chatter, respond clearly: "No recent news or developments" or "Little to no recent chatter on X for {assets}."
- Do not invent posts. If there is not much data, say so.
- In your response, do not mention that you are ignoring posts with many hashtags or describe your filtering method; only report the sentiment summary."""

  return None


market_agent = Agent(
  name="Market agent",
  tools=[get_coingecko_market_data],
  role="Provide market context and price summary for given crypto assets",
  instructions=[
    "FIRST: get context with build_agent_details(crypto_details, 'market_agent'). Extract the asset ticker(s) the user asked for (e.g. HYPE, BTC, ETH, SOL).",
    "Call get_coingecko_market_data with comma-separated ticker symbols, e.g. get_coingecko_market_data('hype') or get_coingecko_market_data('btc,eth,sol'). Pass the ticker as the user gave it (the tool lowercases for the API). Use the returned price, market cap, and 24h change to give a market overview and recommendations.",
    "If the tool returns an Error: message (e.g. CoinGecko request failed, rate limit, no data), tell the user clearly that market data could not be fetched and suggest trying again later.",
  ],
  markdown=True,
)

news_agent = Agent(
  name="News agent",
  tools=[DuckDuckGoTools()],
  role="Find news and sentiment for crypto assets",
  instructions=[
    "Use build_agent_details(crypto_details, 'news_agent') to get the query.",
    "Summarize relevant news and sentiment for the given assets and focus.",
  ],
  model=OpenRouter(id="openai/gpt-4o"),
  markdown=True,
)

technical_agent = Agent(
  name="Technical agent",
  role="Provide technical analysis for crypto assets",
  model=OpenRouter(id="openai/gpt-4o"),
  instructions=[
    "Use build_agent_details(crypto_details, 'technical_agent') for the analysis request.",
    "Give technical analysis (levels, indicators, structure) for the given timeframe and goal.",
  ],
  markdown=True,
)

sentiment_agent = Agent(
  name="X sentiment agent",
  role="Collect and summarize sentiment from X (Twitter) posts that mention the given crypto ticker(s)",
  tools=[safe_search_for_sentiment],
  model=xAI(id="grok-3"),
  instructions=[
    "FIRST: get your task with build_agent_details(crypto_details, 'sentiment_agent').",
    "Use the safe_search_for_sentiment tool with simple queries: e.g. 'AVAX crypto twitter', 'AVAX cryptocurrency', or '$AVAX crypto'. Avoid site: or long operators; simple queries work better.",
    "Only consider posts that explicitly mention the ticker ($ or plain). Ignore posts with more than 2 hashtags (treat as spam); do not mention this filtering in your response.",
    "If the tool returns 'No results' or 'search failed', respond with: no recent news or developments / little to no recent chatter. Otherwise summarize sentiment: overall tone (bullish/bearish/neutral), fear/greed, key themes. Do not invent or exaggerate.",
  ],
  markdown=True,
)

team = Team(
  members=[market_agent, news_agent, technical_agent, sentiment_agent],
  model=OpenRouter(id="openai/gpt-4o"),
  instructions=[
    "You are a team of agents providing crypto analysis for the given assets.",
    "Use build_agent_details to get specific details for each agent.",
    "Coordinate market, news, technical, and X sentiment agents to produce a coherent analysis.",
  ],
  markdown=True,
  show_members_responses=True,
)


def main():
  print("Welcome to the Crypto Analysis Assistant!")
  print("Type 'exit', 'quit', or 'q' at any prompt to stop.\n")

  while True:
    try:
      print("Let's set up your analysis. Please answer a few questions:\n")
      crypto_details = collect_crypto_details()

      if not crypto_details:
        print("No details provided. Please try again.\n")
        continue

      print("\n" + "="*50)
      print("Analysis Summary:")
      print(f"Assets: {crypto_details['assets']}")
      print(f"Timeframe: {crypto_details['timeframe']}")
      print(f"Goal: {crypto_details['goal']}")
      print("="*50 + "\n")

      query = f"""Run a full crypto analysis with:
      - Assets: {crypto_details['assets']}
      - Timeframe: {crypto_details['timeframe']}
      - Goal: {crypto_details['goal']}

      Coordinate all agents to provide market context, news, X sentiment (from posts mentioning the ticker; ignore multi-hashtag spam), and technical analysis."""

      print("Running analysis...\n")

      team.print_response(query, stream=True)

      print("\n" + "="*50 + "\n")

      another = input("Run another analysis? (yes/no): ").strip().lower()
      if another not in ['yes', 'y']:
        print("Goodbye!")
        break

    except KeyboardInterrupt:
      print("\n\nGoodbye!")
      break
    except EOFError:
      print("\n\nGoodbye!")
      break


if __name__ == "__main__":
  main()
