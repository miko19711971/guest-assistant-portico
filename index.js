// --- Guest Assistant: Via del Portico d’Ottavia 1D ---
// Single-file server + UI (Express) con TTS (Samantha) e pulsanti rapidi

import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// ====== DATI APPARTAMENTO (sintetici ma completi) ======
const APT_ID = 'PORTICO1D';
const apartments = {
  [APT_ID]: {
    apartment_id: APT_ID,
    name: 'Via del Portico d’Ottavia 1D',
    address: 'Via del Portico d’Ottavia 1D, Roma, Italy',

    // Orari (modifica se diversi)
    checkin_time: '15:00',
    checkout_time: '11:00',

    // Casa
    wifi_spot: 'Router sulla cassapanca a destra del letto; SSID e password sul cartellino attaccato al router.',
    water_note: 'Acqua del rubinetto potabile. Acqua calda sempre disponibile.',
    kitchen_note: 'Cucina completa di tutto il necessario.',
    ac_note: 'Climatizzatore con telecomando. Spegnerlo quando si esce.',
    bed_towels: 'Letto preparato. A persona: 1 telo grande, 1 medio.',
    bathroom_items: 'Carta igienica, sapone mani, tappetino, asciugacapelli.',
    intercom_info: 'Citofono: terzo pulsante dal basso, a sinistra del portone.',
    doc_notice: 'Invia via WhatsApp le foto dei documenti per la registrazione obbligatoria.',
    host_phone: '+39 335 5245756',

    // Trasporti & pratico
    transport: [
      'Tram 8: fermata “Arenula/Cairoli” (verso Trastevere o Piazza Venezia).',
      'Bus: da Largo Argentina.',
      'Taxi: 06 3570; alternativa: app FreeNow.'
    ],
    services: [
      'Deposito bagagli: Radical Storage (zona Largo Argentina).',
      'Lavanderia self-service: Via Arenula 47 (7:00–22:00).',
      'SIM: TIM – Corso Vittorio Emanuele II, 123; Vodafone – Largo di Torre Argentina.',
      'Farmacia Giordani: Via Arenula 36, +39 06 688 06555.'
    ],

    // Cibo & drink (Selezione breve)
    eat: [
      'Giggetto (fritto di carciofi) – Via del Portico d’Ottavia 21/A-22, +39 06 6861105',
      'Nonna Betta – Via del Portico d’Ottavia 16, +39 06 68806263',
      'Ba’Ghetto – Via del Portico d’Ottavia 57 & 3',
      'Sora Margherita – P.za delle Cinque Scole 30',
      'Il Giardino Romano – Via del Portico d’Ottavia 18'
    ],
    drink: [
      'Beppe e i Suoi Formaggi (vino & formaggi) – Via S. Maria del Pianto 9A',
      'Il Goccetto – Via dei Banchi Vecchi 14',
      'Bar del Fico – P.za del Fico 34/36',
      'Antico Caffè del Teatro di Marcello – Via del Teatro di Marcello 42'
    ],
    shopping: [
      'Forno Boccione (torta ricotta-cioccolato) – Via del Portico d’Ottavia',
      'Botteghe kosher e gastronomie del Ghetto',
      'Via Arenula – boutique e mercatini'
    ],
    visit: [
      'Portico d’Ottavia e antica Pescheria',
      'Teatro di Marcello',
      'Grande Sinagoga & Museo Ebraico (chiuso sabato/festività)',
      'Piazza Mattei e Fontana delle Tartarughe',
      'Isola Tiberina'
    ],
    hidden: [
      'Torre dei Grassi (XII sec.)',
      'Ponte Rotto (resto del ponte Emilio)',
      'Via della Reginella – la strada più stretta del Ghetto'
    ],
    daytrips: [
      'Ostia Antica (Metro B Piramide → treno OSTIA ANTICA) ~40 min',
      'Tivoli: Villa d’Este & Villa Adriana (bus Cotral da Ponte Mammolo) ~1h',
      'Castelli Romani (treno da Termini verso Frascati/Albano)'
    ],

    // Checkout
    checkout_tips: [
      'Lasciare le chiavi nel lockbox o sul tavolo (secondo istruzioni).',
      'Spegnere luci e AC, chiudere le finestre.'
    ],
  }
};

