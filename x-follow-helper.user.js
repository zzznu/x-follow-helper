// ==UserScript==
// @name         片思いフォロー整理
// @namespace    local.x-follow-helper
// @version      1.0.0
// @description  相互フォローを隠し、非相互の候補を強調。解除操作は行いません。
// @match        https://x.com/*
// @run-at       document-idle
// @inject-into  content
// @grant        none
// @noframes
// ==/UserScript==

(() => {
  'use strict';

  // 設定：対象アカウントのIDを、@を付けずに入力してください。
  const TARGET_ACCOUNT = 'CHANGE_ME';

  const target = TARGET_ACCOUNT.trim().replace(/^@/, '').toLowerCase();
  if (target === 'change_me' || !/^[a-z0-9_]{1,15}$/.test(target)) {
    console.warn('片思いフォロー整理：TARGET_ACCOUNT に対象のIDを設定してください。');
    return;
  }

  const ID = 'xfh-panel';
  if (document.getElementById(ID)) return;
  const ROW = '[data-testid="UserCell"]';
  const INDICATOR = '[data-testid="userFollowIndicator"]';
  const FOLLOWING = 'button[data-testid$="-unfollow"]';
  const HIDDEN = 'xfh-mutual-hidden';
  const CANDIDATE = 'xfh-candidate';
  let hideMutual = true;
  let timer;

  const style = document.createElement('style');
  style.textContent = `
    .${HIDDEN} { visibility:hidden !important; pointer-events:none !important; }
    .${CANDIDATE} {
      background-color:rgba(255,180,0,.14) !important;
      box-shadow:inset 4px 0 #ffb400 !important;
    }
  `;
  document.head.append(style);

  const panel = document.createElement('div');
  panel.id = ID;
  panel.style.cssText = 'position:fixed;top:12px;right:12px;z-index:2147483647';
  const shadow = panel.attachShadow({mode:'open'});
  shadow.innerHTML = `
    <style>
      :host { color-scheme:dark; }
      section { width:245px;padding:12px;border:1px solid #777;border-radius:10px;
        background:#202124;color:#fff;font:13px/1.6 sans-serif;box-shadow:0 3px 14px #0008; }
      strong { font-size:14px; } p { margin:6px 0; }
      button { padding:6px 10px;cursor:pointer;background:#fff;color:#111;border:0;border-radius:5px; }
      small { display:block;margin-top:7px;color:#ddd; }
    </style>
    <section>
      <strong>片思いフォロー整理・手動操作</strong>
      <p id="counts" aria-live="polite"></p>
      <button type="button" id="toggle"></button>
      <small>黄色：フォロー中・相互表示なし<br>
        件数は現在読み込まれている行だけ。<br>古さの判定・自動解除はしません。</small>
    </section>`;
  document.body.append(panel);
  const counts = shadow.getElementById('counts');
  const toggle = shadow.getElementById('toggle');

  function refresh() {
    const active = location.pathname.replace(/\/$/, '').toLowerCase() === `/${target}/following`;
    panel.hidden = !active;
    let mutual = 0;
    let candidates = 0;
    document.querySelectorAll(ROW).forEach(row => {
      const following = !!row.querySelector(FOLLOWING);
      const reciprocal = !!row.querySelector(INDICATOR);
      const isMutual = active && following && reciprocal;
      const isCandidate = active && following && !reciprocal;
      if (isMutual) mutual++;
      if (isCandidate) candidates++;
      row.classList.toggle(HIDDEN, isMutual && hideMutual);
      row.classList.toggle(CANDIDATE, isCandidate);
    });
    const message = `候補 ${candidates}人 ／ 相互 ${mutual}人`;
    if (counts.textContent !== message) counts.textContent = message;
    const label = hideMutual ? '相互フォローも表示する' : '相互フォローを隠す';
    if (toggle.textContent !== label) toggle.textContent = label;
    toggle.setAttribute('aria-pressed', String(hideMutual));
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(refresh, 100);
  }
  toggle.addEventListener('click', () => {
    hideMutual = !hideMutual;
    refresh();
  });
  new MutationObserver(schedule).observe(document.body, {
    childList:true, subtree:true, attributes:true, attributeFilter:['data-testid']
  });
  setInterval(refresh, 1000);
  refresh();
})();
