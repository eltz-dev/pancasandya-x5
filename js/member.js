/* =========================================================================
   member.js — halaman member.html (login 36 anggota + inbox NGL pribadi)
   ========================================================================= */

const CAPTCHA_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // tanpa karakter mirip

function generateCaptchaCode(len){
  let str = '';
  for(let i = 0; i < len; i++){
    str += CAPTCHA_CHARS[Math.floor(Math.random() * CAPTCHA_CHARS.length)];
  }
  return str;
}

/* ---------------- inbox pribadi member (gabungan pesan personal + broadcast) ---------------- */
function renderMemberInbox(memberId, listElId, countElId){
  const list = document.getElementById(listElId);
  const count = document.getElementById(countElId);
  let personalMsgs = {};
  let broadcastMsgs = {};

  function escapeHtml(str){
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function render(){
    const merged = Object.assign({}, personalMsgs, broadcastMsgs);
    const entries = Object.entries(merged).sort((a, b)=> (b[1].timestamp || 0) - (a[1].timestamp || 0));

    list.innerHTML = '';

    if(!entries.length){
      list.innerHTML = '<div class="inbox-empty">Belum ada pesan NGL untuk kamu.</div>';
      if(count) count.textContent = '0 pesan';
      return;
    }

    if(count) count.textContent = entries.length + ' pesan';

    entries.forEach(([key, msg])=>{
      const card = document.createElement('div');
      card.className = 'inbox-card';
      card.innerHTML = `
        <div class="inbox-card-top">
          <span class="inbox-to">${msg.kepadaId === 'semua' ? 'Untuk Semua Anggota' : 'Untuk Kamu'}</span>
          <span class="inbox-time">${msg.timestamp ? formatDateTime(msg.timestamp) : ''}</span>
        </div>
        <p class="inbox-message">${escapeHtml(msg.pesan || '')}</p>
        <span class="inbox-from">Dari: ${escapeHtml(msg.nama || 'Anonim')}</span>
      `;
      list.appendChild(card);
    });
  }

  db.ref('messages').orderByChild('kepadaId').equalTo(memberId).on('value', (snap)=>{
    personalMsgs = snap.val() || {};
    render();
  });
  db.ref('messages').orderByChild('kepadaId').equalTo('semua').on('value', (snap)=>{
    broadcastMsgs = snap.val() || {};
    render();
  });
}

/* ---------------- login flow ---------------- */
window.addEventListener('DOMContentLoaded', ()=>{
  const usernameInput   = document.getElementById('memberUsername');
  const passwordInput   = document.getElementById('memberPassword');
  const togglePassBtn   = document.getElementById('memberTogglePassword');
  const captchaLetters  = document.getElementById('memberCaptchaLetters');
  const captchaRefresh  = document.getElementById('memberCaptchaRefresh');
  const captchaInput    = document.getElementById('memberCaptchaInput');
  const verifyBtn       = document.getElementById('memberVerifyCaptchaBtn');
  const resultIcon      = document.getElementById('memberCaptchaResult');
  const loginForm       = document.getElementById('memberLoginForm');
  const loginBtn        = document.getElementById('memberLoginBtn');
  const loginScreen     = document.getElementById('memberLoginScreen');
  const panel           = document.getElementById('memberPanel');
  const panelName       = document.getElementById('memberPanelName');
  const logoutBtn       = document.getElementById('memberLogoutBtn');

  let currentCaptcha = '';
  let captchaVerified = false;

  function renderCaptcha(){
    currentCaptcha = generateCaptchaCode(5);
    captchaVerified = false;
    captchaInput.value = '';
    loginBtn.disabled = true;
    resultIcon.className = 'captcha-result-icon';
    resultIcon.innerHTML = '';

    captchaLetters.innerHTML = '';
    currentCaptcha.split('').forEach((ch)=>{
      const span = document.createElement('span');
      span.textContent = ch;
      const rotate = (Math.random() * 16 - 8).toFixed(1);
      span.style.transform = `rotate(${rotate}deg)`;
      span.style.color = Math.random() > 0.5 ? 'var(--ember)' : 'var(--blush)';
      captchaLetters.appendChild(span);
    });
  }

  renderCaptcha();
  captchaRefresh.addEventListener('click', renderCaptcha);

  togglePassBtn.addEventListener('click', ()=>{
    const willShow = passwordInput.type === 'password';
    passwordInput.type = willShow ? 'text' : 'password';
    togglePassBtn.classList.toggle('is-visible', willShow);
  });

  verifyBtn.addEventListener('click', ()=>{
    if(!usernameInput.value.trim() || !passwordInput.value.trim()){
      showModal({
        icon: '!', title: 'Belum Lengkap',
        message: 'Isi username dan password terlebih dahulu sebelum verifikasi captcha.',
        buttons: [{ label: 'Oke', primary: true }]
      });
      return;
    }
    if(!captchaInput.value.trim()){
      showModal({
        icon: '!', title: 'Captcha Kosong',
        message: 'Ketik kode captcha yang tampil di atas terlebih dahulu.',
        buttons: [{ label: 'Oke', primary: true }]
      });
      return;
    }

    verifyBtn.disabled = true;
    resultIcon.className = 'captcha-result-icon';
    resultIcon.innerHTML = '<span class="loader"></span>';

    setTimeout(()=>{
      const isMatch = captchaInput.value.trim().toUpperCase() === currentCaptcha;
      verifyBtn.disabled = false;

      if(isMatch){
        resultIcon.className = 'captcha-result-icon is-success';
        resultIcon.innerHTML = '✓';
        captchaVerified = true;
        loginBtn.disabled = false;
      } else {
        resultIcon.className = 'captcha-result-icon is-error';
        resultIcon.innerHTML = '✗';
        captchaVerified = false;
        loginBtn.disabled = true;
        setTimeout(renderCaptcha, 1000);
      }
    }, 4000);
  });

  loginForm.addEventListener('submit', (e)=>{
    e.preventDefault();

    if(!captchaVerified){
      showModal({
        icon: '!', title: 'Captcha Belum Diverifikasi',
        message: 'Verifikasi captcha terlebih dahulu sebelum masuk.',
        buttons: [{ label: 'Oke', primary: true }]
      });
      return;
    }

    loginBtn.disabled = true;
    const originalLabel = loginBtn.textContent;
    loginBtn.innerHTML = '<span class="loader"></span> Memvalidasi...';

    setTimeout(()=>{
      const usernameVal = usernameInput.value.trim().toLowerCase();
      const passwordVal = passwordInput.value;
      const member = MEMBERS.find((m)=> m.username.toLowerCase() === usernameVal && m.password === passwordVal);

      if(member){
        sessionStorage.setItem('pancasandyaMemberId', member.id);
        showModal({
          icon: '✓',
          title: 'Berhasil Login sebagai',
          message: member.username,
          buttons: [{ label: 'Lanjutkan', primary: true, onClick: ()=> openMemberPanel(member) }]
        });
      } else {
        loginBtn.disabled = false;
        loginBtn.textContent = originalLabel;
        showModal({
          icon: '!',
          title: 'Login Gagal',
          message: 'Username atau password yang kamu masukkan tidak sesuai.',
          buttons: [{ label: 'Coba Lagi', primary: true }]
        });
        renderCaptcha();
      }
    }, 3000);
  });

  function openMemberPanel(member){
    loginScreen.style.display = 'none';
    panel.style.display = 'block';
    panelName.textContent = member.username;
    panel.querySelectorAll('.reveal').forEach((el)=> el.classList.add('is-in'));
    renderMemberInbox(member.id, 'memberInboxList', 'memberInboxCount');
  }

  logoutBtn.addEventListener('click', ()=>{
    sessionStorage.removeItem('pancasandyaMemberId');
    location.reload();
  });

  // lanjutkan sesi login kalau sudah pernah login sebelumnya di tab ini
  const savedId = sessionStorage.getItem('pancasandyaMemberId');
  if(savedId){
    const member = MEMBERS.find((m)=> m.id === savedId);
    if(member) openMemberPanel(member);
  }
});
