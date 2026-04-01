let mode = 'tarz';
let watchList = JSON.parse(localStorage.getItem('kz_list') || '[]');
let ratings = JSON.parse(localStorage.getItem('kz_ratings') || '{}');

function saveStorage() {
  localStorage.setItem('kz_list', JSON.stringify(watchList));
  localStorage.setItem('kz_ratings', JSON.stringify(ratings));
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
  const inp = document.getElementById('qInput');
  inp.placeholder = m === 'tarz' ? 'Romantik, gerilim, ağlatan...' : 'Sevdiğin bir dizi veya film yaz...';
  inp.value = '';
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

  try {
    const res = await fetch('/api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: q, mode })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    renderResults(data.oneriler, q);
  } catch (e) {
    document.getElementById('resultsArea').innerHTML = `<div class="err">Bir hata oluştu: ${e.message}</div>`;
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
function isSaved(baslik) { return watchList.some(w => w.baslik === baslik); }

function renderResults(list, q) {
  if (!list || !list.length) {
    document.getElementById('resultsArea').innerHTML = '<div class="loading">Sonuç bulunamadı, tekrar dene.</div>';
    return;
  }
  let html = `<div class="r-label">"${q}" için ${list.length} öneri</div><div class="result-grid">`;
  list.forEach((item, i) => {
    const sid = 'r' + i;
    const saved = isSaved(item.baslik);
    const rating = ratings[item.baslik] || 0;
    const starsHtml = [1,2,3,4,5].map(s =>
      `<button class="star ${rating >= s ? 'lit' : ''}" onclick="setRating('${encodeURIComponent(item.baslik)}','${sid}',${s})">★</button>`
    ).join('');
    html += `<div class="r-card">
      <div class="r-head">
        <div class="r-title">${item.baslik}</div>
        <span class="r-badge ${badgeClass(item)}">${badgeLabel(item)}</span>
      </div>
      ${item.orijinal ? `<div class="r-orig">${item.orijinal}</div>` : ''}
      <div class="r-meta">${item.yil} · IMDb ${item.imdb}</div>
      <div class="r-desc">${item.ozet}</div>
      <div class="r-why">${item.neden}</div>
      <div class="r-actions">
        <button class="save-btn ${saved ? 'saved' : ''}" id="sb-${sid}" onclick='toggleSave(${JSON.stringify(item)},"${sid}")'>${saved ? '♥ Listede' : '+ Listeye Ekle'}</button>
        <div class="stars-row">${starsHtml}</div>
      </div>
    </div>`;
  });
  html += '</div>';
  document.getElementById('resultsArea').innerHTML = html;
}

function toggleSave(item, sid) {
  const idx = watchList.findIndex(w => w.baslik === item.baslik);
  if (idx >= 0) watchList.splice(idx, 1);
  else watchList.push(item);
  saveStorage();
  const saved = isSaved(item.baslik);
  const btn = document.getElementById('sb-' + sid);
  btn.textContent = saved ? '♥ Listede' : '+ Listeye Ekle';
  btn.className = 'save-btn' + (saved ? ' saved' : '');
}

function setRating(enc, sid, val) {
  const baslik = decodeURIComponent(enc);
  ratings[baslik] = val;
  saveStorage();
  const row = document.getElementById('stars-' + sid);
  if (row) row.querySelectorAll('.star').forEach((s, i) => s.classList.toggle('lit', i < val));
}

function renderListe() {
  if (!watchList.length) {
    document.getElementById('listeArea').innerHTML = `<div class="list-empty"><div class="icon">🎬</div>Henüz listeye eklediğin içerik yok.<br>Öneri al ve beğendiklerini kaydet!</div>`;
    return;
  }
  let html = `<div class="r-label" style="margin-bottom:10px;">${watchList.length} içerik kaydedildi</div>`;
  watchList.forEach((item, i) => {
    const r = ratings[item.baslik] || 0;
    const starsDisplay = r ? '<span class="l-stars">' + '★'.repeat(r) + '</span>' : '';
    html += `<div class="l-card">
      <div class="l-icon"><svg viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg></div>
      <div class="l-info">
        <div class="l-title">${item.baslik}</div>
        <div class="l-meta">${item.yil} · IMDb ${item.imdb} ${starsDisplay}</div>
      </div>
      <span class="r-badge ${badgeClass(item)}">${badgeLabel(item)}</span>
      <button class="rm-btn" onclick="removeItem(${i})">×</button>
    </div>`;
  });
  document.getElementById('listeArea').innerHTML = html;
}

function removeItem(i) {
  watchList.splice(i, 1);
  saveStorage();
  renderListe();
}

// init
saveStorage();
renderListe();
