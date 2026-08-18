const mineflayer = require('mineflayer');
const pathfinderPlugin = require('mineflayer-pathfinder').pathfinder;
const Movements = require('mineflayer-pathfinder').Movements;
const goals = require('mineflayer-pathfinder').goals;

function createBot() {
  const bot = mineflayer.createBot({
    host: 'ZenoXForce-Eqqx.aternos.me',
    port: 63435,
    username: 'ADMIN',
    version: '1.21.1'
  });

  bot.loadPlugin(pathfinderPlugin);

  // 🔴 এখানে আপনার বেডের সঠিক X, Y, Z নম্বর বসিয়ে দিন
  const bedPosition = { x: --5.31, y: 86.85, z: -5.31 };

  bot.once('spawn', () => {
    console.log('Bot successfully joined the server!');
    const defaultMove = new Movements(bot);
    bot.pathfinder.setMovements(defaultMove);

    setInterval(() => {
      handleBotActions(bot);
    }, 10000);
  });

  bot.on('death', () => {
    console.log('Bot died! Respawning automatically...');
    setTimeout(() => {
      bot.respawn();
    }, 2000);
  });

  async function handleBotActions(bot) {
    if (!bot.entity) return;

    // রাত হলে বা বৃষ্টি হলে
    if (bot.time.isNight || bot.isRaining) {
      console.log('Night detected. Moving to bed...');
      
      // প্রথমে বেডের দিকে হেঁটে যাবে
      bot.pathfinder.setGoal(new goals.GoalBlock(bedPosition.x, bedPosition.y, bedPosition.z));

      // বেডের কাছাকাছি এলে ঘুমানোর চেষ্টা করবে
      const bedBlock = bot.findBlock({
        matching: block => bot.isABed(block),
        maxDistance: 6
      });

      if (bedBlock) {
        try {
          await bot.sleep(bedBlock);
          console.log('Bot is now sleeping.');
        } catch (err) {
          console.log(`Could not sleep: ${err.message}`);
        }
      }
    } else {
      // দিনের বেলা বেডের ৩ ব্লকের ভেতরে হালকা ঘোরাঘুরি করবে
      stayNearBed(bot);
    }
  }

  function stayNearBed(bot) {
    const rx = Math.floor(Math.random() * 5) - 2; // -২ থেকে +২ ব্লক
    const rz = Math.floor(Math.random() * 5) - 2;
    const targetPos = {
      x: bedPosition.x + rx,
      y: bedPosition.y,
      z: bedPosition.z + rz
    };

    bot.pathfinder.setGoal(new goals.GoalBlock(targetPos.x, targetPos.y, targetPos.z));
  }

  bot.on('end', () => {
    console.log('Bot disconnected. Reconnecting in 15 seconds...');
    setTimeout(createBot, 15000);
  });

  bot.on('error', err => console.log('Bot error:', err));
}

createBot();
