/* =========================================================================
   developer.js — halaman developerpanca.html
   ========================================================================= */

window.addEventListener('DOMContentLoaded', ()=>{
  const loginScreen = document.getElementById('devLoginScreen');
  const loginForm   = document.getElementById('devLoginForm');
  const passInput   = document.getElementById('devPassword');
  const panel       = document.getElementById('devPanel');

  function unlockPanel(){
    loginScreen.style.display = 'none';
    panel.style.display = 'block';
    panel.querySelectorAll('.reveal').forEach(el=> el.classList.add('is-in'));
    initDeveloperPanel();
  }

  if(sessionStorage.getItem('pancasandyaDevAuth') === '1'){
    unlockPanel();
  }

  loginForm.addEventListener('submit', (e)=>{
    e.preventDefault();

    if(passInput.value === DEVELOPER_PASSCODE){
      sessionStorage.setItem('pancasandyaDevAuth', '1');
      unlockPanel();
    } else {
      showModal({
        icon: '!',
        title: 'Password Salah',
        message: 'Password developer yang kamu masukkan tidak sesuai.',
        buttons: [{ label: 'Coba Lagi', primary: true }]
      });
      passInput.value = '';
      passInput.focus();
    }
  });

  function initDeveloperPanel(){
    initInboxUI({ listId: 'devInboxList', countId: 'devInboxCount', deleteAllId: 'devDeleteAllBtn' });

    const statusPill   = document.getElementById('devNglStatusText');
    const durationSel  = document.getElementById('devDuration');
    const disableBtn   = document.getElementById('devDisableBtn');
    const activateBtn  = document.getElementById('devActivateBtn');

    db.ref(NGL_SETTINGS_REF).on('value', (snap)=>{
      const settings = snap.val() || {};
      const active = nglIsActive(settings);
      statusPill.textContent = nglStatusLabel(settings);
      statusPill.classList.toggle('is-off', !active);
    });

    disableBtn.addEventListener('click', ()=>{
      const minutes = parseInt(durationSel.value, 10);
      const until = Date.now() + minutes * 60000;

      db.ref(NGL_SETTINGS_REF).update({
        active: false,
        disabledUntil: until,
        disabledBy: 'developer'
      }).then(()=>{
        showModal({
          icon: '✓',
          title: 'NGL Dimatikan',
          message: 'Fitur NGL dimatikan sampai ' + formatDateTime(until) + '. Setelah itu, NGL aktif lagi dengan sendirinya.',
          buttons: [{ label: 'Oke', primary: true }]
        });
      });
    });

    activateBtn.addEventListener('click', ()=>{
      db.ref(NGL_SETTINGS_REF).update({
        active: true,
        disabledUntil: null,
        disabledBy: null
      }).then(()=>{
        showModal({
          icon: '✓',
          title: 'NGL Diaktifkan',
          message: 'Fitur NGL aktif kembali untuk semua pengguna. Status nonaktif dari admin (jika ada) otomatis dibatalkan.',
          buttons: [{ label: 'Oke', primary: true }]
        });
      });
    });
  }
});
