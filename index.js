const mineflayer = require('mineflayer');
const pathfinderPlugin = require('mineflayer-pathfinder').pathfinder;
const Movements = require('mineflayer-pathfinder').Movements;
const goals = require('mineflayer-pathfinder').goals;

const bedPosition = { x: -95, y: 64, z: 61 };

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
    try {
      const defaultMove = new Movements(bot);
      bot.pathfinder.setMovements(defaultMove);
    } catch (e) {
      console.log('Movements setup error:', e.message);
    }

    setInterval(() => {
      handleBotActions(bot);
    }, 10000);
  });

  bot.on('death', () => {
    console.log('Bot died! Respawning automatically...');
    setTimeout(() => {
      try { bot.respawn(); } catch (e) {}
    }, 2000);
  });

  async function handleBotActions(bot) {
    if (!bot || !bot.entity) return;

    try {
      if (bot.time && (bot.time.isNight || bot.isRaining)) {
        console.log('Night/Rain detected. Looking for bed...');
        const bedBlock = bot.findBlock({
          matching: block => bot.isABed(block),
          maxDistance: 15
        });

        if (bedBlock) {
          try {
            await bot.sleep(bedBlock);
            console.log('Bot is now sleeping.');
          } catch (err) {
            console.log('Could not sleep:', err.message);
            moveToBedArea(bot);
          }
        } else {
          moveToBedArea(bot);
        }
      } else {
        stayNearBed(bot);
      }
    } catch (err) {
      console.log('Action error:', err.message);
    }
  }

  function moveToBedArea(bot) {
    if (!bot.pathfinder) return;
    bot.pathfinder.setGoal(new goals.GoalBlock(bedPosition.x, bedPosition.y, bedPosition.z));
  }

  function stayNearBed(bot) {
    if (!bot.pathfinder) return;
    const rx = Math.floor(Math.random() * 5) - 2;
    const rz = Math.floor(Math.random() * 5) - 2;
    bot.pathfinder.setGoal(new goals.GoalBlock(bedPosition.x + rx, bedPosition.y, bedPosition.z + rz));
  }

  bot.on('end', (reason) => {
    console.log(`Bot disconnected (${reason}). Reconnecting in 15 seconds...`);
    setTimeout(createBot, 15000);
  });

  bot.on('error', err => console.log('Bot error:', err.message));
}

createBot();
