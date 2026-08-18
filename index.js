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

  bot.once('spawn', () => {
    console.log('Bot successfully joined the server!');
    const defaultMove = new Movements(bot);
    bot.pathfinder.setMovements(defaultMove);

    setInterval(() => {
      handleBotActions(bot);
    }, 10000);
  });

  async function handleBotActions(bot) {
    if (!bot.entity) return;

    if (bot.time.isNight || bot.isRaining) {
      const bedBlock = bot.findBlock({
        matching: block => bot.isABed(block),
        maxDistance: 32
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
        randomWalk(bot);
      }
    } else {
      randomWalk(bot);
    }
  }

  function randomWalk(bot) {
    const rx = Math.floor(Math.random() * 20) - 10;
    const rz = Math.floor(Math.random() * 20) - 10;
    const targetPos = bot.entity.position.offset(rx, 0, rz);

    bot.pathfinder.setGoal(new goals.GoalBlock(targetPos.x, targetPos.y, targetPos.z));
  }

  bot.on('end', () => {
    console.log('Bot disconnected. Reconnecting in 15 seconds...');
    setTimeout(createBot, 15000);
  });

  bot.on('error', err => console.log('Bot error:', err));
}

createBot();
