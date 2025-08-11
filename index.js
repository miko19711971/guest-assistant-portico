// index.js — Guest Assistant (Portico d'Ottavia) — EN + Samantha voice
// Server: Node + Express. Client: single-page HTML with TTS (Samantha).

import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();
app.use(cors());
app.use(express.json());

// ---------- Apartment data ----------
const apartment = {
  apartment_id: 'PORTICO1D',
  name: 'Via del Portico d’Ottavia 1D',
  address: 'Via del Portico d’Ottavia 1D, Rome, Italy',
  checkin_time: '15:00',
  checkout_time: '11:00',

  // Wi-Fi
  wifi_note:
    'Router on the chest bench to the right of the bed. SSID and password are on the label on the router.',
  wifi_ssid: 'See router label',
  wifi_password: 'See router label',

  // Water / AC / Bathroom
  water_note: 'Cold water is drinkable. Hot water is always available.',
  ac_note: 'Air conditioning via remote control. Please turn it off when you go out.',
  bathroom_amenities: 'Toilet paper, hand soap, bath mat, hairdryer.',
  towels_note: '1 large + 1 medium towel per guest. Bed is prepared on arrival.',

  // Intercom
  intercom_note: 'At the building door, our unit is the third button from the bottom.',

  // Docs
  registration_note: 'Please send photos of the IDs via WhatsApp for guest registration.',

  // Neighborhood
  eat: "Try Giggetto, Nonna Betta, Ba’Ghetto, Sora Margherita, Il Giardino Romano — all within a few minutes' walk.",
  drink: 'Beppe e i Suoi Formaggi (wine & cheese), Il Goccetto (historic wine bar), Bar del Fico (cocktails).',
  visit:
    'Portico d’Ottavia, Teatro di Marcello, Great Synagogue & Jewish Museum (closed Sat/Jewish holidays), Piazza Mattei (Turtle Fountain), Tiber Island.',
  transport:
    "Tram 8 at 'Arenula/Cairoli' (to Trastevere or Piazza Venezia). Buses from Largo Argentina.",
  services:
    'Luggage: Radical Storage near Largo Argentina. Laundry: Via Arenula 47 (7:00–22:00). Pharmacy: Via Arenula 36.',
  emergency: 'Emergency 112 • Radio Taxi +39 06 3570.',
  host_phone: '+39 335 5245756'
};

// ---------- FAQ templates ----------
const faqs = [
  {
    intent: 'wifi',
    utterances: ['wifi', 'wi-fi', 'internet', 'password', 'router'],
    answer_template: `Wi-Fi: {wifi_note}
Wi-Fi network: {wifi_ssid}. Password: {wifi_password}.`
  },
  {
    intent: 'check in',
    utterances: ['check in', 'arrival', 'self check-in', 'access', 'entrance', 'intercom'],
    answer_template: `Check-in from {checkin_time}.
Intercom: {intercom_note}
Need help? Call {host_phone}.`
  },
  {
    intent: 'check out',
    utterances: ['check out', 'leave', 'departure'],
    answer_template: `Check-out by {checkout_time}. Please leave keys as instructed, turn off lights/AC, and close windows.`
  },
  {
    intent: 'water',
    utterances: ['water', 'hot water', 'drinkable', 'boiler', 'shower'],
    answer_template: `{water_note}`
  },
  {
    intent: 'ac',
    utterances: ['ac', 'air conditioning', 'aircon', 'air conditioner'],
    answer_template: `{ac_note}`
  },
  {
    intent: 'bathroom',
    utterances: ['bathroom', 'hairdryer', 'towels', 'amenities', 'soap'],
    answer_template: `Bathroom: {bathroom_amenities}
Towels: {towels_note}`
  },
  { intent: 'restaurants', utterances: ['restaurant', 'eat', 'food', 'dinner', 'lunch'], answer_template: `{eat}` },
  { intent: 'drink',       utterances: ['bar', 'drink', 'wine', 'aperitivo', 'cocktail'], answer_template: `{drink}` },
  { intent: 'what to visit', utterances: ['what to visit', 'sight', 'see', 'attraction', 'museum'], answer_template: `{visit}` },
  { intent: 'transport',   utterances: ['transport', 'tram', 'bus', 'metro', 'subway'],   answer_template: `{transport}` },
  { intent: 'services',    utterances: ['luggage', 'storage', 'laundry', 'pharmacy', 'sim'], answer_template: `{services}` },
  { intent: 'emergency',   utterances: ['emergency', 'police', 'ambulance', 'taxi'],      answer_template: `{emergency}` }
];

// ---------- OpenAI client ----------
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL  = process.env.OPENAI_MODEL  || 'gpt-4o-mini';
const client = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

