export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { query, mode } = req.body;
  if (!query) return res.status(400).json({ error: 'Query gerekli' });
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) return res.status(500).json({ error: 'API key ayarlanmamış' });

  const prompt = `You are a recommendation engine for Asian dramas and films.

IMPORTANT: You MUST use official English/international titles only. Never translate titles to Turkish or any other language.
Good examples: "Goblin", "Vincenzo", "My Mister", "The Glory", "Reply 1988", "Crash Landing on You", "Squid Game", "My Love from the Star"
Bad examples: "Cin Rüyası", "Okul Sırları", "Aile Çiftliği" - these are WRONG, never do this.

User request: ${mode === 'tarz' ? 'Find 5 Asian dramas/films matching this genre/mood: ' + query : 'Find 5 Asian dramas/films similar to: ' + query}

Respond ONLY with this exact JSON format, no other text:
{"oneriler":[{"baslik":"Official English title","orijinal":"Native Korean/Japanese/Chinese title","ulke":"Kore","tur":"dizi","yil":"2020","imdb":"8.4","altbaslik":"Spesifik Türkçe açıklama 10-15 kelime","ozet":"İki cümle Türkçe özet."}]}

Give exactly 5 items.`;

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0,
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await groqRes.json();
    if (data.error) throw new Error(data.error.message);
    const text = data.choices[0].message.content;
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    res.status(200).json(parsed);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
