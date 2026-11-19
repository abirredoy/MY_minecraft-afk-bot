# Minecraft AFK Bot

A Node.js Mineflayer bot that connects to a Minecraft server, walks around a small area near its spawn point (or a nearby bed), and reconnects with exponential backoff after disconnects.

## Requirements

- Node.js 20+
- A Minecraft server that permits bot accounts/connections
- Server owner/operator permission where required

## Configuration

Set these environment variables when deploying:

| Variable | Default | Description |
| --- | --- | --- |
| `MC_HOST` | `ZenoXForce.aternos.me` | Minecraft server hostname |
| `MC_PORT` | `63435` | Server port |
| `MC_USERNAME` | `ADMIN` | Bot username |
| `MC_VERSION` | `1.21.1` | Minecraft protocol version |
| `MC_AUTH` | `offline` | Mineflayer authentication mode |

Do not put account passwords or access tokens in source code. Use your hosting provider's secret/environment-variable settings.

## Run locally

```bash
npm install
npm run check
npm start
```

## Movement and reconnect behavior

- Walks short paths near the nearest bed within 32 blocks.
- If no bed is nearby, wanders within a small radius of the position where it spawned.
- Does not dig blocks.
- Logs connection, movement, kick, and error events.
- Uses capped exponential backoff with jitter to avoid rapid reconnect loops.
- Handles SIGINT/SIGTERM and closes the connection cleanly.

## GitHub Actions limitation

The workflow is manual and intended for testing/diagnostics. GitHub Actions runners are temporary and have execution limits; they cannot provide a guaranteed continuous 24/7 Minecraft connection. For continuous uptime, deploy this project on a suitable always-on host and follow the Minecraft server host's rules. A bot connection also cannot guarantee that a hosting provider will keep a server online if its policy or control panel stops it.
