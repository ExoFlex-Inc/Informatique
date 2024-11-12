# Stage 1: Build Stage
FROM ubuntu:22.04 AS builder

# Install Node.js and yarn
RUN apt-get update && apt-get install -y \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y \
    nodejs \
    && npm install -g yarn

WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install
COPY . .
RUN yarn build

# Stage 2: Production Stage
FROM ubuntu:22.04

# Install Node.js and required packages
RUN apt-get update && apt-get install -y \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y \
    nodejs \
    && npm install -g yarn

# Create non-root user and group
RUN groupadd -r serialgroup && \
    useradd -r -g serialgroup serialuser

# Add user to required groups
RUN usermod -a -G dialout serialuser && \
    usermod -a -G tty serialuser

WORKDIR /app

# Copy files
COPY package.json yarn.lock ./
RUN yarn install
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/src ./src

EXPOSE 1338
EXPOSE 3001

USER serialuser
CMD ["yarn", "start"]