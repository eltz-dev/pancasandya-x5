/* =========================================================================
   admin.js — halaman admin.html
   ========================================================================= */

window.addEventListener('DOMContentLoaded', ()=>{
  initInboxUI({ listId: 'inboxList', countId: 'inboxCount', deleteAllId: 'deleteAllBtn' });

  const statusPill = document.getElementById('nglStatusText');
  const toggleBtn  = document.getElementById('nglToggleBtn');
  let currentSettings = {};

  db.ref(NGL_SETTINGS_REF).on('value', (snap)=>{
    currentSettings = snap.val() || {};
    const active = nglIsActive(currentSettings);

    statusPill.textContent = nglStatusLabel(currentSettings);
    statusPill.classList.toggle('is-off', !active);

    toggleBtn.textContent = active ? 'Nonaktifkan NGL' : 'Aktifkan NGL';
    toggleBtn.className = 'btn ' + (active ? 'btn-danger' : 'btn-primary');
  });

  toggleBtn.addEventListener('click', ()=>{
    const active = nglIsActive(currentSettings);

    if(active){
      db.ref(NGL_SETTINGS_REF).update({ active: false, disabledBy: 'admin' });
    } else {
      db.ref(NGL_SETTINGS_REF).update({ active: true });
    }
  });
});
