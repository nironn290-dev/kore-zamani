const kanalVideolari = {
  "Goblin": "BURAYA_VIDEO_ID",
  "Penthouse": "BURAYA_VIDEO_ID",
  "Squid Game": "BURAYA_VIDEO_ID",
  "Crash Landing on You": "BURAYA_VIDEO_ID",
};

let mode = 'tarz';
let watchList = JSON.parse(localStorage.getItem('kz_list') || '[]');
let ratings = JSON.parse(localStorage.getItem('kz_ratings') || '{}');
let likes = JSON.parse(localStorage.getItem('kz_likes') || '{}');
let yorumlar = JSON.parse(localStorage.getItem('kz_yorumlar') || '{}');
let openVideos = {};

function saveStorage() {
  localStorage.setItem('kz_list', JSON.stringify(watchList));
  localStorage.setItem('kz_ratings', JSON.stringify(ratings));
  localStorage.setItem('kz_likes', JSON.stringify(likes));
  localStorage.setItem('kz_yorumlar', JSON.stringify(yorumlar));
  document.getElementById('listCount').textContent = '♥ ' + watchList.length;
}

function goTab(t, btn) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + t).classList.add('active');
  btn.classList.add('active');
  if (t === 'liste') renderListe();
}

function setMode(m) {
  mode = m;
  document.getElementById('mA').classList.toggle('active', m === 'tarz');
  document.getElementById('mB').classList.toggle('active', m === 'benzer');
  document.getElementById('qInput').placeholder = m === 'tarz' ? 'Romantik, gerilim, ağlatan...' : 'Sevdiğin bir dizi veya film yaz...';
  document.getElementById('qInput').value = '';
  document.getElementById('resultsArea').innerHTML = '';
}

function quickTag(v) {
  document.getElementById('qInput').value = v;
  fetchRecs();
}

