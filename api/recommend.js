export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { query, mode } = req.body;
  if (!query) return res.status(400).json({ error: 'Query gerekli' });
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) return res.status(500).json({ error: 'API key ayarlanmamış' });
  const systemPrompt = `You are an AI assistant for "Kore Zamanı" YouTube channel. Recommend Asian dramas and films to Turkish viewers.
STRICT RULES:
- baslik: ALWAYS use the official English/international title. NEVER translate to Turkish. Examples: "Goblin", "Vincenzo", "My Mister", "The Glory", "Reply 1988", "Crash Landing on You"
- orijinal: Native language title (Korean, Japanese, Chinese)
- altbaslik: Short specific Turkish description (10-15 words, specific to THIS show)
- ozet: 2 sentence Turkish summary
- ulke: Kore, Japon, or Cin
- tur: dizi or film
Output ONLY valid JSON, no markdown, no extra text:
{"oneriler":[{"baslik":"English title","orijinal":"Native title","ulke":"Kore","tur":"dizi","yil":"2020","imdb":"8.4","altbaslik":"Türkçe açıklama","ozet":"Türkçe özet."}]}
Give exactly 5 recommendations.`;
  const userPrompt = mode === 'tarz' ? `Recommend 5 Asian dramas/films for this preference: ${query}` : `Recommend 5 Asian dramas/films similar to: ${query}`;
  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', temperature: 0.1, max_tokens: 1000, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }] })
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
