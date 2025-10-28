#!/bin/bash

# QuickStore Backend - Stop Script
# Stops and removes the Podman container

CONTAINER_NAME="quickstore-backend"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Stopping QuickStore Backend...${NC}"

if podman ps --filter name=${CONTAINER_NAME} --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
    podman stop ${CONTAINER_NAME}
    echo -e "${GREEN}✓ Container stopped${NC}"
else
    echo -e "${RED}Container is not running${NC}"
fi

if podman ps -a --filter name=${CONTAINER_NAME} --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
    podman rm ${CONTAINER_NAME}
    echo -e "${GREEN}✓ Container removed${NC}"
fi

echo -e "${GREEN}Done!${NC}"