async function fetchRecs() {
  const q = document.getElementById('qInput').value.trim();
  if (!q) return;
  document.getElementById('goBtn').disabled = true;
  document.getElementById('resultsArea').innerHTML = '<div class="loading"><div class="pulse"></div><br><br>Öneriler hazırlanıyor...</div>';
  openVideos = {};
  try {
    const res = await fetch('/api/recommend', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({query: q, mode})
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    renderResults(data.oneriler, q);
  } catch(e) {
    document.getElementById('resultsArea').innerHTML = '<div class="err">Hata: ' + e.message + '</div>';
  }
  document.getElementById('goBtn').disabled = false;
}

function badgeClass(item) {
  if (item.ulke === 'Japon') return 'b-japon';
  if (item.ulke === 'Cin') return 'b-cin';
  return item.tur === 'film' ? 'b-kore-film' : 'b-kore-dizi';
}
function badgeLabel(item) {
  const u = item.ulke === 'Japon' ? 'Japon' : item.ulke === 'Cin' ? 'Çin' : 'Kore';
  return u + ' ' + (item.tur === 'film' ? 'Film' : 'Dizi');
}
function isSaved(orijinal) { return watchList.some(w => w.orijinal === orijinal); }

function getVideoId(baslik) {
  if (!baslik) return null;
  for (const key of Object.keys(kanalVideolari)) {
    if (baslik.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(baslik.toLowerCase())) {
      return kanalVideolari[key] !== 'BURAYA_VIDEO_ID' ? kanalVideolari[key] : null;
    }
  }
  return null;
}

function renderResults(list, q) {
  if (!list || !list.length) { document.getElementById('resultsArea').innerHTML = '<div class="loading">Sonuç bulunamadı.</div>'; return; }
  const style = document.getElementById('kz-style');
  if (!style) {
    const s = document.createElement('style');
    s.id = 'kz-style';
    s.textContent = '.r-altbaslik{font-size:15px;font-weight:600;color:#fff;margin-bottom:6px;line-height:1.4;}';
    document.head.appendChild(s);
  }
  let html = '<div class="r-label">"' + q + '" için ' + list.length + ' öneri</div><div class="result-grid">';
  list.forEach((item, i) => {
    const sid = 'r' + i;
    const key = item.orijinal || item.baslik;
    const saved = isSaved(key);
    const rating = ratings[key] || 0;
    const likeCount = likes[key] || 0;
    const liked = localStorage.getItem('kz_liked_' + key) === '1';
    const videoId = getVideoId(item.baslik);
    const starsHtml = [1,2,3,4,5].map(s =>
      '<span class="star ' + (rating >= s ? 'lit' : '') + '" data-sid="' + sid + '" data-key="' + encodeURIComponent(key) + '" data-val="' + s + '">★</span>'
    ).join('');
    const videoHtml = videoId
      ? '<button class="video-btn" data-sid="' + sid + '" data-vid="' + videoId + '"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> Kore Zamanı Videosu</button><div id="vid-' + sid + '"></div>'
      : '';
    const itemJson = JSON.stringify(item).replace(/"/g, '&quot;');
    html += '<div class="r-card">' +
      '<div class="r-head"><div class="r-title">' + item.baslik + '</div><span class="r-badge ' + badgeClass(item) + '">' + badgeLabel(item) + '</span></div>' +
      '<div class="r-orig">' + (item.orijinal || '') + '</div>' +
      '<div class="r-altbaslik">' + (item.altbaslik || '') + '</div>' +
      '<div class="r-meta">' + item.yil + ' · IMDb ' + item.imdb + '</div>' +
      '<div class="r-desc">' + item.ozet + '</div>' +
      videoHtml +
      '<div class="social-row">' +
        '<button class="like-btn ' + (liked ? 'liked' : '') + '" id="like-' + sid + '" data-sid="' + sid + '" data-key="' + encodeURIComponent(key) + '">' +
          '<svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>' +
          '<span id="lc-' + sid + '">' + likeCount + '</span>' +
        '</button>' +
        '<button class="yorum-toggle" data-sid="' + sid + '" data-key="' + encodeURIComponent(key) + '">Yorumlar</button>' +
      '</div>' +
      '<div id="yorumlar-' + sid + '" style="display:none;">' +
        '<div class="yorum-area">' +
          '<div class="yorumlar" id="ylist-' + sid + '"></div>' +
          '<div class="yorum-inp-row">' +
            '<input class="yorum-inp" id="yinp-' + sid + '" placeholder="Yorumunu yaz..." maxlength="200">' +
            '<button class="yorum-send" data-sid="' + sid + '" data-key="' + encodeURIComponent(key) + '">Gönder</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="r-actions">' +
        '<button class="save-btn ' + (saved ? 'saved' : '') + '" id="sb-' + sid + '" data-sid="' + sid + '" data-item="' + itemJson + '">' + (saved ? '♥ Listede' : '+ Listeye Ekle') + '</button>' +
        '<div class="stars-row" id="stars-' + sid + '">' + starsHtml + '</div>' +
      '</div>' +
    '</div>';
  });
  html += '</div>';
  document.getElementById('resultsArea').innerHTML = html;
  attachEvents();
}

function attachEvents() {
  document.querySelectorAll('.star').forEach(el => {
    el.addEventListener('click', function() {
      const sid = this.dataset.sid;
      const key = decodeURIComponent(this.dataset.key);
      const val = parseInt(this.dataset.val);
      ratings[key] = val;
      saveStorage();
      document.getElementById('stars-' + sid).querySelectorAll('.star').forEach((s, i) => {
        s.className = 'star' + (i < val ? ' lit' : '');
      });
    });
  });

  document.querySelectorAll('.video-btn').forEach(el => {
    el.addEventListener('click', function() {
      const sid = this.dataset.sid;
      const vid = this.dataset.vid;
      const el2 = document.getElementById('vid-' + sid);
      if (openVideos[sid]) { el2.innerHTML = ''; openVideos[sid] = false; }
      else { el2.innerHTML = '<div class="video-embed"><iframe src="https://www.youtube.com/embed/' + vid + '" allowfullscreen></iframe></div>'; openVideos[sid] = true; }
    });
  });

  document.querySelectorAll('.like-btn').forEach(el => {
    el.addEventListener('click', function() {
      const sid = this.dataset.sid;
      const key = decodeURIComponent(this.dataset.key);
      const storageKey = 'kz_liked_' + key;
      const liked = localStorage.getItem(storageKey) === '1';
      if (liked) { localStorage.removeItem(storageKey); likes[key] = Math.max(0, (likes[key] || 1) - 1); }
      else { localStorage.setItem(storageKey, '1'); likes[key] = (likes[key] || 0) + 1; }
      saveStorage();
      this.className = 'like-bt
