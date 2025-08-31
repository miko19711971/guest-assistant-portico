// index.js — Guest Assistant (Via del Portico d’Ottavia 1D) — Multilingual + Native Voices

import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // static (logo, favicon, etc.)

// ---------------- Base (neutro) ----------------
const base = {
  apartment_id: 'PORTICO1D',
  name: 'Via del Portico d’Ottavia 1D',
  address: 'Via del Portico d’Ottavia 1D, Rome, Italy',
  checkin_time: '15:00',
  checkout_time: '11:00',
  host_phone: '+39 335 5245756',
  apt_label: { en:'Apartment', it:'Appartamento', fr:'Appartement', de:'Apartment', es:'Apartamento' }
};

// ---------------- Contenuti localizzati ----------------
const APT_I18N = {
  en: {
    // Wi-Fi / Water / AC / Bathroom / Towels
    wifi_note: "Look at the bed: on the right side there’s a chest bench with the router on top. SSID and password are on the label attached to the router.",
    wifi_ssid: 'See router label',
    wifi_password: 'See router label',
    water_note: 'Tap water is safe to drink. Hot water is always available.',
    ac_note: 'Air conditioning works via remote control. Please turn it OFF when you go out.',
    bathroom_amenities: 'Toilet paper, hand soap, bath mat, hairdryer.',
    towels_note: 'Per guest: 1 large + 1 medium towel. Bed is prepared on arrival.',
    // Kitchen
    kitchen_note: 'Kitchen is fully equipped for your needs.',
    // Building & Access
    intercom_note: 'At the building door, our unit is the third button from the bottom.',
    registration_note: 'Please send photos of two identity documents via WhatsApp for guest registration (required by law).',
    // Services nearby
    supermarkets: 'Carrefour Express – Via Arenula 41 • Conad City – Via di Santa Maria del Pianto 4 • Punto Simply – Via dei Falegnami 4',
    pharmacies: 'Farmacia della Reginella – Via della Reginella 25 • Farmacia Internazionale – Largo Arenula 14 (English speaking) • Farmacia San Salvatore – Piazza della Enciclopedia Italiana 53',
    luggage: 'Radical Storage – Largo di Torre Argentina (5 min walk)',
    laundry: 'Self-service laundry – Via Arenula 47',
    hospital: 'Fatebenefratelli Hospital – Tiber Island',
    atms: 'Unicredit (Largo Arenula 1) • BNL (Via Arenula 41) • Intesa (Via Arenula 27)',
    // Transport
    transport: "Tram 8 (stop: Arenula/Cairoli) → Trastevere or Piazza Venezia. Buses from Largo Argentina. Taxi: +39 06 3570 or use FreeNow app.",
    airports: "Fiumicino: Tram 8 → Trastevere Station → FL1 train (~45 min). Ciampino: Terravision bus or taxi. Private transfer: Welcome Pickups.",
    // Safety
    emergency: "EU Emergency 112 • Police 113 • Ambulance 118 • Fire 115 • English-speaking doctor +39 06 488 2371 • 24h vet +39 06 660 681",
    // Eat/Drink/Shop
    eat: "Giggetto al Portico d’Ottavia • Ba’Ghetto (Main & Bistrot) • Nonna Betta • Rimessa Roscioli • Il Giardino Romano • Sora Margherita • Yotvata (dairy, kosher).",
    drink: "Beppe e i Suoi Formaggi (wine & cheese) • Il Goccetto (historic wine bar) • Bar del Fico (cocktails) • Caffè del Portico • Bibliothè (tea room) • Antico Caffè del Teatro di Marcello.",
    shop: "Via del Portico d’Ottavia (artisan shops & kosher bakeries) • Forno Boccione (no sign outside) • Via Arenula boutiques • Jewish Bookstore • Kosher Delight • Fish stalls at Piazza Costaguti (mornings).",
    // Visit / Hidden gems / Experiences / Day trips
    visit: "Portico d’Ottavia • Teatro di Marcello • Great Synagogue of Rome & Jewish Museum (closed Sat & Jewish holidays; museum usually 10:00–17:00) • Piazza Mattei (Turtle Fountain) • Tiber Island.",
    hidden_gems: "Torre dei Grassi • Ponte Emilio “Ponte Rotto” (single remaining arch) • Via della Reginella (Rome’s narrow street).",
    experiences: "Guided tours in the Jewish Ghetto • Jewish-Roman food tastings • Evening walk to Campo de’ Fiori & Piazza Navona • Photo walk through hidden squares • Bike ride around Tiber Island.",
    daytrips: "Ostia Antica (~40 min) • Tivoli (Villa d’Este & Hadrian’s Villa ~1h) • Castelli Romani (villages & wine).",
    // Check-out
    checkout_note: "Before leaving: turn off lights/AC, close windows, leave keys on the table, gently close the door."
  },
  it: {
    wifi_note: "Guarda il letto: sul lato destro c’è una panca/contenitore con il router sopra. SSID e password sono sull’etichetta del router.",
    wifi_ssid: 'Vedi etichetta del router',
    wifi_password: 'Vedi etichetta del router',
    water_note: "L’acqua del rubinetto è potabile. L’acqua calda è sempre disponibile.",
    ac_note: "L’aria condizionata si usa col telecomando. Per favore spegnila quando esci.",
    bathroom_amenities: 'Carta igienica, sapone per le mani, tappetino bagno, asciugacapelli.',
    towels_note: 'Per ospite: 1 telo grande + 1 medio. Il letto è pronto all’arrivo.',
    kitchen_note: 'La cucina è completamente attrezzata per le tue esigenze.',
    intercom_note: 'Al portone, il nostro campanello è il terzo dal basso.',
    registration_note: 'Invia per favore le foto di due documenti via WhatsApp per la registrazione ospiti (obbligo di legge).',
    supermarkets: 'Carrefour Express – Via Arenula 41 • Conad City – Via di Santa Maria del Pianto 4 • Punto Simply – Via dei Falegnami 4',
    pharmacies: 'Farmacia della Reginella – Via della Reginella 25 • Farmacia Internazionale – Largo Arenula 14 (parlano inglese) • Farmacia San Salvatore – Piazza della Enciclopedia Italiana 53',
    luggage: 'Radical Storage – Largo di Torre Argentina (5 min a piedi)',
    laundry: 'Lavanderia self-service – Via Arenula 47',
    hospital: 'Ospedale Fatebenefratelli – Isola Tiberina',
    atms: 'Unicredit (Largo Arenula 1) • BNL (Via Arenula 41) • Intesa (Via Arenula 27)',
    transport: "Tram 8 (fermata: Arenula/Cairoli) → Trastevere o Piazza Venezia. Autobus da Largo Argentina. Taxi: +39 06 3570 o app FreeNow.",
    airports: "Fiumicino: Tram 8 → Stazione Trastevere → treno FL1 (~45 min). Ciampino: bus Terravision o taxi. Transfer privato: Welcome Pickups.",
    emergency: "Emergenze UE 112 • Polizia 113 • Ambulanza 118 • Vigili del Fuoco 115 • Medico in inglese +39 06 488 2371 • Veterinario 24h +39 06 660 681",
    eat: "Giggetto al Portico d’Ottavia • Ba’Ghetto (Main & Bistrot) • Nonna Betta • Rimessa Roscioli • Il Giardino Romano • Sora Margherita • Yotvata (latteria/kosher).",
    drink: "Beppe e i Suoi Formaggi (vino & formaggi) • Il Goccetto (enoteca storica) • Bar del Fico (cocktail) • Caffè del Portico • Bibliothè (sala da tè) • Antico Caffè del Teatro di Marcello.",
    shop: "Via del Portico d’Ottavia (artigiani e forni kosher) • Forno Boccione (senza insegna) • Boutique di Via Arenula • Libreria Ebraica • Kosher Delight • Banchi del pesce a Piazza Costaguti (mattina).",
    visit: "Portico d’Ottavia • Teatro di Marcello • Grande Sinagoga di Roma & Museo Ebraico (chiusi sabato e festività ebraiche; museo di solito 10:00–17:00) • Piazza Mattei (Fontana delle Tartarughe) • Isola Tiberina.",
    hidden_gems: "Torre dei Grassi • Ponte Emilio “Ponte Rotto” (unico arco rimasto) • Via della Reginella (stradina stretta).",
    experiences: "Tour guidati nel Ghetto • Degustazioni giudaico-romane • Passeggiata serale a Campo de’ Fiori & Piazza Navona • Photo walk tra piazzette nascoste • Giro in bici intorno all’Isola Tiberina.",
    daytrips: "Ostia Antica (~40 min) • Tivoli (Villa d’Este & Villa Adriana ~1h) • Castelli Romani (borghi & vino).",
    checkout_note: "Prima di partire: spegni luci/AC, chiudi le finestre, lascia le chiavi sul tavolo, chiudi la porta delicatamente."
  },
  fr: {
    wifi_note: "Regardez le lit : sur la droite, un banc/coffre avec le routeur dessus. SSID et mot de passe figurent sur l’étiquette du routeur.",
    wifi_ssid: 'Voir l’étiquette du routeur',
    wifi_password: 'Voir l’étiquette du routeur',
    water_note: "L’eau du robinet est potable. L’eau chaude est toujours disponible.",
    ac_note: "La climatisation fonctionne avec la télécommande. Merci de l’éteindre en sortant.",
    bathroom_amenities: 'Papier toilette, savon pour les mains, tapis de bain, sèche-cheveux.',
    towels_note: 'Par personne : 1 grande + 1 moyenne serviette. Le lit est prêt à l’arrivée.',
    kitchen_note: 'Cuisine entièrement équipée pour vos besoins.',
    intercom_note: 'À la porte de l’immeuble, notre bouton est le troisième en partant du bas.',
    registration_note: 'Veuillez envoyer les photos de deux pièces d’identité par WhatsApp pour l’enregistrement (obligatoire par la loi).',
    supermarkets: 'Carrefour Express – Via Arenula 41 • Conad City – Via di Santa Maria del Pianto 4 • Punto Simply – Via dei Falegnami 4',
    pharmacies: 'Farmacia della Reginella – Via della Reginella 25 • Farmacia Internazionale – Largo Arenula 14 (anglais) • Farmacia San Salvatore – Piazza della Enciclopedia Italiana 53',
    luggage: 'Radical Storage – Largo di Torre Argentina (5 min à pied)',
    laundry: 'Laverie en libre-service – Via Arenula 47',
    hospital: 'Hôpital Fatebenefratelli – Île Tibérine',
    atms: 'Unicredit (Largo Arenula 1) • BNL (Via Arenula 41) • Intesa (Via Arenula 27)',
    transport: "Tram 8 (arrêt : Arenula/Cairoli) → Trastevere ou Piazza Venezia. Bus depuis Largo Argentina. Taxi : +39 06 3570 ou appli FreeNow.",
    airports: "Fiumicino : Tram 8 → Gare de Trastevere → train FL1 (~45 min). Ciampino : bus Terravision ou taxi. Transfert privé : Welcome Pickups.",
    emergency: "Urgences UE 112 • Police 113 • Ambulance 118 • Pompiers 115 • Médecin anglophone +39 06 488 2371 • Vétérinaire 24h/24 +39 06 660 681",
    eat: "Giggetto al Portico d’Ottavia • Ba’Ghetto (Main & Bistrot) • Nonna Betta • Rimessa Roscioli • Il Giardino Romano • Sora Margherita • Yotvata (laitier, casher).",
    drink: "Beppe e i Suoi Formaggi (vin & fromages) • Il Goccetto (bar à vin historique) • Bar del Fico (cocktails) • Caffè del Portico • Bibliothè (salon de thé) • Antico Caffè del Teatro di Marcello.",
    shop: "Via del Portico d’Ottavia (artisanat & boulangeries casher) • Forno Boccione (sans enseigne) • Boutiques Via Arenula • Librairie juive • Kosher Delight • Étals de poisson Piazza Costaguti (matin).",
    visit: "Portico d’Ottavia • Théâtre de Marcellus • Grande Synagogue & Musée juif de Rome (fermés le samedi et fêtes juives ; musée généralement 10:00–17:00) • Piazza Mattei (Fontaine des Tortues) • Île Tibérine.",
    hidden_gems: "Torre dei Grassi • Ponte Emilio “Ponte Rotto” (arche restante) • Via della Reginella (ruelle étroite).",
    experiences: "Visites guidées du ghetto • Dégustations judéo-romaines • Balade du soir vers Campo de’ Fiori & Piazza Navona • Photo walk dans les places cachées • Tour à vélo autour de l’Île Tibérine.",
    daytrips: "Ostia Antica (~40 min) • Tivoli (Villa d’Este & Villa d’Hadrien ~1h) • Castelli Romani (villages & vin).",
    checkout_note: "Avant de partir : éteignez lumières/AC, fermez les fenêtres, laissez les clés sur la table, fermez la porte délicatement."
  },
  de: {
    wifi_note: "Am Bett: rechts steht eine Truhenbank mit dem Router oben drauf. SSID und Passwort stehen auf dem Router-Etikett.",
    wifi_ssid: 'Siehe Router-Etikett',
    wifi_password: 'Siehe Router-Etikett',
    water_note: "Leitungswasser ist trinkbar. Warmwasser ist immer verfügbar.",
    ac_note: "Klimaanlage per Fernbedienung. Bitte beim Verlassen ausschalten.",
    bathroom_amenities: 'Toilettenpapier, Handseife, Badematte, Haartrockner.',
    towels_note: 'Pro Gast: 1 großes + 1 mittleres Handtuch. Bett bei Ankunft bezogen.',
    kitchen_note: 'Küche ist vollständig ausgestattet.',
    intercom_note: 'Am Hauseingang ist unsere Klingel der dritte Knopf von unten.',
    registration_note: 'Bitte Fotos von zwei Ausweisen per WhatsApp zur Gästeanmeldung senden (gesetzlich erforderlich).',
    supermarkets: 'Carrefour Express – Via Arenula 41 • Conad City – Via di Santa Maria del Pianto 4 • Punto Simply – Via dei Falegnami 4',
    pharmacies: 'Farmacia della Reginella – Via della Reginella 25 • Farmacia Internazionale – Largo Arenula 14 (Englisch) • Farmacia San Salvatore – Piazza della Enciclopedia Italiana 53',
    luggage: 'Radical Storage – Largo di Torre Argentina (5 Min zu Fuß)',
    laundry: 'SB-Waschsalon – Via Arenula 47',
    hospital: 'Krankenhaus Fatebenefratelli – Tiberinsel',
    atms: 'Unicredit (Largo Arenula 1) • BNL (Via Arenula 41) • Intesa (Via Arenula 27)',
    transport: "Tram 8 (Haltestelle: Arenula/Cairoli) → Trastevere oder Piazza Venezia. Busse ab Largo Argentina. Taxi: +39 06 3570 oder FreeNow-App.",
    airports: "Fiumicino: Tram 8 → Bahnhof Trastevere → FL1 (~45 Min). Ciampino: Terravision-Bus oder Taxi. Privater Transfer: Welcome Pickups.",
    emergency: "EU-Notruf 112 • Polizei 113 • Rettung 118 • Feuerwehr 115 • Englischsprachiger Arzt +39 06 488 2371 • Tierarzt 24h +39 06 660 681",
    eat: "Giggetto al Portico d’Ottavia • Ba’Ghetto (Main & Bistrot) • Nonna Betta • Rimessa Roscioli • Il Giardino Romano • Sora Margherita • Yotvata (Milch/Koscher).",
    drink: "Beppe e i Suoi Formaggi (Wein & Käse) • Il Goccetto (historische Weinbar) • Bar del Fico (Cocktails) • Caffè del Portico • Bibliothè (Teehaus) • Antico Caffè del Teatro di Marcello.",
    shop: "Via del Portico d’Ottavia (Handwerk & koschere Bäckereien) • Forno Boccione (ohne Schild) • Via Arenula Boutiquen • Jüdische Buchhandlung • Kosher Delight • Fischstände Piazza Costaguti (morgens).",
    visit: "Portico d’Ottavia • Theater des Marcellus • Große Synagoge & Jüdisches Museum (Sa & jüdische Feiertage geschlossen; Museum meist 10:00–17:00) • Piazza Mattei (Schildkrötenbrunnen) • Tiberinsel.",
    hidden_gems: "Torre dei Grassi • Ponte Emilio „Ponte Rotto“ (übrig gebliebener Bogen) • Via della Reginella (enge Gasse).",
    experiences: "Geführte Touren im jüdischen Ghetto • Jüdisch-römische Verkostungen • Abendspaziergang zu Campo de’ Fiori & Piazza Navona • Foto-Walk durch versteckte Plätze • Radtour um die Tiberinsel.",
    daytrips: "Ostia Antica (~40 Min) • Tivoli (Villa d’Este & Hadriansvilla ~1h) • Castelli Romani (Dörfer & Wein).",
    checkout_note: "Vor der Abreise: Lichter/AC aus, Fenster schließen, Schlüssel auf den Tisch, Tür sanft schließen."
  },
  es: {
    wifi_note: "Mira la cama: a la derecha hay un banco baúl con el router encima. El SSID y la contraseña están en la etiqueta del router.",
    wifi_ssid: 'Ver etiqueta del router',
    wifi_password: 'Ver etiqueta del router',
    water_note: "El agua del grifo es potable. El agua caliente está siempre disponible.",
    ac_note: "El aire acondicionado funciona con mando. Por favor, apágalo al salir.",
    bathroom_amenities: 'Papel higiénico, jabón de manos, alfombrilla de baño, secador.',
    towels_note: 'Por huésped: 1 toalla grande + 1 mediana. La cama está preparada a la llegada.',
    kitchen_note: 'La cocina está totalmente equipada.',
    intercom_note: 'En la puerta del edificio, nuestro timbre es el tercero desde abajo.',
    registration_note: 'Envía fotos de dos documentos por WhatsApp para el registro de huéspedes (requerido por ley).',
    supermarkets: 'Carrefour Express – Via Arenula 41 • Conad City – Via di Santa Maria del Pianto 4 • Punto Simply – Via dei Falegnami 4',
    pharmacies: 'Farmacia della Reginella – Via della Reginella 25 • Farmacia Internazionale – Largo Arenula 14 (inglés) • Farmacia San Salvatore – Piazza della Enciclopedia Italiana 53',
    luggage: 'Radical Storage – Largo di Torre Argentina (5 min a pie)',
    laundry: 'Lavandería autoservicio – Via Arenula 47',
    hospital: 'Hospital Fatebenefratelli – Isla Tiberina',
    atms: 'Unicredit (Largo Arenula 1) • BNL (Via Arenula 41) • Intesa (Via Arenula 27)',
    transport: "Tranvía 8 (parada: Arenula/Cairoli) → Trastevere o Piazza Venezia. Autobuses desde Largo Argentina. Taxi: +39 06 3570 o app FreeNow.",
    airports: "Fiumicino: Tranvía 8 → Estación Trastevere → tren FL1 (~45 min). Ciampino: bus Terravision o taxi. Traslado privado: Welcome Pickups.",
    emergency: "Emergencia UE 112 • Policía 113 • Ambulancia 118 • Bomberos 115 • Médico en inglés +39 06 488 2371 • Veterinario 24h +39 06 660 681",
    eat: "Giggetto al Portico d’Ottavia • Ba’Ghetto (Main & Bistrot) • Nonna Betta • Rimessa Roscioli • Il Giardino Romano • Sora Margherita • Yotvata (lácteos, kosher).",
    drink: "Beppe e i Suoi Formaggi (vino y quesos) • Il Goccetto (enoteca histórica) • Bar del Fico (cócteles) • Caffè del Portico • Bibliothè (tetería) • Antico Caffè del Teatro di Marcello.",
    shop: "Via del Portico d’Ottavia (artesanos y panaderías kosher) • Forno Boccione (sin letrero) • Boutiques de Via Arenula • Librería judía • Kosher Delight • Puestos de pescado en Piazza Costaguti (mañanas).",
    visit: "Portico d’Ottavia • Teatro de Marcelo • Gran Sinagoga y Museo Judío de Roma (cerrados sábados y festividades judías; museo normalmente 10:00–17:00) • Piazza Mattei (Fuente de las Tortugas) • Isla Tiberina.",
    hidden_gems: "Torre dei Grassi • Ponte Emilio “Ponte Rotto” (arco superviviente) • Via della Reginella (calle estrecha).",
    experiences: "Visitas guiadas por el gueto • Degustaciones judeo-romanas • Paseo vespertino a Campo de’ Fiori y Piazza Navona • Ruta fotográfica por plazas ocultas • Vuelta en bici alrededor de la Isla Tiberina.",
    daytrips: "Ostia Antica (~40 min) • Tivoli (Villa d’Este y Villa Adriana ~1h) • Castelli Romani (pueblos y vino).",
    checkout_note: "Antes de salir: apaga luces/AC, cierra las ventanas, deja las llaves en la mesa y cierra la puerta suavemente."
  }
};

