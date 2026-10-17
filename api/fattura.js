export default async function handler(req, res) {
  // Consentiamo le chiamate dalla tua web app
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const { token, companyId, payload } = req.body;

  if (!token || !companyId || !payload) {
    return res.status(400).json({ error: 'Parametri mancanti (token, companyId o payload)' });
  }

  try {
    const response = await fetch(`https://api-v2.fattureincloud.it/c/${companyId}/issued_documents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
