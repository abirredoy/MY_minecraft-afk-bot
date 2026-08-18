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

  let spawnPos = null;

  bot.once('spawn', () => {
    console.log('Bot successfully joined!');
    
    // বট যেখানেই নামবে, সেই জায়গাকেই তার 'Home' বানিয়ে নেবে
    spawnPos = bot.entity.position.clone();

    try {
      const defaultMove = new Movements(bot);
      defaultMove.canDig = false;
      bot.pathfinder.setMovements(defaultMove);
    } catch (e) {}

    // প্রতি ৭ সেকেন্ড পর পর সিদ্ধান্ত নেবে
    setInterval(() => {
      handleBotActions(bot);
    }, 7000);
  });

  bot.on('death', () => {
    console.log('Bot died! Respawning...');
    setTimeout(() => {
      try { bot.respawn(); } catch (e) {}
    }, 3000);
  });

  async function handleBotActions(bot) {
    if (!bot || !bot.entity) return;

    // ১. রাত হলে বা বৃষ্টি হলে ঘুমাবে
    if (bot.time && (bot.time.isNight || bot.isRaining)) {
      const bedBlock = bot.findBlock({
        matching: block => bot.isABed(block),
        maxDistance: 6
      });

      if (bedBlock) {
        try {
          // প্রথমে বেডের ব্লকে যাওয়ার জন্য গোল সেট করা হলো
          bot.pathfinder.setGoal(new goals.GoalBlock(bedBlock.position.x, bedBlock.position.y, bedBlock.position.z));
          
          // সামান্য সময় অপেক্ষা করে বেড অ্যাক্টিভেট বা ঘুম দেওয়ার চেষ্টা করবে
          setTimeout(async () => {
            try {
              await bot.sleep(bedBlock);
              console.log('Bot is now sleeping!');
            } catch (err) {
              // যদি সরাসরি sleep না হয়, ব্লক ইউজ করার চেষ্টা করবে
              try {
                await bot.activateBlock(bedBlock);
              } catch (e) {}
            }
          }, 2000);

        } catch (err) {
          console.log('Sleep error:', err.message);
        }
      }
    } else {
      // ২. দিনের বেলা স্পন পয়েন্ট বা বর্তমান অবস্থানের চারপাশে ৩ ব্লক হাঁটাচলা করবে
      if (spawnPos) {
        const rx = Math.floor(Math.random() * 7) - 3; // -৩ থেকে +৩ ব্লক
        const rz = Math.floor(Math.random() * 7) - 3;
        
        try {
          bot.pathfinder.setGoal(new goals.GoalBlock(
            Math.floor(spawnPos.x) + rx,
            Math.floor(spawnPos.y),
            Math.floor(spawnPos.z) + rz
          ));
        } catch (e) {}
      }
    }
  }

  bot.on('end', (reason) => {
    console.log(`Bot disconnected: ${reason}. Reconnecting in 20s...`);
    setTimeout(createBot, 20000);
  });

  bot.on('error', err => console.log('Bot error:', err.message));
}

process.on('uncaughtException', err => console.log('Handled error:', err.message));

createBot();
