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
function makeKey(baslik, yil) {
  return (baslik + '_' + yil).replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
}
function isSaved(baslik, yil) {
  const k = makeKey(baslik, yil);
  return watchList.some(w => makeKey(w.baslik, w.yil) === k);
}
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
  if (!list || !list.length) {
    document.getElementById('resultsArea').innerHTML = '<div class="loading">Sonuç bulunamadı.</div>';
    return;
  }
  if (!document.getElementById('kz-style')) {
    const s = document.createElement('style');
    s.id = 'kz-style';
    s.textContent = '.r-altbaslik{font-size:15px;font-weight:600;color:#fff;margin-bottom:6px;line-height:1.4;}';
    document.head.appendChild(s);
  }
  let html = '<div class="r-label">"' + q + '" için ' + list.length + ' öneri</div><div class="result-grid">';
  list.forEach(function(item, i) {
    const sid = 'r' + i;
    const rkey = makeKey(item.baslik, item.yil);
    const saved = isSaved(item.baslik, item.yil);
    const rating = ratings[rkey] || 0;
    const likeCount = likes[rkey] || 0;
    const liked = localStorage.getItem('kz_liked_' + rkey) === '1';
    const videoId = getVideoId(item.baslik);
    const starsHtml = [1,2,3,4,5].map(function(s) {
      return '<span class="star ' + (rating >= s ? 'lit' : '') + '" data-rkey="' + rkey + '" data-val="' + s + '" data-sid="' + sid + '">★</span>';
    }).join('');
    const videoHtml = videoId
      ? '<button class="video-btn" data-sid="' + sid + '" data-vid="' + videoId + '"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> Kore Zamanı Videosu</button><div id="vid-' + sid + '"></div>'
      : '';
    const itemJson = JSON.stringify(item).replace(/"/g, '&quot;');
    html += '<div class="r-card">' +
      '<div class="r-head"><div class="r-title">' + item.baslik + '</div><span class="r-badge ' + badgeClass(item) + '">' + badgeLabel(item) + '</span></div>' +
      (item.orijinal ? '<div class="r-orig">' + item.orijinal + '</div>' : '') +
      (item.altbaslik ? '<div class="r-altbaslik">' + item.altbaslik + '</div>' : '') +
      '<div class="r-meta">' + item.yil + ' · IMDb ' + item.imdb + '</div>' +
      '<div class="r-desc">' + item.ozet + '</div>' +
      videoHtml +
      '<div class="social-row">' +
        '<button class="like-btn ' + (liked ? 'liked' : '') + '" id="like-' + sid + '" data-rkey="' + rkey + '" data-sid="' + sid + '">' +
          '<svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>' +
          '<span id="lc-' + sid + '">' + likeCount + '</span>' +
        '</button>' +
        '<button class="yorum-toggle" data-sid="' + sid + '" data-rkey="' + rkey + '">Yorumlar</button>' +
      '</div>' +
      '<div id="yorumlar-' + sid + '" style="display:none;">' +
        '<div class="yorum-area">' +
          '<div class="yorumlar" id="ylist-' + sid + '"></div>' +
          '<div class="yorum-inp-row">' +
            '<input class="yorum-inp" id="yinp-' + sid + '" placeholder="Yorumunu yaz..." maxlength="200">' +
            '<button class="yorum-send" data-sid="' + sid + '" data-rkey="' + rkey + '">Gönder</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="r-actions">' +
        '<button class="save-btn ' + (saved ? 'saved' : '') + '" id="sb-' + sid + '" data-item="' + itemJson + '">' + (saved ? '♥ Listede' : '+ Listeye Ekle') + '</button>' +
        '<div class="stars-row" id="stars-' + sid + '">' + starsHtml + '</div>' +
      '</div>' +
    '</div>';
  });
  html += '</div>';
  document.getElementById('resultsArea').innerHTML = html;
  attachEvents();
}

