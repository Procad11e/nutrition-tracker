export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Methode nicht erlaubt' });
    }

    const apiKey = process.env.GEMINI_API_KEY; 
    
    // HIER IST DEIN ERSEHNTER OUTPUT:
    // Wir schneiden den Key sicher aus, damit du ihn im Browser prüfen kannst!
    const maskedKey = apiKey 
        ? `${apiKey.substring(0, 12)}...${apiKey.substring(apiKey.length - 4)}` 
        : '⚠️ KEIN KEY IN DEN VERCEL-EINSTELLUNGEN GEFOUNDEN!';

    if (!apiKey) {
        return res.status(500).json({ 
            error: `API-Key fehlt völlig. Geladener Wert: ${maskedKey}` 
        });
    }

    try {
        const systemPrompt = req.body.contents[0].parts[0].text;
        const userInput = req.body.contents[0].parts[1].text;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://vercel.com', 
                'X-Title': 'Nutrition Tracker'
            },
            body: JSON.stringify({
                // Modell-ID angepasst auf den aktuellen Standard
                model: "google/gemini-2.5-flash", 
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userInput }
                ]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            // Wenn OpenRouter meckert, packen wir deinen Key direkt in die Fehlermeldung für den Browser!
            return res.status(response.status).json({ 
                error: `OpenRouter meldet: ${data.error?.message || 'Fehler'}. -> Dein aktiver Vercel-Key ist: ${maskedKey}` 
            });
        }

        const aiText = data.choices?.[0]?.message?.content || '';

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
        return res.status(500).json({ 
            error: `Server-Fehler: ${error.message} -> Dein aktiver Vercel-Key ist: ${maskedKey}` 
        });
    }
}
