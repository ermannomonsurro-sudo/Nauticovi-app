// /api/fattura.js (Vercel Serverless Function)
//
// Variabili d'ambiente da impostare su Vercel (Settings -> Environment Variables):
//   FIC_TOKEN         token API di Fatture in Cloud
//   FIC_COMPANY_ID     id azienda su Fatture in Cloud
//   SUPABASE_URL       https://cbvpixcfhmedbapnvfmw.supabase.co
//   SUPABASE_ANON_KEY  chiave pubblica (publishable) di Supabase
//   ADMIN_EMAIL        email admin separate da virgola (es. admin1@nauticovi.it, admin2@nauticovi.it)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const { FIC_TOKEN, FIC_COMPANY_ID, SUPABASE_URL, SUPABASE_ANON_KEY, ADMIN_EMAIL } = process.env;

  if (!FIC_TOKEN || !FIC_COMPANY_ID || !SUPABASE_URL || !SUPABASE_ANON_KEY || !ADMIN_EMAIL) {
    return res.status(500).json({ error: 'Configurazione server incompleta' });
  }

  // 1. Verifica che la richiesta arrivi dall'admin loggato su Supabase
  const authHeader = req.headers.authorization || '';
  const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!jwt) {
    return res.status(401).json({ error: 'Non autenticato' });
  }

  try {
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${jwt}`
      }
    });

    if (!userRes.ok) {
      return res.status(401).json({ error: 'Sessione non valida o scaduta' });
    }

    const user = await userRes.json();

    // Splitta la lista delle email e controlla se l'utente corrente è tra quelle autorizzate
    const emailAutorizzate = ADMIN_EMAIL.split(',').map(e => e.trim().toLowerCase());
    const userEmail = user.email ? user.email.toLowerCase() : '';

    if (!userEmail || !emailAutorizzate.includes(userEmail)) {
      return res.status(403).json({ error: 'Utente non autorizzato' });
    }

    // 2. Valida il documento ricevuto
    const documento = req.body && req.body.payload && req.body.payload.data;
    if (!documento || typeof documento !== 'object') {
      return res.status(400).json({ error: 'Payload mancante' });
    }

    // Dal browser si possono creare solo BOZZE di fattura
    const body = { data: { ...documento, type: 'invoice', is_draft: true } };

    // 3. Chiamata a Fatture in Cloud con il token tenuto solo sul server
    const response = await fetch(
      `https://api-v2.fattureincloud.it/c/${FIC_COMPANY_ID}/issued_documents`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${FIC_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }
    );

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