// ---------- Helpers ----------
function normalize(s){
  return (s || '')
    .toLowerCase()
    .replace(/[\u2010-\u2015\u2212\u2043\u00ad]/g, '-') // dash variants -> '-'
    .replace(/\s+/g, ' ')
    .trim();
}
function detectIntent(message){
  const text = normalize(message);
  let best = null, bestScore = 0;
  for (const f of faqs){
    let score = 0;
    for (const u of f.utterances) if (text.includes(normalize(u))) score++;
    if (score > bestScore){ best = f; bestScore = score; }
  }
  return bestScore > 0 ? best : null;
}
function fillTemplate(tpl, apt){
  return tpl.replace(/\{(\w+)\}/g, (_, k) => (apt[k] ?? `{${k}}`));
}

async function polishToEnglish(raw, userMessage, apt){
  if (!client) return raw;
  const system =
    'You are a helpful hotel/apartment assistant. ' +
    'ALWAYS reply in clear, simple ENGLISH, even if the user writes in another language. ' +
    'Keep answers concise (~120 words max unless steps are needed). ' +
    'Do not invent details; only use the provided apartment data.';
  try{
    const resp = await client.responses.create({
      model: OPENAI_MODEL,
      input: [
        { role: 'system',    content: system },
        { role: 'developer', content: `Apartment data (JSON): ${JSON.stringify(apt)}` },
        { role: 'user',      content: `Guest asked: ${userMessage || ''}\nRaw answer to refine:\n${raw}` }
      ]
    });
    return resp.output_text || raw;
  }catch(e){
    console.error(e);
    return raw;
  }
}

// ---------- API ----------
app.post('/api/message', async (req, res) => {
  const { message = '' } = req.body || {};
  const matched = detectIntent(message);
  let raw = matched
    ? fillTemplate(matched.answer_template, apartment)
    : "I couldn't find a direct match. Please try a keyword or tap a quick button above.";
  const text = await polishToEnglish(raw, message, apartment);
  res.json({ text, intent: matched?.intent || null });
});

