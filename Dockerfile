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

WORKDIR /app

# Copy package files first
COPY package*.json ./
COPY packages/frontend/package*.json ./packages/frontend/
COPY packages/backend/package*.json ./packages/backend/

# Install ALL dependencies (including devDependencies for build)
RUN npm install --legacy-peer-deps

# Copy all source code
COPY . .

# Generate Prisma client
WORKDIR /app/packages/backend
RUN npx prisma@5.22.0 generate

# Build frontend - accept Clerk key as build argument
WORKDIR /app
ARG VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY
RUN npm run build --workspace=packages/frontend

# Build backend
RUN npm run build --workspace=packages/backend

# Run database migrations
WORKDIR /app/packages/backend
RUN echo "📊 Running database migrations..." && \
    npx prisma migrate deploy && \
    echo "✅ Database migrations complete"

# Set production mode for runtime
WORKDIR /app
ENV NODE_ENV=production

# Expose the port Railway will use
EXPOSE 3001

# Start command
CMD ["node", "packages/backend/dist/index.js"]
