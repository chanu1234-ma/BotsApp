// 📂 plugins/viewonce.js
const fs = require('fs');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

// Temporary storage for latest View Once message
let lastViewOnceBuffer = null;
let lastViewOnceType = null;

module.exports = async function viewOnceBypass(client) {
  // Listener for incoming messages
  client.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg || !msg.message) return;

    // Detect View Once message
    if (msg.message.viewOnceMessageV2) {
      const viewOnceMsg = msg.message.viewOnceMessageV2.message;
      const type = Object.keys(viewOnceMsg)[0];
      const buffer = await downloadMediaMessage(
        { message: viewOnceMsg },
        'buffer',
        {},
        { logger: client.logger }
      );

      // Save latest view once data to memory
      lastViewOnceBuffer = buffer;
      lastViewOnceType = type;

      console.log('✅ View Once media captured and saved to memory');
    }

    // Detect .vv command
    if (msg.message.conversation?.toLowerCase() === '.vv') {
      if (!lastViewOnceBuffer) {
        await client.sendMessage(msg.key.remoteJid, {
          text: '😕 View Once message එකක් ලැබීලා නැහැ හෝ capture කරලා නැහැ.'
        });
        return;
      }

      const fileName = `vo-${Date.now()}.${lastViewOnceType === 'imageMessage' ? 'jpg' : 'mp4'}`;
      fs.writeFileSync(fileName, lastViewOnceBuffer);

      await client.sendMessage(msg.key.remoteJid, {
        document: lastViewOnceBuffer,
        fileName,
        mimetype: lastViewOnceType === 'imageMessage' ? 'image/jpeg' : 'video/mp4',
        caption: '🧛 View Once එක නැවත උපදවා ගත්තා 😈'
      });
    }
  });
};