// ---------------- Template risposte per intent (localizzate) ----------------
const FAQ_TPL = {
  en: {
    wifi: `Wi-Fi: {wifi_note}\nNetwork: {wifi_ssid}. Password: {wifi_password}.`,
    checkin: `Check-in from ${base.checkin_time}.\nIntercom: {intercom_note}\nRegistration: {registration_note}\nNeed help? Call ${base.host_phone}.`,
    checkout: `{checkout_note}`,
    water: `{water_note}`,
    ac: `{ac_note}`,
    bathroom: `Bathroom: {bathroom_amenities}\nTowels: {towels_note}`,
    kitchen: `{kitchen_note}`,
    services:
`Supermarkets: {supermarkets}
Pharmacies: {pharmacies}
Hospital: {hospital}
ATMs: {atms}
Laundry: {laundry}
Luggage storage: {luggage}`,
    transport: `{transport}\nAirports: {airports}`,
    eat: `{eat}`,
    drink: `{drink}`,
    shop: `{shop}`,
    visit: `{visit}`,
    hidden: `{hidden_gems}`,
    experience: `{experiences}`,
    daytrips: `{daytrips}`,
    emergency: `{emergency}`
  },
  it: {
    wifi: `Wi-Fi: {wifi_note}\nRete: {wifi_ssid}. Password: {wifi_password}.`,
    checkin: `Check-in dalle ${base.checkin_time}.\nCitofono: {intercom_note}\nRegistrazione: {registration_note}\nServe aiuto? Chiama ${base.host_phone}.`,
    checkout: `{checkout_note}`,
    water: `{water_note}`,
    ac: `{ac_note}`,
    bathroom: `Bagno: {bathroom_amenities}\nAsciugamani: {towels_note}`,
    kitchen: `{kitchen_note}`,
    services:
`Supermercati: {supermarkets}
Farmacie: {pharmacies}
Ospedale: {hospital}
Bancomat: {atms}
Lavanderia: {laundry}
Deposito bagagli: {luggage}`,
    transport: `{transport}\nAeroporti: {airports}`,
    eat: `{eat}`,
    drink: `{drink}`,
    shop: `{shop}`,
    visit: `{visit}`,
    hidden: `{hidden_gems}`,
    experience: `{experiences}`,
    daytrips: `{daytrips}`,
    emergency: `{emergency}`
  },
  fr: {
    wifi: `Wi-Fi : {wifi_note}\nRéseau : {wifi_ssid}. Mot de passe : {wifi_password}.`,
    checkin: `Check-in à partir de ${base.checkin_time}.\nInterphone : {intercom_note}\nEnregistrement : {registration_note}\nBesoin d’aide ? ${base.host_phone}.`,
    checkout: `{checkout_note}`,
    water: `{water_note}`,
    ac: `{ac_note}`,
    bathroom: `Salle de bain : {bathroom_amenities}\nServiettes : {towels_note}`,
    kitchen: `{kitchen_note}`,
    services:
`Supermarchés : {supermarkets}
Pharmacies : {pharmacies}
Hôpital : {hospital}
DAB : {atms}
Laverie : {laundry}
Consigne : {luggage}`,
    transport: `{transport}\nAéroports : {airports}`,
    eat: `{eat}`,
    drink: `{drink}`,
    shop: `{shop}`,
    visit: `{visit}`,
    hidden: `{hidden_gems}`,
    experience: `{experiences}`,
    daytrips: `{daytrips}`,
    emergency: `{emergency}`
  },
  de: {
    wifi: `WLAN: {wifi_note}\nNetz: {wifi_ssid}. Passwort: {wifi_password}.`,
    checkin: `Check-in ab ${base.checkin_time}.\nGegensprechanlage: {intercom_note}\nRegistrierung: {registration_note}\nHilfe? ${base.host_phone}.`,
    checkout: `{checkout_note}`,
    water: `{water_note}`,
    ac: `{ac_note}`,
    bathroom: `Bad: {bathroom_amenities}\nHandtücher: {towels_note}`,
    kitchen: `{kitchen_note}`,
    services:
`Supermärkte: {supermarkets}
Apotheken: {pharmacies}
Krankenhaus: {hospital}
Geldautomaten: {atms}
Waschsalon: {laundry}
Gepäckaufbewahrung: {luggage}`,
    transport: `{transport}\nFlughäfen: {airports}`,
    eat: `{eat}`,
    drink: `{drink}`,
    shop: `{shop}`,
    visit: `{visit}`,
    hidden: `{hidden_gems}`,
    experience: `{experiences}`,
    daytrips: `{daytrips}`,
    emergency: `{emergency}`
  },
  es: {
    wifi: `Wi-Fi: {wifi_note}\nRed: {wifi_ssid}. Contraseña: {wifi_password}.`,
    checkin: `Check-in desde las ${base.checkin_time}.\nPortero: {intercom_note}\nRegistro: {registration_note}\n¿Necesitas ayuda? ${base.host_phone}.`,
    checkout: `{checkout_note}`,
    water: `{water_note}`,
    ac: `{ac_note}`,
    bathroom: `Baño: {bathroom_amenities}\nToallas: {towels_note}`,
    kitchen: `{kitchen_note}`,
    services:
`Supermercados: {supermarkets}
Farmacias: {pharmacies}
Hospital: {hospital}
Cajeros: {atms}
Lavandería: {laundry}
Consigna: {luggage}`,
    transport: `{transport}\nAeropuertos: {airports}`,
    eat: `{eat}`,
    drink: `{drink}`,
    shop: `{shop}`,
    visit: `{visit}`,
    hidden: `{hidden_gems}`,
    experience: `{experiences}`,
    daytrips: `{daytrips}`,
    emergency: `{emergency}`
  }
};

