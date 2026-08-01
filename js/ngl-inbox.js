// PANCASANDYA — inbox NGL (dipakai bersama oleh admin.js & developer.js)
import { db } from "./firebase-config.js";
import { ref, onValue, remove } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

const nglRef = ref(db, 'ngl_messages');

/** Mendengarkan daftar pesan NGL secara realtime, terbaru di paling atas. */
export function subscribeInbox(callback){
  return onValue(nglRef, (snapshot) => {
    const data = snapshot.val();
    const items = data
      ? Object.entries(data).map(([id, val]) => ({ id, ...val }))
      : [];
    items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    callback(items);
  });
}

/** Menghapus satu pesan berdasarkan id-nya. */
export function deleteOneMessage(id){
  return remove(ref(db, 'ngl_messages/' + id));
}

/** Menghapus seluruh pesan NGL. */
export function deleteAllMessages(){
  return remove(nglRef);
}

export function escapeHtml(str){
  const div = document.createElement('div');
  div.textContent = str == null ? '' : str;
  return div.innerHTML;
}

export function formatTime(ts){
  if(!ts) return 'Baru saja';
  return new Date(ts).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}
