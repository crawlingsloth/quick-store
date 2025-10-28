# QuickStore Backend - Container Deployment

This guide explains how to deploy the QuickStore backend using Podman containers.

## Prerequisites

- **Podman** installed on your system
- **PostgreSQL** database accessible from the container
- **.env** file configured with your settings

## Quick Start (Systemd Service - Recommended)

For production deployments, use the systemd service for automatic startup on boot:

### 1. Configure Environment

First, create your `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
DATABASE_URL=postgresql://user:password@host:5432/database
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
CORS_ORIGINS=http://localhost:5173,http://100.115.172.96:5173
```

**Important:** If using an external database (like `192.168.50.62`), ensure the container can reach it. The database host should be accessible from within the container network.

### 2. Install Systemd Service (Auto-Start on Boot)

Run the installation script to set up the backend as a systemd service:

```bash
./install-service.sh
```

This will:
- Install the systemd service
- Enable it to start automatically on boot
- Enable lingering (starts even if user isn't logged in)
- Start the service immediately
- Display service status

**Service is now installed!** The backend will automatically start:
- When the system boots
- When the service is restarted
- If it crashes (automatic restart)

### 3. Manage the Service

Use systemctl commands to manage the service:

```bash
# View service status
systemctl --user status quickstore-backend

# View live logs
journalctl --user -u quickstore-backend -f

# Restart service
systemctl --user restart quickstore-backend

# Stop service
systemctl --user stop quickstore-backend

# Start service
systemctl --user start quickstore-backend
```

To uninstall the service:

```bash
./uninstall-service.sh
```

---

## Alternative: Manual Container Deployment

If you prefer to run the container manually without systemd:

### 1. Deploy the Container

Run the deployment script:

```bash
./deploy.sh
```

This will:
- Build the Docker image
- Stop any existing container
- Start a new container with your configuration
- Display logs and status

### 3. Verify Deployment

Check if the backend is running:

```bash
# Check container status
podman ps

# View logs
podman logs -f quickstore-backend

# Test the API
curl http://localhost:7878/health
```

Access the API documentation at: http://localhost:7878/docs

## Container Management

### View Logs

```bash
# Follow logs in real-time
podman logs -f quickstore-backend

# View last 100 lines
podman logs --tail 100 quickstore-backend
```

### Stop Container

```bash
./stop.sh
# Or manually:
podman stop quickstore-backend
```

### Start Container

```bash
podman start quickstore-backend
```

### Restart Container

```bash
podman restart quickstore-backend
```

### Shell Access

```bash
podman exec -it quickstore-backend /bin/bash
```

### Remove Container

```bash
podman rm -f quickstore-backend
```

### Remove Image

```bash
podman rmi quickstore-backend:latest
```

## Database Migrations

If you need to run database migrations:

```bash
# Access container shell
podman exec -it quickstore-backend /bin/bash

# Inside container, run migrations
alembic upgrade head
```

Or run migrations from outside the container:

```bash
podman exec quickstore-backend alembic upgrade head
```

## Troubleshooting

### Container Won't Start

1. Check logs: `podman logs quickstore-backend`
2. Verify .env file exists and is configured correctly
3. Ensure database is accessible from the container
4. Check if port 7878 is already in use: `ss -tlnp | grep 7878`

### Database Connection Issues

If the container can't connect to the database:

1. Verify `DATABASE_URL` in `.env` file
2. Check if the database host is accessible:
   ```bash
   podman exec quickstore-backend ping -c 3 192.168.50.62
   ```
3. Ensure PostgreSQL allows connections from the container's IP

### Permission Issues

If you encounter permission errors:

```bash
# Rebuild with proper permissions
podman build --no-cache -t quickstore-backend:latest .
```

## Production Deployment

For production deployments:

1. **Use a reverse proxy** (nginx, traefik) for SSL/TLS
2. **Set strong SECRET_KEY** in .env
3. **Limit CORS_ORIGINS** to your actual frontend domains
4. **Use environment-specific .env** files
5. **Set up log rotation** for container logs
6. **Monitor container health** using the built-in health check

### Example with systemd

Create a systemd service for automatic startup:

```bash
# Create service file
sudo nano /etc/systemd/system/quickstore-backend.service
```

Service file content:

```ini
[Unit]
Description=QuickStore Backend Container
After=network.target

[Service]
Type=forking
RemainAfterExit=yes
WorkingDirectory=/home/eshan/production/services/quick-store/backend
ExecStart=/usr/bin/podman start quickstore-backend
ExecStop=/usr/bin/podman stop quickstore-backend
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable quickstore-backend
sudo systemctl start quickstore-backend
```

## Update Deployment

To update the backend after code changes:

```bash
# Stop the current container
./stop.sh

# Rebuild and deploy
./deploy.sh
```

## Networking

The container exposes port **7878** by default. You can change this in `deploy.sh`:

```bash
PORT=8000  # Change to your desired port
```

## Environment Variables

All environment variables should be set in the `.env` file:

| Variable | Description | Example |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | postgresql://user:pass@host:5432/db |
| SECRET_KEY | JWT secret key | random-secret-key-here |
| ALGORITHM | JWT algorithm | HS256 |
| ACCESS_TOKEN_EXPIRE_MINUTES | Token expiration time | 10080 (7 days) |
| CORS_ORIGINS | Allowed CORS origins | http://localhost:5173,http://app.com |

## Security Notes

- The container runs as a non-root user (appuser) for security
- Keep your .env file secure and never commit it to git
- Use strong, randomly generated SECRET_KEY in production
- Limit CORS_ORIGINS to only your trusted domains
- Consider using secrets management for sensitive data in production

## Support

For issues or questions, check the logs first:

```bash
podman logs --tail 100 quickstore-backend
```

Common issues are usually related to:
- Database connectivity
- Environment variable configuration
- Port conflicts
