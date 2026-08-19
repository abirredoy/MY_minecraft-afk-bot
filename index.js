const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');

function createBot() {
  console.log('Starting bot connection...');

  const bot = mineflayer.createBot({
    host: 'ZenoXForce-Eqqx.aternos.me',
    port: 63435,
    username: 'ADMIN',
    version: '1.21.1',
    checkTimeoutInterval: 120 * 1000
  });

  bot.loadPlugin(pathfinder);

  let currentMode = 'auto'; // ডিফল্টভাবে অটো মোডে থাকবে
  let currentBedPos = null;

  bot.once('spawn', () => {
    console.log('Bot successfully joined!');
    bot.chat('Bot is online! Commands: !auto, !follow, !stop, !sleep');

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

  // অটো মোড লজিক: কাছের বেড খোঁজা, তার চারপাশে ঘোরা এবং ঘুমোনো
  async function runAutoBehavior(bot) {
    if (!bot || !bot.entity || bot.isSleeping) return;

    try {
      // ১. সবচেয়ে কাছের বেড খুঁজে বের করা (যত দূরেই হোক না কেন)
      const bedBlock = bot.findBlock({
        matching: block => bot.isABed(block),
        maxDistance: 64 // অনেক দূর পর্যন্ত স্ক্যান করবে
      });

      if (bedBlock) {
        currentBedPos = bedBlock.position;

        // যদি রাত হয় বা সময় হয়, তবে সরাসরি ঘুমিয়ে পড়বে
        if (bot.time && (bot.time.timeOfDay >= 12500 && bot.time.timeOfDay < 23459)) {
          if (!bot.isSleeping) {
            bot.pathfinder.setGoal(new goals.GoalBlock(currentBedPos.x, currentBedPos.y, currentBedPos.z));
            setTimeout(async () => {
              try {
                await bot.sleep(bedBlock);
              } catch (e) {}
            }, 2000);
            return;
          }
        }

        // ২. দিনের বেলা বেডের আশপাশের এলাকায় এলোমেলো ঘোরাঘুরি করা
        if (!bot.pathfinder.isMoving()) {
          const rx = Math.floor(Math.random() * 9) - 4; // বেডের চারপাশের রেঞ্জ
          const rz = Math.floor(Math.random() * 9) - 4;

          bot.pathfinder.setGoal(new goals.GoalBlock(
            currentBedPos.x + rx,
            currentBedPos.y,
            currentBedPos.z + rz
          ));
        }
      }
    } catch (e) {}
  }

  // চ্যাট কমান্ড হ্যান্ডলার (শুধুমাত্র ZenoXAbir এর কমান্ড শুনবে)
  bot.on('chat', (username, message) => {
    if (username === bot.username) return;
    if (username !== 'ZenoXAbir') return; // অন্য কারো কথা শুনবে না
    if (!message.startsWith('!')) return;

    const command = message.slice(1).toLowerCase().trim();
    console.log(`Command from ZenoXAbir: ${command}`);

    if (command === 'auto') {
      currentMode = 'auto';
      bot.chat('Switched to Auto mode! I am managing myself.');
    }
    else if (command === 'follow') {
      currentMode = 'follow';
      const target = bot.players['ZenoXAbir'] ? bot.players['ZenoXAbir'].entity : null;
      
      if (!target) {
        // যদি players অবজেক্টে না পায়, entities থেকে খুঁজবে
        const playerEntity = Object.values(bot.entities).find(e => e.type === 'player' && e.username === 'ZenoXAbir');
        if (playerEntity) {
          bot.chat('Following you, ZenoXAbir!');
          bot.pathfinder.setGoal(new goals.GoalFollow(playerEntity, 1), true);
          return;
        }
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
        maxDistance: 32
      });

      if (bedBlock) {
        bot.chat('Going to bed now...');
        try {
          bot.pathfinder.setGoal(new goals.GoalBlock(bedBlock.position.x, bedBlock.position.y, bedBlock.position.z));
          setTimeout(async () => {
            try {
              await bot.sleep(bedBlock);
              bot.chat('Good night!');
            } catch (e) {
              bot.chat('Could not sleep right now.');
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
        bot.chat('Stopped and waiting!');
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
    console.log(`Disconnected: ${reason}. Reconnecting...`);
    setTimeout(createBot, 15000);
  });

  bot.on('error', err => {});
}

process.on('uncaughtException', (err) => {});
process.on('unhandledRejection', (reason) => {});

createBot();
