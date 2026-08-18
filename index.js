const mineflayer = require('mineflayer');
const pathfinderPlugin = require('mineflayer-pathfinder').pathfinder;
const Movements = require('mineflayer-pathfinder').Movements;
const goals = require('mineflayer-pathfinder').goals;

// আপনার বর্তমান বেডের লোকেশন
const bedPosition = { x: -92.95, y: 64.00, z: -66.53 };

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
    
    // মুভমেন্টের নিয়ম সহজ করা হলো
    const defaultMove = new Movements(bot);
    defaultMove.canDig = false; // কোনো ব্লক ভাঙবে না
    bot.pathfinder.setMovements(defaultMove);

    // লুপে অ্যাকশন চালানো
    setInterval(() => {
      try {
        handleBotActions(bot);
      } catch (err) {
        console.log('Action Loop Ignored Error:', err.message);
      }
    }, 10000);
  });

  bot.on('death', () => {
    console.log('Bot died! Respawning...');
    setTimeout(() => {
      try { bot.respawn(); } catch (e) {}
    }, 2000);
  });

  async function handleBotActions(bot) {
    if (!bot || !bot.entity) return;

    // রাত বা বৃষ্টি হলে
    if (bot.time && (bot.time.isNight || bot.isRaining)) {
      console.log('Night/Rain detected. Trying to sleep...');
      
      const bedBlock = bot.findBlock({
        matching: block => bot.isABed(block),
        maxDistance: 10
      });

      if (bedBlock) {
        try {
          await bot.sleep(bedBlock);
          console.log('Bot is sleeping.');
        } catch (err) {
          console.log('Sleep failed:', err.message);
        }
      } else {
        // বেডের পাশে না থাকলে হাঁটার চেষ্টা করবে
        safeMove(bot, bedPosition.x, bedPosition.y, bedPosition.z);
      }
    } else {
      // দিনের বেলা হালকা র‍্যান্ডম হাঁটাচলা
      const rx = Math.floor(Math.random() * 3) - 1;
      const rz = Math.floor(Math.random() * 3) - 1;
      safeMove(bot, bedPosition.x + rx, bedPosition.y, bedPosition.z + rz);
    }
  }

  function safeMove(bot, x, y, z) {
    try {
      if (bot.pathfinder) {
        bot.pathfinder.setGoal(new goals.GoalBlock(x, y, z));
      }
    } catch (e) {
      console.log('Pathing Error Ignored:', e.message);
    }
  }

  // ক্র্যাশ হ্যান্ডলিং (যাতে জয়েন করে হুট করে বের না হয়)
  bot.on('end', (reason) => {
    console.log(`Disconnected (${reason}). Reconnecting in 15 seconds...`);
    setTimeout(createBot, 15000);
  });

  bot.on('error', err => console.log('Bot error:', err.message));
}

// কোনো আনহ্যান্ডেল্ড ক্র্যাশ হলে যেন প্রসেস বন্ধ না হয়ে যায়
process.on('uncaughtException', (err) => {
  console.log('Caught exception:', err.message);
});

createBot();