function attachEvents() {
  document.querySelectorAll('.star').forEach(function(el) {
    el.addEventListener('click', function() {
      const rkey = this.dataset.rkey;
      const val = parseInt(this.dataset.val);
      const sid = this.dataset.sid;
      ratings[rkey] = val;
      saveStorage();
      const row = document.getElementById('stars-' + sid);
      if (row) {
        row.querySelectorAll('.star').forEach(function(s, i) {
          s.className = 'star' + (i < val ? ' lit' : '');
        });
      }
    });
  });

  document.querySelectorAll('.video-btn').forEach(function(el) {
    el.addEventListener('click', function() {
      const sid = this.dataset.sid;
      const vid = this.dataset.vid;
      const el2 = document.getElementById('vid-' + sid);
      if (openVideos[sid]) { el2.innerHTML = ''; openVideos[sid] = false; }
      else { el2.innerHTML = '<div class="video-embed"><iframe src="https://www.youtube.com/embed/' + vid + '" allowfullscreen></iframe></div>'; openVideos[sid] = true; }
    });
  });

  document.querySelectorAll('.like-btn').forEach(function(el) {
    el.addEventListener('click', function() {
      const rkey = this.dataset.rkey;
      const sid = this.dataset.sid;
      const storageKey = 'kz_liked_' + rkey;
      const liked = localStorage.getItem(storageKey) === '1';
      if (liked) { localStorage.removeItem(storageKey); likes[rkey] = Math.max(0, (likes[rkey] || 1) - 1); }
      else { localStorage.setItem(storageKey, '1'); likes[rkey] = (likes[rkey] || 0) + 1; }
      saveStorage();
      this.className = 'like-btn' + (!liked ? ' liked' : '');
      document.getElementById('lc-' + sid).textContent = likes[rkey];
    });
  });

  document.querySelectorAll('.yorum-toggle').forEach(function(el) {
    el.addEventListener('click', function() {
      const sid = this.dataset.sid;
      const rkey = this.dataset.rkey;
      const el2 = document.getElementById('yorumlar-' + sid);
      if (el2.style.display === 'none') { el2.style.display = 'block'; renderYorumlar(rkey, sid); }
      else { el2.style.display = 'none'; }
    });
  });

  document.querySelectorAll('.yorum-send').forEach(function(el) {
    el.addEventListener('click', function() {
      const sid = this.dataset.sid;
      const rkey = this.dataset.rkey;
      const inp = document.getElementById('yinp-' + sid);
      const text = inp.value.trim();
      if (!text) return;
      if (!yorumlar[rkey]) yorumlar[rkey] = [];
      yorumlar[rkey].push({nick: 'Takipçi ' + Math.floor(Math.random()*999+1), text: text});
      saveStorage();
      inp.value = '';
      renderYorumlar(rkey, sid);
    });
  });

  document.querySelectorAll('.save-btn').forEach(function(el) {
    el.addEventListener('click', function() {
      const item = JSON.parse(this.dataset.item.replace(/&quot;/g, '"'));
      const k = makeKey(item.baslik, item.yil);
      const existIdx = watchList.findIndex(function(w) { return makeKey(w.baslik, w.yil) === k; });
      if (existIdx >= 0) watchList.splice(existIdx, 1);
      else watchList.push(item);
      saveStorage();
      const saved = isSaved(item.baslik, item.yil);
      this.textContent = saved ? '♥ Listede' : '+ Listeye Ekle';
      this.className = 'save-btn' + (saved ? ' saved' : '');
    });
  });
}

function renderYorumlar(rkey, sid) {
  const list = yorumlar[rkey] || [];
  const el = document.getElementById('ylist-' + sid);
  if (!list.length) { el.innerHTML = '<div style="font-size:11px;color:var(--txt3);padding:4px;">Henüz yorum yok. İlk yorumu yaz!</div>'; return; }
  el.innerHTML = list.map(function(y) { return '<div class="yorum-item"><div class="yorum-nick">' + y.nick + '</div><div class="yorum-text">' + y.text + '</div></div>'; }).join('');
  el.scrollTop = el.scrollHeight;
}

function renderListe() {
  if (!watchList.length) {
    document.getElementById('listeArea').innerHTML = '<div class="list-empty">Henüz listeye eklediğin içerik yok.<br>Öneri al ve beğendiklerini kaydet!</div>';
    return;
  }
  let html = '<div class="r-label" style="margin-bottom:10px;">' + watchList.length + ' içerik kaydedildi</div>';
  watchList.forEach(function(item, i) {
    const rkey = makeKey(item.baslik, item.yil);
    const r = ratings[rkey] || 0;
    html += '<div class="l-card">' +
      '<div class="l-icon"><svg viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg></div>' +
      '<div class="l-info"><div class="l-title">' + item.baslik + '</div><div class="l-meta">' + item.yil + ' · IMDb ' + item.imdb + (r ? ' <span class="l-stars">' + '★'.repeat(r) + '</span>' : '') + '</div></div>' +
      '<span class="r-badge ' + badgeClass(item) + '" style="flex-shrink:0;">' + badgeLabel(item) + '</span>' +
      '<button class="rm-btn" data-idx="' + i + '">×</button>' +
    '</div>';
  });
  document.getElementById('listeArea').innerHTML = html;
  document.querySelectorAll('.rm-btn').forEach(function(el) {
    el.addEventListener('click', function() {
      watchList.splice(parseInt(this.dataset.idx), 1);
      saveStorage();
      renderListe();
    });
  });
}

document.querySelectorAll('.nav-btn').forEach(function(btn, i) {
  btn.addEventListener('click', function() { goTab(i === 0 ? 'oneri' : 'liste', this); });
});
document.getElementById('listCount').addEventListener('click', function() {
  goTab('liste', document.querySelectorAll('.nav-btn')[1]);
});
document.getElementById('mA').addEventListener('click', function() { setMode('tarz'); });
document.getElementById('mB').addEventListener('click', function() { setMode('benzer'); });
document.getElementById('goBtn').addEventListener('click', fetchRecs);
document.getElementById('qInput').addEventListener('keydown', function(e) { if (e.key === 'Enter') fetchRecs(); });
document.querySelectorAll('.tag').forEach(function(t) {
  t.addEventListener('click', function() { quickTag(this.textContent); });
});

saveStorage();
