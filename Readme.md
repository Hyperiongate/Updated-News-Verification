# Facts & Fakes v2

AI-powered news fact-checking platform with two-layer analysis.

## What It Does

Paste a news article URL or text. Get back:

- **Trust Score** — single 0–100 credibility score
- **Layer 1: Article Accuracy** — did the journalist accurately report what happened or was said?
- **Layer 2: Claim Truth** — are the underlying claims in the article actually true?
- **Bias & Manipulation** — political leaning, loaded language, manipulation techniques
- **Source & Author Credibility** — publication reputation and author credentials

The two-layer system is the differentiator. Most fact-checkers only ask "is this article true?" — we separate *how it's reported* from *whether the claims are true*.

## Tech Stack

- **Backend**: Python 3.11, Flask, Gunicorn
- **Frontend**: Jinja2 templates, vanilla JS, CSS (dark mode)
- **Database**: PostgreSQL (Render managed)
- **AI Orchestrator**: Anthropic Claude
- **AI Specialists**: OpenAI GPT-4o-mini, DeepSeek, Cohere, Google Gemini
- **Scraping**: BeautifulSoup, ScrapingBee
- **PDF**: ReportLab
- **Hosting**: Render (single service)

## Repository Structure

```
factsandfakes-v2/
├── app.py                    # Flask app, all routes
├── config.py                 # Environment variable config
├── multi_ai_service.py       # Multi-AI consensus engine
├── requirements.txt
├── Dockerfile
├── gunicorn.conf.py
│
├── agents/
│   ├── orchestrator.py       # Claude orchestrates the analysis
│   ├── article_agent.py      # Extracts article content
│   ├── factcheck_agent.py    # Two-layer fact-checking
│   ├── bias_agent.py         # Bias + manipulation detection
│   ├── credibility_agent.py  # Source + author credibility
│   └── synthesizer.py        # Combines all outputs → final report
│
├── connectors/
│   ├── scraper.py            # Article extraction (BS4 + ScrapingBee)
│   ├── swarm_connector.py    # Read-only AI Swarm connection
│   └── youtube.py            # YouTube transcripts (future)
│
├── templates/                # Jinja2 HTML templates
├── static/                   # CSS, JS, images
└── utils/                    # PDF generation, helpers
```

## Environment Variables

Set these in your Render dashboard (never in code):

```
ANTHROPIC_API_KEY
OPENAI_API_KEY
DEEPSEEK_API_KEY
COHERE_API_KEY
GOOGLE_API_KEY
GOOGLE_FACT_CHECK_API_KEY
SCRAPINGBEE_API_KEY
DATABASE_URL          (Render provides this automatically)
SECRET_KEY            (generate a random string)
SWARM_BASE_URL        (https://ai-swarm-orchestrator.onrender.com)
SWARM_ENABLED         (true)
```

## Deployment

This project deploys automatically to Render on every push to `main`.

1. Push to GitHub
2. Render detects the `Dockerfile` and builds automatically
3. Health check available at `/health`

## Development Status

Currently in active development. Phase build order:

- [x] Phase 1 — Foundation (Flask app, frontend, stub API)
- [ ] Phase 2 — Article Extraction
- [ ] Phase 3 — Two-Layer Fact-Checker
- [ ] Phase 4 — Supporting Agents
- [ ] Phase 5 — Orchestrator & Synthesizer
- [ ] Phase 6 — Full Frontend Results
- [ ] Phase 7 — Swarm Connection
- [ ] Phase 8 — PDF & Polish

## Local Development

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy and fill in environment variables
cp .env.example .env

# Run
flask run
```

---

*Facts & Fakes — Know if the reporting is accurate. Know if the claims are true.*
