<h1 align="center">
  <img src="client/public/favicon.png" alt="TigerBug Logo" width="48" height="48" style="vertical-align: middle; margin-right: 10px;">
  TigerBug
</h1>

<p align="center"><strong>The open source bug reporting system designed specifically for video game development teams.</strong></p>

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node.js-22+-green.svg)](https://nodejs.org)
[![SQLite](https://img.shields.io/badge/database-SQLite-003B57.svg)](https://sqlite.org)

---

### 💡 Why we built TigerBug

As game developers ourselves, we were frustrated with existing bug tracking solutions.
Enterprise solutions like Jira felt overwhelming for our use cases, while simple tools lacked the features we needed.
We couldn't find a tool that:

- **Understood our game development workflows** - Most tools were built for web development, not games
- **Made it easy to share gameplay footage and save files** - Essential for reproducing game bugs
- **Gather feedback from players** - We needed a way to involve our community in bug reporting

So we built TigerBug - our custom-made solution that combines the best of everything we wanted in a bug tracker,
tailored specifically for game development teams.

### 🎯 Core Features

- **🏗️ Project-based Organization** - Organize bugs by game project
- **🔐 Flexible Authentication** - Email/password or OAuth (Google, GitHub) - your choice
- **💬 Rich Commenting System** - Thread discussions with file attachments for screenshots, logs, and saves
- **👍 Community Voting** - Let your team and players upvote the most critical issues
- **📧 Smart Notifications** - Stay informed via email when issues change or receive comments
- **📎 File Attachments** - Upload crash logs, screenshots, save files, and reproduction steps

![Screenshot of detail view](https://i.imgur.com/aWbUzUP.png)

### 🐛 Issue Tracking for Games

Every bug report in TigerBug is designed to capture the full context of the issue:

- **Clear titles and descriptions** help everyone understand the issue
- **Priority through voting** - let the team highlight what breaks the game experience
- **Rich discussions** with threaded comments and file uploads

![Screenshot of new issue](https://i.imgur.com/Ak2Qupw.png)

![Screenshot of kanban view](https://i.imgur.com/5MME37b.png)

### 🐳 Quick Start with Docker

The easiest way to get TigerBug running is with Docker Compose:

#### docker-compose.yml
```yaml
services:
  tigerbug:
    image: tigerbug:latest
    ports:
      - "9840:9840"
    volumes:
      - ./data:/app/server/data
    environment:
      - JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
      - JWT_EXPIRES_IN=7d
    restart: unless-stopped
```

### Why is there no Issues tab?

This project has been made to meet our specific needs.
We don't have the time and resources to maintain this project as a full-fledged issue tracker.  
Feel free to fork and modify it for your own use cases.  
For critical issues, please contact us directly at [contact@twobit-games.com](mailto:contact@twobit-games.com).

### 📄 License

TigerBug is open source software licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

**Built with ❤️ by TwoBit Games**