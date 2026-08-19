const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');

function startBot() {
  console.log('Connecting to server...');

  const bot = mineflayer.createBot({
    host: 'ZenoXForce-Eqqx.aternos.me',
    port: 63435,
    username: 'ADMIN',
    version: '1.21.1'
  });

  // পাথফাইন্ডার প্লাগইন লোড করা
  bot.loadPlugin(pathfinder);

  bot.once('spawn', () => {
    console.log('Bot spawned successfully in the world!');
    bot.chat('Bot is online! Ready for ZenoXAbir commands: !follow, !stop, !sleep, !coords');

    // মুভমেন্ট কনফিগারেশন
    try {
      const defaultMove = new Movements(bot);
      defaultMove.canDig = false;
      bot.pathfinder.setMovements(defaultMove);
    } catch (err) {
      console.log('Movement setup error:', err);
    }
  });

  // চ্যাট কমান্ড হ্যান্ডলার (সরাসরি মাইনফ্লায়ারের নিজস্ব চ্যাট ইভেন্ট)
  bot.on('chat', (username, message) => {
    // নিজের মেসেজ ইগনোর করবে
    if (username === bot.username) return;

    console.log(`[CHAT] ${username}: ${message}`);

    // ১. শুধু ZenoXAbir এর কমান্ড ফিল্টার করা
    if (username !== 'ZenoXAbir') return;

    // ২. কমান্ড চেক করা (! দিয়ে শুরু কিনা)
    if (!message.startsWith('!')) return;

    const command = message.slice(1).toLowerCase().trim();
    console.log(`Executing command from ZenoXAbir: ${command}`);

    // ৩. কমান্ড অনুযায়ী কাজ করা
    if (command === 'follow') {
      const targetPlayer = bot.players['ZenoXAbir'];
      if (!targetPlayer || !targetPlayer.entity) {
        bot.chat('ZenoXAbir, I cannot see you nearby!');
        return;
      }

      bot.chat('Following you, ZenoXAbir!');
      const p = targetPlayer.entity.position;
      bot.pathfinder.setGoal(new goals.GoalFollow(targetPlayer.entity, 1), true);
    }
    else if (command === 'stop') {
      try {
        bot.pathfinder.stop();
        bot.clearControlStates();
        bot.chat('Stopped everything!');
      } catch (err) {
        bot.chat('Failed to stop.');
      }
    }
    else if (command === 'sleep') {
      const bedBlock = bot.findBlock({
        matching: block => bot.isABed(block),
        maxDistance: 15
      });

      if (!bedBlock) {
        bot.chat('No bed found nearby!');
        return;
      }

      bot.chat('Heading to bed...');
      bot.pathfinder.setGoal(new goals.GoalBlock(bedBlock.position.x, bedBlock.position.y, bedBlock.position.z));

      bot.once('goal_reached', async () => {
        try {
          await bot.sleep(bedBlock);
          bot.chat('Good night, ZenoXAbir!');
        } catch (err) {
          bot.chat('Could not sleep right now.');
        }
      });
    }
    else if (command === 'coords') {
      const pos = bot.entity.position;
      bot.chat(`My current pos: X: ${Math.floor(pos.x)}, Y: ${Math.floor(pos.y)}, Z: ${Math.floor(pos.z)}`);
    }
  });

  // ডিসকানেক্ট বা ক্র্যাশ হ্যান্ডলিং
  bot.on('kicked', (reason) => console.log('Kicked from server:', reason));
  bot.on('error', (err) => console.log('Bot error:', err));
  
  bot.on('end', () => {
    console.log('Bot disconnected. Reconnecting in 10 seconds...');
    setTimeout(startBot, 10000);
  });
}

// আনহ্যান্ডলড এরর হ্যান্ডেল করার জন্য যাতে প্রজেক্ট ক্র্যাশ না করে
process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.log('Unhandled Rejection:', reason);
});

startBot();
