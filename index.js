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
  let currentMode = 'auto'; // ডিফল্ট অটো মোড

  bot.once('spawn', () => {
    console.log('Bot successfully joined!');
    bot.chat('Bot is online! Only ZenoXAbir can control me. Commands: !auto, !follow, !stop, !sleep');

    homePos = bot.entity.position.clone();

    try {
      const defaultMove = new Movements(bot);
      defaultMove.canDig = false;
      bot.pathfinder.setMovements(defaultMove);
    } catch (e) {}

    // অটো মোড লুপ (প্রতি ৫ সেকেন্ড পর পর চেক করবে)
    setInterval(() => {
      if (currentMode === 'auto') {
        runAutoBehavior(bot);
      }
    }, 5000);
  });

  // অটো মোড বিহেভিয়ার
  async function runAutoBehavior(bot) {
    if (!bot || !bot.entity || bot.isSleeping) return;

    // ১. বেড খুঁজে ঘুমানোর চেষ্টা করা
    try {
      const bedBlock = bot.findBlock({
        matching: block => bot.isABed(block),
        maxDistance: 12
      });

      if (bedBlock) {
        bot.pathfinder.setGoal(new goals.GoalBlock(bedBlock.position.x, bedBlock.position.y, bedBlock.position.z));
        setTimeout(async () => {
          try {
            if (!bot.isSleeping) {
              await bot.sleep(bedBlock);
            }
          } catch (e) {}
        }, 2000);
        return;
      }
    } catch (e) {}

    // ২. বেড না পেলে হোম পজিশনের চারপাশে এলোমেলো হাঁটা
    if (homePos && !bot.pathfinder.isMoving()) {
      const rx = Math.floor(Math.random() * 9) - 4;
      const rz = Math.floor(Math.random() * 9) - 4;

      try {
        bot.pathfinder.setGoal(new goals.GoalBlock(
          Math.floor(homePos.x) + rx,
          Math.floor(homePos.y),
          Math.floor(homePos.z) + rz
        ));
      } catch (e) {}
    }
  }

  // ফিক্সড চ্যাট কমান্ড হ্যান্ডলার
  bot.on('message', (jsonMsg) => {
    const chatText = jsonMsg.toString();
    
    if (!chatText.includes('<') || !chatText.includes('>')) return;
    
    const parts = chatText.split('>');
    const senderPart = parts[0].replace('<', '').trim();
    const username = senderPart.split(' ').pop(); 
    const message = parts.slice(1).join('>').trim();

    // শুধুমাত্র ZenoXAbir এর কমান্ড শুনবে
    if (username !== 'ZenoXAbir') return;
    if (!message.startsWith('!')) return;

    const command = message.slice(1).toLowerCase().trim();
    console.log(`Command received from ZenoXAbir: ${command}`);

    if (command === 'auto') {
      currentMode = 'auto';
      bot.chat('Switched to Auto mode!');
    }
    else if (command === 'follow') {
      currentMode = 'follow';
      
      let target = null;
      if (bot.players['ZenoXAbir'] && bot.players['ZenoXAbir'].entity) {
        target = bot.players['ZenoXAbir'].entity;
      } else {
        const playerEntity = Object.values(bot.entities).find(e => e.type === 'player' && e.username === 'ZenoXAbir');
        if (playerEntity) target = playerEntity;
      }

      if (!target) {
        bot.chat('ZenoXAbir, I can\'t see you nearby!');
        return;
      }

      bot.chat('Following you, ZenoXAbir!');
      try {
        bot.pathfinder.setGoal(new goals.GoalFollow(target, 1), true);
      } catch (err) {}
    }
    else if (command === 'sleep') {
      currentMode = 'manual';
      const bedBlock = bot.findBlock({
        matching: block => bot.isABed(block),
        maxDistance: 15
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
    else if (command === 'stop') {
      currentMode = 'stop';
      try {
        bot.pathfinder.stop();
        bot.chat('Stopped!');
      } catch (err) {}
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

  bot.on('error', err => {});
}

process.on('uncaughtException', (err) => {});
process.on('unhandledRejection', (reason) => {});

createBot();
