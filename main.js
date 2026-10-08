// Baki Agrocentrum — progresszív kiegészítések. JS nélkül is minden tartalom elérhető.
(() => {
  'use strict';

  // --- fejléc árnyék görgetéskor ---
  const hdr = document.getElementById('hdr');
  const onScroll = () => hdr && hdr.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // --- mobilmenü ---
  const btn = document.querySelector('[data-menu]');
  const nav = document.getElementById('nav');
  if (btn && nav) {
    const label = btn.querySelector('span');
    // görgetészár: a body rögzítése (iOS Safari-n az overflow:hidden önmagában nem elég)
    let lockY = 0;
    const lock = (on) => {
      const b = document.body;
      if (on === b.classList.contains('menu-open')) return;
      if (on) { lockY = window.scrollY; b.style.top = `-${lockY}px`; b.classList.add('menu-open'); }
      else {
        b.classList.remove('menu-open'); b.style.top = '';
        document.documentElement.style.scrollBehavior = 'auto';
        window.scrollTo(0, lockY);
        document.documentElement.style.scrollBehavior = '';
      }
    };
    const setOpen = (open, returnFocus) => {
      nav.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
      lock(open);
      if (label) label.textContent = open ? 'Bezárás' : 'Menü';
      if (open) { const first = nav.querySelector('a'); if (first) first.focus(); }
      else if (returnFocus) btn.focus();
    };
    btn.addEventListener('click', () => setOpen(btn.getAttribute('aria-expanded') !== 'true'));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) setOpen(false, true);
      // fókusz a megnyitott menüben marad (gomb + menüpontok)
      if (e.key === 'Tab' && nav.classList.contains('is-open')) {
        const items = [btn, ...nav.querySelectorAll('a')];
        const i = items.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); items[items.length - 1].focus(); }
        else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus(); }
      }
    });
    nav.addEventListener('click', (e) => { if (e.target.closest('a') && nav.classList.contains('is-open')) setOpen(false); });
    window.addEventListener('pageshow', () => setOpen(false)); // vissza gombnál (bfcache) se maradjon nyitva
    matchMedia('(min-width: 900px)').addEventListener('change', (m) => { if (m.matches) setOpen(false); });
  }

  // --- megjelenés görgetéskor ---
  const rv = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    rv.forEach((el) => io.observe(el));
  } else rv.forEach((el) => el.classList.add('is-in'));

  // --- fajtaszűrő ---
  const seg = document.querySelector('[data-filter]');
  if (seg) {
    const rows = document.querySelectorAll('.vt tbody tr');
    seg.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      seg.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      const c = b.dataset.crop;
      rows.forEach((r) => { r.hidden = !!c && r.dataset.crop !== c; });
    });
  }

  // --- kapcsolati űrlap ---
  // Integrációs határ: ha a form data-endpoint attribútuma ki van töltve, JSON POST megy oda, és csak
  // 2xx válasz esetén jelzünk sikert. Üresen a felhasználó levelezőprogramja nyílik meg (mailto).
  const form = document.querySelector('[data-form]');
  if (form) {
    const status = form.querySelector('[data-status]');
    const q = new URLSearchParams(location.search).get('targy');
    if (q && form.elements.subject.querySelector(`option[value="${CSS.escape(q)}"]`)) form.elements.subject.value = q;

    const rules = {
      name: (v) => (v.trim().length < 2 ? 'Kérjük, adja meg a nevét.' : ''),
      email: (v) => (!v.trim() ? 'Kérjük, adja meg az e-mail-címét.'
        : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? 'Az e-mail-cím formátuma nem megfelelő (például nev@pelda.hu).' : ''),
      phone: (v) => (v.trim() && !/^[+\d][\d\s()/-]{5,}$/.test(v.trim()) ? 'A telefonszám csak számjegyeket, szóközt és + ( ) / - jeleket tartalmazhat.' : ''),
      message: (v) => (v.trim().length < 10 ? 'Kérjük, írjon legalább 10 karakteres üzenetet.' : ''),
      consent: (_, el) => (!el.checked ? 'A továbblépéshez kérjük, jelölje be, hogy elolvasta az adatvédelmi tájékoztatót.' : ''),
    };
    const check = (name) => {
      const el = form.elements[name];
      const msg = rules[name](el.value, el);
      const err = document.getElementById('e-' + (name === 'message' ? 'msg' : name));
      el.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (err) { err.textContent = msg; err.hidden = !msg; }
      return !msg;
    };
    Object.keys(rules).forEach((n) => {
      const el = form.elements[n];
      el.addEventListener(el.type === 'checkbox' ? 'change' : 'blur', () => { if (el.getAttribute('aria-invalid')) check(n); });
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      status.className = 'form__status'; status.textContent = '';
      const bad = Object.keys(rules).filter((n) => !check(n));
      if (bad.length) {
        status.classList.add('is-error');
        status.textContent = bad.length === 1 ? 'Egy mezőt javítani kell.' : `${bad.length} mezőt javítani kell.`;
        form.elements[bad[0]].focus();
        return;
      }
      const subjectLabel = form.elements.subject.options[form.elements.subject.selectedIndex].text;
      const data = { name: form.elements.name.value.trim(), email: form.elements.email.value.trim(), phone: form.elements.phone.value.trim(), subject: subjectLabel, message: form.elements.message.value.trim() };

      const endpoint = form.dataset.endpoint;
      if (endpoint) {
        const b = form.querySelector('button[type=submit]');
        b.disabled = true;
        try {
          const r = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
          if (!r.ok) throw new Error(String(r.status));
          status.textContent = 'Köszönjük, üzenetét megkaptuk.';
          form.reset();
        } catch {
          status.classList.add('is-error');
          status.textContent = 'Az üzenetet most nem sikerült elküldeni. Kérjük, írjon a(z) ' + form.dataset.mailto + ' címre, vagy hívjon minket.';
        } finally { b.disabled = false; }
        return;
      }

      const body = `${data.message}\n\n--\n${data.name}\n${data.email}${data.phone ? '\n' + data.phone : ''}`;
      const href = `mailto:${form.dataset.mailto}?subject=${encodeURIComponent('Weboldal – ' + subjectLabel)}&body=${encodeURIComponent(body)}`;
      window.location.href = href;
      status.textContent = 'Megnyitottuk az üzenetet a levelezőprogramjában. Az üzenet akkor megy el, ha ott az Elküldés gombra kattint.';
    });
  }
})();
