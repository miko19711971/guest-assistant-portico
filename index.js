// index.js — Guest Assistant (Via del Portico d’Ottavia 1D) — EN + Samantha voice

import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();
app.use(cors());
app.use(express.json());

// serve static files (logo, favicon, etc.)
app.use(express.static('.'));

// ---------- Apartment data (Portico d’Ottavia 1D) ----------
const apartment = {
  apartment_id: 'PORTICO1D',
  name: 'Via del Portico d’Ottavia 1D',
  address: 'Via del Portico d’Ottavia 1D, Rome, Italy',
  checkin_time: '15:00',
  checkout_time: '11:00',

  // Wi‑Fi
  wifi_note:
    "Look at the bed: on the right side there’s a chest bench with the router on top. SSID and password are on the label attached to the router.",
  wifi_ssid: 'See router label',
  wifi_password: 'See router label',

  // Water / AC / Bathroom / Towels
  water_note: 'Tap water is safe to drink. Hot water is always available.',
  ac_note: 'Air conditioning works via remote control. Please turn it OFF when you go out.',
  bathroom_amenities: 'Toilet paper, hand soap, bath mat, hairdryer.',
  towels_note: 'Per guest: 1 large + 1 medium towel. Bed is prepared on arrival.',

  // Kitchen (fully equipped; no special gas steps in your guide)
  kitchen_note: 'Kitchen is fully equipped for your needs.',

  // Building & Access
  intercom_note:
    'At the building door, our unit is the third button from the bottom.',
  registration_note:
    'Please send photos of two identity documents via WhatsApp for guest registration (required by law).',

  // Assistance
  host_phone: '+39 335 5245756',

  // Services nearby (from your files)
  supermarkets:
    'Carrefour Express – Via Arenula 41 • Conad City – Via di Santa Maria del Pianto 4 • Punto Simply – Via dei Falegnami 4',
  pharmacies:
    'Farmacia della Reginella – Via della Reginella 25 • Farmacia Internazionale – Largo Arenula 14 (English speaking) • Farmacia San Salvatore – Piazza della Enciclopedia Italiana 53',
  luggage: 'Radical Storage – Largo di Torre Argentina (5 min walk)',
  laundry: 'Self‑service laundry – Via Arenula 47',
  hospital: 'Fatebenefratelli Hospital – Tiber Island',
  atms: 'Unicredit (Largo Arenula 1) • BNL (Via Arenula 41) • Intesa (Via Arenula 27)',

  // Transport
  transport:
    "Tram 8 (stop: Arenula/Cairoli) → Trastevere or Piazza Venezia. Buses from Largo Argentina. Taxi: +39 06 3570 or use FreeNow app.",
  airports:
    "Fiumicino: Tram 8 → Trastevere Station → FL1 train (~45 min). Ciampino: Terravision bus or taxi. Private transfer: Welcome Pickups.",

  // Safety & useful numbers
  emergency:
    "EU Emergency 112 • Police 113 • Ambulance 118 • Fire 115 • English‑speaking doctor +39 06 488 2371 • 24h vet +39 06 660 681",

  // Eat / Drink / Shop
  eat:
    "Giggetto al Portico d’Ottavia • Ba’Ghetto (Main & Bistrot) • Nonna Betta • Rimessa Roscioli • Il Giardino Romano • Sora Margherita • Yotvata (dairy, kosher).",
  drink:
    "Beppe e i Suoi Formaggi (wine & cheese) • Il Goccetto (historic wine bar) • Bar del Fico (cocktails) • Caffè del Portico • Bibliothè (tea room) • Antico Caffè del Teatro di Marcello.",
  shop:
    "Via del Portico d’Ottavia (artisan shops & kosher bakeries) • Forno Boccione (no sign outside) • Via Arenula boutiques • Jewish Bookstore • Kosher Delight • Fish stalls at Piazza Costaguti (mornings).",

  // What to visit & Hidden gems
  visit:
    "Portico d’Ottavia • Teatro di Marcello • Great Synagogue of Rome & Jewish Museum (closed Sat & Jewish holidays; museum usually 10:00–17:00) • Piazza Mattei (Turtle Fountain) • Tiber Island.",
  hidden_gems:
    "Torre dei Grassi • Ponte Emilio “Ponte Rotto” (single remaining arch) • Via della Reginella (Rome’s narrow street).",

  // Experiences & walks
  experiences:
    "Guided tours in the Jewish Ghetto • Jewish‑Roman food tastings • Evening walk to Campo de’ Fiori & Piazza Navona • Photo walk through hidden squares • Bike ride around Tiber Island.",

  // Day trips
  daytrips:
    "Ostia Antica (~40 min) • Tivoli (Villa d’Este & Hadrian’s Villa ~1h) • Castelli Romani (villages & wine).",

  // Check‑out
  checkout_note:
    "Before leaving: turn off lights/AC, close windows, leave keys on the table, gently close the door."
};

