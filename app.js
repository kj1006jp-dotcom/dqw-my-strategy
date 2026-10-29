(function () {
  'use strict';
  const STORAGE_KEY = 'dqw-my-strategy-v1';
  const vocationGroups = {
    特級職: ['ゴッドハンド', '大魔道士', '大神官', 'ニンジャ', '魔剣士', '守り人', 'ドラゴン', '天地雷鳴士', '魔人', '時渡りの剣士', '魔弾の剣士'],
    上級職: ['バトルマスター', '賢者', 'レンジャー', '魔法戦士', 'パラディン', 'スーパースター', '海賊', 'まものマスター'],
    基本職: ['戦士', '僧侶', '武闘家', '魔法使い', '盗賊', '遊び人', '踊り子'],
    その他: ['釣り人', '守護天使（期間限定）', 'その他']
  };
  const blankMember = (index) => ({ name: `なかま${index + 1}`, vocation: '', weapon: '', helmet: '', shield: '', armorTop: '', armorBottom: '', armorMemo: '', weaponMemo: '' });
  const blankData = () => ({ version: 1, party: [0, 1, 2, 3].map(blankMember), sessions: [] });
  let data = loadData();

  function loadData() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return normalizeData(saved);
    } catch (_) { return blankData(); }
  }
  function normalizeData(value) {
    const clean = blankData();
    if (!value || typeof value !== 'object') return clean;
    if (Array.isArray(value.party)) clean.party = clean.party.map((member, i) => {
      const old = value.party[i];
      if (!old || typeof old !== 'object') return member;
      return { name: safeText(old.name, member.name, 30), vocation: safeText(old.vocation, '', 40), weapon: safeText(old.weapon, '', 80), helmet: safeText(old.helmet, '', 80), shield: safeText(old.shield, '', 80), armorTop: safeText(old.armorTop, '', 80), armorBottom: safeText(old.armorBottom, '', 80), armorMemo: safeText(old.armorMemo, safeText(old.armor, '', 120), 120), weaponMemo: safeText(old.weaponMemo, '', 500) };
    });
    if (Array.isArray(value.sessions)) clean.sessions = value.sessions.filter((s) => s && typeof s === 'object' && Number(s.minutes) > 0 && Number(s.experience) >= 0).slice(0, 500).map((s) => ({ id: safeText(s.id, makeId(), 80), date: /^\d{4}-\d{2}-\d{2}$/.test(s.date) ? s.date : today(), minutes: Number(s.minutes), experience: Number(s.experience), memo: safeText(s.memo, '', 100) }));
    return clean;
  }
  function safeText(value, fallback, max) { return typeof value === 'string' ? value.slice(0, max) : fallback; }
  function saveData() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (_) { showMessage('保存できませんでした。ブラウザの空き容量をご確認ください。', true); } }
  function today() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
  function makeId() { return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
  function escapeHtml(text) { return String(text).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]); }
  function partyMarkup(member, index) {
    const options = ['<option value="">職業を選択</option>', ...Object.entries(vocationGroups).map(([group, jobs]) => `<optgroup label="${group}">${jobs.map((v) => `<option value="${escapeHtml(v)}" ${member.vocation === v ? 'selected' : ''}>${escapeHtml(v)}</option>`).join('')}</optgroup>`)].join('');
    return `<article class="party-card"><div class="card-heading"><span class="member-number">0${index + 1}</span><div class="member-title">${escapeHtml(member.name)}<small>PARTY MEMBER ${index + 1}</small></div></div><div class="fields-grid"><label>職業<select data-index="${index}" data-field="vocation">${options}</select></label><label>武器<input data-index="${index}" data-field="weapon" value="${escapeHtml(member.weapon)}" maxlength="80" placeholder="例：ぎんがのつるぎ"></label><label>かぶと<input data-index="${index}" data-field="helmet" value="${escapeHtml(member.helmet)}" maxlength="80" placeholder="例：セラフィムのかぶと"></label><label>盾<input data-index="${index}" data-field="shield" value="${escapeHtml(member.shield)}" maxlength="80" placeholder="例：みちびきの盾"></label><label>よろい上<input data-index="${index}" data-field="armorTop" value="${escapeHtml(member.armorTop)}" maxlength="80" placeholder="例：セラフィムの法衣上"></label><label>よろい下<input data-index="${index}" data-field="armorBottom" value="${escapeHtml(member.armorBottom)}" maxlength="80" placeholder="例：セラフィムの法衣下"></label></div><div class="weapon-note"><label for="armor-memo-${index}">防具の補足メモ</label><textarea id="armor-memo-${index}" data-index="${index}" data-field="armorMemo" maxlength="120" placeholder="防具のセット名や補足">${escapeHtml(member.armorMemo)}</textarea></div><div class="weapon-note"><label for="memo-${index}">武器の用途・評価メモ</label><textarea id="memo-${index}" data-index="${index}" data-field="weaponMemo" maxlength="500" placeholder="使う場面や使用感、評価など">${escapeHtml(member.weaponMemo)}</textarea></div><p class="autosave">入力内容は自動で保存されます</p></article>`;
  }
  function renderParty() {
    document.getElementById('party-list').innerHTML = data.party.map(partyMarkup).join('');
    document.querySelectorAll('#party-list [data-field]').forEach((field) => field.addEventListener('input', updateMember));
    document.querySelectorAll('#party-list select[data-field]').forEach((field) => field.addEventListener('change', updateMember));
  }
  function updateMember(event) { const el = event.currentTarget; data.party[Number(el.dataset.index)][el.dataset.field] = el.value; saveData(); }
  function renderSessions() {
    const list = document.getElementById('training-history');
    document.getElementById('session-count').textContent = `${data.sessions.length}件`;
    if (!data.sessions.length) { list.innerHTML = '<p class="empty-history">まだ記録はありません。<br>最初の経験値稼ぎを記録してみましょう。</p>'; return; }
    list.innerHTML = [...data.sessions].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)).map((s) => `<article class="history-item"><time class="history-date" datetime="${s.date}">${s.date.replace(/-/g, '/')}</time><div class="history-main"><strong>${Number(s.minutes).toLocaleString('ja-JP')}分 ・ ${Number(s.experience).toLocaleString('ja-JP')} EXP</strong>${s.memo ? `<p>${escapeHtml(s.memo)}</p>` : ''}</div><div class="rate">${Math.floor(s.experience / s.minutes).toLocaleString('ja-JP')}<small>EXP／分</small></div><button class="delete-entry" type="button" data-delete="${escapeHtml(s.id)}" aria-label="${s.date}の記録を削除">×</button></article>`).join('');
    list.querySelectorAll('[data-delete]').forEach((button) => button.addEventListener('click', () => { data.sessions = data.sessions.filter((s) => s.id !== button.dataset.delete); saveData(); renderSessions(); }));
  }
  const form = document.getElementById('training-form');
  const minutes = form.elements.minutes; const experience = form.elements.experience;
  function updatePreview() { const m = Number(minutes.value); const xp = Number(experience.value); document.getElementById('exp-preview').innerHTML = m > 0 && experience.value !== '' ? `経験値／分 <strong>${Math.floor(xp / m).toLocaleString('ja-JP')} EXP</strong>` : '時間と経験値を入力すると、経験値／分を表示します。'; }
  minutes.addEventListener('input', updatePreview); experience.addEventListener('input', updatePreview);
  document.getElementById('training-date').value = today();
  form.addEventListener('submit', (event) => { event.preventDefault(); if (!form.reportValidity()) return; data.sessions.push({ id: makeId(), date: form.elements.date.value, minutes: Number(minutes.value), experience: Number(experience.value), memo: form.elements.memo.value.trim().slice(0, 100) }); saveData(); renderSessions(); form.reset(); document.getElementById('training-date').value = today(); updatePreview(); });
  function showMessage(message, error) { const el = document.getElementById('backup-message'); el.textContent = message; el.style.color = error ? '#a84e4e' : ''; }
  document.getElementById('export-button').addEventListener('click', () => { const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `dqw-my-strategy-${today()}.json`; document.body.appendChild(a); a.click(); a.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); showMessage('JSONファイルを書き出しました。'); });
  function readFileText(file) { if (typeof file.text === 'function') return file.text(); return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(reader.error); reader.readAsText(file); }); }
  document.getElementById('import-file').addEventListener('change', async (event) => { const file = event.target.files[0]; if (!file) return; try { const parsed = JSON.parse(await readFileText(file)); if (!parsed || !Array.isArray(parsed.party) || !Array.isArray(parsed.sessions)) throw new Error('format'); if (!window.confirm('現在の記録を、選んだJSONの内容で置き換えます。よろしいですか？')) return; data = normalizeData(parsed); saveData(); renderParty(); renderSessions(); showMessage('JSONを読み込みました。'); } catch (_) { showMessage('読み込めませんでした。有効なバックアップJSONを選んでください。', true); } finally { event.target.value = ''; } });
  renderParty(); renderSessions();
})();
