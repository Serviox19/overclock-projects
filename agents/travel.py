from typing import Iterator
from agno.agent import Agent
from agno.team import Team
from agno.models.xai import xAI
from agno.tools.duckduckgo import DuckDuckGoTools

weather_agent = Agent(
  name="Weather agent",
  tools=[DuckDuckGoTools()],
  role="Get the weather of a certain City",
  instructions=[
    "FIRST: use the build_agent_query function to build a query for the weather agent, and use it to get the weather recommendations. build_agent_query(trip_details, 'weather_agent')",
    "SECOND: use the function response to get the weather recommendations",
  ],
  markdown=True,
)

travel_agent = Agent(
  name="Travel agent",
  role="Plan a trip to a given destination",
  instructions=[
    "FIRST: use the build_agent_query function to build a query for the travel agent, and use it to get the travel recommendations. build_agent_query(trip_details, 'travel_agent')",
    "SECOND: use the function response to get the travel recommendations, and use it to plan a trip to the destination.",
  ],
  model=xAI(id="grok-3"),
  markdown=True,
)

events_agent = Agent(
  name="Events agent",
  role="Find events in a given destination",
  model=xAI(id="grok-3"),
  instructions=[
    "FIRST: use the build_agent_query function to build a query for the events agent, and use it to get the events recommendations. build_agent_query(trip_details, 'events_agent')",
    "SECOND: use the function response to get the events recommendations",
  ],
  markdown=True,
)

team = Team(
  members=[weather_agent, travel_agent, events_agent],
  model=xAI(id="grok-3"),
  instructions=["You are a team of agents that are tasked with planning a trip to a given destination."],
  markdown=True,
  show_members_responses=True,
)

def collect_trip_details():
  """Collect trip details through multi-step questions"""
  trip_details = {}

  # Question 1: Destination
  destination = input("Where are we traveling to? ").strip()
  if not destination:
    return None
  trip_details['destination'] = destination

  # Question 2: Transportation mode
  transport_mode = input("Are we flying or driving? ").strip().lower()
  trip_details['transport_mode'] = transport_mode

  # Question 3: If flying, ask departure city
  if 'fly' in transport_mode:
    departure_city = input("Where are we flying from? ").strip()
    trip_details['departure_city'] = departure_city

  # Question 4: Duration
  days = input("How many days? ").strip()
  trip_details['days'] = days

  # Question 5: Activities/Description
  description = input("Brief description of what you want to do: ").strip()
  trip_details['description'] = description

  return trip_details


def build_agent_query(trip_details, agent_name):
  """Build a comprehensive query for a specific agent using collected details"""
  destination = trip_details['destination']
  transport_mode = trip_details['transport_mode']
  days = trip_details['days']
  description = trip_details['description']

  if agent_name == "travel_agent":
    query = f"""I'm planning a trip to {destination} for {days} days.
Transportation: {transport_mode}"""

    if 'departure_city' in trip_details:
      query += f" from {trip_details['departure_city']}"

    query += f"""

Activities I'm interested in: {description}

Please help me plan this trip including:
- Best time to travel
- Estimated flight costs (if applicable)
- Recommended return dates
- Any travel tips specific to my interests"""

    return query

  elif agent_name == "weather_agent":
    return f"What's the weather like in {destination} and what's the best time to visit for {description}?"

  elif agent_name == "events_agent":
    return f"Find events in {destination} related to: {description}. I'll be there for {days} days."

  return None


def main():
  print("Welcome to the Travel Planning Assistant!")
  print("Type 'exit', 'quit', or 'q' at any prompt to stop.\n")

  while True:
    try:
      # Collect all trip details
      print("Let's plan your trip! Please answer a few questions:\n")
      trip_details = collect_trip_details()

      if not trip_details:
        print("No details provided. Please try again.\n")
        continue

      print("\n" + "="*50)
      print("Trip Summary:")
      print(f"Destination: {trip_details['destination']}")
      print(f"Transport: {trip_details['transport_mode']}")
      if 'departure_city' in trip_details:
        print(f"Departing from: {trip_details['departure_city']}")
      print(f"Duration: {trip_details['days']} days")
      print(f"Activities: {trip_details['description']}")
      print("="*50 + "\n")

      # Example: Use with travel_agent
      travel_query = build_agent_query(trip_details, "travel_agent")
      print("Getting travel recommendations...\n")
      travel_agent.print_response(travel_query, stream=True)
      print("\n")

      # Ask if they want to plan another trip
      another = input("\nPlan another trip? (yes/no): ").strip().lower()
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