// ---------- FAQ (keyword → template) ----------
const faqs = [
  { intent: 'wifi', utterances: ['wifi','wi-fi','internet','password','router'],
    answer_template: `Wi‑Fi: {wifi_note}\nNetwork: {wifi_ssid}. Password: {wifi_password}.` },

  { intent: 'check in', utterances: ['check in','arrival','self check-in','access','entrance','intercom','doorbell'],
    answer_template: `Check‑in from {checkin_time}.\nIntercom: {intercom_note}\nRegistration: {registration_note}\nNeed help? Call {host_phone}.` },

  { intent: 'check out', utterances: ['check out','leave','departure'],
    answer_template: `{checkout_note}` },

  { intent: 'water', utterances: ['water','hot water','drinkable','tap','shower'],
    answer_template: `{water_note}` },

  { intent: 'ac', utterances: ['ac','air conditioning','aircon','air conditioner'],
    answer_template: `{ac_note}` },

  { intent: 'bathroom', utterances: ['bathroom','hairdryer','towels','amenities','soap'],
    answer_template: `Bathroom: {bathroom_amenities}\nTowels: {towels_note}` },

  { intent: 'kitchen', utterances: ['kitchen','cook','cooking','stove'],
    answer_template: `{kitchen_note}` },

  { intent: 'services', utterances: ['pharmacy','hospital','atm','sim','laundry','luggage','supermarket','groceries'],
    answer_template:
`Supermarkets: {supermarkets}
Pharmacies: {pharmacies}
Hospital: {hospital}
ATMs: {atms}
Laundry: {laundry}
Luggage storage: {luggage}` },

  { intent: 'transport', utterances: ['transport','tram','bus','taxi','airport','train','metro'],
    answer_template: `{transport}\nAirports: {airports}` },

  { intent: 'eat', utterances: ['eat','restaurant','dinner','lunch','food'],
    answer_template: `{eat}` },

  { intent: 'drink', utterances: ['drink','bar','wine','cocktail','aperitivo'],
    answer_template: `{drink}` },

  { intent: 'shop', utterances: ['shop','market','shopping','bakeries','kosher'],
    answer_template: `{shop}` },

  { intent: 'visit', utterances: ['what to visit','see','sight','attraction','museum','synagogue'],
    answer_template: `{visit}` },

  { intent: 'hidden gems', utterances: ['hidden','secret','gem','less-known','off the beaten path'],
    answer_template: `{hidden_gems}` },

  { intent: 'experience', utterances: ['experience','walk','tour','itinerary','sunset','photo'],
    answer_template: `{experiences}` },

  { intent: 'day trips', utterances: ['day trip','tivoli','ostia','castelli','excursion'],
    answer_template: `{daytrips}` },

  { intent: 'emergency', utterances: ['emergency','police','ambulance','fire','doctor','vet'],
    answer_template: `{emergency}` }
];

// ---------- OpenAI polish (force EN) ----------
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const client = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

function norm(s){ return (s||'').toLowerCase().replace(/\s+/g,' ').trim(); }
function detectIntent(msg){
  const t = norm(msg); let best=null, scoreBest=0;
  for (const f of faqs){
    let s=0; for (const u of f.utterances){ if (t.includes(norm(u))) s++; }
    if (s>scoreBest){ best=f; scoreBest=s; }
  }
  return scoreBest>0 ? best : null;
}
function fill(tpl, obj){ return tpl.replace(/\{(\w+)\}/g,(_,k)=>obj[k] ?? `{${k}}`); }

async function polishEN(raw, userMsg){
  if (!client) return raw;
  const sys = 'You are a concise hotel/apartment assistant. ALWAYS answer in clear English. Keep facts as given; do not invent. Max ~120 words unless steps are needed.';
  try{
    const r = await client.responses.create({
      model: OPENAI_MODEL,
      input: [
        { role:'system', content: sys },
        { role:'developer', content: `Apartment data: ${JSON.stringify(apartment)}` },
        { role:'user', content: `Guest asked: ${userMsg}\nDraft answer:\n${raw}` }
      ]
    });
    return r.output_text || raw;
  }catch{ return raw; }
}

