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
      const bedBlock = bot.findBlock({
        matching: block => block.name.includes('bed'),
        maxDistance: 64
      });

      if (!bedBlock) {
        if (!bot.pathfinder.isMoving()) {
          const rx = Math.floor(Math.random() * 11) - 5;
          const rz = Math.floor(Math.random() * 11) - 5;
          bot.pathfinder.setGoal(new goals.GoalBlock(bot.entity.position.x + rx, bot.entity.position.y, bot.entity.position.z + rz));
        }
        return;
      }

      const distanceToBed = bot.entity.position.distanceTo(bedBlock.position);

      if (bot.time.isNight || bot.isRaining) {
        if (distanceToBed <= 2.5) {
          bot.pathfinder.stop();
          if (!bot.isSleeping) {
            try {
              await bot.sleep(bedBlock);
            } catch (err) {
              bot.activateBlock(bedBlock);
            }
          }
        } else {
          bot.pathfinder.setGoal(new goals.GoalBlock(bedBlock.position.x, bedBlock.position.y, bedBlock.position.z));
        }
      } else {
        if (!bot.isSleeping) {
          if (distanceToBed > 4 || !bot.pathfinder.isMoving()) {
            const rx = Math.floor(Math.random() * 5) - 2;
            const rz = Math.floor(Math.random() * 5) - 2;
            bot.pathfinder.setGoal(new goals.GoalBlock(bedBlock.position.x + rx, bedBlock.position.y, bedBlock.position.z + rz));
          }
        }
      }
    } catch (e) {}
  }, 3000);

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
