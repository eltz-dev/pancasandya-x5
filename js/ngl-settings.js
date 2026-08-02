/* =========================================================================
   ngl-settings.js — helper status fitur NGL, dipakai bersama oleh
   nglpanca.html, admin.html, dan developerpanca.html
   ========================================================================= */

const NGL_SETTINGS_REF = 'settings/ngl';

/**
 * Menentukan apakah NGL sedang aktif berdasarkan data settings di Firebase.
 * - disabledUntil (timestamp di masa depan) selalu menang, walau admin
 *   sudah menyalakan "active" — ini yang membuat jadwal dari developer
 *   otomatis berakhir sendiri tanpa perlu ada yang menekan tombol lagi.
 * - active:false berarti dimatikan manual tanpa batas waktu.
 */
function nglIsActive(settings){
  const now = Date.now();
  if(settings && settings.disabledUntil && settings.disabledUntil > now) return false;
  if(settings && settings.active === false) return false;
  return true;
}

function nglStatusLabel(settings){
  const now = Date.now();
  if(settings && settings.disabledUntil && settings.disabledUntil > now){
    let label = 'Nonaktif hingga ' + formatDateTime(settings.disabledUntil);
    if(settings.disabledBy) label += ' · oleh ' + capitalize(settings.disabledBy);
    return label;
  }
  if(settings && settings.active === false){
    let label = 'Nonaktif';
    if(settings.disabledBy) label += ' · dimatikan oleh ' + capitalize(settings.disabledBy);
    return label;
  }
  return 'Aktif';
}

function formatDateTime(ts){
  return new Date(ts).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function capitalize(str){
  return str.charAt(0).toUpperCase() + str.slice(1);
}
