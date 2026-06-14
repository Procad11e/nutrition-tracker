export default async function handler(req, res) {
    // Nur POST-Requests erlauben
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Wir behalten den Variablennamen bei, damit du in Vercel nichts ändern musst
    const apiKey = process.env.GEMINI_API_KEY; 
    if (!apiKey) {
        return res.status(500).json({ error: 'Konfigurationsfehler: API-Key fehlt auf Vercel.' });
    }

    try {
        const { foodDescription } = req.body;
        if (!foodDescription) {
            return res.status(400).json({ error: 'Leere Anfrage: Keine Mahlzeit übergeben.' });
        }

        // Native OpenRouter-Anfrage im OpenAI-Format
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://vercel.com',
                'X-Title': 'Nutrition Tracker'
            },
            body: JSON.stringify({
                model: "meta-llama/llama-3-8b-instruct:free",
                messages: [
                    {
                        role: "system",
                        content: "You are a precise nutrition expert. Analyze the given meal and return ONLY a valid JSON object. Do not include markdown formatting, backticks, or prose. Structure: {\"kcal\": number, \"protein\": number, \"carbs\": number, \"fat\": number}"
                    },
                    {
                        role: "user",
                        content: `Analyze this meal: ${foodDescription}`
                    }
                ],
                response_format: { type: "json_object" },
                temperature: 0.1
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({ 
                error: data.error?.message || 'OpenRouter API-Fehler' 
            });
        }

        const content = data.choices?.[0]?.message?.content;
        if (!content) {
            return res.status(502).json({ error: 'Ungültige Antwort von der KI erhalten.' });
        }

        // KI-Antwort parsen
        const nutritionData = JSON.parse(content);
        
        // Saubere, gerundete Daten direkt ans Frontend zurückgeben
        return res.status(200).json({
            kcal: Math.round(nutritionData.kcal || 0),
            protein: Math.round((nutritionData.protein || 0) * 10) / 10,
            carbs: Math.round((nutritionData.carbs || 0) * 10) / 10,
            fat: Math.round((nutritionData.fat || 0) * 10) / 10
        });

    } catch (error) {
        return res.status(500).json({ error: `Server-Fehler: ${error.message}` });
    }
}
