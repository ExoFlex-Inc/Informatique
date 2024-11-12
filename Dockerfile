# # Stage 1: Build Stage
# FROM ubuntu:22.04 AS builder

# # Install Node.js and yarn
# RUN apt-get update && apt-get install -y \
#     curl \
#     && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
#     && apt-get install -y \
#     nodejs \
#     && npm install -g yarn

# WORKDIR /app
# COPY package.json yarn.lock ./
# RUN yarn install
# COPY . .
# RUN yarn build

# # Stage 2: Production Stage
# FROM ubuntu:22.04

# # Install Node.js and required packages
# RUN apt-get update && apt-get install -y \
#     curl \
#     udev \
#     dialout \
#     && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
#     && apt-get install -y \
#     nodejs \
#     && npm install -g yarn

# # Create non-root user and group with specific IDs
# RUN groupadd -r -g 1000 serialgroup && \
#     useradd -r -u 1000 -g serialgroup serialuser

# # Add user to required groups
# RUN usermod -a -G dialout serialuser && \
#     usermod -a -G tty serialuser && \
#     usermod -a -G plugdev serialuser

# # Create udev rules directory
# RUN mkdir -p /etc/udev/rules.d

# # Add udev rule for serial device
# RUN echo 'KERNEL=="ttyACM[0-9]*", MODE="0666", GROUP="dialout"' > /etc/udev/rules.d/99-serial.rules

# WORKDIR /app

# # Copy files
# COPY package.json yarn.lock ./
# RUN yarn install
# COPY --from=builder /app/dist ./dist
# COPY --from=builder /app/public ./public
# COPY --from=builder /app/src ./src

# # Set proper permissions
# RUN chown -R serialuser:serialgroup /app

# EXPOSE 1338
# EXPOSE 3001

# USER serialuser
# CMD ["yarn", "start"]

# Stage 1: Test Stage
FROM ubuntu:22.04

# Install Node.js and required packages
RUN apt-get update && apt-get install -y \
    curl \
    udev \
    setserial \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y \
    nodejs \
    && npm install -g yarn

# Create non-root user and group
RUN groupadd -r -g 1000 serialgroup && \
    useradd -r -u 1000 -g serialgroup serialuser

# Add user to required groups
RUN usermod -a -G dialout serialuser && \
    usermod -a -G tty serialuser && \
    usermod -a -G plugdev serialuser

WORKDIR /app

# Copy only test-related files
COPY package.json yarn.lock ./
COPY test/serial.test.js ./test/

# Install only test dependencies
RUN yarn install --production=false

# Add udev rule for serial device
RUN mkdir -p /etc/udev/rules.d && \
    echo 'KERNEL=="ttyACM[0-9]*", MODE="0666", GROUP="dialout"' > /etc/udev/rules.d/99-serial.rules

# Set permissions
RUN chown -R serialuser:serialgroup /app

USER serialuser

# Run only serial tests
CMD ["yarn", "test:serial"]