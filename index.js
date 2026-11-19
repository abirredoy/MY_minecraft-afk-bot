const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');

const CONFIG = {
  host: process.env.MC_HOST || 'ZenoXForce.aternos.me',
  port: Number(process.env.MC_PORT || 63435),
  username: process.env.MC_USERNAME || 'ADMIN',
  version: process.env.MC_VERSION || '1.21.1',
  auth: process.env.MC_AUTH || 'offline',
  reconnectBaseMs: 5000,
  reconnectMaxMs: 60000,
  movementIntervalMs: 20000,
  wanderRadius: 6,
};

let activeBot = null;
let reconnectTimer = null;
let reconnectAttempt = 0;
let shuttingDown = false;

function log(level, message, extra) {
  const suffix = extra === undefined ? '' : ` ${formatExtra(extra)}`;
  console[level] ? console[level](`[Minecraft Bot] ${new Date().toISOString()} ${message}${suffix}`)
    : console.log(`[Minecraft Bot] ${message}${suffix}`);
}

function formatExtra(value) {
  if (value instanceof Error) return value.stack || value.message;
  if (typeof value === 'string') return value;
  try { return JSON.stringify(value); } catch { return String(value); }
}

function scheduleReconnect(reason) {
  if (shuttingDown || reconnectTimer) return;

  const delay = Math.min(
    CONFIG.reconnectBaseMs * (2 ** reconnectAttempt),
    CONFIG.reconnectMaxMs
  );
  const jitter = Math.floor(Math.random() * 1500);
  reconnectAttempt += 1;

  log('warn', `${reason}. Reconnecting in ${Math.round((delay + jitter) / 1000)}s (attempt ${reconnectAttempt}).`);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    createBot();
  }, delay + jitter);
}

function chooseRoamTarget(bot, anchor) {
  const angle = Math.random() * Math.PI * 2;
  const distance = 2 + Math.random() * CONFIG.wanderRadius;
  const x = Math.floor(anchor.x + Math.cos(angle) * distance);
  const z = Math.floor(anchor.z + Math.sin(angle) * distance);
  return { x, y: anchor.y, z };
}

function startMovement(bot) {
  let movementTimer = null;
  let home = null;

  bot.once('spawn', () => {
    home = bot.entity.position.clone();
    log('info', `Spawned at ${home.x.toFixed(1)}, ${home.y.toFixed(1)}, ${home.z.toFixed(1)}.`);

    try {
      const movements = new Movements(bot);
      movements.canDig = false;
      movements.allow1by1towers = false;
      bot.pathfinder.setMovements(movements);
    } catch (error) {
      log('error', 'Could not configure pathfinder movements.', error);
    }

    movementTimer = setInterval(() => {
      if (!bot.entity || !bot.pathfinder || bot.pathfinder.isMoving()) return;

      try {
        const bed = bot.findBlock({
          matching: block => bot.isABed(block),
          maxDistance: 32,
        });

        if (bed) {
          const distance = bot.entity.position.distanceTo(bed.position);
          if (distance > 4) {
            bot.pathfinder.setGoal(new goals.GoalNear(
              bed.position.x, bed.position.y, bed.position.z, 2
            ));
            log('info', 'Walking toward the nearest bed area.');
            return;
          }

          const target = chooseRoamTarget(bot, bed.position);
          bot.pathfinder.setGoal(new goals.GoalNear(target.x, target.y, target.z, 1));
          log('info', 'Taking a short walk near the bed.');
          return;
        }

        const target = chooseRoamTarget(bot, home);
        bot.pathfinder.setGoal(new goals.GoalNear(target.x, target.y, target.z, 1));
        log('info', 'No nearby bed found; taking a short walk near the spawn point.');
      } catch (error) {
        log('warn', 'Movement cycle failed; it will retry on the next cycle.', error);
      }
    }, CONFIG.movementIntervalMs);
  });

  return () => {
    if (movementTimer) clearInterval(movementTimer);
  };
}

function createBot() {
  if (shuttingDown) return;

  if (!CONFIG.host || !Number.isInteger(CONFIG.port) || CONFIG.port < 1 || CONFIG.port > 65535) {
    log('error', 'Invalid Minecraft host or port. Check MC_HOST and MC_PORT.');
    return;
  }

  log('info', `Connecting to ${CONFIG.host}:${CONFIG.port} as ${CONFIG.username}...`);

  let bot;
  try {
    bot = mineflayer.createBot({
      host: CONFIG.host,
      port: CONFIG.port,
      username: CONFIG.username,
      version: CONFIG.version,
      auth: CONFIG.auth,
      checkTimeoutInterval: 120000,
    });
  } catch (error) {
    log('error', 'Could not create the Minecraft connection.', error);
    scheduleReconnect('Connection setup failed');
    return;
  }

  activeBot = bot;
  bot.loadPlugin(pathfinder);
  const stopMovement = startMovement(bot);

  bot.once('spawn', () => {
    reconnectAttempt = 0;
    log('info', 'Bot joined the server successfully.');
  });

  bot.on('death', () => {
    log('warn', 'Bot died; requesting respawn.');
    setTimeout(() => {
      if (!shuttingDown && activeBot === bot && bot.isDead) {
        try { bot.respawn(); } catch (error) {
          log('warn', 'Respawn request failed.', error);
        }
      }
    }, 3000);
  });

  bot.on('kicked', reason => {
    log('warn', 'Server kicked the bot.', reason);
  });

  bot.on('error', error => {
    log('error', 'Minecraft connection error.', error);
  });

  bot.once('end', reason => {
    stopMovement();
    if (activeBot === bot) activeBot = null;
    log('warn', 'Connection ended.', reason || 'No reason supplied');
    scheduleReconnect('Disconnected');
  });
}

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  log('info', `Received ${signal}; shutting down cleanly.`);

  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = null;

  if (activeBot) {
    try { activeBot.quit('Bot process shutting down'); } catch (error) {
      log('warn', 'Error while closing the Minecraft connection.', error);
    }
  }

  setTimeout(() => process.exit(0), 1500).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('uncaughtException', error => {
  log('error', 'Uncaught exception.', error);
});
process.on('unhandledRejection', reason => {
  log('error', 'Unhandled promise rejection.', reason);
});

createBot();
