const kanalVideolari = {
  "Goblin": "BURAYA_VIDEO_ID",
  "Penthouse: Açgözlülük ve İntikam": "BURAYA_VIDEO_ID",
  "Squid Game": "BURAYA_VIDEO_ID",
  "My Love from the Star": "BURAYA_VIDEO_ID",
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
  document.getElementById('resultsArea').innerHTML = `<div class="loading"><div class="pulse"></div><br><br>Öneriler hazırlanıyor...</div>`;
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
    document.getElementById('resultsArea').innerHTML = `<div class="err">Hata: ${e.message}</div>`;
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
function isSaved(b) { return watchList.some(w => w.baslik === b); }

function getVideoId(baslik) {
  for (const [key, val] of Object.entries(kanalVideolari)) {
    if (baslik.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(baslik.toLowerCase())) {
      return val !== 'BURAYA_VIDEO_ID' ? val : null;
    }
  }
  return null;
}

function renderResults(list, q) {
  if (!list || !list.length) { document.getElementById('resultsArea').innerHTML = '<div class="loading">Sonuç bulunamadı.</div>'; return; }
  let html = `<div class="r-label">"${q}" için ${list.length} öneri</div><div class="result-grid">`;
  list.forEach((item, i) => {
    const sid = 'r' + i;
    const saved = isSaved(item.baslik);
    const rating = ratings[item.baslik] || 0;
    const likeCount = likes[item.baslik] || 0;
    const liked = localStorage.getItem('kz_liked_' + item.baslik) === '1';
    const videoId = getVideoId(item.baslik);
    const starsHtml = [1,2,3,4,5].map(s =>
      `<span class="star ${rating >= s ? 'lit' : ''}" data-sid="${sid}" data-baslik="${encodeURIComponent(item.baslik)}" data-val="${s}">★</span>`
    ).join('');
    const videoHtml = videoId
      ? `<button class="video-btn" data-sid="${sid}" data-vid="${videoId}"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> Kore Zamanı Videosu</button><div id="vid-${sid}"></div>`
      : '';
    const itemJson = JSON.stringify(item).replace(/"/g, '&quot;');
    html += `<div class="r-card">
      <div class="r-head">
        <div class="r-title">${item.baslik}</div>
        <span class="r-badge ${badgeClass(item)}">${badgeLabel(item)}</span>
      </div>
      ${item.orijinal ? `<div class="r-orig">${item.orijinal}</div>` : ''}
      <div class="r-meta">${item.yil} · IMDb ${item.imdb}</div>
      <div class="r-desc">${item.ozet}</div>
      <div class="r-why">${item.neden}</div>
      ${videoHtml}
      <div class="social-row">
        <button class="like-btn ${liked ? 'liked' : ''}" id="like-${sid}" data-sid="${sid}" data-baslik="${encodeURIComponent(item.baslik)}">
          <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          <span id="lc-${sid}">${likeCount}</span>
        </button>
        <button class="yorum-toggle" data-sid="${sid}" data-baslik="${encodeURIComponent(item.baslik)}">Yorumlar</button>
      </div>
      <div id="yorumlar-${sid}" style="display:none;">
        <div class="yorum-area">
          <div class="yorumlar" id="ylist-${sid}"></div>
          <div class="yorum-inp-row">
            <input class="yorum-inp" id="yinp-${sid}" placeholder="Yorumunu yaz..." maxlength="200">
            <button class="yorum-send" data-sid="${sid}" data-baslik="${encodeURIComponent(item.baslik)}">Gönder</button>
          </div>
        </div>
      </div>
      <div class="r-actions">
        <button class="save-btn ${saved ? 'saved' : ''}" id="sb-${sid}" data-sid="${sid}" data-item="${itemJson}">${saved ? '♥ Listede' : '+ Listeye Ekle'}</button>
        <div class="stars-row" id="stars-${sid}">${starsHtml}</div>
      </div>
    </div>`;
  });
  html += '</div>';
  document.getElementById('resultsArea').innerHTML = html;
  attachEvents();
}

function attachEvents() {
  // Yıldız
  document.querySelectorAll('.star').forEach(el => {
    el.addEventListener('click', function() {
      const sid = this.dataset.sid;
      const baslik = decodeURIComponent(this.dataset.baslik);
      const val = parseInt(this.dataset.val);
      ratings[baslik] = val;
      saveStorage();
      const row = document.getElementById('stars-' + sid);
      row.querySelectorAll('.star').forEach((s, i) => {
        s.className = 'star' + (i < val ? ' lit' : '');
      });
    });
  });

  // Video
  document.querySelectorAll('.video-btn').forEach(el => {
    el.addEventListener('click', function() {
      const sid = this.dataset.sid;
      const vid = this.dataset.vid;
      const el2 = document.getElementById('vid-' + sid);
      if (openVideos[sid]) {
        el2.innerHTML = '';
        openVideos[sid] = false;
      } else {
        el2.innerHTML = `<div class="video-embed"><iframe src="https://www.youtube.com/embed/${vid}" allowfullscreen></iframe></div>`;
        openVideos[sid] = true;
      }
    });
  });

  // Beğeni
  document.querySelectorAll('.like-btn').forEach(el => {
    el.addEventListener('click', function() {
      const sid = this.dataset.sid;
      const baslik = decodeURIComponent(this.dataset.baslik);
      const key = 'kz_liked_' + baslik;
      const liked = localStorage.getItem(key) === '1';
      if (liked) {
        localStorage.removeItem(key);
        likes[baslik] = Math.max(0, (likes[baslik] || 1) - 1);
      } else {
        localStorage.setItem(key, '1');
        likes[baslik] = (likes[baslik] || 0) + 1;
      }
      saveStorage();
      this.className = 'like-btn' + (!liked ? ' liked' : '');
      document.getElementById('lc-' + sid).textContent = likes[baslik];
    });
  });

  // Yorumlar toggle
  document.querySelectorAll('.yorum-toggle').forEach(el => {
    el.addEventListener('click', function() {
      const sid = this.dataset.sid;
      const baslik = decodeURIComponent(this.dataset.baslik);
      const el2 = document.getElementById('yorumlar-' + sid);
      if (el2.style.display === 'none') {
        el2.style.display = 'block';
        renderYorumlar(baslik, sid);
      } else {
        el2.style.display = 'none';
      }
    });
  });

  // Yorum gönder
  document.querySelectorAll('.yorum-send').forEach(el => {
    el.addEventListener('click', function() {
      const sid = this.dataset.sid;
      const baslik = decodeURIComponent(this.dataset.baslik);
      const inp = document.getElementById('yinp-' + sid);
      const text = inp.value.trim();
      if (!text) return;
      if (!yorumlar[baslik]) yorumlar[baslik] = [];
      const nick = 'Takipçi ' + Math.floor(Math.random() * 999 + 1);
      yorumlar[baslik].push({nick, text});
      saveStorage();
      inp.value = '';
      renderYorumlar(baslik, sid);
    });
  });

  // Listeye ekle
  document.querySelectorAll('.save-btn').forEach(el => {
    el.addEventListener('click', function() {
      const sid = this.dataset.sid;
      const item = JSON.parse(this.dataset.item.replace(/&quot;/g, '"'));
      const idx = watchList.findIndex(w => w.baslik === item.baslik);
      if (idx >= 0) watchList.splice(idx, 1);
      else watchList.push(item);
      saveStorage();
      const saved = isSaved(item.baslik);
      this.textContent = saved ? '♥ Listede' : '+ Listeye Ekle';
      this.className = 'save-btn' + (saved ? ' saved' : '');
    });
  });
}

function renderYorumlar(baslik, sid) {
  const list = yorumlar[baslik] || [];
  const el = document.getElementById('ylist-' + sid);
  if (!list.length) { el.innerHTML = '<div style="font-size:11px;color:var(--txt3);padding:4px;">Henüz yorum yok. İlk yorumu yaz!</div>'; return; }
  el.innerHTML = list.map(y => `<div class="yorum-item"><div class="yorum-nick">${y.nick}</div><div class="yorum-text">${y.text}</div></div>`).join('');
  el.scrollTop = el.scrollHeight;
}

function renderListe() {
  if (!watchList.length) {
    document.getElementById('listeArea').innerHTML = `<div class="list-empty">Henüz listeye eklediğin içerik yok.<br>Öneri al ve beğendiklerini kaydet!</div>`;
    return;
  }
  let html = `<div class="r-label" style="margin-bottom:10px;">${watchList.length} içerik kaydedildi</div>`;
  watchList.forEach((item, i) => {
    const r = ratings[item.baslik] || 0;
    html += `<div class="l-card">
      <div class="l-icon"><svg viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg></div>
      <div class="l-info">
        <div class="l-title">${item.baslik}</div>
        <div class="l-meta">${item.yil} · IMDb ${item.imdb} ${r ? '<span class="l-stars">' + '★'.repeat(r) + '</span>' : ''}</div>
      </div>
      <span class="r-badge ${badgeClass(item)}" style="flex-shrink:0;">${badgeLabel(item)}</span>
      <button class="rm-btn" data-idx="${i}">×</button>
    </div>`;
  });
  document.getElementById('listeArea').innerHTML = html;
  document.querySelectorAll('.rm-btn').forEach(el => {
    el.addEventListener('click', function() {
      watchList.splice(parseInt(this.dataset.idx), 1);
      saveStorage();
      renderListe();
    });
  });
}

// Nav butonları
document.querySelectorAll('.nav-btn').forEach((btn, i) => {
  btn.addEventListener('click', function() { goTab(i === 0 ? 'oneri' : 'liste', this); });
});
document.getElementById('listCount').addEventListener('click', function() {
  goTab('liste', document.querySelectorAll('.nav-btn')[1]);
});
document.getElementById('mA').addEventListener('click', () => setMode('tarz'));
document.getElementById('mB').addEventListener('click', () => setMode('benzer'));
document.getElementById('goBtn').addEventListener('click', fetchRecs);
document.getElementById('qInput').addEventListener('keydown', e => { if (e.key === 'Enter') fetchRecs(); });
document.querySelectorAll('.tag').forEach(t => {
  t.addEventListener('click', function() { quickTag(this.textContent); });
});

saveStorage();
