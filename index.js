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

  // বটের হোম/বেস পজিশন সেভ রাখার ভ্যারিয়েবল
  let homePosition = null;

  bot.once('spawn', () => {
    console.log('Bot successfully joined the server!');
    const defaultMove = new Movements(bot);
    bot.pathfinder.setMovements(defaultMove);

    // জয়েন করার সাথে সাথে তার অবস্থানকে হোম ধরে নেওয়া
    homePosition = bot.entity.position.clone();

    setInterval(() => {
      handleBotActions(bot);
    }, 10000);
  });

  async function handleBotActions(bot) {
    if (!bot.entity) return;

    if (bot.time.isNight || bot.isRaining) {
      const bedBlock = bot.findBlock({
        matching: block => bot.isABed(block),
        maxDistance: 15
      });

      if (bedBlock) {
        try {
          console.log('Night detected. Going to bed...');
          await bot.sleep(bedBlock);
          console.log('Bot is now sleeping.');
        } catch (err) {
          console.log(`Could not sleep: ${err.message}`);
        }
      } else {
        stayNearHome(bot);
      }
    } else {
      stayNearHome(bot);
    }
  }

  // হোম বা বেডের আশেপাশে ৩ ব্লকের মধ্যে হালকা হাঁটাচলা
  function stayNearHome(bot) {
    if (!homePosition) return;

    const rx = Math.floor(Math.random() * 7) - 3; // -৩ থেকে +৩ ব্লকের মধ্যে
    const rz = Math.floor(Math.random() * 7) - 3;
    const targetPos = homePosition.offset(rx, 0, rz);

    bot.pathfinder.setGoal(new goals.GoalBlock(targetPos.x, targetPos.y, targetPos.z));
  }

  bot.on('end', () => {
    console.log('Bot disconnected. Reconnecting in 15 seconds...');
    setTimeout(createBot, 15000);
  });

  bot.on('error', err => console.log('Bot error:', err));
}

createBot();
