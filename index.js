const mineflayer = require('mineflayer');
const pathfinderPlugin = require('mineflayer-pathfinder').pathfinder;
const Movements = require('mineflayer-pathfinder').Movements;
const goals = require('mineflayer-pathfinder').goals;

function createBot() {
  const bot = mineflayer.createBot({
    host: 'ZenoXForce-Eqqx.aternos.me',
    port: 63435,
    username: 'ADMIN',
    version: '1.21.1',
    checkTimeoutInterval: 60 * 1000
  });

  bot.loadPlugin(pathfinderPlugin);

  bot.once('spawn', () => {
    console.log('Bot successfully joined!');
    bot.chat('Bot is online! Commands: !follow, !sleep, !stop');

    try {
      const defaultMove = new Movements(bot);
      defaultMove.canDig = false;
      bot.pathfinder.setMovements(defaultMove);
    } catch (e) {}
  });

  // কমান্ড হ্যান্ডলার
  bot.on('chat', async (username, message) => {
    if (username === bot.username) return;
    if (!message.startsWith('!')) return;

    const args = message.slice(1).toLowerCase().trim().split(' ');
    const command = args[0];

    // ১. ফলো কমান্ড: !follow
    if (command === 'follow') {
      try {
        const targetPlayer = bot.players[username];
        if (!targetPlayer || !targetPlayer.entity) {
          bot.chat(`${username}, I can't see you right now!`);
          return;
        }

        bot.chat(`Following ${username}!`);
        bot.pathfinder.setGoal(new goals.GoalFollow(targetPlayer.entity, 1), true);
      } catch (err) {
        console.log('Follow error:', err.message);
        bot.chat('Failed to follow.');
      }
    }

    // ২. ঘুমানোর কমান্ড: !sleep
    else if (command === 'sleep') {
      try {
        const bedBlock = bot.findBlock({
          matching: block => bot.isABed(block),
          maxDistance: 10
        });

        if (bedBlock) {
          bot.chat('Going to bed...');
          bot.pathfinder.setGoal(new goals.GoalBlock(bedBlock.position.x, bedBlock.position.y, bedBlock.position.z));
          
          setTimeout(async () => {
            try {
              await bot.sleep(bedBlock);
              bot.chat('Good night!');
            } catch (e) {
              bot.chat('Could not sleep in the bed.');
            }
          }, 2500);
        } else {
          bot.chat('No bed found nearby!');
        }
      } catch (err) {
        console.log('Sleep error:', err.message);
      }
    }

    // ৩. থামার কমান্ড: !stop
    else if (command === 'stop') {
      try {
        if (bot.pathfinder) {
          bot.pathfinder.stop();
        }
        bot.chat('Stopped moving!');
      } catch (err) {
        console.log('Stop error:', err.message);
      }
    }
  });

  bot.on('death', () => {
    console.log('Bot died! Respawning...');
    setTimeout(() => {
      try { bot.respawn(); } catch (e) {}
    }, 3000);
  });

  bot.on('end', (reason) => {
    console.log(`Bot disconnected: ${reason}. Reconnecting in 20s...`);
    setTimeout(createBot, 20000);
  });

  bot.on('error', err => console.log('Bot error:', err.message));
}

// গেম ক্র্যাশ রোধ করার গ্লোবাল হ্যান্ডলার
process.on('uncaughtException', (err) => {
  console.log('Caught unhandled exception:', err.message);
});

process.on('unhandledRejection', (reason, promise) => {
  console.log('Caught unhandled rejection:', reason);
});

createBot();
