FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV DATABASE_URL=sqlite:////data/accounting.db

RUN mkdir -p /data

# Render ke liye correct port
EXPOSE 10000

# ✅ IMPORTANT (dynamic port use karega)
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-10000}"]
