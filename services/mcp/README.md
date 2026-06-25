# CPG CFO Agent MCP Server

This service exposes the existing LangGraph CFO pipeline through the Model Context Protocol over stdio. It reuses the backend analysis code directly, so the MCP tools stay aligned with the FastAPI app and Groq-powered agent graph.

## Tools

- `analyze_transactions(csv_data)` - runs the full CFO brief pipeline.
- `categorize_spend(csv_data)` - returns only the categorization agent output.
- `get_runway_forecast(csv_data)` - returns only the runway forecast output.

## Claude Desktop configuration

Replace the path below with your local repo path and Python interpreter. The server speaks stdio, so Claude Desktop should launch it as a command-based MCP server.

```json
{
  "mcpServers": {
    "cpg-cfo-agent": {
      "command": "/Users/gaurangmohan/CFG CFO AGENT/.venv/bin/python",
      "args": ["/Users/gaurangmohan/CFG CFO AGENT/services/mcp/server.py"],
      "env": {
        "GROQ_API_KEY": "your_groq_api_key"
      }
    }
  }
}
```

## Docker

Build the container from the repository root:

```bash
docker build -f services/mcp/Dockerfile -t cpg-cfo-agent-mcp .
```

Then run it with your API key available in the environment:

```bash
docker run --rm -i -e GROQ_API_KEY="$GROQ_API_KEY" cpg-cfo-agent-mcp
```

## Notes

- The server keeps all implementation inside `services/mcp/`.
- `monthly_revenue` is inferred from the CSV so the MCP tools only need `csv_data`.
- If the CSV does not contain an explicit inflow or revenue column, the server falls back to a deterministic spend-based estimate.