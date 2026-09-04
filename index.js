const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');

function createBot() {
  console.log('Connecting to server...');

  const bot = mineflayer.createBot({
    host: 'ZenoXForce.aternos.me',
    port: 63435,
    username: 'ADMIN',
    version: '1.21.1',
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

  // সম্পূর্ণ স্বয়ংক্রিয় লুপ (প্রতি ৫ সেকেন্ড পর পর কাজ করবে)
  setInterval(() => {
    if (!bot.entity || bot.isSleeping) return;

    try {
      // ১. সবচেয়ে কাছের বেড খুঁজে বের করা (যত দূরেই হোক)
      const bedBlock = bot.findBlock({
        matching: block => bot.isABed(block),
        maxDistance: 64
      });

      if (bedBlock) {
        const dist = bot.entity.position.distanceTo(bedBlock.position);

        // ২. যদি রাত হয় এবং বেডের কাছাকাছি থাকে, তবে সোজা ঘুমিয়ে পড়বে
        if (bot.time && (bot.time.timeOfDay >= 12500 && bot.time.timeOfDay < 23459)) {
          if (dist <= 4 && !bot.isSleeping) {
            bot.pathfinder.setGoal(new goals.GoalBlock(bedBlock.position.x, bedBlock.position.y, bedBlock.position.z));
            setTimeout(async () => {
              try { await bot.sleep(bedBlock); } catch (e) {}
            }, 1000);
            return;
          }
        }

        // ৩. যদি বেড থেকে দূরে থাকে, তবে সোজা বেডের কাছে চলে যাবে
        if (dist > 3) {
          if (!bot.pathfinder.isMoving()) {
            bot.pathfinder.setGoal(new goals.GoalBlock(bedBlock.position.x, bedBlock.position.y, bedBlock.position.z));
          }
        } 
        // ৪. বেডের কাছে পৌঁছে গেলে বা কাছাকাছি থাকলে, সেই বেডের আশপাশে এলোমেলো ঘোরাঘুরি করবে
        else {
          if (!bot.pathfinder.isMoving()) {
            const rx = Math.floor(Math.random() * 5) - 2; // -2 থেকে +2 ব্লকের মধ্যে
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

  // সার্ভার থেকে বের হয়ে গেলে বা ডিসকানেক্ট হলে নিজে থেকে আবার রিজয়েন নেবে
  bot.on('end', (reason) => {
    console.log(`Disconnected: ${reason}. Reconnecting in 10s...`);
    setTimeout(createBot, 10000);
  });

  bot.on('error', err => {});
}

process.on('uncaughtException', () => {});
process.on('unhandledRejection', () => {});

createBot();