// ---------- API ----------
app.post('/api/message', async (req,res)=>{
  const { message='' } = req.body || {};
  const m = detectIntent(message);
  let raw = m ? fill(m.answer_template, apartment)
              : 'I did not find a direct answer. Try a quick button or use keywords (wifi, transport, eat, museum…).';
  const text = await polishEN(raw, message);
  res.json({ text, intent: m?.intent || null });
});

// ---------- UI (single file) ----------
app.get('/', (_req,res)=>{
  const buttons = [
    'wifi','check in','check out','water','AC','bathroom','kitchen',
    'eat','drink','shop','visit','hidden gems','experience','day trips',
    'transport','services','emergency'
  ];
  const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Guest Help — Via del Portico d’Ottavia 1D</title>
<link rel="icon" type="image/png" href="logo-niceflatinrome.jpg">
<style>
*{box-sizing:border-box} body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#f6f6f6}
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
</style></head>
<body>
<div class="wrap">
  <header>
    <div class="h-row">
      <div class="h-left">
        <img class="logo" src="logo-niceflatinrome.jpg" alt="NiceFlatInRome">
        <div class="brand">niceflatinrome.com</div>
      </div>
      <div class="apt">Apartment: PORTICO1D</div>
    </div>
    <div class="controls">
      <button id="voiceBtn" aria-pressed="false" title="Toggle voice">🔇 Voice: Off</button>
    </div>
  </header>

  <main id="chat" aria-live="polite"></main>

  <footer>
    <input id="input" placeholder="Type a message… e.g., wifi, transport, eat" autocomplete="off">
    <button id="sendBtn">Send</button>
  </footer>
</div>
<script>
const chatEl = document.getElementById('chat');
const input = document.getElementById('input');
const sendBtn = document.getElementById('sendBtn');

// Voice (Samantha – EN only)
let voiceOn = false, pick = null;
function pickSamantha(){
  const all = window.speechSynthesis ? (speechSynthesis.getVoices()||[]) : [];
  const en = all.filter(v=>/en-/i.test(v.lang));
  pick = en.find(v=>/samantha/i.test(v.name)) || en[0] || all[0] || null;
}
if ('speechSynthesis' in window){
  pickSamantha(); window.speechSynthesis.onvoiceschanged = pickSamantha;
}
function warm(){ try{ const u=new SpeechSynthesisUtterance('Voice enabled.'); if(pick) u.voice=pick; u.lang='en-US'; speechSynthesis.cancel(); speechSynthesis.speak(u);}catch{} }
function speak(t){ if(!voiceOn||!('speechSynthesis'in window))return; try{ const u=new SpeechSynthesisUtterance(t); if(pick) u.voice=pick; u.lang='en-US'; speechSynthesis.cancel(); speechSynthesis.speak(u);}catch{} }

document.getElementById('voiceBtn').addEventListener('click',e=>{
  voiceOn=!voiceOn; e.currentTarget.setAttribute('aria-pressed',String(voiceOn));
  e.currentTarget.textContent = voiceOn ? '🔊 Voice: On' : '🔇 Voice: Off';
  if (voiceOn) warm();
});

function add(type, txt){
  const d=document.createElement('div');
  d.className='msg '+(type==='me'?'me':'wd');
  d.textContent=txt;
  chatEl.appendChild(d);
  chatEl.scrollTop=chatEl.scrollHeight;
}
function welcome(){
  add('wd','Welcome! I can help with Wi‑Fi, check‑in/out, water/AC, bathroom, kitchen, restaurants & drinks, shopping, what to visit, hidden gems, experiences, day trips, transport, services, emergency. (English)');
  const q=document.createElement('div'); q.className='quick';
  const items=${JSON.stringify(buttons)};
  for(const it of items){
    const b=document.createElement('button'); b.textContent=it;
    b.onclick=()=>{ input.value=it; send(); };
    q.appendChild(b);
  }
  chatEl.appendChild(q);
}

async function send(){
  const text=(input.value||'').trim(); if(!text) return;
  add('me',text); input.value='';
  try{
    const r=await fetch('/api/message',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text})});
    const data=await r.json(); const bot=data.text||'Sorry, something went wrong.';
    add('wd',bot); speak(bot);
  }catch{
    add('wd','Network error. Please try again.');
  }
}
sendBtn.addEventListener('click',send);
input.addEventListener('keydown',e=>{ if(e.key==='Enter') send(); });
welcome();
</script>
</body></html>`;
  res.setHeader('content-type','text/html; charset=utf-8');
  res.end(html);
});

// ---------- Start ----------
const port = process.env.PORT || 8787;
app.listen(port, ()=>console.log('Guest assistant up on http://localhost:'+port));
