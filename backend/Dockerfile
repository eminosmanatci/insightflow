FROM python:3.11-slim

WORKDIR /backend

# Sistem bağımlılıklarının kurulması (psycopg2 derlemesi gerekirse diye)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Bağımlılıkların kopyalanması ve yüklenmesi
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Proje dosyalarının kopyalanması
COPY . .

EXPOSE 8000