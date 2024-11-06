#!/bin/bash

# Load the .env file
set -o allexport
source .env || { echo "Failed to load .env"; exit 1; }
set +o allexport

# Check if ROBOT is set to "false"
if [ "$ROBOT" == "false" ]; then
    echo "ROBOT is false, starting socat..."
    socat -d -d pty,raw,echo=0,link=/tmp/ttys020 pty,raw,echo=0,link=/tmp/ttys021 &
    socat_pid=$!

    # Wait for socat to start and check if it's running
    wait $socat_pid
    if [ $? -eq 0 ]; then
        echo "Socat successfully started."
    else
        echo "Socat failed to start."
    fi
else
    echo "ROBOT is not false, socat will not run."
fi