/* ==========================================================================
   Portfolio behaviour. Progressive enhancement only — every word on the page
   is in the HTML, so nothing here is required to read the site.
   ========================================================================== */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- current year in the footer ------------------------------------- */
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* --- reveal on scroll ------------------------------------------------ */
  var revealables = document.querySelectorAll('.reveal');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealables.forEach(function (el) { el.classList.add('in'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    revealables.forEach(function (el) { revealObserver.observe(el); });
  }

  /* --- stat counters ---------------------------------------------------
     The final number is already the element's text, so a browser without
     IntersectionObserver simply shows it.                                */
  var counters = document.querySelectorAll('[data-count]');

  if (!reduceMotion && 'IntersectionObserver' in window) {
    var countObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        countUp(entry.target);
        countObserver.unobserve(entry.target);
      });
    }, { threshold: 0.6 });

    counters.forEach(function (el) { countObserver.observe(el); });
  }

  function countUp(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    if (!isFinite(target)) return;

    var duration = 900;
    var started = null;

    function step(now) {
      if (started === null) started = now;
      var progress = Math.min((now - started) / duration, 1);
      // ease-out cubic: fast first, settles on the number
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = String(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = String(target);
    }

    requestAnimationFrame(step);
  }

  /* --- hero terminal typing -------------------------------------------
     Each `.line` is already written out in the HTML. We hide them, then
     replay them: command lines are typed a character at a time, output
     lines appear whole, the way a real shell behaves.                    */
  var term = document.getElementById('hero-term');

  if (term && !reduceMotion) {
    var lines = Array.prototype.slice.call(term.querySelectorAll('.line'));
    var originals = lines.map(function (line) { return line.innerHTML; });

    lines.forEach(function (line) { line.style.visibility = 'hidden'; });

    var index = 0;

    function playLine() {
      if (index >= lines.length) return;

      var line = lines[index];
      var cmd = line.querySelector('.cmdtext');
      line.style.visibility = 'visible';

      if (!cmd) {
        index += 1;
        setTimeout(playLine, 190);
        return;
      }

      var text = cmd.textContent;
      cmd.textContent = '';
      var char = 0;

      (function type() {
        if (char <= text.length) {
          cmd.textContent = text.slice(0, char);
          char += 1;
          setTimeout(type, 34);
          return;
        }
        index += 1;
        setTimeout(playLine, 240);
      })();
    }

    // Restore everything if the tab is hidden mid-animation, so nobody comes
    // back to a half-typed prompt.
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden || index >= lines.length) return;
      lines.forEach(function (line, i) {
        line.innerHTML = originals[i];
        line.style.visibility = 'visible';
      });
      index = lines.length;
    });

    setTimeout(playLine, 260);
  }

  /* --- résumé: print / save as PDF -------------------------------------- */
  var printBtn = document.getElementById('print-cv');
  if (printBtn) {
    printBtn.addEventListener('click', function () { window.print(); });
  }

  /* --- highlight the section you are reading --------------------------- */
  // Sub-pages link back with "../index.html#about", which is not a selector —
  // only same-page hashes describe a section on this page.
  var navLinks = Array.prototype.slice.call(
    document.querySelectorAll('.nav-links a[href^="#"]')
  );
  var sections = navLinks
    .map(function (link) { return document.getElementById(link.getAttribute('href').slice(1)); })
    .filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (link) {
          var active = link.getAttribute('href') === '#' + entry.target.id;
          if (active) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach(function (section) { navObserver.observe(section); });
  }
})();
