// PANCASANDYA — panel developer: login, kontrol fitur NGL, inbox realtime
import { subscribeInbox, deleteOneMessage, deleteAllMessages, escapeHtml, formatTime } from "./ngl-inbox.js";
import { subscribeNglStatus, turnOffNgl, turnOnNgl, DURATION_PRESETS, formatUntil } from "./ngl-status.js";

window.__panca_module_ok = true;

// Ganti kode akses ini kapan pun kamu mau. Ini satu-satunya tempat menyimpannya.
const DEV_PASSCODE = "PancaDev2026";
const SESSION_KEY = "pancasandya_dev_auth";

document.addEventListener('DOMContentLoaded', () => {
  const gate = document.querySelector('[data-login-gate]');
  const panel = document.querySelector('[data-dev-panel]');
  const form = document.querySelector('[data-login-form]');
  const errorEl = document.querySelector('[data-login-error]');
  const logoutBtn = document.querySelector('[data-logout]');

  function showPanel(){
    gate.style.display = 'none';
    panel.style.display = 'block';
    panel.querySelectorAll('.reveal').forEach(el => el.classList.add('is-in'));
    initInbox();
    initNglControl();
  }

  function showGate(){
    panel.style.display = 'none';
    gate.style.display = 'block';
  }

  if(sessionStorage.getItem(SESSION_KEY) === 'true'){
    showPanel();
  }

  if(form){
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('[name="passcode"]');
      if(input.value === DEV_PASSCODE){
        sessionStorage.setItem(SESSION_KEY, 'true');
        errorEl.textContent = '';
        form.reset();
        showPanel();
      } else {
        errorEl.textContent = 'Kode akses salah. Coba lagi.';
        input.value = '';
        input.focus();
      }
    });
  }

  if(logoutBtn){
    logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem(SESSION_KEY);
      showGate();
    });
  }
});

/* ---------------------------------------------------------
   INBOX: sama seperti admin — lihat semua, hapus satu/semua
   --------------------------------------------------------- */
function initInbox(){
  const list = document.querySelector('[data-inbox-list]');
  const emptyState = document.querySelector('[data-inbox-empty]');
  const countLabel = document.querySelector('[data-inbox-count]');
  const deleteAllBtn = document.querySelector('[data-delete-all]');
  if(!list || list.dataset.bound) return;
  list.dataset.bound = 'true';

  subscribeInbox((items) => {
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
      li.className = 'inbox-item';
      li.innerHTML = `
        <button class="item-delete" type="button" data-delete-id="${item.id}" aria-label="Hapus pesan ini">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
        </button>
        <div class="row1">
          <span class="to">Kepada: ${escapeHtml(item.kepada || '-')}</span>
          <span class="from">dari ${escapeHtml(item.nama || 'Anonim')}</span>
        </div>
        <p class="msg">${escapeHtml(item.pesan || '')}</p>
        <div class="time">${formatTime(item.createdAt)}</div>
      `;
      list.appendChild(li);
    });
  });

  list.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-delete-id]');
    if(!btn) return;
    const id = btn.getAttribute('data-delete-id');
    window.showPopup({
      type: 'warning',
      title: 'Hapus pesan ini?',
      message: 'Pesan ini akan terhapus selamanya dan tidak bisa dikembalikan.',
      confirmText: 'Ya, hapus',
      cancelText: 'Batal',
      onConfirm: () => {
        deleteOneMessage(id).catch((err) => {
          console.error(err);
          window.showPopup({ type: 'warning', title: 'Gagal menghapus', message: 'Terjadi kendala saat menghapus pesan. Coba lagi.', confirmText: 'Oke' });
        });
      }
    });
  });

  if(deleteAllBtn){
    deleteAllBtn.addEventListener('click', () => {
      window.showPopup({
        type: 'warning',
        title: 'Hapus semua pesan?',
        message: 'Apakah kamu yakin ingin menghapus seluruh pesan NGL? Pesan akan terhapus selamanya.',
        confirmText: 'Ya, hapus semua',
        cancelText: 'Batal',
        onConfirm: () => {
          deleteAllMessages().then(() => {
            window.showPopup({ type: 'success', title: 'Terhapus', message: 'Seluruh pesan NGL berhasil dihapus dari database.', confirmText: 'Oke' });
          }).catch((err) => {
            console.error(err);
            window.showPopup({ type: 'warning', title: 'Gagal menghapus', message: 'Terjadi kendala saat menghapus pesan. Coba lagi.', confirmText: 'Oke' });
          });
        }
      });
    });
  }
}

/* ---------------------------------------------------------
   KONTROL FITUR NGL — developer, jabatan tertinggi.
   Kalau developer mengaktifkan lagi, status ini langsung
   menimpa apa pun yang diatur admin (realtime, last-write-wins).
   --------------------------------------------------------- */
function initNglControl(){
  const badge = document.querySelector('[data-ngl-badge]');
  const meta = document.querySelector('[data-ngl-meta]');
  const select = document.querySelector('[data-duration-select]');
  const offBtn = document.querySelector('[data-turn-off]');
  const onBtn = document.querySelector('[data-turn-on]');
  if(!badge || badge.dataset.bound) return;
  badge.dataset.bound = 'true';

  if(select){
    select.innerHTML = DURATION_PRESETS.map((p, i) => `<option value="${i}">${p.label}</option>`).join('');
  }

  subscribeNglStatus((status) => {
    if(status.effectiveActive){
      badge.className = 'badge is-on';
      badge.innerHTML = '<span class="dot"></span> Aktif';
      onBtn.disabled = true;
      offBtn.disabled = false;
      meta.innerHTML = status.updatedBy ? `Terakhir diubah oleh <b>${escapeHtml(status.updatedBy)}</b>` : '';
    } else {
      badge.className = 'badge is-off';
      badge.innerHTML = '<span class="dot"></span> Nonaktif';
      onBtn.disabled = false;
      offBtn.disabled = false;
      const untilText = status.until ? `hingga <b>${formatUntil(status.until)}</b>` : 'secara permanen';
      meta.innerHTML = `Dimatikan ${untilText}${status.updatedBy ? ` oleh <b>${escapeHtml(status.updatedBy)}</b>` : ''}`;
    }
  });

  if(offBtn){
    offBtn.addEventListener('click', () => {
      const preset = DURATION_PRESETS[Number(select.value)];
      window.showPopup({
        type: 'warning',
        title: 'Matikan fitur NGL?',
        message: `Fitur NGL akan dinonaktifkan (${preset.label}). Semua orang tidak bisa mengirim pesan sampai diaktifkan kembali.`,
        confirmText: 'Ya, matikan',
        cancelText: 'Batal',
        onConfirm: () => {
          turnOffNgl(preset.ms, 'developer').catch((err) => console.error(err));
        }
      });
    });
  }

  if(onBtn){
    onBtn.addEventListener('click', () => {
      turnOnNgl('developer').catch((err) => console.error(err));
    });
  }
}
