# AgenticAI

An AI-powered, multi-agent system for automated test generation from software requirements documents.

## Overview

AgenticAI uses a **LangGraph**-orchestrated pipeline of three specialised AI agents to automatically convert a Software Requirements Specification (SRS) PDF into executable **Playwright** test scripts — with a built-in self-healing loop that detects and fixes bad test code before it is written out.

A standalone **Greeting Agent** (built with Google ADK) is also included as a minimal example of a single-agent chatbot.

---

## Architecture

```
SRS PDF + Base URL
        │
        ▼
┌───────────────────┐
│  Agent A          │  RequirementExtractorAgent
│  (Extractor)      │  – Parses the PDF with Gemini
│                   │  – Outputs structured requirements (JSON)
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  Agent B          │  PlaywrightGeneratorAgent
│  (Generator)      │  – Inspects live page locators
│                   │  – Generates pytest-playwright test code
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  Agent C          │  CodeValidatorAgent
│  (Validator)      │  – Syntax check
│                   │  – Locator existence check (headless browser)
│                   │  – LLM semantic review
└────────┬──────────┘
         │
    ┌────┴─────┐
    │  PASS?   │
    └────┬─────┘
    No   │ Yes
    │    └──► Save test files
    └──► Back to Agent B (max 5 iterations)
```

### Graph workflow (`graph/workflow.py`)

The `build_graph` function wires the three agents into a `StateGraph`:

- **Entry point** → `agent_a`
- `agent_a` → `agent_b` → `agent_c`
- `agent_c` loops back to `agent_b` when `state["status"] == "FAIL"`, otherwise terminates.

---

## Project Structure

```
AgenticAI/
├── agents/
│   ├── agent_a_extractor_new.py   # Requirement extractor (Agent A)
│   ├── agent_b_extractor_new.py   # Playwright test generator (Agent B)
│   └── agent_c_extractor_new.py   # Code validator (Agent C)
├── graph/
│   └── workflow.py                # LangGraph StateGraph definition
├── Greeting_agent/
│   ├── agent.py                   # Google ADK greeting chatbot
│   └── requirements.txt           # Dependencies for the greeting agent
├── data/
│   └── srs.pdf                    # Sample SRS document
└── README.md
```

---

## Prerequisites

- Python 3.10+
- A **Google Gemini API key** (set as `GOOGLE_API_KEY` in `.env`)
- Playwright browsers installed

---

## Installation

### Test-generation pipeline

```bash
# 1. Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# 2. Install dependencies
pip install langgraph langchain-google-genai playwright python-dotenv

# 3. Install Playwright browsers
playwright install chromium

# 4. Create .env with your API key
echo "GOOGLE_API_KEY=your_key_here" > .env
```

### Greeting Agent

```bash
cd Greeting_agent
pip install -r requirements.txt
```

---

## Usage

### Running the multi-agent pipeline

```python
from graph.workflow import build_graph
from agents.agent_a_extractor_new import RequirementExtractorAgent
from agents.agent_b_extractor_new import PlaywrightGeneratorAgent
from agents.agent_c_extractor_new import CodeValidatorAgent

agent_a = RequirementExtractorAgent(model_name="gemini-2.0-flash", temperature=0.0)
agent_b = PlaywrightGeneratorAgent(model_name="gemini-2.0-flash", temperature=0.2)
agent_c = CodeValidatorAgent(model_name="gemini-2.0-flash", temperature=0.0)

app = build_graph(agent_a, agent_b, agent_c)

initial_state = {
    "pdf_path": "data/srs.pdf",
    "base_url": "https://your-app-url.com",
    "requirements": [],
    "generated_tests": [],
    "validation_reports": [],
    "messages": [],
    "iteration_count": 0,
    "previously_validated": {},
    "requirements_to_fix": [],
    "needs_regeneration": False,
}

final_state = app.invoke(initial_state)
```

### Running the Greeting Agent

```bash
cd Greeting_agent
adk run agent
```

---

## How It Works

1. **Agent A** reads the SRS PDF, uses Gemini to extract every testable functional requirement, and serialises each one with an ID, description, target URL, test scenario, expected behaviour, and priority.

2. **Agent B** inspects the live web page for each requirement to collect real element locators (IDs, labels, roles, placeholders), then prompts Gemini to write a `pytest-playwright` test function that uses only those locators.

3. **Agent C** validates every generated test through three layers:
   - **Syntax** – parses the code with Python's `ast` module.
   - **Locators** – launches a headless Chromium browser and checks that every referenced element actually exists on the page.
   - **Semantics** – sends the code back to Gemini for a human-style code review against the original requirement.

   If critical issues remain and the iteration limit (5) has not been reached, Agent C sends the failing requirements back to Agent B for regeneration.

---

## Configuration

| Environment variable | Description |
|---|---|
| `GOOGLE_API_KEY` | Gemini API key used by all LangChain agents |

Corporate proxy / Zscaler users should configure `config.GENAI_CLIENT_ARGS` (referenced in the agent files) with the appropriate SSL certificate settings.

---

## Dependencies

| Library | Purpose |
|---|---|
| `langgraph` | Multi-agent state-machine orchestration |
| `langchain-google-genai` | Gemini LLM integration |
| `playwright` | Headless browser for locator inspection and test execution |
| `google-adk` | Google Agent Development Kit (Greeting Agent) |
| `python-dotenv` | `.env` file support |

---

## License

This project is provided as-is for educational and research purposes.
