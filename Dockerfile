FROM node:20-slim

# Install Chromium and dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    python3 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV NODE_ENV=production

WORKDIR /app

# Copy package files first
COPY package*.json ./
COPY packages/frontend/package*.json ./packages/frontend/
COPY packages/backend/package*.json ./packages/backend/

# Install dependencies with legacy peer deps
RUN npm install --legacy-peer-deps

# Copy all source code
COPY . .

# Generate Prisma client using local installation
WORKDIR /app/packages/backend
RUN npx prisma@5.22.0 generate

# Build frontend
WORKDIR /app
RUN npm run build --workspace=packages/frontend

# Build backend
RUN npm run build --workspace=packages/backend

# Start command
CMD ["node", "packages/backend/dist/index.js"]