// ====== FAQ/INTENT SEMPLICI ======
const faqs = [
  { intent:'wifi',      utterances:['wifi','wi-fi','internet','password','router'],
    answer: apt => `Wi-Fi: ${apt.wifi_spot}` },
  { intent:'water',     utterances:['water','acqua','hot water','boiler','doccia'],
    answer: apt => `${apt.water_note}` },
  { intent:'ac',        utterances:['ac','aria condizionata','aircon','air conditioning'],
    answer: apt => `${apt.ac_note}` },
  { intent:'kitchen',   utterances:['kitchen','cucina','cook','stovetop'],
    answer: apt => `${apt.kitchen_note}` },
  { intent:'towels',    utterances:['towel','asciugamani','bed','letto','lenzuola'],
    answer: apt => `${apt.bed_towels}` },
  { intent:'bathroom',  utterances:['bathroom','bagno','hairdryer','phon'],
    answer: apt => `${apt.bathroom_items}` },
  { intent:'intercom',  utterances:['intercom','citofono','buzzer','ring'],
    answer: apt => `${apt.intercom_info}` },
  { intent:'checkin',   utterances:['check in','arrive','access','entrance','code'],
    answer: apt => `Check-in dalle ${apt.checkin_time}. Per aiuto: ${apt.host_phone}.` },
  { intent:'checkout',  utterances:['check out','leave','departure','checkout time'],
    answer: apt => `Check-out entro le ${apt.checkout_time}. ${apt.checkout_tips.join(' ')}` },
  { intent:'documents', utterances:['document','passport','id','registration'],
    answer: apt => `${apt.doc_notice}` },
  { intent:'transport', utterances:['transport','bus','tram','metro','taxi','airport'],
    answer: apt => `Trasporti:\n• ${apartments[APT_ID].transport.join('\n• ')}` },
  { intent:'restaurants', utterances:['eat','food','restaurant','dinner','lunch'],
    answer: apt => `Dove mangiare (breve lista):\n• ${apt.eat.join('\n• ')}` },
  { intent:'drink',       utterances:['drink','bar','wine','cocktail','aperitivo'],
    answer: apt => `Dove bere:\n• ${apt.drink.join('\n• ')}` },
  { intent:'shopping',    utterances:['shop','shopping','market','bakery','forno'],
    answer: apt => `Shopping & sapori:\n• ${apt.shopping.join('\n• ')}` },
  { intent:'visit',       utterances:['what to visit','sights','see','visit','things to do'],
    answer: apt => `Cosa visitare a piedi:\n• ${apt.visit.join('\n• ')}\nHidden gems:\n• ${apt.hidden.join('\n• ')}` },
  { intent:'daytrips',    utterances:['day trip','gita','excursion','ostia','tivoli','castelli'],
    answer: apt => `Gite in giornata:\n• ${apt.daytrips.join('\n• ')}` },
  { intent:'emergency',   utterances:['emergency','doctor','pharmacy','medico','ospedale','police'],
    answer: apt => `Emergenze 112. Host ${apartments[APT_ID].host_phone}. Farmacia: Via Arenula 36. Taxi 06 3570.` },
  { intent:'host',        utterances:['host','michele','contact','phone','help'],
    answer: apt => `Assistenza: ${apt.host_phone}` },
];

// ====== INTENT MATCHING ======
const norm = s => (s||'').toLowerCase().normalize('NFKD').replace(/\s+/g,' ').trim();
function detectIntent(message){
  const text = norm(message);
  let best=null,score=0;
  for (const f of faqs){
    let s=0;
    for (const u of f.utterances) if (text.includes(norm(u))) s++;
    if (s>score){ score=s; best=f; }
  }
  return score>0 ? best : null;
}

// ====== API ======
app.post('/api/message', (req,res)=>{
  const { message, aptId = APT_ID } = req.body || {};
  const apt = apartments[aptId];
  if (!apt) return res.status(400).json({ error:'Invalid aptId' });

  const m = detectIntent(message);
  let answer = m ? m.answer(apt)
                 : 'Non trovo una risposta diretta. Prova con: wifi, water, AC, kitchen, towels, bathroom, intercom, check in, check out, restaurants, transport, visit, day trips, emergency.';
  res.json({ text: answer, intent: m?.intent || null });
});

