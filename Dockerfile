# Use the most recent Node.js image
FROM node:latest

# Set working directory
WORKDIR /app

# Copy package.json and yarn.lock, and install dependencies
COPY package.json yarn.lock ./
RUN yarn install

# Copy the src and supabase folders into the container
COPY src/ src/
COPY supabase/ supabase/

# Expose the port the app runs on
EXPOSE 3001

# Run the app
CMD ["yarn", "start"]