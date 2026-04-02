export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { query, mode } = req.body;
  if (!query) return res.status(400).json({ error: 'Query gerekli' });
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) return res.status(500).json({ error: 'API key ayarlanmamış' });
  const systemPrompt = `Sen "Kore Zamanı" YouTube kanalının yapay zeka asistanısın. Türk izleyicilere Asya dizi ve film önerileri yapıyorsun.\nKapsam: Kore dizileri, Kore filmleri, Japon dizileri, Çin dizileri.\nSADECE JSON formatında yanıt ver, başka hiçbir şey yazma, markdown kullanma, kod bloğu kullanma.\nFormat:\n{"oneriler":[{"baslik":"Türkçe adı","orijinal":"Orijinal dil adı","ulke":"Kore veya Japon veya Cin","tur":"dizi veya film","yil":"2020","imdb":"8.4","ozet":"1 cümle özet.","neden":"Neden bu kullanıcıya uygun, 1 cümle."}]}\nTam 5 öneri ver.`;
  const userPrompt = mode === 'tarz' ? `Şu tarza uygun 5 Asya dizi/film öner: ${query}` : `"${query}" dizisine/filmine benzer 5 Asya içeriği öner`;
  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', temperature: 0.7, max_tokens: 1000, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }] })
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
