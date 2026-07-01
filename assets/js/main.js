/* tom-panos.com — interactivity (reveal, counters, chart bars, filters, search) */
(function () {
  function ready(fn){ document.readyState!=='loading' ? fn() : document.addEventListener('DOMContentLoaded', fn); }
  ready(function () {
    // Scroll reveal (+ chart bar growth for [data-grow] children)
    var reveal = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target, d = parseInt(el.getAttribute('data-reveal-delay') || '0', 10);
        setTimeout(function () {
          el.style.opacity = '1'; el.style.transform = 'none';
          el.querySelectorAll('[data-grow]').forEach(function (g) {
            g.style[g.getAttribute('data-axis')] = g.getAttribute('data-val');
          });
        }, d);
        reveal.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('[data-reveal]').forEach(function (el) { reveal.observe(el); });

    // Animated counters
    function animateCount(el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var dec = parseInt(el.getAttribute('data-dec') || '0', 10);
      var prefix = el.getAttribute('data-prefix') || '', suffix = el.getAttribute('data-suffix') || '';
      var dur = 1500, start = performance.now();
      function fmt(v){ return prefix + v.toLocaleString('en-US',{minimumFractionDigits:dec,maximumFractionDigits:dec}) + suffix; }
      function tick(now){ var p = Math.min(1,(now-start)/dur), eased = 1-Math.pow(1-p,3);
        el.textContent = fmt(target*eased); if (p<1) requestAnimationFrame(tick); }
      requestAnimationFrame(tick);
    }
    var counters = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { animateCount(e.target); counters.unobserve(e.target); } });
    }, { threshold: 0.5 });
    document.querySelectorAll('[data-count]').forEach(function (el) { counters.observe(el); });

    // Category filters (+ optional live search) — one per filter bar
    document.querySelectorAll('[data-filterbar]').forEach(function (bar) {
      var scope = bar.closest('section') || document;
      var btns = bar.querySelectorAll('[data-filter]');
      var cards = scope.querySelectorAll('[data-card]');
      var search = document.querySelector('[data-search]');
      var empty = scope.querySelector('[data-empty]') || document.querySelector('[data-empty]');
      var cat = 'All', q = '';
      function apply() {
        var visible = 0;
        cards.forEach(function (c) {
          var okCat = cat === 'All' || c.getAttribute('data-cat') === cat;
          var okQ = !q || (c.getAttribute('data-name') || '').indexOf(q) !== -1;
          var show = okCat && okQ;
          c.style.display = show ? 'flex' : 'none';
          if (show) { c.style.opacity = '1'; c.style.transform = 'none'; visible++; }
        });
        if (empty) empty.style.display = visible ? 'none' : 'block';
      }
      bar.addEventListener('click', function (ev) {
        var btn = ev.target.closest('[data-filter]'); if (!btn) return;
        cat = btn.getAttribute('data-filter');
        btns.forEach(function (b) {
          var on = b === btn;
          b.style.color = on ? '#0B0C10' : '#9BA3AD';
          b.style.background = on ? 'linear-gradient(135deg,#5C9BE8,#2E6BB0)' : 'rgba(255,255,255,.03)';
          b.style.borderColor = on ? 'transparent' : 'rgba(255,255,255,.12)';
        });
        apply();
      });
      if (search) search.addEventListener('input', function (ev) { q = ev.target.value.trim().toLowerCase(); apply(); });
    });
  });
})();
