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
