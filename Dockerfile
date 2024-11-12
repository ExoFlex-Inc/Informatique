# Stage 1: Build Stage
FROM node:18 AS builder

WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install
COPY . .
RUN yarn build

# Stage 2: Production Stage
FROM node:18

# Create non-root user and group
RUN groupadd -r serialgroup && \
    useradd -r -g serialgroup serialuser

RUN usermod -a -G dialout serialuser && \
    usermod -a -G tty serialuser

WORKDIR /app

# Copy package.json and yarn.lock
COPY package.json yarn.lock ./
RUN yarn install

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/src/server.ts ./src/server.ts
COPY --from=builder /app/src ./src

EXPOSE 1338
EXPOSE 3001

# Switch to non-root user
USER serialuser

CMD ["yarn", "start"]