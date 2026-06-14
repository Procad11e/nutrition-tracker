export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Methode nicht erlaubt' });
    }

    const apiKey = process.env.GEMINI_API_KEY; 
    
    if (!apiKey) {
        return res.status(500).json({ error: 'API-Key auf Vercel fehlt.' });
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
                // GEÄNDERT: Auf die offizielle und gültige OpenRouter Model-ID
                model: "google/gemini-2-flash", 
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
