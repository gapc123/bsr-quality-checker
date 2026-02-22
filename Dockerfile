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

# Copy package files
COPY package*.json ./
COPY packages/frontend/package*.json ./packages/frontend/
COPY packages/backend/package*.json ./packages/backend/

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Generate Prisma client
RUN cd packages/backend && npx prisma generate

# Build frontend
RUN npm run build --workspace=packages/frontend

# Build backend
RUN npm run build --workspace=packages/backend

# Start command
CMD ["node", "packages/backend/dist/index.js"]
