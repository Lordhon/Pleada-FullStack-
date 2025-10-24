FROM python:3.13-slim


RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    gcc \
    python3-dev \
    netcat-openbsd \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

COPY wait-for-db.sh .
RUN chmod +x wait-for-db.sh

EXPOSE 8000

CMD ["./wait-for-db.sh"]
