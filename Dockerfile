# Stage 1: Build Stage
FROM node:18 AS builder

# Set working directory
WORKDIR /app

# Copy package.json and yarn.lock to install dependencies
COPY package.json yarn.lock ./

# Install all dependencies
RUN yarn install --verbose

# Copy all application files
COPY . .

# Build the application
RUN yarn build

# Stage 2: Production Stage
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Set NODE_ENV to production for optimized runtime performance
ENV NODE_ENV=production

# Copy only the necessary files from the builder stage
COPY --from=builder /app/package.json ./
COPY --from=builder /app/yarn.lock ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public/* ./dist/

# Expose the port(s) the application will run on
EXPOSE 1338
EXPOSE 3001

# Start the server
CMD ["yarn", "start"]