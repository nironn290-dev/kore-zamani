export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query, mode } = req.body;
  if (!query) return res.status(400).json({ error: 'Query gerekli' });

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) return res.status(500).json({ error: 'API key ayarlanmamış' });

  const systemPrompt = `Sen "Kore Zamanı" YouTube kanalının yapay zeka asistanısın. Türk izleyicilere Asya dizi ve film önerileri yapıyorsun.
Kapsam: Kore dizileri, Kore filmleri, Japon dizileri, Çin dizileri.
SADECE JSON formatında yanıt ver, başka hiçbir şey yazma, markdown kullanma, kod bloğu kullanma.
Format:
{"oneriler":[{"baslik":"Türkçe adı","orijinal":"Orijinal dil adı","ulke":"Kore veya Japon veya Cin","tur":"dizi veya film","yil":"2020","imdb":"8.4","ozet":"1 cümle özet.","neden":"Neden bu kullanıcıya uygun, 1 cümle."}]}
Tam 5 öneri ver.`;

  const userPrompt = mode === 'tarz'
    ? `Şu tarza uygun 5 Asya dizi/film öner: ${query}`
    : `"${query}" dizisine/filmine benzer 5 Asya içeriği öner`;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1000 }
        })
      }
    );

    const data = await geminiRes.json();
    if (data.error) throw new Error(data.error.message);

    const text = data.candidates[0].content.parts[0].text;
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    res.status(200).json(parsed);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