// ---------------- Intent matching (keyword EN) ----------------
const INTENTS = [
  { key:'wifi',        utter:['wifi','wi-fi','internet','password','router'] },
  { key:'checkin',     utter:['check in','arrival','self check-in','access','entrance','intercom','doorbell'] },
  { key:'checkout',    utter:['check out','leave','departure'] },
  { key:'water',       utter:['water','hot water','drinkable','tap','shower'] },
  { key:'ac',          utter:['ac','air conditioning','aircon','air conditioner'] },
  { key:'bathroom',    utter:['bathroom','hairdryer','towels','amenities','soap'] },
  { key:'kitchen',     utter:['kitchen','cook','cooking','stove'] },
  { key:'services',    utter:['pharmacy','hospital','atm','sim','laundry','luggage','supermarket','groceries'] },
  { key:'transport',   utter:['transport','tram','bus','taxi','airport','train','metro'] },
  { key:'eat',         utter:['eat','restaurant','dinner','lunch','food'] },
  { key:'drink',       utter:['drink','bar','wine','cocktail','aperitivo'] },
  { key:'shop',        utter:['shop','market','shopping','bakeries','kosher'] },
  { key:'visit',       utter:['what to visit','see','sight','attraction','museum','synagogue'] },
  { key:'hidden',      utter:['hidden','secret','gem','less-known','off the beaten path'] },
  { key:'experience',  utter:['experience','walk','tour','itinerary','sunset','photo'] },
  { key:'daytrips',    utter:['day trip','tivoli','ostia','castelli','excursion'] },
  { key:'emergency',   utter:['emergency','police','ambulance','fire','doctor','vet'] }
];

