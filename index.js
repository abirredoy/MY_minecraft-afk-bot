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
      // ১. প্রথমে আশপাশে বেড আছে কি না তা খুঁজে বের করা
      const bedBlock = bot.findBlock({
        matching: block => block.name.includes('bed'),
        maxDistance: 32
      });

      if (bedBlock) {
        // সার্ভারে রাত হলে বা বৃষ্টি হলে সরাসরি বেডে গিয়ে ঘুমানোর চেষ্টা করবে
        if (bot.time.isNight || bot.isRaining) {
          try {
            await bot.sleep(bedBlock);
            return;
          } catch (err) {
            // যদি সরাসরি ঘুমাতে না পারে, তবে বেডের একদম কাছে চলে যাবে
            bot.pathfinder.setGoal(new goals.GoalBlock(bedBlock.position.x, bedBlock.position.y, bedBlock.position.z));
            return;
          }
        }

        // ২. দিনের বেলা বা সাধারণ সময়ে বেডের আশপাশেই (৪-৬ ব্লকের মধ্যে) ঘোরাফেরা করবে
        const distanceToBed = bot.entity.position.distanceTo(bedBlock.position);
        if (distanceToBed > 6 || !bot.pathfinder.isMoving()) {
          const rx = Math.floor(Math.random() * 7) - 3;
          const rz = Math.floor(Math.random() * 7) - 3;
          bot.pathfinder.setGoal(new goals.GoalBlock(bedBlock.position.x + rx, bedBlock.position.y, bedBlock.position.z + rz));
        }
      } else {
        // যদি আশপাশে কোনো বেড না থাকে, তবে সাধারণ র্যান্ডম ঘোরাফেরা করবে
        if (!bot.pathfinder.isMoving()) {
          const rx = Math.floor(Math.random() * 13) - 6;
          const rz = Math.floor(Math.random() * 13) - 6;
          bot.pathfinder.setGoal(new goals.GoalBlock(bot.entity.position.x + rx, bot.entity.position.y, bot.entity.position.z + rz));
        }
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
