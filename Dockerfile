# Stage 1: Build Stage
FROM node:18 AS builder

# Set working directory
WORKDIR /app

# Copy package.json and yarn.lock for dependency installation
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install

# Copy all application files
COPY . .

# Build the application
RUN yarn build

# Stage 2: Production Stage
FROM node:18

WORKDIR /app

# Copy package.json and yarn.lock
COPY package.json yarn.lock ./

# Install all dependencies (since we need both frontend and backend deps)
RUN yarn install

# Copy the built files from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/src/server.ts ./src/server.ts
COPY --from=builder /app/src ./src

EXPOSE 1338
EXPOSE 3001

# Start both servers
CMD ["yarn", "start"]