# Stage 1: Build Stage
FROM ubuntu:22.04 AS builder

# Prevent tzdata from asking for user input
ENV DEBIAN_FRONTEND=noninteractive

# Add build arguments
ARG BUILD_DATE
ARG GIT_SHA

# Add labels that will change with each build
LABEL org.opencontainers.image.created="${BUILD_DATE}"
LABEL org.opencontainers.image.revision="${GIT_SHA}"
LABEL org.opencontainers.image.version="${BUILD_DATE}"

# Install Node.js and yarn in a single RUN to reduce layers
RUN apt-get update && apt-get install -y \
    curl \
    git \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g yarn \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /var/cache/apt/*

WORKDIR /app

# Install dependencies first (better caching)
COPY package.json ./
RUN yarn install

# Copy source and build
COPY . .
RUN yarn build

# Stage 2: Production Stage
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# Install Node.js and yarn in a single RUN
RUN apt-get update && apt-get install -y \
    curl \
    git \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g yarn \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /var/cache/apt/*

WORKDIR /app

# Copy only production dependencies
COPY package.json ./
RUN yarn install --production

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/src ./src

# Create a non-root user for security
RUN useradd -m -s /bin/bash nodeuser \
    && chown -R nodeuser:nodeuser /app

EXPOSE 1338
EXPOSE 3001

# Switch to non-root user
USER nodeuser

CMD ["yarn", "start"]
