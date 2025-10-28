#!/bin/bash

# QuickStore Backend - Systemd Service Installation
# This script installs and enables the systemd service for automatic startup

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}QuickStore Backend Service Installation${NC}"
echo -e "${BLUE}========================================${NC}"

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SERVICE_FILE="$SCRIPT_DIR/quickstore-backend.service"

# Check if service file exists
if [ ! -f "$SERVICE_FILE" ]; then
    echo -e "${RED}Error: Service file not found at $SERVICE_FILE${NC}"
    exit 1
fi

# Create systemd user directory if it doesn't exist
SYSTEMD_USER_DIR="$HOME/.config/systemd/user"
mkdir -p "$SYSTEMD_USER_DIR"

# Stop the existing container if it's running
echo -e "\n${BLUE}Stopping existing container...${NC}"
if podman ps --filter name=quickstore-backend --format "{{.Names}}" | grep -q "^quickstore-backend$"; then
    podman stop quickstore-backend 2>/dev/null || true
    podman rm quickstore-backend 2>/dev/null || true
    echo -e "${GREEN}✓ Existing container stopped${NC}"
else
    echo -e "${YELLOW}No running container found${NC}"
fi

# Copy service file to systemd user directory
echo -e "\n${BLUE}Installing service file...${NC}"
cp "$SERVICE_FILE" "$SYSTEMD_USER_DIR/"
echo -e "${GREEN}✓ Service file installed to $SYSTEMD_USER_DIR${NC}"

# Reload systemd daemon
echo -e "\n${BLUE}Reloading systemd daemon...${NC}"
systemctl --user daemon-reload
echo -e "${GREEN}✓ Systemd daemon reloaded${NC}"

# Enable the service
echo -e "\n${BLUE}Enabling service...${NC}"
systemctl --user enable quickstore-backend.service
echo -e "${GREEN}✓ Service enabled${NC}"

# Enable lingering (allows service to start at boot without user login)
echo -e "\n${BLUE}Enabling lingering for user...${NC}"
loginctl enable-linger "$USER"
echo -e "${GREEN}✓ Lingering enabled${NC}"

# Start the service
echo -e "\n${BLUE}Starting service...${NC}"
systemctl --user start quickstore-backend.service
echo -e "${GREEN}✓ Service started${NC}"

# Wait a moment for the service to start
sleep 3

# Check service status
echo -e "\n${BLUE}Service Status:${NC}"
systemctl --user status quickstore-backend.service --no-pager || true

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Installation Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e ""
echo -e "Service is now installed and will start automatically on boot."
echo -e ""
echo -e "Useful commands:"
echo -e "  View status:     ${BLUE}systemctl --user status quickstore-backend${NC}"
echo -e "  View logs:       ${BLUE}journalctl --user -u quickstore-backend -f${NC}"
echo -e "  Stop service:    ${BLUE}systemctl --user stop quickstore-backend${NC}"
echo -e "  Start service:   ${BLUE}systemctl --user start quickstore-backend${NC}"
echo -e "  Restart service: ${BLUE}systemctl --user restart quickstore-backend${NC}"
echo -e "  Disable service: ${BLUE}systemctl --user disable quickstore-backend${NC}"
echo -e ""
echo -e "Backend is running at: ${BLUE}http://localhost:7878${NC}"
echo -e "API docs available at: ${BLUE}http://localhost:7878/docs${NC}"
