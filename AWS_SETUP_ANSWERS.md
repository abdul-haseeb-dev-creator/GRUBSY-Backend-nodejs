# AWS Setup Answers

Port Access: Is port 3000 open in your AWS Security Groups for external access? No, do not open port 3000 for external access. Use nginx reverse proxy on ports 80/443.

Reverse Proxy: Should we set up nginx to handle requests from standard ports (80/443) and proxy to port 3000? Yes, nginx is already configured for this in nginx/nginx.conf.

SSL Certificate: Do you need HTTPS setup for www.uk-gds.com? Yes, HTTPS is configured in nginx for the domain.

Process Management: Should we set up PM2 or systemd to keep the server running automatically? Yes, use PM2 for Node.js process management within Docker containers, or systemd for managing the Docker service.

## Basis for Answers

These answers are based on:
- nginx/nginx.conf configuration file
- src/server.js port setting (3002 default, but nginx upstream uses 3000)
- scripts/deploy-production.sh deployment script using Docker Compose