const mineflayer = require('mineflayer');
const pathfinderPlugin = require('mineflayer-pathfinder').pathfinder;
const Movements = require('mineflayer-pathfinder').Movements;
const goals = require('mineflayer-pathfinder').goals;

// আপনার মাইনক্রাফট ইউজারনেম এখানে লিখে দিতে পারেন (যাতে শুধু আপনিই কমান্ড দিতে পারেন)
const OWNER_USERNAME = ''; // অথবা আপনার ইন-গেম নাম এখানে বসাতে পারেন (খালি রাখলে যেকেউ প্রিফিক্স দিয়ে কমান্ড দিতে পারবে)

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
    console.log('Bot successfully joined and ready for secure commands!');
    bot.chat('Bot is online! Use !follow, !sleep, or !stop');

    try {
      const defaultMove = new Movements(bot);
      defaultMove.canDig = false;
      bot.pathfinder.setMovements(defaultMove);
    } catch (e) {}
  });

  // সিকিউর চ্যাট কমান্ড হ্যান্ডলার
  bot.on('chat', async (username, message) => {
    if (username === bot.username) return;

    // কমান্ডের শুরুতে অবশ্যই '!' থাকতে হবে (যেমন: !follow)
    if (!message.startsWith('!')) return;

    const args = message.slice(1).toLowerCase().trim().split(' ');
    const command = args[0];

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
      } catch (e) {
        bot.chat('Could not follow.');
      }
    }

    // ২. ঘুমানোর কমান্ড: !sleep
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
            } catch (err) {
              bot.chat('Failed to sleep.');
            }
          }, 3000);
        } catch (e) {
          bot.chat('Path to bed failed.');
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
      } catch (e) {}
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

process.on('uncaughtException', err => console.log('Handled error:', err.message));

createBot();
