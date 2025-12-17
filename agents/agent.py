from typing import Iterator
from agno.agent import Agent
from agno.team import Team
from agno.models.xai import xAI
from agno.tools.duckduckgo import DuckDuckGoTools

weather_agent = Agent(
  name="Weather agent",
  tools=[DuckDuckGoTools()],
  role="Get the weather of a certain City",
  instructions=["Use the DuckDuckGoTools to search the web for the weather in a given city."],
  markdown=True,
)

live_search_agent = Agent(
  name="Live search agent",
  role="Live search for a given question",
  model=xAI(id="grok-3",
    search_parameters={
      "mode": "on",
      "max_search_results": 20,
      "return_citations": False,
    },
  ),
  markdown=True,
)

team = Team(
  members=[weather_agent, live_search_agent],
  model=xAI(id="grok-3"),
  instructions=["You are a team of agents that are tasked with things like finding the weather of a given city or a live search question."],
  markdown=True,
  show_members_responses=True,
)

def main():
  print("Welcome! Ask questions about weather, or anything else you want to know.")
  print("Type 'exit', 'quit', or 'q' to stop.\n")

  while True:
    try:
      user_query = input("Your question: ").strip()

      if user_query.lower() in ['exit', 'quit', 'q']:
        print("Goodbye!")
        break

      if not user_query:
        print("Please enter a question.\n")
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