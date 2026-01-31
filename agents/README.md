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
export XAI_API_KEY=xxx
export OPENROUTER_API_KEY=xxx   # required for crypto.py (get key at https://openrouter.ai/settings/keys)
export COINGECKO_API_KEY=xxx   # optional for crypto.py market data (header: x-cg-demo-api-key; https://www.coingecko.com/en/api)
```

4. Install dependencies:
```bash
pip install -U agno openai ddgs python-dotenv requests
```

Or install from requirements file:
```bash
pip install -r requirements-agentos.txt
```

## Running the Agents

```bash
python3 agent.py
python3 travel.py
python3 crypto.py   # needs OPENROUTER_API_KEY and XAI_API_KEY
```
