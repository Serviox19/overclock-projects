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

**Leaving the virtual environment:** Run `deactivate` in the terminal. You don't need to if you're just closing the terminal. Deactivate when you're staying in the same shell and switching to another project (so you don't use the wrong Python or install into the wrong env).

## Running the Agents

```bash
python3 agent.py
python3 travel.py
python3 crypto.py   # needs OPENROUTER_API_KEY
```
