# Environment Variables

Here's what you can configure when running TigerBug. Most of these have sensible defaults, but you'll want to set a few
for production.

| Variable       | Required | Default                                                      | What it does                                                            |
|----------------|----------|--------------------------------------------------------------|-------------------------------------------------------------------------|
| PORT           | No       | 9840                                                         | Which port the server runs on                                           |
| CLIENT_URL     | No       | http://localhost:5173 (dev) / http://localhost:9840 (Docker) | The URL people will use to access TigerBug (needed for emails and CORS) |
| JWT_SECRET     | Yes      | (none)                                                       | A secret key for login tokens - make this random and keep it safe!      |
| JWT_EXPIRES_IN | No       | 7d                                                           | How long people stay logged in (1d = 1 day, 7d = 1 week, etc.)          |
| UPLOAD_PATH    | No       | /app/server/data/attachments                                 | Where uploaded files get stored                                         |
| NODE_ENV       | No       | development                                                  | Set to "production" to hide debug info from users                       |

## Email Setup

Email gets configured through the admin UI, not environment variables. Much easier that way.

## How it works

The server uses your `CLIENT_URL` setting to handle CORS and serve the web interface from the built files.
