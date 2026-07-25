FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
# Honor Railway's injected PORT; fall back to 8000 for local/compose use.
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
