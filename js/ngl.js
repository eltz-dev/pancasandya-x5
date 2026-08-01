// PANCASANDYA — NGL: kirim pesan anonim + cek status aktif/nonaktif fitur
import { db } from "./firebase-config.js";
import { ref, push, update, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";
import { subscribeNglStatus, formatUntil } from "./ngl-status.js";
import { MEMBERS } from "./members.js";

window.__panca_module_ok = true;

const ALL_VALUE = "__semua__";

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('[data-ngl-form]');
  if(!form) return;

  const nameInput = form.querySelector('[name="nama"]');
  const toSelect = form.querySelector('[name="kepada"]');
  const msgInput = form.querySelector('[name="pesan"]');
  const submitBtn = form.querySelector('[data-submit-btn]');
  const lockedBanner = document.querySelector('[data-locked-banner]');
  const lockedText = document.querySelector('[data-locked-text]');

  // Isi pilihan "Kepada": 36 anggota + opsi "Semuanya" di paling bawah
  if(toSelect){
    const options = ['<option value="" disabled selected>Pilih penerima...</option>'];
    MEMBERS.forEach(m => {
      options.push(`<option value="${m.slug}">${escapeOption(m.name)}</option>`);
    });
    options.push(`<option value="${ALL_VALUE}">Semuanya</option>`);
    toSelect.innerHTML = options.join('');
  }

  function escapeOption(str){
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  let hasShownWelcome = false;
  let wasActive = true;
  let firstStatusCheck = true;

  function lockForm(){
    form.classList.add('is-locked');
    [nameInput, toSelect, msgInput, submitBtn].forEach(el => el && (el.disabled = true));
    if(lockedBanner) lockedBanner.style.display = 'flex';
  }

  function unlockForm(){
    form.classList.remove('is-locked');
    [nameInput, toSelect, msgInput, submitBtn].forEach(el => el && (el.disabled = false));
    if(lockedBanner) lockedBanner.style.display = 'none';
  }

  subscribeNglStatus((status) => {
    if(!status.effectiveActive){
      lockForm();
      if(lockedText){
        lockedText.textContent = status.until
          ? `Fitur ini akan aktif kembali sekitar ${formatUntil(status.until)}.`
          : 'Fitur ini akan aktif kembali begitu developer atau admin mengaktifkannya.';
      }
      if(wasActive || firstStatusCheck){
        window.showPopup({
          type: 'warning',
          title: 'Dimatikan Sementara',
          message: 'Fitur NGL sedang dinonaktifkan sementara oleh developer/admin. Kamu belum bisa mengirim pesan sampai fitur ini diaktifkan kembali.',
          confirmText: 'Oke, mengerti'
        });
      }
      wasActive = false;
    } else {
      unlockForm();
      if(!wasActive && !firstStatusCheck){
        window.showPopup({
          type: 'success',
          title: 'NGL Aktif Kembali',
          message: 'Fitur kirim pesan anonim sudah bisa dipakai lagi. Yuk titip pesan!',
          confirmText: 'Oke'
        });
      } else if(firstStatusCheck && !hasShownWelcome){
        hasShownWelcome = true;
        window.showPopup({
          type: 'info',
          title: 'Sebelum kamu kirim',
          message: 'Pesan yang masuk berpeluang disampaikan lewat Reels Instagram kami. Jangan lupa follow <b>@pancasandya.x5</b> ya!',
          confirmText: 'Siap, mengerti'
        });
      }
      wasActive = true;
    }
    firstStatusCheck = false;
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const kepadaValue = toSelect.value;
    const pesan = msgInput.value.trim();

    if(!kepadaValue || !pesan){
      window.showPopup({
        type: 'warning',
        title: 'Belum lengkap',
        message: 'Kolom "Kepada" dan "Pesan" wajib diisi sebelum mengirim.',
        confirmText: 'Oke'
      });
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Mengirim...';

    const senderName = nameInput.value.trim() || 'Anonim';
    const timestamp = serverTimestamp();
    const updates = {};
    const globalId = push(ref(db, 'ngl_messages')).key;

    if(kepadaValue === ALL_VALUE){
      updates[`ngl_messages/${globalId}`] = { nama: senderName, kepada: 'Semua Anggota', pesan, createdAt: timestamp };
      MEMBERS.forEach(m => {
        const inboxId = push(ref(db, 'member_inbox/' + m.slug)).key;
        updates[`member_inbox/${m.slug}/${inboxId}`] = { nama: senderName, pesan, createdAt: timestamp };
      });
    } else {
      const member = MEMBERS.find(m => m.slug === kepadaValue);
      const targetName = member ? member.name : kepadaValue;
      updates[`ngl_messages/${globalId}`] = { nama: senderName, kepada: targetName, pesan, createdAt: timestamp };
      if(member){
        const inboxId = push(ref(db, 'member_inbox/' + member.slug)).key;
        updates[`member_inbox/${member.slug}/${inboxId}`] = { nama: senderName, pesan, createdAt: timestamp };
      }
    }

    update(ref(db), updates).then(() => {
      form.reset();
      window.showPopup({
        type: 'success',
        title: 'Berhasil Terkirim!',
        message: 'Pesanmu sudah sampai ke Pancasandya. Terima kasih sudah berbagi cerita.',
        confirmText: 'Kirim lagi'
      });
    }).catch((err) => {
      console.error(err);
      window.showPopup({
        type: 'warning',
        title: 'Gagal terkirim',
        message: 'Terjadi kendala saat mengirim pesan. Coba periksa koneksi internetmu dan kirim ulang.',
        confirmText: 'Oke'
      });
    }).finally(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Kirim';
    });
  });
});
