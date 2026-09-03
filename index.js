const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');

process.setMaxListeners(30);

function createBot() {
  console.log('Connecting to server...');

  const bot = mineflayer.createBot({
    host: 'ZenoXForce-Eqqx.aternos.me',
    port: 63435,
    username: 'ADMIN',
    version: '1.21.1',
    checkTimeoutInterval: 1200 * 1000
  });

  bot.loadPlugin(pathfinder);

  bot.once('spawn', () => {
    console.log('Bot successfully joined and ready!');

    try {
      const defaultMove = new Movements(bot);
      defaultMove.canDig = false;
      bot.pathfinder.setMovements(defaultMove);
    } catch (e) {}
  });

  const interval = setInterval(async () => {
    if (!bot.entity) return;

    try {
      if (bot.time.isNight || bot.isRaining) {
        const bed = bot.findBlock({
          matching: block => bot.isABed(block),
          maxDistance: 32
        });

        if (bed) {
          try {
            await bot.sleep(bed);
            return;
          } catch (err) {}
        }
      }

      if (!bot.pathfinder.isMoving()) {
        const nearbyBed = bot.findBlock({
          matching: block => bot.isABed(block),
          maxDistance: 16
        });

        let targetX, targetZ;
        const targetY = bot.entity.position.y;

        if (nearbyBed) {
          const rx = Math.floor(Math.random() * 9) - 4;
          const rz = Math.floor(Math.random() * 9) - 4;
          targetX = nearbyBed.position.x + rx;
          targetZ = nearbyBed.position.z + rz;
        } else {
          const rx = Math.floor(Math.random() * 13) - 6;
          const rz = Math.floor(Math.random() * 13) - 6;
          targetX = bot.entity.position.x + rx;
          targetZ = bot.entity.position.z + rz;
        }

        bot.pathfinder.setGoal(new goals.GoalBlock(targetX, targetY, targetZ));
      }
    } catch (e) {}
  }, 10000);

  bot.on('death', () => {
    console.log('Bot died. Respawning...');
    setTimeout(() => {
      try { bot.respawn(); } catch (e) {}
    }, 3000);
  });

  bot.on('end', (reason) => {
    console.log(`Disconnected: ${reason}. Reconnecting in 10s...`);
    clearInterval(interval);
    setTimeout(createBot, 10000);
  });

  bot.on('error', err => {});
}

process.on('uncaughtException', (err) => {});
process.on('unhandledRejection', (reason, promise) => {});

createBot();