function norm(s){ return (s||'').toLowerCase().replace(/\s+/g,' ').trim(); }
function detectIntent(msg){
  const t = norm(msg); let best=null, scoreBest=0;
  for(const it of INTENTS){ let s=0; for(const u of it.utter){ if(t.includes(norm(u))) s++; } if(s>scoreBest){best=it; scoreBest=s;} }
  return best?.key || null;
}
function fill(tpl, dict){ return tpl.replace(/\{(\w+)\}/g,(_,k)=>dict[k] ?? `{${k}}`); }

// ---------------- OpenAI opzionale ----------------
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const client = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;
async function polishOptional(text, lang){
  if(!client) return text;
  const sys = `You are a helpful assistant. Keep the language as: ${lang}. Do not change facts, names, numbers or codes.`;
  try{
    const r = await client.responses.create({
      model: OPENAI_MODEL,
      input: [{ role:'system', content: sys }, { role:'user', content: text }]
    });
    return r.output_text || text;
  }catch{ return text; }
}

// ---------------- API ----------------
app.post('/api/message', async (req,res)=>{
  const { message='', lang='en' } = req.body || {};
  const L = (APT_I18N[lang] ? lang : 'en');
  const intent = detectIntent(message);
  let out = '';
  if (intent) {
    const tpl = FAQ_TPL[L][intent];
    out = fill(tpl, APT_I18N[L]);
  } else {
    const fallback = {
      en:'I did not find a direct answer. Try a button or use keywords (wifi, transport, eat, museum…).',
      it:'Non ho trovato una risposta diretta. Prova un pulsante o usa parole chiave (wifi, trasporti, mangiare, museo…).',
      fr:"Je n’ai pas trouvé de réponse directe. Essayez un bouton ou des mots-clés (wifi, transports, manger, musée…).",
      de:'Keine direkte Antwort gefunden. Nutze einen Button oder Stichwörter (WLAN, Verkehr, Essen, Museum…).',
      es:'No encontré una respuesta directa. Prueba un botón o usa palabras clave (wifi, transporte, comer, museo…).'
    }[L];
    out = fallback;
  }
  const text = await polishOptional(out, L);
  res.json({ text, intent });
});

