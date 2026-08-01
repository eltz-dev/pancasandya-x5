/* =========================================================
   PANCASANDYA — utilitas bersama (sidebar, reveal, typewriter, modal)
   ========================================================= */

const REDUCE_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------------------------------------------------
   SIDEBAR
   --------------------------------------------------------- */
function initSidebar(){
  const btn = document.querySelector('[data-menu-btn]');
  const sidebar = document.querySelector('[data-sidebar]');
  const backdrop = document.querySelector('[data-sidebar-backdrop]');
  const flashImg = document.querySelector('[data-sidebar-flash]');
  if(!btn || !sidebar || !backdrop) return;

  let hasFlashed = false;

  function openSidebar(){
    sidebar.classList.add('is-open');
    sidebar.setAttribute('aria-hidden', 'false');
    backdrop.classList.add('is-visible');
    btn.classList.add('is-open');
    btn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';

    if(flashImg && !hasFlashed){
      hasFlashed = true;
      if(REDUCE_MOTION){
        flashImg.classList.add('is-gone');
      } else {
        flashImg.classList.add('is-flashing');
        setTimeout(() => flashImg.classList.add('is-gone'), 1550);
      }
    }
  }

  function closeSidebar(){
    sidebar.classList.remove('is-open');
    sidebar.setAttribute('aria-hidden', 'true');
    backdrop.classList.remove('is-visible');
    btn.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  btn.addEventListener('click', () => {
    sidebar.classList.contains('is-open') ? closeSidebar() : openSidebar();
  });
  backdrop.addEventListener('click', closeSidebar);
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape') closeSidebar();
  });
}

/* ---------------------------------------------------------
   REVEAL ON LOAD / SCROLL
   --------------------------------------------------------- */
function initReveal(){
  const els = document.querySelectorAll('.reveal, .class-photo-frame, .desc-card');
  if(REDUCE_MOTION){
    els.forEach(el => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px 120px 0px' });
  els.forEach(el => io.observe(el));

  // Jaring pengaman: kalau ada elemen yang masih belum "is-in" setelah 1.8 detik
  // (misalnya jauh di bawah layar dan belum sempat di-scroll), tetap tampilkan.
  // Elemen di dalam panel yang sengaja disembunyikan (mis. panel developer/member
  // sebelum login) tidak ikut dipaksa tampil.
  setTimeout(() => {
    els.forEach(el => {
      if(el.classList.contains('is-in')) return;
      if(el.closest('[data-dev-panel]') || el.closest('[data-member-panel]')) return;
      const hiddenParent = el.closest('[style*="display: none"], [style*="display:none"]');
      if(hiddenParent) return;
      el.classList.add('is-in');
      io.unobserve(el);
    });
  }, 1800);
}

/* ---------------------------------------------------------
   TYPEWRITER — mengetik & menghapus kata secara acak & berulang
   --------------------------------------------------------- */
function initTypewriter(){
  const nodes = document.querySelectorAll('[data-typewriter]');
  nodes.forEach(node => {
    let words;
    try{
      words = JSON.parse(node.getAttribute('data-typewriter'));
    } catch(e){ return; }
    if(!Array.isArray(words) || words.length === 0) return;

    const textSpan = document.createElement('span');
    textSpan.className = 'tw-text';
    const cursor = document.createElement('span');
    cursor.className = 'cursor';
    cursor.textContent = '\u00A0';
    node.textContent = '';
    node.appendChild(textSpan);
    node.appendChild(cursor);

    if(REDUCE_MOTION){
      textSpan.textContent = words[0];
      return;
    }

    let lastIndex = -1;
    const TYPE_SPEED = 85;
    const DELETE_SPEED = 45;
    const HOLD_TIME = 1400;
    const GAP_TIME = 350;

    function pickWord(){
      if(words.length === 1) return words[0];
      let idx;
      do { idx = Math.floor(Math.random() * words.length); } while(idx === lastIndex);
      lastIndex = idx;
      return words[idx];
    }

    function typeLoop(){
      const word = pickWord();
      let i = 0;
      (function typeChar(){
        textSpan.textContent = word.slice(0, i);
        i++;
        if(i <= word.length){
          setTimeout(typeChar, TYPE_SPEED);
        } else {
          setTimeout(deleteChar, HOLD_TIME);
        }
      })();

      function deleteChar(){
        if(i > 0){
          i--;
          textSpan.textContent = word.slice(0, i);
          setTimeout(deleteChar, DELETE_SPEED);
        } else {
          setTimeout(typeLoop, GAP_TIME);
        }
      }
    }
    typeLoop();
  });
}

/* ---------------------------------------------------------
   MODAL / POPUP KUSTOM (pengganti window.alert & confirm)
   --------------------------------------------------------- */
const ICONS = {
  success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 16v-5"/><path d="M12 8h.01"/></svg>',
  warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 17h.01"/></svg>'
};

function showPopup({ type = 'info', title, message, confirmText = 'Oke', cancelText = null, onConfirm = null } = {}){
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal-box" role="dialog" aria-modal="true">
      <div class="modal-icon ${type === 'warning' ? 'is-danger' : ''}">${ICONS[type] || ICONS.info}</div>
      <h3>${title}</h3>
      <p>${message}</p>
      <div class="modal-actions">
        ${cancelText ? `<button class="btn btn-ghost" data-cancel>${cancelText}</button>` : ''}
        <button class="btn btn-primary" data-confirm>${confirmText}</button>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);
  document.body.style.overflow = 'hidden';

  requestAnimationFrame(() => backdrop.classList.add('is-visible'));

  function close(){
    backdrop.classList.remove('is-visible');
    document.body.style.overflow = '';
    setTimeout(() => backdrop.remove(), 350);
  }

  backdrop.querySelector('[data-confirm]').addEventListener('click', () => {
    close();
    if(onConfirm) onConfirm();
  });
  const cancelBtn = backdrop.querySelector('[data-cancel]');
  if(cancelBtn) cancelBtn.addEventListener('click', close);

  backdrop.addEventListener('click', (e) => {
    if(e.target === backdrop) close();
  });

  return { close };
}
window.showPopup = showPopup;

/* ---------------------------------------------------------
   Aktifkan link sidebar sesuai halaman aktif
   --------------------------------------------------------- */
function markActiveNav(){
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.sidebar-nav a').forEach(a => {
    const href = a.getAttribute('href');
    if(href === path) a.classList.add('is-active');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  initReveal();
  initTypewriter();
  markActiveNav();
});
