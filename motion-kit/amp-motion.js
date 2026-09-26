/*! AMP motion kit v1.0.0 · AMP London Group
    Needs GSAP 3.15 + ScrollTrigger (SplitText and DrawSVGPlugin optional), loaded before this file.
    Labels: data-motion="rise|lines|draw|unveil|count|wash|steps|nudge", data-motion-stagger,
    data-motion-delay, data-from, data-draw-to, and data-motion-header on the site header.
    GSAP: standard "no charge" licence, https://gsap.com/standard-license */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Trigger when the element's top reaches `pct` of the viewport. Two edge cases matter:
  // content already on the first screen must fire at load (start may go below 0), and
  // content near the page end must still fire at max scroll (start capped just under it).
  // GSAP's clamp() handles the second but breaks the first (start pinned to 0 never "passes").
  function at(pct) {
    return function (self) {
      var el = self.trigger;
      var top = el.getBoundingClientRect().top + window.scrollY;
      var max = ScrollTrigger.maxScroll(window);
      return Math.min(top - window.innerHeight * pct, max - 2);
    };
  }
  var START = at(0.88);
  var api = (window.AMPMotion = { version: '1.0.0', ready: false, init: init, refresh: refresh });

  function all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function kids(el) { return Array.prototype.slice.call(el.children); }
  function targetsOf(el) { return el.hasAttribute('data-motion-stagger') ? kids(el) : [el]; }
  function num(el, attr, fallback) { var v = parseFloat(el.getAttribute(attr)); return isNaN(v) ? fallback : v; }
  function refresh() { if (window.ScrollTrigger) window.ScrollTrigger.refresh(); }

  // Entrance finished: hand the element back to its own CSS.
  function done(el, props) {
    el.classList.add('is-in');
    gsap.set(el, { clearProps: props || 'opacity,transform,clipPath' });
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
  function show(targets, from) {
    return gsap.to(targets, {
      opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', overwrite: true,
      stagger: { each: 0.08, onComplete: function () { done(this.targets()[0]); } }
    });
  }
  function rise() {
    var singles = all('[data-motion="rise"]:not([data-motion-stagger])');
    if (singles.length) {
      ScrollTrigger.batch(singles, { start: START, once: true, onEnter: function (batch) { show(batch); } });
    }
    all('[data-motion="rise"][data-motion-stagger]').forEach(function (group) {
      ScrollTrigger.create({ trigger: group, start: START, once: true, onEnter: function () { show(kids(group)); group.classList.add('is-in'); } });
    });
  }

  // ---------- unveil ----------
  function unveil() {
    all('[data-motion="unveil"]').forEach(function (el) {
      var t = targetsOf(el);
      ScrollTrigger.create({
        trigger: el, start: START, once: true,
        onEnter: function () {
          if (el.hasAttribute('data-motion-stagger')) el.classList.add('is-in');
          gsap.fromTo(t,
            { opacity: 0, y: 12, clipPath: 'inset(10% 4% 10% 4% round 16px)' },
            { opacity: 1, y: 0, clipPath: 'inset(0% 0% 0% 0% round 16px)', duration: 0.9, ease: 'power3.out', overwrite: true,
              stagger: { each: 0.12, onComplete: function () { done(this.targets()[0]); } } });
        }
      });
    });
  }

  // ---------- lines (headings) ----------
  function lines() {
    all('[data-motion="lines"]').forEach(function (el) {
      if (!window.SplitText) { done(el); return; }
      SplitText.create(el, {
        type: 'lines', mask: 'lines', linesClass: 'amp-line', autoSplit: true,
        onSplit: function (self) {
          if (el.classList.contains('is-in')) return; // re-split after resize: no replay
          gsap.set(el, { opacity: 1 });
          return gsap.from(self.lines, {
            yPercent: 110, duration: 0.9, stagger: 0.1, ease: 'expo.out',
            scrollTrigger: { trigger: el, start: at(0.92), once: true },
            onComplete: function () { done(el, 'opacity'); }
          });
        }
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
      gsap.to(parts, {
        drawSVG: '0% ' + to, duration: el.matches(shapes) ? 1.3 : 1.5, ease: 'power2.inOut', stagger: 0.12,
        delay: num(el, 'data-motion-delay', 0),
        scrollTrigger: { trigger: el.ownerSVGElement || el, start: START, once: true },
        onComplete: function () { done(el, 'opacity'); }
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
      var from = num(el, 'data-from', 0);
      var box = { v: from };
      var paint = function () { el.textContent = final.replace(match[0], String(Math.round(box.v))); };
      paint();
      gsap.to(box, {
        v: to, duration: 1.4, ease: 'power2.out', onUpdate: paint,
        scrollTrigger: { trigger: el, start: START, once: true },
        onComplete: function () { el.textContent = final; el.classList.add('is-in'); }
      });
    });
  }

  // ---------- wash ----------
  function wash() {
    all('[data-motion="wash"]').forEach(function (el) {
      if (el.querySelector(':scope > .amp-wash')) return;
      var layer = document.createElement('div');
      layer.className = 'amp-wash';
      layer.setAttribute('aria-hidden', 'true');
      layer.appendChild(document.createElement('i'));
      layer.appendChild(document.createElement('i'));
      el.insertBefore(layer, el.firstChild);
    });
  }

  // ---------- steps ----------
  function steps() {
    all('[data-motion="steps"]').forEach(function (el) {
      var items = kids(el);
      if (window.innerWidth < 700) {
        items.forEach(function (i) { i.classList.add('is-lit'); });
        gsap.from(items, { opacity: 0, y: 16, duration: 0.7, ease: 'power3.out', stagger: 0.08, clearProps: 'opacity,transform',
          scrollTrigger: { trigger: el, start: START, once: true } });
        return;
      }
      items.forEach(function (item) {
        ScrollTrigger.create({ trigger: item, start: at(0.62), once: true, onEnter: function () { item.classList.add('is-lit'); } });
      });
    });
  }

  // ---------- nudge ----------
  function nudge() {
    all('[data-motion="nudge"]').forEach(function (el) {
      ScrollTrigger.create({
        trigger: el, start: at(0.95), once: true,
        onEnter: function () { gsap.delayedCall(num(el, 'data-motion-delay', 3.5), function () { el.classList.add('amp-nudge'); }); }
      });
    });
  }

  function init() {
    if (api.ready) return;
    header();
    var gaveUp = root.hasAttribute('data-amp-gaveup');
    if (reduce || gaveUp || !window.gsap || !window.ScrollTrigger) {
      root.classList.remove('amp-motion');
      api.ready = true;
      return;
    }
    gsap.registerPlugin.apply(gsap, [window.ScrollTrigger, window.SplitText, window.DrawSVGPlugin].filter(Boolean));
    root.classList.add('amp-motion');
    wash(); lines(); draw(); unveil(); rise(); count(); steps(); nudge();
    api.ready = true;
    window.addEventListener('load', refresh);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
