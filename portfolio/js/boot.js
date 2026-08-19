/* Runs before paint so reveal-on-scroll styles only apply when JS is present.
   Kept in its own blocking file so the Content-Security-Policy can forbid
   inline script entirely. */
document.documentElement.classList.add('js');
