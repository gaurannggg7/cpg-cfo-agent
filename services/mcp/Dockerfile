FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

COPY services/mcp/requirements.txt /tmp/services-mcp-requirements.txt
RUN pip install --no-cache-dir -r /tmp/services-mcp-requirements.txt

COPY backend/agent.py /app/backend/agent.py
COPY services/mcp /app/services/mcp

WORKDIR /app/services/mcp

CMD ["python", "server.py"]