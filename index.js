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
    checkTimeoutInterval: 600 * 1000
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

  const interval = setInterval(() => {
    if (!bot.entity) return;

    try {
      if (!bot.pathfinder.isMoving()) {
        const rx = Math.floor(Math.random() * 7) - 3;
        const rz = Math.floor(Math.random() * 7) - 3;
        
        const targetX = bot.entity.position.x + rx;
        const targetZ = bot.entity.position.z + rz;
        const targetY = bot.entity.position.y;

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
