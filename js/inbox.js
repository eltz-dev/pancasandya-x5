/* =========================================================================
   inbox.js — render inbox NGL realtime + hapus 1 pesan / hapus semua.
   Dipakai bersama oleh admin.html dan developerpanca.html.
   ========================================================================= */

function initInboxUI(opts){
  const list = document.getElementById(opts.listId);
  const count = opts.countId ? document.getElementById(opts.countId) : null;
  const deleteAllBtn = opts.deleteAllId ? document.getElementById(opts.deleteAllId) : null;

  function escapeHtml(str){
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  db.ref('messages').on('value', (snapshot)=>{
    const data = snapshot.val();
    list.innerHTML = '';

    if(!data){
      list.innerHTML = '<div class="inbox-empty">Belum ada pesan NGL yang masuk.</div>';
      if(count) count.textContent = '0 pesan';
      return;
    }

    // urutkan terbaru di paling atas (menumpuk)
    const entries = Object.entries(data).sort((a, b)=>{
      return (b[1].timestamp || 0) - (a[1].timestamp || 0);
    });

    if(count) count.textContent = entries.length + ' pesan';

    entries.forEach(([key, msg])=>{
      const card = document.createElement('div');
      card.className = 'inbox-card';
      card.innerHTML = `
        <div class="inbox-card-top">
          <span class="inbox-to">Kepada: ${escapeHtml(msg.kepada || '-')}</span>
          <span class="inbox-time">${msg.timestamp ? formatDateTime(msg.timestamp) : ''}</span>
        </div>
        <p class="inbox-message">${escapeHtml(msg.pesan || '')}</p>
        <div class="inbox-card-bottom">
          <span class="inbox-from">Dari: ${escapeHtml(msg.nama || 'Anonim')}</span>
          <button type="button" class="inbox-delete" data-key="${key}">Hapus</button>
        </div>
      `;
      list.appendChild(card);
    });

    list.querySelectorAll('.inbox-delete').forEach((btn)=>{
      btn.addEventListener('click', ()=>{
        const key = btn.getAttribute('data-key');
        showModal({
          icon: '!',
          title: 'Hapus Pesan Ini?',
          message: 'Pesan ini akan terhapus permanen dari inbox.',
          buttons: [
            { label: 'Batal', primary: false },
            { label: 'Ya, Hapus', primary: true, onClick: ()=> db.ref('messages/' + key).remove() }
          ]
        });
      });
    });
  });

  if(deleteAllBtn){
    deleteAllBtn.addEventListener('click', ()=>{
      showModal({
        icon: '!',
        title: 'Hapus Semua Pesan?',
        message: 'Apakah kamu yakin ingin menghapus seluruh pesan NGL? Pesan akan terhapus selamanya.',
        buttons: [
          { label: 'Batal', primary: false },
          { label: 'Ya, Hapus', primary: true, onClick: ()=> db.ref('messages').remove() }
        ]
      });
    });
  }
}
