const mineflayer = require('mineflayer');
const pathfinderPlugin = require('mineflayer-pathfinder').pathfinder;
const Movements = require('mineflayer-pathfinder').Movements;
const goals = require('mineflayer-pathfinder').goals;

function createBot() {
  console.log('Bot starting...');

  const bot = mineflayer.createBot({
    host: 'ZenoXForce-Eqqx.aternos.me',
    port: 63435,
    username: 'ADMIN',
    version: '1.21.1',
    checkTimeoutInterval: 60 * 1000
  });

  bot.loadPlugin(pathfinderPlugin);

  bot.once('spawn', () => {
    console.log('Bot joined successfully!');
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

    const command = message.slice(1).toLowerCase().trim();

    // ১. ফলো কমান্ড: !follow
    if (command === 'follow') {
      const target = bot.players[username] ? bot.players[username].entity : null;
      if (!target) {
        bot.chat(`${username}, I can't see you!`);
        return;
      }

      bot.chat(`Following you, ${username}!`);
      try {
        bot.pathfinder.setGoal(new goals.GoalFollow(target, 1), true);
      } catch (err) {
        console.log('Follow error:', err.message);
      }
    }

    // ২. ঘুমানোর কমান্ড: !sleep (আশেপাশের যেকোনো বেড পেলে ঘুমাবে)
    else if (command === 'sleep') {
      const bedBlock = bot.findBlock({
        matching: block => bot.isABed(block),
        maxDistance: 10
      });

      if (bedBlock) {
        bot.chat('Going to sleep...');
        try {
          await bot.pathfinder.setGoal(new goals.GoalBlock(bedBlock.position.x, bedBlock.position.y, bedBlock.position.z));
          setTimeout(async () => {
            try {
              await bot.sleep(bedBlock);
              bot.chat('Good night!');
            } catch (e) {
              bot.chat('Could not sleep.');
            }
          }, 2000);
        } catch (err) {
          console.log('Sleep error:', err.message);
        }
      } else {
        bot.chat('No bed found nearby!');
      }
    }

    // ৩. থামার কমান্ড: !stop
    else if (command === 'stop') {
      try {
        bot.pathfinder.stop();
        bot.chat('Stopped!');
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
    console.log(`Disconnected: ${reason}. Reconnecting in 20s...`);
    setTimeout(createBot, 20000);
  });

  bot.on('error', err => {
    console.log('Bot error:', err.message);
  });
}

process.on('uncaughtException', (err) => {
  console.log('Error:', err.message);
});

createBot();
