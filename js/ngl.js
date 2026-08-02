/* =========================================================================
   ngl.js — halaman nglpanca.html
   ========================================================================= */

window.addEventListener('DOMContentLoaded', ()=>{
  const form       = document.getElementById('nglForm');
  const submitBtn  = document.getElementById('nglSubmit');
  const nameInput  = document.getElementById('nglNama');
  const kepadaInput= document.getElementById('nglKepada');
  const pesanInput = document.getElementById('nglPesan');
  const banner     = document.getElementById('nglStatusBanner');

  let latestSettings = {};
  let wasActive = null;   // null = belum pernah dicek
  let introShown = false;

  function setFormEnabled(enabled){
    [nameInput, kepadaInput, pesanInput, submitBtn].forEach(el=> el.disabled = !enabled);
    banner.style.display = enabled ? 'none' : 'flex';
  }

  function updateBannerText(settings){
    if(settings.disabledUntil && settings.disabledUntil > Date.now()){
      banner.textContent = '🔒 NGL sedang dimatikan sementara. Aktif kembali pada ' + formatDateTime(settings.disabledUntil) + '.';
    } else {
      banner.textContent = '🔒 NGL sedang dimatikan sementara. Menunggu diaktifkan kembali oleh developer.';
    }
  }

  db.ref(NGL_SETTINGS_REF).on('value', (snap)=>{
    latestSettings = snap.val() || {};
    const active = nglIsActive(latestSettings);

    setFormEnabled(active);
    if(!active) updateBannerText(latestSettings);

    if(wasActive === null){
      // pengecekan pertama saat halaman dibuka
      if(active){
        showModal({
          icon: '✉',
          title: 'Sebelum Kirim Pesan',
          message: 'Pesan kamu bisa disampaikan/diposting lewat Reels Instagram kami. Jangan lupa follow @pancasandya.x5 ya!',
          buttons: [{ label: 'Mengerti', primary: true }]
        });
        introShown = true;
      } else {
        showModal({
          icon: '🔒',
          title: 'Dimatikan Sementara',
          message: 'Fitur NGL sedang dimatikan sementara. Kamu belum bisa mengirim pesan sampai fitur ini diaktifkan kembali.',
          buttons: [{ label: 'Mengerti', primary: true }]
        });
      }
    } else if(active && !wasActive){
      showModal({
        icon: '✓',
        title: 'NGL Aktif Kembali',
        message: 'Fitur NGL sudah aktif lagi. Silakan kirim pesanmu sekarang.',
        buttons: [{ label: 'Oke', primary: true }]
      });
    } else if(!active && wasActive){
      showModal({
        icon: '🔒',
        title: 'Dimatikan Sementara',
        message: 'Fitur NGL baru saja dimatikan sementara. Coba lagi nanti ya.',
        buttons: [{ label: 'Mengerti', primary: true }]
      });
    }

    wasActive = active;
  });

  form.addEventListener('submit', (e)=>{
    e.preventDefault();

    if(!nglIsActive(latestSettings)){
      showModal({
        icon: '🔒',
        title: 'Dimatikan Sementara',
        message: 'Fitur NGL sedang dimatikan sementara. Kamu belum bisa mengirim pesan sekarang.',
        buttons: [{ label: 'Mengerti', primary: true }]
      });
      return;
    }

    const nama     = nameInput.value.trim();
    const kepadaId = kepadaInput.value;
    const kepadaLabel = kepadaInput.selectedIndex >= 0 ? kepadaInput.options[kepadaInput.selectedIndex].text : '';
    const pesan    = pesanInput.value.trim();

    if(!kepadaId || !pesan){
      showModal({
        icon: '!',
        title: 'Belum Lengkap',
        message: 'Kolom "Kepada" dan "Pesan" wajib diisi sebelum mengirim.',
        buttons: [{ label: 'Oke', primary: true }]
      });
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Mengirim...';

    db.ref('messages').push({
      nama: nama || '',
      kepada: kepadaLabel,
      kepadaId: kepadaId,
      pesan: pesan,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    }).then(()=>{
      form.reset();
      showModal({
        icon: '✓',
        title: 'Berhasil Terkirim!',
        message: 'Pesan kamu sudah masuk ke Pancasandya. Terima kasih sudah berbagi cerita.',
        buttons: [{ label: 'Kirim Lagi', primary: true }]
      });
    }).catch(()=>{
      showModal({
        icon: '!',
        title: 'Gagal Terkirim',
        message: 'Terjadi kendala saat mengirim pesan. Coba lagi sebentar ya.',
        buttons: [{ label: 'Oke', primary: true }]
      });
    }).finally(()=>{
      submitBtn.disabled = !nglIsActive(latestSettings);
      submitBtn.textContent = 'Kirim';
    });
  });
});
