// ADD THIS AT THE TOP OF YOUR index.js
const express = require('express');
const app = express();
app.get('/', (_, res) => res.send('WhatsApp Bot is running!'));
app.listen(process.env.PORT || 3000, () => console.log("Web server running"));

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { appendRow } = require('./sheets');

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

let userState = {}; // Store temporary responses per user

console.log("🚀 WhatsApp bot starting...");

client.on('qr', qr => {
  console.log('📱 Scan this QR Code using WhatsApp:');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('✅ Bot is ready to receive messages.');
});

client.on('message', async msg => {
  const message = msg.body.trim().toLowerCase();
  const sender = msg.from;
  const name = msg._data?.notifyName || msg._data?.pushName || "Unknown";
  const phone = sender.split('@')[0];
  const timestamp = new Date().toLocaleString();

  if (message === 'hi') {
    await msg.reply("👋 Hi! We’re hiring at InsuranceDekho.\nTo apply, reply with: `Apply JD001` or `Apply JD002` depending on your preferred role.");
    return;
  }

  if (message.startsWith("apply jd")) {
    const jdId = message.toUpperCase().split(" ")[1];
    userState[sender] = { name, phone, jdId, step: 'insurance_exp' };
    await msg.reply("Do you have experience in General Insurance?\nReply with 'Yes' or 'No'.");
    return;
  }

  const state = userState[sender];
  if (!state) return;

  // General Insurance path branching
  if (state.step === 'insurance_exp') {
    if (message === 'yes') {
      state.flow = 'insurance';
      state.step = 'product';
      return await msg.reply("Which Product?\na) Motor Insurance\nb) Life Insurance\nc) Health Insurance\nd) Other (specify)");
    } else if (message === 'no') {
      state.flow = 'standard';
      state.step = 'skills';
      return await msg.reply("No problem! Select your top skill:\n1. Communication\n2. Leadership\n3. Data Analysis\n4. Negotiation\n5. Teamwork");
    } else {
      return await msg.reply("❌ Invalid input. Reply with 'Yes' or 'No'.");
    }
  }

  // Flow: Insurance-specific questions
  if (state.flow === 'insurance') {
    switch (state.step) {
      case 'product':
        state.product = msg.body;
        state.step = 'channel';
        return await msg.reply("Which Channel?\na) Agency Channel\nb) Bancassurance\nc) Direct channel\nd) Other (specify)");
      case 'channel':
        state.channel = msg.body;
        if (!message.includes('agency')) {
          delete userState[sender];
          return await msg.reply("❌ Only Agency Channel experience is currently eligible. Thank you!");
        }
        state.step = 'experience';
        return await msg.reply("How many years of experience in Agency channel?\na) 0-6 Months\nb) 1-2 Years");
      case 'experience':
        state.experience = msg.body;
        state.step = 'location';
        return await msg.reply("What is your current location?");
      case 'location':
        state.location = msg.body;
        state.step = 'ctc';
        return await msg.reply("What is your fixed CTC?");
      case 'ctc':
        state.ctc = msg.body;
        state.step = 'expectation';
        return await msg.reply("What is your salary expectation?");
      case 'expectation':
        state.expectation = msg.body;
        state.step = 'dob';
        return await msg.reply("What is your Date of Birth? (DD-MM-YYYY)");
      case 'dob':
        state.dob = msg.body;
        await appendRow([
          state.name,
          state.phone,
          state.jdId,
          '', '', '', '', '',
          state.product,
          state.channel,
          state.experience,
          state.location,
          state.ctc,
          state.expectation,
          state.dob,
          timestamp
        ]);
        delete userState[sender];
        return await msg.reply("✅ Info received. Thank you!");
    }
  }

  // Flow: Standard dropdown questions
  if (state.flow === 'standard') {
    const skillMap = {
      '1': 'Communication',
      '2': 'Leadership',
      '3': 'Data Analysis',
      '4': 'Negotiation',
      '5': 'Teamwork'
    };
    const toolMap = {
      '1': 'Excel',
      '2': 'Power BI',
      '3': 'Python',
      '4': 'Salesforce',
      '5': 'SQL'
    };
    const domainMap = {
      '1': 'Sales',
      '2': 'Marketing',
      '3': 'Operations',
      '4': 'Technology',
      '5': 'HR'
    };
    const educationMap = {
      '1': '12th Pass',
      '2': 'Graduate',
      '3': 'Postgraduate',
      '4': 'MBA',
      '5': 'Other'
    };

    switch (state.step) {
      case 'skills':
        if (skillMap[message]) {
          state.skills = skillMap[message];
          state.step = 'tools';
          return await msg.reply("Select your primary tool/technology:\n1. Excel\n2. Power BI\n3. Python\n4. Salesforce\n5. SQL");
        } else {
          return await msg.reply("❌ Invalid input. Reply with a number from 1 to 5.");
        }
      case 'tools':
        if (toolMap[message]) {
          state.tools = toolMap[message];
          state.step = 'domain';
          return await msg.reply("Select your domain:\n1. Sales\n2. Marketing\n3. Operations\n4. Technology\n5. HR");
        } else {
          return await msg.reply("❌ Invalid input. Reply with a number from 1 to 5.");
        }
      case 'domain':
        if (domainMap[message]) {
          state.domain = domainMap[message];
          state.step = 'education';
          return await msg.reply("Select your highest qualification:\n1. 12th Pass\n2. Graduate\n3. Postgraduate\n4. MBA\n5. Other");
        } else {
          return await msg.reply("❌ Invalid input. Reply with a number from 1 to 5.");
        }
      case 'education':
        if (educationMap[message]) {
          state.education = educationMap[message];
          await appendRow([
            state.name,
            state.phone,
            state.jdId,
            '',
            state.skills,
            state.tools,
            state.domain,
            state.education,
            '', '', '', '', '', '', '',
            timestamp
          ]);
          delete userState[sender];
          return await msg.reply("✅ Info received. Thank you!");
        } else {
          return await msg.reply("❌ Invalid input. Reply with a number from 1 to 5.");
        }
    }
  }
});

client.initialize();