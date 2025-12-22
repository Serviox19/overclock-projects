from typing import Iterator
from dotenv import load_dotenv
from agno.agent import Agent
from agno.team import Team
from agno.models.xai import xAI
from agno.tools.firecrawl import FirecrawlTools

load_dotenv()

get_ticker_agent = Agent(
  name="Get ticker agent",
  role="Get the ticker of a given company",
  model=xAI(id="grok-3"),
  instructions=["Based on user input, get the ticker of the company. We will need the ticker of the company to get the basic financial information. We will be passing the ticker to the financial info agent."],
  markdown=True,
)

financial_info_agent = Agent(
  name="Financial info agent",
  role="Get the basic financial information of a given company",
  tools=[FirecrawlTools(enable_scrape=False, enable_crawl=True)],
  instructions=[
    "FIRST: use user input to get the company name and use the FirecrawlTools to get the basic financial information of the company. Go to finance.yahoo.com/quote/{{company_ticker}}/key-statistics to get the basic financial information of the company.",
    "SECOND: use the function response to get the basic financial information of the company. And pass it to the analyst agent to analyze the financial information of the company."
  ],
  markdown=True,
)

news_agent = Agent(
  name="News agent",
  role="Get the news about a given company",
  model=xAI(id="grok-3"),
  instructions=["gather the news about a given company, keep it short and to the point. Only gather the latest news that seems relevant to the company."],
  markdown=True,
)

analysis_agent = Agent(
  name="Analysis agent",
  role="Analyze the financial information of a given company",
  model=xAI(id="grok-3"),
  instructions=["Analyze the financial information from the financial_info_agent. Also analyze the news from the news_agent. Do not make any assumptions, only use the information provided to you, analyze the financial information of the company and make a conclusion based on the information provided."],
  markdown=True,
)

team = Team(
  members=[get_ticker_agent, financial_info_agent, news_agent, analysis_agent],
  model=xAI(id="grok-3"),
  instructions=["You are a team of agents that are tasked with getting the stocks of a given company. You will be passing the company name to the get_ticker_agent to get the ticker of the company. You will be passing the ticker to the financial_info_agent to get the basic financial information of the company. You will be passing the company name to the news_agent to get the news about the company. You will be passing all the information to the analysis_agent to analyze the financial information of the company."],
  markdown=True,
  show_members_responses=True,
)

def main():
  print("Welcome to the Stocks Assistant!")
  print("Type 'exit', 'quit', or 'q' to stop.\n")

  while True:
    try:
      user_query = input("Enter the company name you want to analyze: ").strip()

      if user_query.lower() in ['exit', 'quit', 'q']:
        print("Goodbye!")
        break

      if not user_query:
        print("Please enter a company name.\n")
        continue

      print()  # Add spacing
      team.print_response(user_query, stream=True)
      print("\n")  # Add spacing after response

    except KeyboardInterrupt:
      print("\n\nGoodbye!")
      break
    except EOFError:
      print("\n\nGoodbye!")
      break

if __name__ == "__main__":
  main()