// ---------------- UI (single file) ----------------
app.get('/', (_req,res)=>{
  // EN keywords usate per il matching (le etichette sono tradotte)
  const BUTTON_KEYS = [
    'wifi','check in','check out','water','AC','bathroom','kitchen',
    'eat','drink','shop','visit','hidden gems','experience','day trips',
    'transport','services','emergency'
  ];

  const UI_I18N = {
    en:{ welcome:'Hi, I am Samantha, your virtual assistant. Tap a button to get a quick answer.',
         placeholder:'Type a message… e.g., wifi, transport, eat',
         buttons:{ wifi:'wifi','check in':'check in','check out':'check out','water':'water','AC':'AC','bathroom':'bathroom','kitchen':'kitchen',
           eat:'eat', drink:'drink', shop:'shop', visit:'visit', 'hidden gems':'hidden gems', experience:'experience', 'day trips':'day trips',
           transport:'transport', services:'services', emergency:'emergency' },
         voice_on:'🔊 Voice: On', voice_off:'🔇 Voice: Off', apt_label: base.apt_label.en },
    it:{ welcome:'Ciao, sono Samantha, la tua guida virtuale. Tocca un pulsante per una risposta rapida.',
         placeholder:'Scrivi un messaggio… es. wifi, trasporti, mangiare',
         buttons:{ wifi:'wifi','check in':'check in','check out':'check out','water':'acqua','AC':'aria condizionata','bathroom':'bagno','kitchen':'cucina',
           eat:'mangiare', drink:'bere', shop:'shopping', visit:'visitare', 'hidden gems':'angoli nascosti', experience:'esperienze', 'day trips':'gite di un giorno',
           transport:'trasporti', services:'servizi', emergency:'emergenza' },
         voice_on:'🔊 Voce: On', voice_off:'🔇 Voce: Off', apt_label: base.apt_label.it },
    fr:{ welcome:'Bonjour, je suis Samantha, votre guide virtuel. Touchez un bouton pour une réponse rapide.',
         placeholder:'Écrivez un message… ex. wifi, transports, manger',
         buttons:{ wifi:'wifi','check in':'check in','check out':'check out','water':'eau','AC':'climatisation','bathroom':'salle de bain','kitchen':'cuisine',
           eat:'manger', drink:'boire', shop:'shopping', visit:'visiter', 'hidden gems':'pépites cachées', experience:'expériences', 'day trips':'excursions',
           transport:'transports', services:'services', emergency:'urgence' },
         voice_on:'🔊 Voix : Activée', voice_off:'🔇 Voix : Désactivée', apt_label: base.apt_label.fr },
    de:{ welcome:'Hallo, ich bin Samantha, dein virtueller Guide. Tippe auf einen Button für eine schnelle Antwort.',
         placeholder:'Nachricht eingeben… z. B. WLAN, Verkehr, Essen',
         buttons:{ wifi:'WLAN','check in':'check in','check out':'check out','water':'Wasser','AC':'Klimaanlage','bathroom':'Bad','kitchen':'Küche',
           eat:'Essen', drink:'Trinken', shop:'Shopping', visit:'Sehenswürdigkeiten', 'hidden gems':'versteckte Ecken', experience:'Erlebnisse', 'day trips':'Tagesausflüge',
           transport:'Verkehr', services:'Services', emergency:'Notfall' },
         voice_on:'🔊 Stimme: An', voice_off:'🔇 Stimme: Aus', apt_label: base.apt_label.de },
    es:{ welcome:'Hola, soy Samantha, tu guía virtual. Toca un botón para una respuesta rápida.',
         placeholder:'Escribe un mensaje… p. ej., wifi, transporte, comer',
         buttons:{ wifi:'wifi','check in':'check in','check out':'check out','water':'agua','AC':'aire acondicionado','bathroom':'baño','kitchen':'cocina',
           eat:'comer', drink:'beber', shop:'compras', visit:'visitar', 'hidden gems':'rincones ocultos', experience:'experiencias', 'day trips':'excursiones',
           transport:'transporte', services:'servicios', emergency:'emergencia' },
         voice_on:'🔊 Voz: Activada', voice_off:'🔇 Voz: Desactivada', apt_label: base.apt_label.es }
  };

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
.controls{display:flex;gap:8px;margin-top:8px;align-items:center;flex-wrap:wrap}
.lang{display:flex;gap:6px;margin-left:auto}
.lang button{border:1px solid #ddd;background:#fff;padding:6px 8px;border-radius:10px;cursor:pointer;font-size:13px}
.lang button[aria-current="true"]{background:#2b2118;color:#fff;border-color:#2b2118}
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
      <div class="apt"><span id="aptLabel">${base.apt_label.en}</span>: ${base.apartment_id}</div>
    </div>
    <div class="controls">
      <button id="voiceBtn" aria-pressed="false" title="Toggle voice">🔇 Voice: Off</button>
      <nav class="lang" aria-label="Language">
        <button data-lang="en" aria-current="true">EN</button>
        <button data-lang="it">IT</button>
        <button data-lang="fr">FR</button>
        <button data-lang="de">DE</button>
        <button data-lang="es">ES</button>
      </nav>
    </div>
  </header>

  <main id="chat" aria-live="polite"></main>

  <footer>
    <input id="input" placeholder="Type a message… e.g., wifi, transport, eat" autocomplete="off">
    <button id="sendBtn">Send</button>
  </footer>
</div>
<script>
const UI_I18N = ${JSON.stringify(UI_I18N)};
const BUTTON_KEYS = ${JSON.stringify(BUTTON_KEYS)};

const chatEl = document.getElementById('chat');
const input = document.getElementById('input');
const sendBtn = document.getElementById('sendBtn');

// Lingua: ?lang -> localStorage -> navigator
const url = new URL(location);
let lang = (url.searchParams.get('lang') || localStorage.getItem('lang') || (navigator.language||'en').slice(0,2)).toLowerCase();
if(!UI_I18N[lang]) lang='en';
url.searchParams.set('lang', lang); history.replaceState(null,'',url);
localStorage.setItem('lang', lang);

// ---------- TTS: voce madrelingua per lingua ----------
let voiceOn = false, pick = null;
const VOICE_PREFS = {
  en: ['Samantha','Google US English'],
  it: ['Alice','Eloisa','Google italiano'],
  fr: ['Amelie','Thomas','Google français'],
  de: ['Anna','Markus','Google Deutsch'],
  es: ['Monica','Jorge','Paulina','Google español']
};
function selectVoice(){
  if(!('speechSynthesis' in window)) return null;
  const all = speechSynthesis.getVoices()||[];
  const prefs = VOICE_PREFS[lang]||[];
  for(const name of prefs){
    const v = all.find(v => (v.name||'').toLowerCase()===name.toLowerCase());
    if(v) return v;
  }
  const byLang = all.find(v => (v.lang||'').toLowerCase().startsWith(lang));
  return byLang || all[0] || null;
}
function refreshVoice(){ pick = selectVoice(); }
if('speechSynthesis' in window){
  refreshVoice(); speechSynthesis.onvoiceschanged = refreshVoice;
}
function warm(){
  if(!('speechSynthesis' in window)) return;
  try{
    speechSynthesis.cancel();
    const dot = new SpeechSynthesisUtterance('.');
    dot.rate=1; dot.pitch=1; dot.volume=0.01;
    if(pick) dot.voice=pick;
    dot.lang = pick?.lang || lang;
    speechSynthesis.speak(dot);
  }catch{}
}
function speak(t){
  if(!voiceOn || !('speechSynthesis' in window)) return;
  try{
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t);
    if(pick) u.voice=pick;
    u.lang = pick?.lang || lang;
    speechSynthesis.speak(u);
  }catch{}
}

document.getElementById('voiceBtn').addEventListener('click',e=>{
  voiceOn = !voiceOn;
  e.currentTarget.setAttribute('aria-pressed', String(voiceOn));
  applyUI();
  if(voiceOn) warm();
});
document.querySelector('.lang').addEventListener('click',e=>{
  const btn = e.target.closest('[data-lang]'); if(!btn) return;
  lang = btn.getAttribute('data-lang');
  localStorage.setItem('lang', lang);
  const u = new URL(location); u.searchParams.set('lang', lang); history.replaceState(null,'',u);
  refreshVoice(); applyUI(); chatEl.innerHTML=''; welcome();
  if(voiceOn) warm();
});

function applyUI(){
  const t = UI_I18N[lang] || UI_I18N.en;
  document.getElementById('aptLabel').textContent = t.apt_label;
  document.getElementById('voiceBtn').textContent = voiceOn ? t.voice_on : t.voice_off;
  input.placeholder = t.placeholder;
  document.querySelectorAll('.lang [data-lang]').forEach(b=>{
    b.setAttribute('aria-current', b.getAttribute('data-lang')===lang ? 'true':'false');
  });
}

function add(type, txt){
  const d=document.createElement('div');
  d.className='msg '+(type==='me'?'me':'wd');
  d.textContent=txt;
  chatEl.appendChild(d);
  chatEl.scrollTop=chatEl.scrollHeight;
}
function welcome(){
  const t = UI_I18N[lang] || UI_I18N.en;
  add('wd', t.welcome);
  const q=document.createElement('div'); q.className='quick';
  for(const key of BUTTON_KEYS){
    const label = t.buttons[key] || key;
    const b=document.createElement('button'); b.textContent=label;
    // invia sempre la keyword EN per il matching
    b.onclick=()=>{ input.value=key; send(); };
    q.appendChild(b);
  }
  chatEl.appendChild(q);
}

async function send(){
  const text=(input.value||'').trim(); if(!text) return;
  add('me', text); input.value='';
  try{
    const r=await fetch('/api/message',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({message:text, lang})
    });
    const data=await r.json();
    const bot=data.text||'Sorry, something went wrong.';
    add('wd',bot); speak(bot);
  }catch{
    add('wd','Network error. Please try again.');
  }
}
sendBtn.addEventListener('click',send);
input.addEventListener('keydown',e=>{ if(e.key==='Enter') send(); });

applyUI();
welcome();
</script>
</body></html>`;
  res.setHeader('content-type','text/html; charset=utf-8');
  res.end(html);
});

// ---------------- Start ----------------
const port = process.env.PORT || 8787;
app.listen(port, ()=>console.log('Guest assistant up on http://localhost:'+port));
