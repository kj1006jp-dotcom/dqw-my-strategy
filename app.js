(function () {
  'use strict';
  const STORAGE_KEY = 'dqw-my-strategy-v1';
  const vocationGroups = {
    特級職: ['ゴッドハンド', '大魔道士', '大神官', 'ニンジャ', '魔剣士', '守り人', 'ドラゴン', '天地雷鳴士', '魔人', '時渡りの剣士', '魔弾の剣士'],
    上級職: ['バトルマスター', '賢者', 'レンジャー', '魔法戦士', 'パラディン', 'スーパースター', '海賊', 'まものマスター'],
    基本職: ['戦士', '僧侶', '武闘家', '魔法使い', '盗賊', '遊び人', '踊り子'],
    その他: ['釣り人', '守護天使（期間限定）', 'その他']
  };
  const allowedFeatures = ['all', 'single', 'metal', 'other'];
  const featureLabels = { all: '全体攻撃', single: '単体攻撃', metal: 'メタル系特効', other: 'その他' };
  const allowedPriorities = ['speed', 'mp', 'metal', 'owned'];
  const purposeLabels = { quest: '通常クエストの周回', exp: '経験値効率を重視', metal: 'メタル系モンスター対策', mp: 'MP効率向け' };
  const blankMember = (index) => ({ name: `なかま${index + 1}`, vocation: '', weapon: '', helmet: '', shield: '', armorTop: '', armorBottom: '', armorMemo: '', weaponMemo: '' });
  const blankAdvisor = () => ({ vocation: '', purpose: 'quest', priorities: ['speed', 'mp', 'metal', 'owned'], weapons: [] });
  const blankData = () => ({ version: 1, party: [0, 1, 2, 3].map(blankMember), sessions: [], advisor: blankAdvisor() });
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
    if (value.advisor && typeof value.advisor === 'object') {
      const advisor = value.advisor;
      clean.advisor.vocation = safeText(advisor.vocation, '', 40);
      clean.advisor.purpose = ['quest', 'exp', 'metal'].includes(advisor.purpose) ? advisor.purpose : 'quest';
      clean.advisor.priorities = Array.isArray(advisor.priorities) ? [...new Set(advisor.priorities.filter((item) => allowedPriorities.includes(item)))] : clean.advisor.priorities;
      if (Array.isArray(advisor.weapons)) clean.advisor.weapons = advisor.weapons.filter((w) => w && typeof w === 'object' && typeof w.name === 'string' && w.name.trim()).slice(0, 100).map((w) => ({ id: safeText(w.id, makeId(), 80), name: safeText(w.name.trim(), '', 80), features: Array.isArray(w.features) ? [...new Set(w.features.filter((feature) => allowedFeatures.includes(feature)))] : [], other: safeText(w.other, '', 120), level: w.level !== '' && Number.isInteger(Number(w.level)) && Number(w.level) > 0 ? Number(w.level) : '', limitBreaks: w.limitBreaks !== '' && Number.isInteger(Number(w.limitBreaks)) && Number(w.limitBreaks) >= 0 ? Number(w.limitBreaks) : '', skills: safeText(w.skills, '', 250), mpEfficiency: ['good', 'average', 'poor'].includes(w.mpEfficiency) ? w.mpEfficiency : '', owned: Boolean(w.owned) }));
    }
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
  function updateMember(event) { const el = event.currentTarget; data.party[Number(el.dataset.index)][el.dataset.field] = el.value; saveData(); if (el.dataset.field === 'weapon') renderPartyWeaponSource(); if (el.dataset.field === 'vocation') { renderPartyVocationSource(); renderAdvisorVocations(); } }
  function renderSessions() {
    const list = document.getElementById('training-history');
    document.getElementById('session-count').textContent = `${data.sessions.length}件`;
    if (!data.sessions.length) { list.innerHTML = '<p class="empty-history">まだ記録はありません。<br>最初の経験値稼ぎを記録してみましょう。</p>'; return; }
    list.innerHTML = [...data.sessions].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)).map((s) => `<article class="history-item"><time class="history-date" datetime="${s.date}">${s.date.replace(/-/g, '/')}</time><div class="history-main"><strong>${Number(s.minutes).toLocaleString('ja-JP')}分 ・ ${Number(s.experience).toLocaleString('ja-JP')} EXP</strong>${s.memo ? `<p>${escapeHtml(s.memo)}</p>` : ''}</div><div class="rate">${Math.floor(s.experience / s.minutes).toLocaleString('ja-JP')}<small>EXP／分</small></div><button class="delete-entry" type="button" data-delete="${escapeHtml(s.id)}" aria-label="${s.date}の記録を削除">×</button></article>`).join('');
    list.querySelectorAll('[data-delete]').forEach((button) => button.addEventListener('click', () => { data.sessions = data.sessions.filter((s) => s.id !== button.dataset.delete); saveData(); renderSessions(); }));
  }
  function renderAdvisorVocations() {
    const select = document.getElementById('advisor-vocation');
    const known = Object.values(vocationGroups).flat();
    const savedPartyJobs = [...new Set(data.party.map((member) => member.vocation.trim()).filter((job) => job && !known.includes(job)))];
    select.innerHTML = `<option value="">職業を選択</option>${Object.entries(vocationGroups).map(([group, jobs]) => `<optgroup label="${escapeHtml(group)}">${jobs.map((job) => `<option value="${escapeHtml(job)}">${escapeHtml(job)}</option>`).join('')}</optgroup>`).join('')}${savedPartyJobs.length ? `<optgroup label="パーティの登録職業">${savedPartyJobs.map((job) => `<option value="${escapeHtml(job)}">${escapeHtml(job)}</option>`).join('')}</optgroup>` : ''}`;
    select.value = data.advisor.vocation;
  }
  function renderPartyVocationSource() {
    const select = document.getElementById('party-vocation-source');
    if (!select) return;
    const partyVocations = [...new Set(data.party.map((member) => member.vocation.trim()).filter(Boolean))];
    select.innerHTML = `<option value="">登録職業を選択</option>${partyVocations.map((vocation) => `<option value="${escapeHtml(vocation)}">${escapeHtml(vocation)}</option>`).join('')}`;
  }
  function getPartyWeaponNames() {
    return [...new Set(data.party.map((member) => member.weapon.trim()).filter(Boolean))];
  }
  function renderPartyWeaponSource() {
    const select = document.getElementById('party-weapon-source');
    if (!select) return;
    const current = select.value;
    select.innerHTML = `<option value="">武器名を選択</option>${getPartyWeaponNames().map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join('')}`;
    if (getPartyWeaponNames().includes(current)) select.value = current;
  }
  function resetWeaponForm() {
    document.getElementById('advisor-weapon-form').reset();
    document.getElementById('advisor-editing-id').value = '';
    document.getElementById('cancel-weapon-edit').hidden = true;
    document.getElementById('advisor-weapon-form').querySelector('button[type="submit"]').textContent = '武器を保存';
  }
  function fillWeaponForm(weapon) {
    const form = document.getElementById('advisor-weapon-form');
    document.getElementById('advisor-editing-id').value = weapon.id;
    document.getElementById('advisor-weapon-name').value = weapon.name;
    document.getElementById('advisor-weapon-other').value = weapon.other;
    document.getElementById('advisor-weapon-level').value = weapon.level;
    document.getElementById('advisor-weapon-breaks').value = weapon.limitBreaks;
    document.getElementById('advisor-weapon-skills').value = weapon.skills;
    document.getElementById('advisor-weapon-mp').value = weapon.mpEfficiency;
    document.getElementById('advisor-weapon-owned').checked = weapon.owned;
    form.querySelectorAll('input[name="feature"]').forEach((input) => { input.checked = weapon.features.includes(input.value); });
    document.getElementById('cancel-weapon-edit').hidden = false;
    form.querySelector('button[type="submit"]').textContent = '変更を保存';
    document.getElementById('advisor-weapon-name').focus();
  }
  function renderAdvisorWeapons() {
    const list = document.getElementById('advisor-weapon-list');
    document.getElementById('advisor-weapon-count').textContent = `${data.advisor.weapons.length}件`;
    if (!data.advisor.weapons.length) {
      list.innerHTML = '<p class="empty-history">まだ武器が登録されていません。<br>上の欄から手持ちの武器を追加してください。</p>';
      return;
    }
    list.innerHTML = data.advisor.weapons.map((weapon) => `<article class="advisor-weapon-item"><div class="advisor-weapon-copy"><strong>${escapeHtml(weapon.name)}</strong><p>${escapeHtml(weapon.features.map((feature) => featureLabels[feature]).join('・') || '攻撃特徴は未登録')}${weapon.other ? `・${escapeHtml(weapon.other)}` : ''}${weapon.owned ? '・所持' : ''}</p></div><div class="advisor-weapon-actions"><button class="text-button" type="button" data-edit-weapon="${escapeHtml(weapon.id)}">編集</button><button class="text-button text-button-danger" type="button" data-remove-weapon="${escapeHtml(weapon.id)}">削除</button></div></article>`).join('');
    list.querySelectorAll('[data-edit-weapon]').forEach((button) => button.addEventListener('click', () => {
      const weapon = data.advisor.weapons.find((item) => item.id === button.dataset.editWeapon);
      if (weapon) fillWeaponForm(weapon);
    }));
    list.querySelectorAll('[data-remove-weapon]').forEach((button) => button.addEventListener('click', () => {
      if (!window.confirm('この比較用武器を削除しますか？パーティ編成の記録は変更されません。')) return;
      const id = button.dataset.removeWeapon;
      data.advisor.weapons = data.advisor.weapons.filter((weapon) => weapon.id !== id);
      if (document.getElementById('advisor-editing-id').value === id) resetWeaponForm();
      saveData(); renderAdvisorWeapons(); renderAdvisorAdvice();
      document.getElementById('advisor-message').textContent = '比較用の登録を削除しました。パーティ編成のデータはそのままです。';
    }));
  }
  function evaluateWeapon(weapon, purpose) {
    const priorities = new Set(data.advisor.priorities);
    let score = 0;
    let hasEvidence = false;
    const reasons = [];
    if ((purpose === 'quest' || purpose === 'exp') && weapon.features.includes('all')) {
      score += 3; hasEvidence = true;
      reasons.push('「全体攻撃」と登録されています（通常敵の周回の目安として +3 点）。');
      if (priorities.has('speed')) { score += 1; reasons.push('重視項目「周回速度」に合う登録特徴として +1 点。'); }
    }
    if (purpose === 'metal' && weapon.features.includes('metal')) {
      score += 4; hasEvidence = true;
      reasons.push('「メタル系特効」と登録されています（+4 点）。');
      if (priorities.has('metal')) { score += 2; reasons.push('重視項目「メタル系対策」に合う登録特徴として +2 点。'); }
    }
    if (purpose === 'mp' && weapon.mpEfficiency) {
      hasEvidence = true;
      const points = { good: 3, average: 1, poor: -1 }[weapon.mpEfficiency];
      score += points;
      reasons.push(`MP効率は「${{ good: '良いと思う', average: 'ふつう', poor: '気になる' }[weapon.mpEfficiency]}」という手動評価です（${points > 0 ? '+' : ''}${points} 点）。`);
      if (priorities.has('mp')) reasons.push('重視項目「MP効率」の手動評価を比較に使いました。');
    }
    if ((purpose === 'quest' || purpose === 'exp') && priorities.has('mp') && weapon.mpEfficiency) {
      hasEvidence = true;
      score += { good: 1, average: 0, poor: -1 }[weapon.mpEfficiency];
      const points = { good: 1, average: 0, poor: -1 }[weapon.mpEfficiency];
      reasons.push(`MP効率の手動評価「${{ good: '良いと思う', average: 'ふつう', poor: '気になる' }[weapon.mpEfficiency]}」を補助的に反映（${points > 0 ? '+' : ''}${points} 点）。`);
    }
    if (priorities.has('owned') && weapon.owned) { score += 1; reasons.push('「所持している」と登録されているため、手持ち活用として +1 点。'); }
    return { weapon, score, hasEvidence, reasons };
  }
  function missingInfo(weapon, purpose) {
    const missing = [];
    if ((purpose === 'quest' || purpose === 'exp') && !weapon.features.includes('all')) missing.push('全体攻撃としての特徴が未登録');
    if ((purpose === 'quest' || purpose === 'exp') && data.advisor.priorities.includes('mp') && !weapon.mpEfficiency) missing.push('重視項目のMP効率は未評価');
    if (purpose === 'metal' && !weapon.features.includes('metal')) missing.push('メタル系特効の特徴が未登録');
    if (purpose === 'mp' && !weapon.mpEfficiency) missing.push('MP効率の手動評価が未入力');
    if (!weapon.level) missing.push('武器レベルが未入力');
    if (weapon.limitBreaks === '') missing.push('限界突破回数が未入力');
    if (!weapon.skills) missing.push('主なスキルが未入力');
    missing.push('攻撃倍率・実ダメージ・敵の耐性などは未登録のため比較していません');
    return missing;
  }
  function renderPurposeAdvice(purpose) {
    const candidates = data.advisor.weapons.map((weapon) => evaluateWeapon(weapon, purpose)).filter((result) => result.hasEvidence).sort((a, b) => b.score - a.score || a.weapon.name.localeCompare(b.weapon.name, 'ja'));
    const selected = data.advisor.purpose === purpose;
    const vocationNote = data.advisor.vocation ? `対象職業：${escapeHtml(data.advisor.vocation)}。職業ごとのスキル適性は未登録のため、順位には使っていません。` : '対象職業は未選択です。職業ごとの適性は比較していません。';
    if (!candidates.length) {
      let need = '武器を登録してください。';
      if (data.advisor.weapons.length && (purpose === 'quest' || purpose === 'exp')) need = '「全体攻撃」の特徴を持つ武器がありません。武器の説明を確認して特徴を登録すると、暫定比較できます。';
      if (data.advisor.weapons.length && purpose === 'metal') need = '「メタル系特効」の特徴を持つ武器がありません。特効が確認できた武器だけを登録してください。';
      if (data.advisor.weapons.length && purpose === 'mp') need = '比較できる手動評価がありません。武器ごとにMP効率を入力すると比較できます。';
      return `<article class="advice-card ${selected ? 'is-selected-purpose' : ''}"><div class="advice-card-title"><span class="advice-tag">${purposeLabels[purpose]}</span>${selected ? '<span class="selected-mark">今回の目的</span>' : ''}</div><p class="no-advice">登録情報だけではおすすめを決められません。</p><p class="advice-reason">${need}</p><ul class="missing-list"><li>不足：各武器の特徴を手動で登録してください。</li><li>${vocationNote}</li></ul></article>`;
    }
    const highest = candidates[0].score;
    const winners = candidates.filter((item) => item.score === highest);
    const winnerCards = winners.map(({ weapon, reasons }) => {
      const reasonsHtml = reasons.length ? reasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join('') : '<li>登録された評価基準に一致しました。</li>';
      const rating = weapon.mpEfficiency ? { good: '良いと思う', average: 'ふつう', poor: '気になる' }[weapon.mpEfficiency] : '未評価';
      const details = [`登録特徴：${weapon.features.length ? escapeHtml(weapon.features.map((feature) => featureLabels[feature]).join('・')) : '未登録'}`, `武器レベル：${weapon.level || '未入力'}`, `限界突破：${weapon.limitBreaks === '' ? '未入力' : `${weapon.limitBreaks}回`}`, `MP効率（手動）：${rating}`, `主なスキル：${weapon.skills ? escapeHtml(weapon.skills) : '未入力'}`, `その他の補足：${weapon.other ? escapeHtml(weapon.other) : '未入力'}`];
      return `<div class="recommended-weapon"><div class="recommended-name">${escapeHtml(weapon.name)}${weapon.owned ? '<span class="owned-badge">所持</span>' : ''}</div><p class="recommend-use">用途：${purposeLabels[purpose]}</p><p class="recommend-reasons-title">おすすめ理由</p><ul>${reasonsHtml}</ul><p class="recommend-reasons-title">登録情報</p><ul class="weapon-detail-list">${details.map((detail) => `<li>${detail}</li>`).join('')}</ul><p class="missing-title">不足・比較していない情報</p><ul class="missing-list">${missingInfo(weapon, purpose).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>`;
    }).join('');
    const tieNote = winners.length > 1 ? '<p class="tie-note">同点の武器があるため、優劣は付けられません。</p>' : '';
    return `<article class="advice-card ${selected ? 'is-selected-purpose' : ''}"><div class="advice-card-title"><span class="advice-tag">${purposeLabels[purpose]}</span>${selected ? '<span class="selected-mark">今回の目的</span>' : ''}<span class="score-note">簡易点 ${highest}</span></div><p class="comparison-rule">評価基準：${purpose === 'metal' ? 'メタル系特効の登録を評価します。' : purpose === 'mp' ? '手動入力したMP効率だけを評価します。' : '全体攻撃の登録を周回向けの目安として評価します。経験値獲得量や経験値／分は計算しません。'} 優先項目と所持状況も表示・加点します。</p>${tieNote}${winnerCards}<p class="vocation-note">${vocationNote}</p></article>`;
  }
  function renderAdvisorAdvice() {
    const purpose = data.advisor.purpose;
    document.getElementById('advisor-purpose-badge').textContent = `今回の目的：${purposeLabels[purpose] || purposeLabels.quest}`;
    const order = [purpose, ...['quest', 'metal', 'mp'].filter((item) => item !== purpose)];
    document.getElementById('advisor-results').innerHTML = order.map(renderPurposeAdvice).join('');
  }
  function initAdvisor() {
    renderAdvisorVocations(); renderPartyVocationSource(); renderPartyWeaponSource();
    const purposeSelect = document.getElementById('advisor-purpose');
    purposeSelect.value = data.advisor.purpose;
    document.querySelectorAll('.priority-options input').forEach((input) => { input.checked = data.advisor.priorities.includes(input.value); input.addEventListener('change', () => {
      data.advisor.priorities = [...document.querySelectorAll('.priority-options input:checked')].map((item) => item.value);
      saveData(); renderAdvisorAdvice();
    }); });
    document.getElementById('advisor-vocation').addEventListener('change', (event) => { data.advisor.vocation = event.currentTarget.value; saveData(); renderAdvisorAdvice(); });
    document.getElementById('use-party-vocation').addEventListener('click', () => {
      const vocation = document.getElementById('party-vocation-source').value;
      if (!vocation) { document.getElementById('advisor-message').textContent = '先にパーティ登録済みの職業を選んでください。'; return; }
      data.advisor.vocation = vocation;
      document.getElementById('advisor-vocation').value = vocation;
      saveData(); renderAdvisorAdvice();
      document.getElementById('advisor-message').textContent = 'パーティの職業を対象の職業に反映しました。パーティ登録自体は変更していません。';
    });
    purposeSelect.addEventListener('change', (event) => { data.advisor.purpose = event.currentTarget.value; saveData(); renderAdvisorAdvice(); });
    document.getElementById('use-party-weapon').addEventListener('click', () => {
      const name = document.getElementById('party-weapon-source').value;
      if (!name) { document.getElementById('advisor-message').textContent = '先にパーティ登録済みの武器を選んでください。'; return; }
      document.getElementById('advisor-weapon-name').value = name;
      document.getElementById('advisor-weapon-owned').checked = true;
      document.getElementById('advisor-message').textContent = '武器名を入力しました。特徴を確認して「武器を保存」を押してください。';
      document.getElementById('advisor-weapon-name').focus();
    });
    document.getElementById('advisor-weapon-form').addEventListener('submit', (event) => {
      event.preventDefault();
      const name = document.getElementById('advisor-weapon-name').value.trim();
      if (!name) { document.getElementById('advisor-weapon-name').focus(); return; }
      const editId = document.getElementById('advisor-editing-id').value;
      const existing = data.advisor.weapons.find((weapon) => weapon.id === editId || weapon.name.toLocaleLowerCase() === name.toLocaleLowerCase());
      const candidate = { id: existing ? existing.id : makeId(), name: name.slice(0, 80), features: [...document.querySelectorAll('input[name="feature"]:checked')].map((input) => input.value), other: document.getElementById('advisor-weapon-other').value.trim().slice(0, 120), level: document.getElementById('advisor-weapon-level').value ? Number(document.getElementById('advisor-weapon-level').value) : '', limitBreaks: document.getElementById('advisor-weapon-breaks').value ? Number(document.getElementById('advisor-weapon-breaks').value) : '', skills: document.getElementById('advisor-weapon-skills').value.trim().slice(0, 250), mpEfficiency: document.getElementById('advisor-weapon-mp').value, owned: document.getElementById('advisor-weapon-owned').checked };
      if (existing) data.advisor.weapons = data.advisor.weapons.map((weapon) => weapon.id === existing.id ? candidate : weapon);
      else if (data.advisor.weapons.length < 100) data.advisor.weapons.push(candidate);
      else { document.getElementById('advisor-message').textContent = '比較用の武器は100件まで登録できます。'; return; }
      saveData(); resetWeaponForm(); renderAdvisorWeapons(); renderAdvisorAdvice();
      document.getElementById('advisor-message').textContent = '武器を保存しました。入力内容はこのブラウザーに保存されます。';
    });
    document.getElementById('cancel-weapon-edit').addEventListener('click', resetWeaponForm);
    renderAdvisorWeapons(); renderAdvisorAdvice();
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
  document.getElementById('import-file').addEventListener('change', async (event) => { const file = event.target.files[0]; if (!file) return; try { const parsed = JSON.parse(await readFileText(file)); if (!parsed || !Array.isArray(parsed.party) || !Array.isArray(parsed.sessions)) throw new Error('format'); if (!window.confirm('現在の記録を、選んだJSONの内容で置き換えます。よろしいですか？')) return; data = normalizeData(parsed); saveData(); renderParty(); renderSessions(); renderAdvisorVocations(); renderPartyVocationSource(); renderPartyWeaponSource(); document.getElementById('advisor-purpose').value = data.advisor.purpose; document.querySelectorAll('.priority-options input').forEach((input) => { input.checked = data.advisor.priorities.includes(input.value); }); resetWeaponForm(); renderAdvisorWeapons(); renderAdvisorAdvice(); showMessage('JSONを読み込みました。'); } catch (_) { showMessage('読み込めませんでした。有効なバックアップJSONを選んでください。', true); } finally { event.target.value = ''; } });
  renderParty(); renderSessions(); initAdvisor();
})();
