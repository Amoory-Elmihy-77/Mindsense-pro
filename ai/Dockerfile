FROM python:3.10.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# System packages needed by Torch/Torchaudio/Pillow and common model runtimes
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsndfile1 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency manifest first for better layer caching
COPY dependencies.txt .

RUN pip install --upgrade pip && \
    pip install -r dependencies.txt && \
    pip install python-multipart

# Copy application source
COPY . .

EXPOSE 8000

# FastAPI app entrypoint
CMD ["uvicorn", "ai_server:app", "--host", "0.0.0.0", "--port", "8000"]