// ====== UI (HTML + CSS + JS inline) ======
app.get('/', (req,res)=>{
  const apt = (req.query.apt || APT_ID).toString();
  const quickButtons = [
    'wifi','water','AC','kitchen','towels','bathroom','intercom',
    'check in','check out','restaurants','drink','shopping',
    'what to visit','day trips','transport','emergency'
  ];

  const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Guest Help – Via del Portico d’Ottavia 1D</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#f6f6f6}
  .wrap{max-width:760px;margin:0 auto;min-height:100vh;display:flex;flex-direction:column}
  header{position:sticky;top:0;background:#fff;padding:12px 16px;border-bottom:1px solid #e0e0e0;display:flex;align-items:center;gap:12px;flex-wrap:wrap}
  .brand{font-weight:700;color:#a33}
  .apt{margin-left:auto;font-size:14px;opacity:.85}
  .h-left{display:flex;align-items:center;gap:10px}
  img.brand{height:40px; width:auto; display:block}
  #voiceBtn{margin-left:auto;padding:8px 10px;border:1px solid #ddd;background:#fff;border-radius:10px;cursor:pointer;font-size:14px}
  #voiceBtn[aria-pressed="true"]{background:#2b2118;color:#fff;border-color:#2b2118}
  main{flex:1;padding:12px}
  .msg{max-width:85%;line-height:1.35;border-radius:12px;padding:10px 12px;margin:8px 0;white-space:pre-wrap}
  .msg.wd{background:#fff;border:1px solid #e0e0e0}
  .msg.me{background:#e8f0fe;border:1px solid #c5d5ff;margin-left:auto}
  .quick{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}
  .quick button{border:1px solid #d6c5b8;background:#fff;color:#333;padding:8px 12px;border-radius:12px;cursor:pointer;height:36px;line-height:1}
  .quick button:active{transform:translateY(1px)}
  footer{position:sticky;bottom:0;background:#fff;display:flex;gap:8px;padding:10px;border-top:1px solid #e0e0e0}
  input{flex:1;padding:14px;border:1px solid #cbd5e1;border-radius:10px;outline:none}
  #sendBtn{padding:14px;border:1px solid #2b2118;background:#2b2118;color:#fff;border-radius:10px;cursor:pointer}
</style>
</head>
<body>
  <div class="wrap">
    <header>
      <div class="h-left">
        <img src="logo-niceflatinrome.png" alt="NiceFlatInRome" class="brand">
        <div class="brand">niceflatinrome.com</div>
      </div>
      <div class="apt">Apartment: ${apt}</div>
      <button id="voiceBtn" aria-pressed="false" title="Toggle voice">🔇 Voice: Off</button>
    </header>
    <main id="chat" aria-live="polite"></main>
    <footer>
      <input id="input" placeholder="Type a message… e.g., wifi, AC, transport" autocomplete="off">
      <button id="sendBtn">Send</button>
    </footer>
  </div>
<script>
  const aptId  = new URLSearchParams(location.search).get('apt') || '${apt}';
  const chatEl = document.getElementById('chat');
  const input  = document.getElementById('input');
  const sendBtn = document.getElementById('sendBtn');
  const voiceBtn = document.getElementById('voiceBtn');

  // TTS fisso Samantha (English). Se non presente, usa voce di default.
  let voiceOn = false;
  let samantha = null;

  function pickSamantha(){
    if (!('speechSynthesis' in window)) return null;
    const all = window.speechSynthesis.getVoices() || [];
    // Cerca Samantha (iOS) o voci en-US femminili simili
    return all.find(v => /samantha/i.test(v.name)) ||
           all.find(v => /en-us/i.test(v.lang));
  }
  function loadVoices(){
    samantha = pickSamantha();
  }
  if ('speechSynthesis' in window){
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
  function speak(text){
    if (!voiceOn || !('speechSynthesis' in window)) return;
    try{
      const u = new SpeechSynthesisUtterance(text);
      if (samantha) u.voice = samantha;
      u.lang = (samantha && samantha.lang) || 'en-US';
      u.rate = 1; u.pitch = 1; u.volume = 1;
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    }catch(e){ console.warn('TTS error', e); }
  }
  voiceBtn.addEventListener('click', ()=>{
    voiceOn = !voiceOn;
    voiceBtn.setAttribute('aria-pressed', String(voiceOn));
    voiceBtn.textContent = voiceOn ? '🔊 Voice: On' : '🔇 Voice: Off';
  });

  // UI helpers
  function add(type, txt){
    const d = document.createElement('div');
    d.className = 'msg ' + (type === 'me' ? 'me' : 'wd');
    d.textContent = txt;
    chatEl.appendChild(d);
    chatEl.scrollTop = chatEl.scrollHeight;
  }
  function renderWelcome(){
    add('wd','Welcome! I can help with Wi-Fi, water, AC, kitchen, towels, bathroom, intercom, check-in/out, restaurants, drink, shopping, what to visit, day trips, transport, emergency.');
    const q = document.createElement('div'); q.className='quick';
    const items = ${JSON.stringify(quickButtons)};
    for (const it of items){
      const b = document.createElement('button'); b.textContent = it;
      b.addEventListener('click', ()=>{ input.value = it; send(); });
      q.appendChild(b);
    }
    chatEl.appendChild(q);
  }

  async function send(){
    const text = (input.value || '').trim();
    if (!text) return;
    add('me', text);
    input.value = '';
    try{
      const r = await fetch('/api/message',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ message:text, aptId }) });
      const data = await r.json();
      const botText = data.text || 'Sorry, something went wrong.';
      add('wd', botText);
      speak(botText);
    }catch(e){ add('wd','Network error. Please try again.'); }
  }
  sendBtn.addEventListener('click', send);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
  renderWelcome();
</script>
</body></html>`;
  res.setHeader('content-type','text/html; charset=utf-8');
  res.end(html);
});

// ====== START ======
const port = process.env.PORT || 8789;
app.listen(port, ()=> console.log('Portico assistant on http://localhost:'+port));
