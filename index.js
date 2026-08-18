const mineflayer = require('mineflayer');

// আপনার বেডের অবস্থান
const BED_X = -88;
const BED_Y = 64;
const BED_Z = -72;

// বারবার দ্রুত রিকানেক্ট রোধ করতে ফ্ল্যাগ
let isReconnecting = false;

function createBot() {
  console.log('Connecting to server...');
  
  const bot = mineflayer.createBot({
    host: 'ZenoXForce-Eqqx.aternos.me',
    port: 63435,
    username: 'ADMIN',
    version: '1.21.1',
    checkTimeoutInterval: 60 * 1000 // ১ মিনিট টাইমআউট দেওয়া হলো যাতে দ্রুত কিক না মারে
  });

  bot.once('spawn', () => {
    console.log('Bot successfully joined and stabilized!');
    isReconnecting = false;

    // প্রতি ১৫ সেকেন্ড পর পর চেক করবে
    setInterval(() => {
      handleBotLogic(bot);
    }, 15000);
  });

  bot.on('death', () => {
    console.log('Bot died! Respawning in 5 seconds...');
    setTimeout(() => {
      try { bot.respawn(); } catch (err) {}
    }, 5000);
  });

  async function handleBotLogic(bot) {
    if (!bot || !bot.entity) return;

    // রাত হলে বা বৃষ্টি পড়লে
    if (bot.time && (bot.time.isNight || bot.isRaining)) {
      const bedBlock = bot.findBlock({
        matching: block => bot.isABed(block),
        maxDistance: 8
      });

      if (bedBlock) {
        try {
          await bot.sleep(bedBlock);
          console.log('Bot is sleeping safely.');
        } catch (err) {
          // ঘুমাতে না পারলে স্বাভাবিক থাকবে
        }
      }
    } else {
      // দিনের বেলা শান্তভাবে সামান্য দৃষ্টিকোণ ঘোরাবে (AFK কিক এড়াতে)
      const yaw = Math.random() * Math.PI * 2;
      bot.look(yaw, 0, true);
    }
  }

  // ডিসকানেক্ট হলে হঠাৎ সাথে সাথে ট্রাই করবে না, ৩০ সেকেন্ড পর একবার ট্রাই করবে
  bot.on('end', (reason) => {
    console.log(`Bot disconnected (${reason}). Waiting 30 seconds before trying again...`);
    
    if (!isReconnecting) {
      isReconnecting = true;
      setTimeout(() => {
        createBot();
      }, 30000); // ৩০ সেকেন্ডের বিরতি
    }
  });

  bot.on('error', (err) => {
    console.log('Connection error:', err.message);
  });
}

process.on('uncaughtException', (err) => {
  console.log('System Handled Exception:', err.message);
});

createBot();
