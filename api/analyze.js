export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Methode nicht erlaubt' });
    }

    // Nutzt deinen neuen OpenRouter-Key, den du in Vercel gespeichert hast
    const apiKey = process.env.GEMINI_API_KEY; 
    
    if (!apiKey) {
        return res.status(500).json({ error: 'API-Key auf Vercel fehlt.' });
    }

    try {
        // Extrahiere die Prompts aus dem Format, das deine index.html losschickt
        const systemPrompt = req.body.contents[0].parts[0].text;
        const userInput = req.body.contents[0].parts[1].text;

        // Anfrage an OpenRouter senden
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://vercel.com', 
                'X-Title': 'Nutrition Tracker'
            },
            body: JSON.stringify({
                model: "google/gemini-2-flash:free", // Nutzt Gemini 2 Flash völlig kostenlos und ohne IP-Sperre
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userInput }
                ]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({ error: data.error?.message || 'OpenRouter Fehler' });
        }

        const aiText = data.choices?.[0]?.message?.content || '';

        // WICHTIGER TRICK: Wir verpacken die Antwort im alten Google-Format,
        // damit deine index.html fehlerfrei weiterarbeitet!
        const geminiFormat = {
            candidates: [
                {
                    content: {
                        parts: [
                            { text: aiText }
                        ]
                    }
                }
            ]
        };

        return res.status(200).json(geminiFormat);

    } catch (error) {
        return res.status(500).json({ error: 'Server-Fehler: ' + error.message });
    }
}
