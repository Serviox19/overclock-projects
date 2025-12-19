# Agent Setup

## Python Environment Setup

1. Create virtual environment:
```bash
python3 -m venv .venv
```

2. Activate virtual environment:
```bash
source .venv/bin/activate
```

3. Set API keys:
```bash
export OPENAI_API_KEY=xxx
# or
export XAI_API_KEY=xxx
```

4. Install dependencies:
```bash
pip install -U agno openai duckduckgo-search
```

Or install from requirements file:
```bash
pip install -r requirements-agentos.txt
```

## Running the Agents

```bash
python3 agent.py
python3 travel.py
```
