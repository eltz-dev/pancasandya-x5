// PANCASANDYA — status fitur NGL (dipakai bersama oleh ngl.js, admin.js, developer.js)
import { db } from "./firebase-config.js";
import { ref, onValue, set, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

const statusRef = ref(db, 'ngl_status');

/**
 * Mendengarkan perubahan status NGL secara realtime.
 * callback menerima objek: { active, until, updatedBy, effectiveActive, expired }
 * - active: nilai mentah di database
 * - until: timestamp ms kapan NGL otomatis aktif lagi (null = tanpa batas waktu / permanen)
 * - effectiveActive: status yang sudah memperhitungkan apakah waktu "until" sudah lewat
 */
export function subscribeNglStatus(callback){
  return onValue(statusRef, (snap) => {
    const raw = snap.val() || { active: true, until: null, updatedBy: null };
    const now = Date.now();
    const expired = raw.active === false && !!raw.until && now >= raw.until;
    const effectiveActive = raw.active !== false || expired;

    callback({ ...raw, effectiveActive, expired });

    // Perbaikan otomatis: kalau waktu nonaktif sudah lewat, tulis ulang jadi aktif
    if(expired){
      set(statusRef, {
        active: true,
        until: null,
        updatedAt: serverTimestamp(),
        updatedBy: 'sistem (otomatis)'
      }).catch(() => {});
    }
  });
}

/** Mematikan fitur NGL. durationMs null berarti nonaktif permanen sampai diaktifkan manual. */
export function turnOffNgl(durationMs, actor){
  return set(statusRef, {
    active: false,
    until: durationMs ? Date.now() + durationMs : null,
    updatedAt: serverTimestamp(),
    updatedBy: actor
  });
}

/** Mengaktifkan kembali fitur NGL. */
export function turnOnNgl(actor){
  return set(statusRef, {
    active: true,
    until: null,
    updatedAt: serverTimestamp(),
    updatedBy: actor
  });
}

/** Daftar pilihan durasi yang bisa dipakai di UI dropdown. */
export const DURATION_PRESETS = [
  { label: '15 Menit', ms: 15 * 60 * 1000 },
  { label: '1 Jam', ms: 60 * 60 * 1000 },
  { label: '6 Jam', ms: 6 * 60 * 60 * 1000 },
  { label: '12 Jam', ms: 12 * 60 * 60 * 1000 },
  { label: '1 Hari', ms: 24 * 60 * 60 * 1000 },
  { label: '3 Hari', ms: 3 * 24 * 60 * 60 * 1000 },
  { label: '1 Minggu', ms: 7 * 24 * 60 * 60 * 1000 },
  { label: 'Sampai diaktifkan manual', ms: null }
];

export function formatUntil(ts){
  if(!ts) return null;
  return new Date(ts).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}
