// Shared behaviour: mobile nav, generic demo forms (scroll motion lives in motion-kit/)

document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    var setNav = function (open) {
      nav.classList.toggle('open', open);
      toggle.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Menu');
    };
    toggle.addEventListener('click', function () { setNav(!nav.classList.contains('open')); });
    nav.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setNav(false); }); });
    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') setNav(false); });
    document.addEventListener('click', function (ev) {
      if (nav.classList.contains('open') && !nav.contains(ev.target) && !toggle.contains(ev.target)) setNav(false);
    });
  }

  // Brand films: play once, muted, when half on screen; pause off screen; rest on the end card.
  // Reduced motion (or no IntersectionObserver): leave the native controls and never autoplay.
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('[data-film]').forEach(function (box) {
    var v = box.querySelector('video'), ui = box.querySelector('.film-ui');
    var sound = box.querySelector('.film-sound'), replay = box.querySelector('.film-replay');
    if (!v || reduce || !('IntersectionObserver' in window)) return;
    v.removeAttribute('controls');
    ui.hidden = false;
    var played = false;
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && !played) { played = true; v.play().catch(function () { v.setAttribute('controls', ''); ui.hidden = true; }); }
        else if (!e.isIntersecting && !v.paused) { v.pause(); played = false; }
      });
    }, { threshold: 0.5 }).observe(v);
    box.ampPlayWithSound = function () {   // a visitor asked for it, so sound is allowed
      played = true; v.muted = false; sound.setAttribute('aria-pressed', 'true'); sound.textContent = 'Sound off';
      replay.hidden = true; v.currentTime = 0; v.play();
    };
    v.addEventListener('ended', function () { replay.hidden = false; });
    replay.addEventListener('click', function () { replay.hidden = true; v.currentTime = 0; v.play(); });
    sound.addEventListener('click', function () {
      v.muted = !v.muted;
      sound.setAttribute('aria-pressed', v.muted ? 'false' : 'true');
      sound.textContent = v.muted ? 'Sound on' : 'Sound off';
      if (!v.muted && (v.ended || v.paused)) { replay.hidden = true; if (v.ended) v.currentTime = 0; v.play(); }
    });
  });

  // "Watch the introduction" links: glide to the film and play it with sound
  document.querySelectorAll('[data-film-play]').forEach(function (a) {
    a.addEventListener('click', function (ev) {
      var target = document.querySelector(a.getAttribute('href'));
      var box = target && target.querySelector('[data-film]');
      if (!box) return;
      ev.preventDefault();
      box.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      if (box.ampPlayWithSound) box.ampPlayWithSound();
      else { var v = box.querySelector('video'); v.muted = false; v.currentTime = 0; v.play(); }
    });
  });

  // Demo forms: swap for a success note instead of submitting
  document.querySelectorAll('form[data-demo]').forEach(function (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var note = form.querySelector('.form-success');
      if (note) {
        note.style.display = 'block';
        note.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      form.querySelectorAll('input, select, textarea, button[type="submit"]').forEach(function (el) {
        el.disabled = true;
      });
    });
  });
});