// ---------- UI (single-file HTML + CSS + JS with Samantha voice) ----------
app.get('/', (_req, res) => {
  const quickButtons = [
    'wifi','check in','check out','water','AC','bathroom',
    'restaurants','drink','what to visit','transport','services','emergency'
  ];

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="google" content="notranslate">
<title>Guest Help — Portico d’Ottavia 1D</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#f6f6f6}
  .wrap{max-width:760px;margin:0 auto;min-height:100vh;display:flex;flex-direction:column}
  header{position:sticky;top:0;background:#fff;border-bottom:1px solid #e0e0e0;padding:10px 14px}
  .h-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
  .h-left{display:flex;align-items:center;gap:10px}
  .brand{font-weight:700;color:#a33}
  .apt{margin-left:auto;opacity:.75}
  img.logo{height:36px;width:auto;display:block}
  .controls{display:flex;gap:8px;margin-top:8px}
  #voiceBtn{padding:8px 10px;border:1px solid #ddd;background:#fff;border-radius:10px;cursor:pointer;font-size:14px}
  #voiceBtn[aria-pressed="true"]{background:#2b2118;color:#fff;border-color:#2b2118}
  #voiceSelect{padding:8px 10px;border:1px solid #ddd;border-radius:10px;background:#fff;font-size:14px;max-width:260px}
  main{flex:1;padding:12px}
  .msg{max-width:85%;line-height:1.35;border-radius:12px;padding:10px 12px;margin:8px 0;white-space:pre-wrap}
  .msg.wd{background:#fff;border:1px solid #e0e0e0}
  .msg.me{background:#e8f0fe;border:1px solid #c5d5ff;margin-left:auto}
  .quick{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}
  .quick button{border:1px solid #d6c5b8;background:#fff;color:#333;padding:6px 10px;border-radius:12px;cursor:pointer}
  .quick button:active{transform:translateY(1px)}
  footer{position:sticky;bottom:0;background:#fff;display:flex;gap:8px;padding:10px;border-top:1px solid #e0e0e0}
  input{flex:1;padding:12px;border:1px solid #cbd5e1;border-radius:10px;outline:none}
  #sendBtn{padding:12px 14px;border:1px solid #2b2118;background:#2b2118;color:#fff;border-radius:10px;cursor:pointer}
</style>
</head>
<body class="notranslate">
  <div class="wrap">
    <header>
      <div class="h-row">
        <div class="h-left">
          <img class="logo" src="https://raw.githubusercontent.com/miko19711971/Leonina-chat/main/logo-niceflatinrome.png" alt="NiceFlatInRome">
          <div class="brand">niceflatinrome.com</div>
        </div>
        <div class="apt">Apartment: PORTICO1D</div>
      </div>
      <div class="controls">
        <button id="voiceBtn" aria-pressed="false" title="Toggle voice">🔇 Voice: Off</button>
        <select id="voiceSelect" title="Choose voice"></select>
      </div>
    </header>

    <main id="chat" aria-live="polite"></main>

    <footer>
      <input id="input" placeholder="Type a message… e.g., wifi, check in, transport" autocomplete="off">
      <button id="sendBtn">Send</button>
    </footer>
  </div>

<script>
  const chatEl = document.getElementById('chat');
  const input  = document.getElementById('input');
  const sendBtn= document.getElementById('sendBtn');

  // ---------- Voice (English only; prefer Samantha) ----------
  let voiceOn = false;
  let voices = [];
  let pickedVoice = null;
  const voiceBtn = document.getElementById('voiceBtn');
  const voiceSelect = document.getElementById('voiceSelect');

  function chooseSamanthaFirst(list){
    // Prefer Samantha Enhanced/Siri if present
    const sams = list.filter(v => /samantha/i.test(v.name));
    if (sams.length) return sams[0];
    return list[0] || null;
  }

  function loadVoices(){
    voices = window.speechSynthesis ? (window.speechSynthesis.getVoices() || []) : [];
    const allowed = voices.filter(v => /en-/i.test(v.lang));
    pickedVoice = chooseSamanthaFirst(allowed) || voices[0] || null;

    // Populate select with ONLY English voices (keeps it short)
    voiceSelect.innerHTML = '';
    allowed.forEach(v => {
      const o = document.createElement('option');
      o.value = v.name;
      o.textContent = v.name + ' (' + v.lang + ')';
      voiceSelect.appendChild(o);
    });
    if (pickedVoice) voiceSelect.value = pickedVoice.name;
  }
  if ('speechSynthesis' in window){
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }

  function warmUpSpeak(){
    try{
      const u = new SpeechSynthesisUtterance('Voice enabled.');
      if (pickedVoice) u.voice = pickedVoice;
      u.lang = 'en-US';
      const resumeHack = setInterval(()=>{
        if (speechSynthesis.speaking) speechSynthesis.resume(); else clearInterval(resumeHack);
      }, 200);
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    }catch(e){ console.warn('Warm-up error', e); }
  }
  function speak(text){
    if (!voiceOn || !('speechSynthesis' in window)) return;
    try{
      const u = new SpeechSynthesisUtterance(text);
      if (pickedVoice) u.voice = pickedVoice;
      u.lang = 'en-US';
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    }catch(e){ console.warn('TTS error', e); }
  }
  voiceBtn.addEventListener('click', ()=>{
    voiceOn = !voiceOn;
    voiceBtn.setAttribute('aria-pressed', String(voiceOn));
    voiceBtn.textContent = voiceOn ? '🔊 Voice: On' : '🔇 Voice: Off';
    if (voiceOn) warmUpSpeak();
  });
  voiceSelect.addEventListener('change', ()=>{
    const name = voiceSelect.value;
    const list = window.speechSynthesis.getVoices() || [];
    pickedVoice = list.find(v => v.name === name) || pickedVoice;
  });

  // ---------- UI helpers ----------
  function add(type, txt){
    const d = document.createElement('div');
    d.className = 'msg ' + (type==='me' ? 'me' : 'wd');
    d.textContent = txt;
    chatEl.appendChild(d);
    chatEl.scrollTop = chatEl.scrollHeight;
  }
  function renderWelcome(){
    add('wd','Welcome! I can help with Wi-Fi, check-in/out, water/AC, bathroom, restaurants & drinks, what to visit, transport, services, emergency. (English)');
    const q = document.createElement('div'); q.className = 'quick';
    const items = ${JSON.stringify(quickButtons)};
    for (const it of items){
      const b = document.createElement('button'); b.textContent = it;
      b.addEventListener('click', ()=>{ input.value = it; send(); });
      q.appendChild(b);
    }
    chatEl.appendChild(q);
  }

  // ---------- Send ----------
  async function send(){
    const text = (input.value || '').trim();
    if (!text) return;
    add('me', text);
    input.value = '';
    try{
      const r = await fetch('/api/message', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ message: text })
      });
      const data = await r.json();
      const botText = data.text || 'Sorry, something went wrong.';
      add('wd', botText);
      speak(botText);
    }catch(e){
      add('wd', 'Network error. Please try again.');
    }
  }
  sendBtn.addEventListener('click', send);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });

  renderWelcome();
</script>
</body>
</html>`;
  res.setHeader('content-type','text/html; charset=utf-8');
  res.end(html);
});

// ---------- Start ----------
const port = process.env.PORT || 8787;
app.listen(port, () => console.log('Guest assistant up on http://localhost:' + port));
