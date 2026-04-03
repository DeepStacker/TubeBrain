FROM python:3.12-slim

WORKDIR /app

# System dependencies for video/audio processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    tesseract-ocr \
    libtesseract-dev \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp binary for YouTube downloads
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

# Copy and install Python dependencies
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Install supervisord for running multiple processes
RUN pip install --no-cache-dir supervisor

# Copy backend application code
COPY backend/ .

# Copy startup script and supervisor config
COPY scripts/start.sh /start.sh
COPY scripts/supervisord.conf /etc/supervisord.conf
RUN chmod +x /start.sh

EXPOSE 8000

# Default command - can be overridden
CMD ["/start.sh"]
