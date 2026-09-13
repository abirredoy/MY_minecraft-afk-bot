const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');

function createBot() {
  console.log('Connecting to server...');

  const bot = mineflayer.createBot({
    host: '185.107.192.149',
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

    // Aternos এর এএফকে ডিটেকশন এড়াতে প্রতি ২ মিনিট পর পর ছোট জাম্প দেওয়া
    setInterval(() => {
      try {
        bot.setControlState('jump', true);
        setTimeout(() => bot.setControlState('jump', false), 500);
      } catch (e) {}
    }, 120 * 1000);

    setTimeout(() => {
      console.log('Scheduled session end. Disconnecting bot...');
      bot.quit();
    }, 4 * 60 * 60 * 1000); 
  });

  setInterval(() => {
    if (!bot.entity) return;

    try {
      const bedBlock = bot.findBlock({
        matching: block => bot.isABed(block),
        maxDistance: 64
      });

      if (bedBlock) {
        const dist = bot.entity.position.distanceTo(bedBlock.position);

        if (dist > 3) {
          if (!bot.pathfinder.isMoving()) {
            bot.pathfinder.setGoal(new goals.GoalBlock(bedBlock.position.x, bedBlock.position.y, bedBlock.position.z));
          }
        } 
        else {
          if (!bot.pathfinder.isMoving()) {
            const rx = Math.floor(Math.random() * 5) - 2;
            const rz = Math.floor(Math.random() * 5) - 2;
            bot.pathfinder.setGoal(new goals.GoalBlock(
              bedBlock.position.x + rx,
              bedBlock.position.y,
              bedBlock.position.z + rz
            ));
          }
        }
      }
    } catch (e) {}
  }, 5000);

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
    setTimeout(createBot, 3000); // রিকানেক্ট সময় কমিয়ে ৩ সেকেন্ড করা হলো
  });

  bot.on('error', err => {});
}

process.on('uncaughtException', () => {});
process.on('unhandledRejection', () => {});

createBot();
