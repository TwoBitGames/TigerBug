# Getting Started

Welcome to TigerBug! It's a simple bug tracker designed specifically for game developers who want something that just works without a ton of setup.

## Quick Start with Docker
The easiest way to get running:
```bash
# Make a folder for your data
mkdir -p tigerbug-data

# Create the docker setup
cat > docker-compose.yml <<'YML'
services:
  tigerbug:
    image: ghcr.io/twobitgames/tigerbug:latest
    container_name: tigerbug
    restart: unless-stopped
    ports:
      - "9840:9840"
    environment:
      - JWT_SECRET=change-me-to-something-random
      - JWT_EXPIRES_IN=7d
      - CLIENT_URL=http://localhost:9840
    volumes:
      - ./tigerbug-data:/app/server/data
YML

docker compose up -d
```
Then open http://localhost:9840 and you're good to go!

## First time setup
When you first visit TigerBug, there won't be any users yet. No worries - it'll walk you through creating the first admin account. That person becomes the system administrator and can set everything else up.

Once you've got your admin account, you can:
1. Set up branding (logo, name) to make it yours
2. Create your first project
3. Add team members (either manually or through OAuth if you set that up)
4. Optionally configure email so people get notifications

## Setting up your first project
1. Log in as admin
2. Head to the Admin Dashboard (look for "Admin" in the navigation)
3. Create a project - just needs a name, but you can add a description and logo too
4. Add team members and set their roles (Reporter, Manager, or Administrator)

## Working with issues
Once you're in a project, you can:
- Report bugs or request features
- Set priority levels (Low, Medium, High, Critical)
- Track status (Open → In Progress → Closed)
- Upload screenshots, crash logs, save files - anything that helps
- Vote on what's most important (great for community feedback)

## Views that work for you
Switch between List and Kanban views depending on how your team works. The Kanban board groups issues by status and loads more as you scroll.

## Personal todo dashboard
There's a personal dashboard that shows all your assigned issues organized by due date - Overdue, Today, This Week, Later, and No Due Date. Helps you stay on top of your work.

## File storage
All the stuff people upload (screenshots, logs, profile pictures, logos) gets stored in `/app/server/data/attachments` by default. In production, make sure this is on a persistent volume so you don't lose files when you update.
