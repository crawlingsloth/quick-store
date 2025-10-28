#!/bin/bash

# QuickStore Backend - Systemd Service Uninstallation
# This script removes the systemd service

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}QuickStore Backend Service Uninstall${NC}"
echo -e "${BLUE}========================================${NC}"

# Stop the service
echo -e "\n${BLUE}Stopping service...${NC}"
systemctl --user stop quickstore-backend.service 2>/dev/null || echo -e "${RED}Service not running${NC}"

# Disable the service
echo -e "\n${BLUE}Disabling service...${NC}"
systemctl --user disable quickstore-backend.service 2>/dev/null || echo -e "${RED}Service not enabled${NC}"

# Remove service file
SYSTEMD_USER_DIR="$HOME/.config/systemd/user"
SERVICE_FILE="$SYSTEMD_USER_DIR/quickstore-backend.service"

if [ -f "$SERVICE_FILE" ]; then
    echo -e "\n${BLUE}Removing service file...${NC}"
    rm "$SERVICE_FILE"
    echo -e "${GREEN}✓ Service file removed${NC}"
else
    echo -e "${RED}Service file not found${NC}"
fi

# Reload systemd daemon
echo -e "\n${BLUE}Reloading systemd daemon...${NC}"
systemctl --user daemon-reload
echo -e "${GREEN}✓ Systemd daemon reloaded${NC}"

# Stop and remove the container
echo -e "\n${BLUE}Stopping and removing container...${NC}"
podman stop quickstore-backend 2>/dev/null || true
podman rm quickstore-backend 2>/dev/null || true
echo -e "${GREEN}✓ Container stopped and removed${NC}"

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Uninstall Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e ""
echo -e "The service has been removed from systemd."
echo -e "You can re-install it anytime by running: ${BLUE}./install-service.sh${NC}"
