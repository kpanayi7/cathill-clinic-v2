/*! AMP motion kit v1.1.0 · AMP London Group
    Needs GSAP 3.15 core (SplitText and DrawSVGPlugin optional), loaded before this file.
    Labels: data-motion="rise|lines|draw|unveil|count|wash|steps|nudge", data-motion-stagger,
    data-motion-delay, data-from, data-draw-to, and data-motion-header on the site header.
    Idle cost is zero by design: triggers use IntersectionObserver (no scroll polling),
    nothing loops, and GSAP's ticker sleeps once the entrances have played.
    GSAP: standard "no charge" licence, https://gsap.com/standard-license */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var api = (window.AMPMotion = { version: '1.1.0', ready: false, init: init, refresh: function () {} });

  function all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function kids(el) { return Array.prototype.slice.call(el.children); }
  function num(el, attr, fallback) { var v = parseFloat(el.getAttribute(attr)); return isNaN(v) ? fallback : v; }

  // Entrance finished: hand the element back to its own CSS.
  function done(el, props) {
    el.classList.add('is-in');
    gsap.set(el, { clearProps: props || 'opacity,transform,clipPath' });
  }

  // ---------- triggers ----------
  // watch(els, line, fn): call fn(batch) once for elements whose top has crossed `line`
  // (a fraction of the viewport height, e.g. 0.88). Elements already on screen fire at
  // load; elements that can never reach the line (end of the page) fire when the page
  // bottom comes into view. Built on IntersectionObserver: no work while idle.
  var pending = [];
  function watch(els, line, fn) {
    if (!els.length) return;
    var left = els.slice();
    var io = new IntersectionObserver(function (entries) {
      var batch = [];
      entries.forEach(function (e) {
        if (e.isIntersecting && left.indexOf(e.target) > -1) { batch.push(e.target); left.splice(left.indexOf(e.target), 1); io.unobserve(e.target); }
      });
      if (batch.length) fn(batch);
      if (!left.length) io.disconnect();
    }, { rootMargin: '0px 0px -' + Math.round((1 - line) * 100) + '% 0px', threshold: 0 });
    els.forEach(function (el) { io.observe(el); });
    pending.push(function () { if (left.length) { var rest = left.splice(0); rest.forEach(function (el) { io.unobserve(el); }); io.disconnect(); fn(rest); } });
  }
  function pageEnd() {
    var marker = document.createElement('div');
    marker.setAttribute('aria-hidden', 'true');
    marker.style.cssText = 'height:1px;margin-top:-1px;pointer-events:none';
    document.body.appendChild(marker);
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { io.disconnect(); pending.splice(0).forEach(function (f) { f(); }); }
    });
    io.observe(marker);
  }

  // ---------- header shrink (runs even with reduced motion: it's layout, not animation) ----------
  function header() {
    var h = document.querySelector('[data-motion-header]');
    if (!h) return;
    var on = null;
    var update = function () {
      var s = window.scrollY > 24;
      if (s !== on) { on = s; h.classList.toggle('is-scrolled', s); }
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  // ---------- rise ----------
  function show(targets) {
    return gsap.to(targets, {
      opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', overwrite: true,
      stagger: { each: 0.08, onComplete: function () { done(this.targets()[0]); } }
    });
  }
  function rise() {
    watch(all('[data-motion="rise"]:not([data-motion-stagger])'), 0.88, show);
    all('[data-motion="rise"][data-motion-stagger]').forEach(function (group) {
      watch([group], 0.88, function () { group.classList.add('is-in'); show(kids(group)); });
    });
  }

  // ---------- unveil ----------
  function unveil() {
    all('[data-motion="unveil"]').forEach(function (el) {
      watch([el], 0.88, function () {
        if (el.hasAttribute('data-motion-stagger')) el.classList.add('is-in');
        gsap.fromTo(el.hasAttribute('data-motion-stagger') ? kids(el) : [el],
          { opacity: 0, y: 12, clipPath: 'inset(10% 4% 10% 4% round 16px)' },
          { opacity: 1, y: 0, clipPath: 'inset(0% 0% 0% 0% round 16px)', duration: 0.9, ease: 'power3.out', overwrite: true,
            stagger: { each: 0.12, onComplete: function () { done(this.targets()[0]); } } });
      });
    });
  }

  // ---------- lines (headings) ----------
  function lines() {
    all('[data-motion="lines"]').forEach(function (el) {
      if (!window.SplitText) { done(el); return; }
      SplitText.create(el, {
        type: 'lines', mask: 'lines', linesClass: 'amp-line', autoSplit: true,
        // autoSplit re-splits when a webfont arrives or the width changes. A re-split
        // after the entrance has started must not hide the fresh lines again.
        onSplit: function (self) {
          el._ampLines = self.lines;
          if (el._ampTween || el.classList.contains('is-in')) {
            if (el._ampTween) el._ampTween.kill();
            gsap.set(self.lines, { yPercent: 0 });
            done(el, 'opacity');
            return;
          }
          gsap.set(self.lines, { yPercent: 110 });
          gsap.set(el, { opacity: 1 });
        }
      });
      watch([el], 0.92, function () {
        if (!el._ampLines) { done(el, 'opacity'); return; }
        el._ampTween = gsap.to(el._ampLines, { yPercent: 0, duration: 0.9, stagger: 0.1, ease: 'expo.out', onComplete: function () { done(el, 'opacity'); } });
      });
    });
  }

  // ---------- draw (SVG strokes) ----------
  function draw() {
    var shapes = 'path,circle,line,polyline,polygon,rect,ellipse';
    all('[data-motion="draw"]').forEach(function (el) {
      if (!window.DrawSVGPlugin) { done(el); return; }
      var parts = el.matches(shapes) ? [el] : all(shapes, el);
      var to = el.getAttribute('data-draw-to') || '100%';
      gsap.set(parts, { drawSVG: '0% 0%' });
      gsap.set(el, { opacity: 1 });
      watch([el.ownerSVGElement || el], 0.88, function () {
        gsap.to(parts, {
          drawSVG: '0% ' + to, duration: el.matches(shapes) ? 1.3 : 1.5, ease: 'power2.inOut', stagger: 0.12,
          delay: num(el, 'data-motion-delay', 0),
          onComplete: function () { done(el, 'opacity'); }
        });
      });
    });
  }

  // ---------- count ----------
  function count() {
    all('[data-motion="count"]').forEach(function (el) {
      var final = el.textContent;
      var match = final.match(/[\d.,]+/);
      if (!match) return;
      var to = parseFloat(match[0].replace(/,/g, ''));
      var box = { v: num(el, 'data-from', 0) };
      var paint = function () { el.textContent = final.replace(match[0], String(Math.round(box.v))); };
      paint();
      watch([el], 0.88, function () {
        gsap.to(box, { v: to, duration: 1.4, ease: 'power2.out', onUpdate: paint,
          onComplete: function () { el.textContent = final; el.classList.add('is-in'); } });
      });
    });
  }

  // ---------- wash: one slow drift as the section arrives, then it rests ----------
  function wash() {
    var hosts = all('[data-motion="wash"]');
    hosts.forEach(function (el) {
      if (el.querySelector(':scope > .amp-wash')) return;
      var layer = document.createElement('div');
      layer.className = 'amp-wash';
      layer.setAttribute('aria-hidden', 'true');
      layer.appendChild(document.createElement('i'));
      layer.appendChild(document.createElement('i'));
      el.insertBefore(layer, el.firstChild);
    });
    watch(hosts, 0.95, function (batch) { batch.forEach(function (el) { el.classList.add('is-washing'); }); });
  }

  // ---------- steps ----------
  function steps() {
    all('[data-motion="steps"]').forEach(function (el) {
      var items = kids(el);
      if (window.innerWidth < 700) {
        items.forEach(function (i) { i.classList.add('is-lit'); });
        gsap.set(items, { opacity: 0, y: 16 });
        watch([el], 0.88, function () {
          gsap.to(items, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.08, clearProps: 'opacity,transform' });
        });
        return;
      }
      watch(items, 0.62, function (batch) { batch.forEach(function (item) { item.classList.add('is-lit'); }); });
    });
  }

  // ---------- nudge ----------
  function nudge() {
    all('[data-motion="nudge"]').forEach(function (el) {
      watch([el], 0.95, function () { gsap.delayedCall(num(el, 'data-motion-delay', 3.5), function () { el.classList.add('amp-nudge'); }); });
    });
  }

  function init() {
    if (api.ready) return;
    header();
    var gaveUp = root.hasAttribute('data-amp-gaveup');
    if (reduce || gaveUp || !window.gsap || !('IntersectionObserver' in window)) {
      root.classList.remove('amp-motion');
      api.ready = true;
      return;
    }
    var plugins = [window.SplitText, window.DrawSVGPlugin].filter(Boolean);
    if (plugins.length) gsap.registerPlugin.apply(gsap, plugins);
    root.classList.add('amp-motion');
    wash(); lines(); draw(); unveil(); rise(); count(); steps(); nudge();
    pageEnd();
    api.ready = true;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
