#!/bin/bash

# QuickStore Backend - Podman Deployment Script
# This script builds and deploys the FastAPI backend using Podman

set -e  # Exit on error

# Configuration
CONTAINER_NAME="quickstore-backend"
IMAGE_NAME="quickstore-backend"
IMAGE_TAG="latest"
PORT=7878

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}QuickStore Backend Deployment${NC}"
echo -e "${BLUE}========================================${NC}"

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    echo "Please create a .env file based on .env.example"
    exit 1
fi

# Stop and remove existing container if it exists
echo -e "\n${BLUE}Checking for existing container...${NC}"
if podman ps -a --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${BLUE}Stopping and removing existing container...${NC}"
    podman stop ${CONTAINER_NAME} 2>/dev/null || true
    podman rm ${CONTAINER_NAME} 2>/dev/null || true
    echo -e "${GREEN}✓ Existing container removed${NC}"
fi

# Build the image
echo -e "\n${BLUE}Building Docker image...${NC}"
podman build -t ${IMAGE_NAME}:${IMAGE_TAG} .
echo -e "${GREEN}✓ Image built successfully${NC}"

# Run the container
echo -e "\n${BLUE}Starting container...${NC}"
podman run -d \
    --name ${CONTAINER_NAME} \
    --env-file .env \
    -p ${PORT}:7878 \
    --restart unless-stopped \
    ${IMAGE_NAME}:${IMAGE_TAG}

echo -e "${GREEN}✓ Container started successfully${NC}"

# Wait a moment for the container to start
sleep 3

# Check container status
echo -e "\n${BLUE}Container Status:${NC}"
podman ps --filter name=${CONTAINER_NAME}

# Show logs
echo -e "\n${BLUE}Container Logs (last 20 lines):${NC}"
podman logs --tail 20 ${CONTAINER_NAME}

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Backend is running at: ${BLUE}http://localhost:${PORT}${NC}"
echo -e "API docs available at: ${BLUE}http://localhost:${PORT}/docs${NC}"
echo -e ""
echo -e "Useful commands:"
echo -e "  View logs:      ${BLUE}podman logs -f ${CONTAINER_NAME}${NC}"
echo -e "  Stop container: ${BLUE}podman stop ${CONTAINER_NAME}${NC}"
echo -e "  Start container:${BLUE}podman start ${CONTAINER_NAME}${NC}"
echo -e "  Restart:        ${BLUE}podman restart ${CONTAINER_NAME}${NC}"
echo -e "  Shell access:   ${BLUE}podman exec -it ${CONTAINER_NAME} /bin/bash${NC}"
