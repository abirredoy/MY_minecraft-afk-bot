const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');

function createBot() {
  console.log('Connecting to server...');

  const bot = mineflayer.createBot({
    host: 'ZenoXForce.aternos.me',
    port: 63435,
    username: 'ADMIN',
    version: '1.21.1',
    auth: 'offline',
    checkTimeoutInterval: 120 * 1000
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

  // মুভমেন্ট চেক করার সময় ১৫ সেকেন্ড রাখা হয়েছে যাতে অ্যান্টিচিট সমস্যা না করে
  setInterval(() => {
    if (!bot.entity) return;

    try {
      const bedBlock = bot.findBlock({
        matching: block => bot.isABed(block),
        maxDistance: 32
      });

      if (bedBlock) {
        const dist = bot.entity.position.distanceTo(bedBlock.position);

        if (dist > 4) {
          if (!bot.pathfinder.isMoving()) {
            bot.pathfinder.setGoal(new goals.GoalBlock(bedBlock.position.x, bedBlock.position.y, bedBlock.position.z));
          }
        } 
        else {
          if (!bot.pathfinder.isMoving() && Math.random() < 0.3) {
            const rx = Math.floor(Math.random() * 3) - 1;
            const rz = Math.floor(Math.random() * 3) - 1;
            bot.pathfinder.setGoal(new goals.GoalBlock(
              bedBlock.position.x + rx,
              bedBlock.position.y,
              bedBlock.position.z + rz
            ));
          }
        }
      }
    } catch (e) {}
  }, 15000);

  bot.on('death', () => {
    console.log('Bot died. Respawning...');
    setTimeout(() => {
      try { bot.respawn(); } catch (e) {}
    }, 3000);
  });

  bot.on('kicked', (reason) => {
    console.log(`Kicked from server: ${reason}`);
  });

  bot.on('end', (reason) => {
    console.log(`Disconnected: ${reason}. Reconnecting in 3s...`);
    setTimeout(createBot, 3000);
  });

  bot.on('error', err => {});
}

process.on('uncaughtException', () => {});
process.on('unhandledRejection', () => {});

createBot();
