export default async function handler(req, res) {
    // Nur POST-Anfragen erlauben
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Methode nicht erlaubt' });
    }

    // Holt den Key sicher aus den Vercel-Umgebungsvariablen
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
        return res.status(500).json({ error: 'API-Key ist auf Vercel nicht konfiguriert.' });
    }

    try {
        // Die Anfrage an Google (wird jetzt von einer US-IP ausgeführt!)
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();
        
        // Ergebnis zurück an deine Website senden
        return res.status(response.status).json(data);
    } catch (error) {
        return res.status(500).json({ error: 'Server-Fehler: ' + error.message });
    }
}
