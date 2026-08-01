// PANCASANDYA — member: login (captcha palsu) + inbox pribadi realtime
import { db } from "./firebase-config.js";
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";
import { MEMBER_ACCOUNTS } from "./member-credentials.js";

window.__panca_module_ok = true;

const SESSION_KEY = "pancasandya_member_session";
const CAPTCHA_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // tanpa 0/O/1/I biar gak ambigu

document.addEventListener('DOMContentLoaded', () => {
  const gate = document.querySelector('[data-login-gate]');
  const panel = document.querySelector('[data-member-panel]');
  const form = document.querySelector('[data-member-form]');

  const usernameInput = form.querySelector('[name="username"]');
  const passwordInput = form.querySelector('[name="password"]');
  const eyeBtn = document.querySelector('[data-eye-toggle]');

  const captchaBlock = document.querySelector('[data-captcha-block]');
  const captchaCodeEl = document.querySelector('[data-captcha-code]');
  const captchaInput = document.querySelector('[name="captcha"]');
  const captchaRefreshBtn = document.querySelector('[data-captcha-refresh]');
  const verifyBtn = document.querySelector('[data-verify-captcha]');
  const feedbackEl = document.querySelector('[data-captcha-feedback]');
  const loginBtn = document.querySelector('[data-login-btn]');

  const logoutBtn = document.querySelector('[data-logout]');

  let currentCaptcha = '';
  let captchaVerified = false;

  /* ---------- Sesi tersimpan ---------- */
  const savedSlug = sessionStorage.getItem(SESSION_KEY);
  if(savedSlug){
    const account = MEMBER_ACCOUNTS.find(a => a.slug === savedSlug);
    if(account) showPanel(account);
  }

  /* ---------- Toggle lihat/sembunyikan password ---------- */
  if(eyeBtn){
    eyeBtn.addEventListener('click', () => {
      const isHidden = passwordInput.type === 'password';
      passwordInput.type = isHidden ? 'text' : 'password';
      eyeBtn.innerHTML = isHidden ? eyeOffIcon() : eyeIcon();
    });
    eyeBtn.innerHTML = eyeIcon();
  }

  /* ---------- Munculkan captcha begitu username & password terisi ---------- */
  function checkReveal(){
    const ready = usernameInput.value.trim().length > 0 && passwordInput.value.length > 0;
    if(ready && !captchaBlock.classList.contains('is-shown')){
      captchaBlock.classList.add('is-shown');
      generateCaptcha();
    } else if(!ready && captchaBlock.classList.contains('is-shown')){
      captchaBlock.classList.remove('is-shown');
      resetCaptchaState();
    }
  }
  usernameInput.addEventListener('input', checkReveal);
  passwordInput.addEventListener('input', checkReveal);

  /* ---------- Generate captcha 5 karakter ---------- */
  function generateCaptcha(){
    currentCaptcha = Array.from({ length: 5 }, () => CAPTCHA_CHARS[Math.floor(Math.random() * CAPTCHA_CHARS.length)]).join('');
    captchaCodeEl.innerHTML = currentCaptcha.split('').map((ch, i) => {
      const rotate = (Math.random() * 16 - 8).toFixed(1);
      const rise = (Math.random() * 6 - 3).toFixed(1);
      return `<span style="transform:rotate(${rotate}deg) translateY(${rise}px)">${ch}</span>`;
    }).join('');
    captchaInput.value = '';
    resetCaptchaState();
  }

  function resetCaptchaState(){
    captchaVerified = false;
    feedbackEl.className = 'captcha-feedback';
    feedbackEl.innerHTML = '';
    loginBtn.style.display = 'none';
    verifyBtn.disabled = false;
    verifyBtn.textContent = 'Verifikasi Captcha';
  }

  if(captchaRefreshBtn){
    captchaRefreshBtn.addEventListener('click', generateCaptcha);
  }

  /* ---------- Verifikasi captcha (loading 4 detik, lalu centang/silang) ---------- */
  if(verifyBtn){
    verifyBtn.addEventListener('click', () => {
      const typed = captchaInput.value.trim();
      if(!typed) return;

      verifyBtn.disabled = true;
      verifyBtn.textContent = 'Memverifikasi...';
      feedbackEl.className = 'captcha-feedback';
      feedbackEl.innerHTML = '<span class="spinner"></span> Memvalidasi captcha...';

      setTimeout(() => {
        const correct = typed.toUpperCase() === currentCaptcha.toUpperCase();
        if(correct){
          captchaVerified = true;
          feedbackEl.className = 'captcha-feedback is-ok';
          feedbackEl.innerHTML = checkIcon() + ' Captcha terverifikasi';
          loginBtn.style.display = 'flex';
          verifyBtn.textContent = 'Terverifikasi';
        } else {
          captchaVerified = false;
          verifyBtn.textContent = 'Verifikasi Captcha';
          generateCaptcha();
          feedbackEl.className = 'captcha-feedback is-fail';
          feedbackEl.innerHTML = crossIcon() + ' Captcha salah, coba lagi dengan kode baru';
        }
      }, 4000);
    });
  }

  /* ---------- Masuk (loading 3 detik, lalu validasi akun) ---------- */
  if(loginBtn){
    loginBtn.addEventListener('click', () => {
      if(!captchaVerified) return;

      loginBtn.disabled = true;
      loginBtn.textContent = 'Memvalidasi...';

      setTimeout(() => {
        const typedUser = usernameInput.value.trim().toLowerCase();
        const typedPass = passwordInput.value;
        const account = MEMBER_ACCOUNTS.find(a => a.name.toLowerCase() === typedUser && a.password === typedPass);

        loginBtn.disabled = false;
        loginBtn.textContent = 'Masuk';

        if(account){
          sessionStorage.setItem(SESSION_KEY, account.slug);
          window.showPopup({
            type: 'success',
            title: 'Berhasil Login sebagai',
            message: `<b>${escapeHtml(account.name)}</b>`,
            confirmText: 'Lanjut'
          });
          form.reset();
          showPanel(account);
        } else {
          window.showPopup({
            type: 'warning',
            title: 'Login gagal',
            message: 'Username atau password salah. Periksa kembali datamu, lalu coba lagi.',
            confirmText: 'Oke'
          });
          form.reset();
          captchaBlock.classList.remove('is-shown');
          resetCaptchaState();
        }
      }, 3000);
    });
  }

  /* ---------- Logout ---------- */
  if(logoutBtn){
    logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem(SESSION_KEY);
      panel.style.display = 'none';
      gate.style.display = 'block';
      form.reset();
      captchaBlock.classList.remove('is-shown');
      resetCaptchaState();
    });
  }

  /* ---------- Tampilkan panel + inbox pribadi ---------- */
  function showPanel(account){
    gate.style.display = 'none';
    panel.style.display = 'block';
    panel.querySelectorAll('.reveal').forEach(el => el.classList.add('is-in'));

    const nameEl = document.querySelector('[data-member-name]');
    if(nameEl) nameEl.textContent = account.name;

    const list = document.querySelector('[data-inbox-list]');
    const emptyState = document.querySelector('[data-inbox-empty]');
    const countLabel = document.querySelector('[data-inbox-count]');
    if(!list || list.dataset.bound) return;
    list.dataset.bound = 'true';

    onValue(ref(db, 'member_inbox/' + account.slug), (snap) => {
      const data = snap.val();
      const items = data ? Object.entries(data).map(([id, val]) => ({ id, ...val })) : [];
      items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      list.innerHTML = '';
      if(items.length === 0){
        emptyState.style.display = 'block';
        countLabel.innerHTML = '<b>0</b> pesan';
        return;
      }
      emptyState.style.display = 'none';
      countLabel.innerHTML = `<b>${items.length}</b> pesan`;

      items.forEach(item => {
        const li = document.createElement('li');
        li.className = 'inbox-item member-item';
        li.innerHTML = `
          <div class="row1"><span class="from">dari ${escapeHtml(item.nama || 'Anonim')}</span></div>
          <p class="msg">${escapeHtml(item.pesan || '')}</p>
          <div class="time">${formatTime(item.createdAt)}</div>
        `;
        list.appendChild(li);
      });
    });
  }

  function escapeHtml(str){
    const div = document.createElement('div');
    div.textContent = str == null ? '' : str;
    return div.innerHTML;
  }

  function formatTime(ts){
    if(!ts) return 'Baru saja';
    return new Date(ts).toLocaleString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  function eyeIcon(){
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/><circle cx="12" cy="12" r="3"/></svg>';
  }
  function eyeOffIcon(){
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.6 21.6 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 7 11 7a21.6 21.6 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><path d="M1 1l22 22"/></svg>';
  }
  function checkIcon(){
    return '<svg class="result-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
  }
  function crossIcon(){
    return '<svg class="result-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>';
  }
});
