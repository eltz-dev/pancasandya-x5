/* =========================================================================
   main.js — perilaku bersama di semua halaman Pancasandya:
   sidebar + animasi gerbang, reveal on load, typewriter, dan modal custom
   ========================================================================= */

/* ---------------- SIDEBAR ---------------- */
(function initSidebar(){
  const toggle   = document.getElementById('sidebarToggle');
  const sidebar  = document.getElementById('sidebar');
  const overlay  = document.getElementById('sidebarOverlay');
  const gate     = document.getElementById('sidebarGate');
  const nav      = document.getElementById('sidebarNav');
  const closeBtn = document.getElementById('sidebarClose');

  if(!toggle || !sidebar) return;

  let gateTimer = null;

  function openSidebar(){
    toggle.classList.add('is-active');
    sidebar.classList.add('is-open');
    overlay.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    sidebar.setAttribute('aria-hidden', 'false');

    // reset urutan animasi gerbang setiap dibuka
    gate.classList.remove('is-hidden');
    nav.classList.remove('is-visible');
    gate.querySelectorAll('img').forEach(img=>{
      img.style.animation = 'none';
      // force reflow supaya animasi blink restart
      void img.offsetWidth;
      img.style.animation = '';
    });

    clearTimeout(gateTimer);
    gateTimer = setTimeout(()=>{
      gate.classList.add('is-hidden');
      nav.classList.add('is-visible');
    }, 1500);
  }

  function closeSidebar(){
    toggle.classList.remove('is-active');
    sidebar.classList.remove('is-open');
    overlay.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    sidebar.setAttribute('aria-hidden', 'true');
    clearTimeout(gateTimer);
  }

  toggle.addEventListener('click', ()=>{
    sidebar.classList.contains('is-open') ? closeSidebar() : openSidebar();
  });
  overlay.addEventListener('click', closeSidebar);
  if(closeBtn) closeBtn.addEventListener('click', closeSidebar);

  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape') closeSidebar();
  });

  // tandai link aktif sesuai halaman saat ini
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  nav.querySelectorAll('a').forEach(a=>{
    if(a.getAttribute('href') === currentPage) a.classList.add('is-active');
  });
})();

/* ---------------- REVEAL ON LOAD / SCROLL ---------------- */
(function initReveal(){
  const items = document.querySelectorAll('.reveal');
  if(!items.length) return;

  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  items.forEach((el, i)=>{
    el.style.transitionDelay = (i * 0.12) + 's';
    io.observe(el);
  });
})();

/* ---------------- TYPEWRITER ---------------- */
function startTypewriter(elementId, phrases, opts){
  const el = document.getElementById(elementId);
  if(!el) return;

  const options = Object.assign({
    typeSpeed: 70,
    deleteSpeed: 40,
    pauseAfterType: 1400,
    pauseAfterDelete: 400
  }, opts || {});

  let lastIndex = -1;

  function pickPhrase(){
    if(phrases.length === 1) return phrases[0];
    let idx;
    do{ idx = Math.floor(Math.random() * phrases.length); } while(idx === lastIndex);
    lastIndex = idx;
    return phrases[idx];
  }

  function typeLoop(){
    const phrase = pickPhrase();
    let charIndex = 0;

    function typeChar(){
      el.textContent = phrase.slice(0, charIndex);
      charIndex++;
      if(charIndex <= phrase.length){
        const jitter = Math.random() * 40;
        setTimeout(typeChar, options.typeSpeed + jitter);
      } else {
        setTimeout(deleteChar, options.pauseAfterType);
      }
    }

    function deleteChar(){
      charIndex--;
      el.textContent = phrase.slice(0, charIndex);
      if(charIndex >= 0){
        setTimeout(deleteChar, options.deleteSpeed);
      } else {
        setTimeout(typeLoop, options.pauseAfterDelete);
      }
    }

    typeChar();
  }

  typeLoop();
}

/* ---------------- MODAL SYSTEM (pengganti alert/confirm) ---------------- */
function showModal(config){
  const cfg = Object.assign({
    icon: '✦',
    title: '',
    message: '',
    buttons: [{ label: 'Oke', primary: true }]
  }, config);

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');

  const box = document.createElement('div');
  box.className = 'modal-box';

  const icon = document.createElement('div');
  icon.className = 'modal-icon';
  icon.textContent = cfg.icon;

  const title = document.createElement('h3');
  title.textContent = cfg.title;

  const msg = document.createElement('p');
  msg.textContent = cfg.message;

  const actions = document.createElement('div');
  actions.className = 'modal-actions';

  function close(){
    overlay.classList.remove('is-open');
    setTimeout(()=> overlay.remove(), 300);
  }

  cfg.buttons.forEach(btnCfg=>{
    const btn = document.createElement('button');
    btn.className = 'btn ' + (btnCfg.primary ? 'btn-primary' : 'btn-ghost');
    btn.textContent = btnCfg.label;
    btn.addEventListener('click', ()=>{
      if(typeof btnCfg.onClick === 'function') btnCfg.onClick();
      close();
    });
    actions.appendChild(btn);
  });

  box.appendChild(icon);
  box.appendChild(title);
  box.appendChild(msg);
  box.appendChild(actions);
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  overlay.addEventListener('click', (e)=>{
    if(e.target === overlay && cfg.dismissible !== false) close();
  });

  requestAnimationFrame(()=> overlay.classList.add('is-open'));

  return { close };
}
