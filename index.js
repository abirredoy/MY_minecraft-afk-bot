const mineflayer = require('mineflayer');
const pathfinderPlugin = require('mineflayer-pathfinder').pathfinder;
const Movements = require('mineflayer-pathfinder').Movements;
const goals = require('mineflayer-pathfinder').goals;

function createBot() {
  console.log('Starting bot connection...');

  const bot = mineflayer.createBot({
    host: 'ZenoXForce-Eqqx.aternos.me',
    port: 63435,
    username: 'ADMIN',
    version: '1.21.1',
    checkTimeoutInterval: 120 * 1000
  });

  bot.loadPlugin(pathfinderPlugin);

  let homePos = null;
  let currentMode = 'auto'; // ডিফল্টভাবে অটো মোডে থাকবে

  bot.once('spawn', () => {
    console.log('Bot successfully joined!');
    bot.chat('Bot is online! Commands: !auto, !follow, !stop, !sleep');

    // বট যেখানে স্পন হবে সেটাই তার হোম লোকেশন
    homePos = bot.entity.position.clone();

    try {
      const defaultMove = new Movements(bot);
      defaultMove.canDig = false;
      bot.pathfinder.setMovements(defaultMove);
    } catch (e) {}

    // অটো মোডের জন্য প্রতি ৬ সেকেন্ড পরপর লুপ চলবে
    setInterval(() => {
      if (currentMode === 'auto') {
        runAutoBehavior(bot);
      }
    }, 6000);
  });

  // অটো মোডের কাজ: একা একা হাঁটা বা রাত হলে ঘুমানো
  async function runAutoBehavior(bot) {
    if (!bot || !bot.entity) return;

    // ১. রাত বা বৃষ্টি হলে নিজে থেকে ঘুমাবে
    if (bot.time && (bot.time.isNight || bot.isRaining)) {
      const bedBlock = bot.findBlock({
        matching: block => bot.isABed(block),
        maxDistance: 10
      });

      if (bedBlock && !bot.isSleeping) {
        try {
          bot.pathfinder.setGoal(new goals.GoalBlock(bedBlock.position.x, bedBlock.position.y, bedBlock.position.z));
          setTimeout(async () => {
            try {
              await bot.sleep(bedBlock);
            } catch (e) {}
          }, 2000);
          return;
        } catch (e) {}
      }
    }

    // ২. দিনের বেলা হোম পজিশনের চারপাশে এলোমেলো হাঁটাচলা করবে
    if (homePos && !bot.pathfinder.isMoving()) {
      const rx = Math.floor(Math.random() * 7) - 3; // -৩ থেকে +৩ ব্লক
      const rz = Math.floor(Math.random() * 7) - 3;

      try {
        bot.pathfinder.setGoal(new goals.GoalBlock(
          Math.floor(homePos.x) + rx,
          Math.floor(homePos.y),
          Math.floor(homePos.z) + rz
        ));
      } catch (e) {}
    }
  }

  // চ্যাট কমান্ড হ্যান্ডলার
  bot.on('chat', async (username, message) => {
    if (username === bot.username) return;
    if (!message.startsWith('!')) return;

    const command = message.slice(1).toLowerCase().trim();

    // ১. অটো মোড: !auto
    if (command === 'auto') {
      currentMode = 'auto';
      bot.chat('Switched to Auto mode! I will roam and sleep automatically.');
    }

    // ২. ফলো মোড: !follow
    else if (command === 'follow') {
      currentMode = 'follow';
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

    // ৩. স্লিপ কমান্ড: !sleep
    else if (command === 'sleep') {
      currentMode = 'manual';
      const bedBlock = bot.findBlock({
        matching: block => bot.isABed(block),
        maxDistance: 12
      });

      if (bedBlock) {
        bot.chat('Going to bed...');
        try {
          bot.pathfinder.setGoal(new goals.GoalBlock(bedBlock.position.x, bedBlock.position.y, bedBlock.position.z));
          setTimeout(async () => {
            try {
              await bot.sleep(bedBlock);
              bot.chat('Good night!');
            } catch (e) {
              bot.chat('Could not sleep.');
            }
          }, 2000);
        } catch (err) {}
      } else {
        bot.chat('No bed found nearby!');
      }
    }

    // ৪. স্টপ কমান্ড: !stop
    else if (command === 'stop') {
      currentMode = 'stop';
      try {
        bot.pathfinder.stop();
        bot.chat('Stopped and waiting!');
      } catch (err) {}
    }
  });

  bot.on('death', () => {
    console.log('Bot died! Respawning...');
    setTimeout(() => {
      try { bot.respawn(); } catch (e) {}
    }, 4000);
  });

  bot.on('end', (reason) => {
    console.log(`Disconnected: ${reason}. Reconnecting in 30s...`);
    setTimeout(createBot, 30000);
  });

  bot.on('error', err => {
    console.log('Bot error:', err.message);
  });
}

process.on('uncaughtException', (err) => {});
process.on('unhandledRejection', (reason) => {});

createBot();
