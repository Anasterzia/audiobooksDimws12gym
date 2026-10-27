'use strict';
(() => {
  const app = document.getElementById('app');
  let data = { site: {}, books: [] };

  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    kids.flat().forEach((c) => { if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(String(c))); });
    return el;
  }
  const safeUrl = (u) => { try { const x = new URL(u, location.href); return /^https?:$/.test(x.protocol) ? x.href : null; } catch { return null; } };
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  function cover(b) {
    return h('div', { class: 'cover' }, b.cover
      ? h('img', { src: b.cover, alt: '', loading: 'lazy' })
      : h('div', { class: 'ph' }, (b.title || '?').trim().charAt(0).toUpperCase()));
  }

  function library() {
    app.replaceChildren();
    const grid = h('div', { class: 'grid' });
    const search = h('input', { type: 'search', class: 'search', placeholder: 'Αναζήτηση τίτλου, συγγραφέα, αναγνώστη…', 'aria-label': 'Αναζήτηση' });
    app.append(
      h('div', { class: 'hero' }, h('h1', {}, 'Τα βιβλία μας'), search),
      data.site.intro ? h('p', { class: 'intro' }, data.site.intro) : null,
      data.site.access_note ? h('div', { class: 'note' }, data.site.access_note) : null,
      grid);
    const draw = () => {
      const q = norm(search.value.trim());
      const list = data.books.filter((b) => !q || norm([b.title, b.author, b.description, (b.readers || []).join(' ')].join(' ')).includes(q));
      grid.replaceChildren();
      if (!list.length) { grid.className = ''; grid.append(h('div', { class: 'empty' }, q ? 'Δεν βρέθηκαν βιβλία.' : 'Δεν υπάρχουν ακόμη βιβλία.')); return; }
      grid.className = 'grid';
      list.forEach((b) => grid.append(h('a', { class: 'book', href: '#/book/' + encodeURIComponent(b.id) },
        cover(b), h('h3', {}, b.title), h('div', { class: 'meta' }, b.author || ''))));
    };
    search.addEventListener('input', draw);
    draw();
  }

  function bookPage(id) {
    app.replaceChildren();
    const b = data.books.find((x) => x.id === id);
    app.append(h('a', { class: 'back', href: '#/' }, '← Πίσω στα βιβλία'));
    if (!b) { app.append(h('p', { class: 'empty' }, 'Το βιβλίο δεν βρέθηκε.')); return; }
    const link = b.link ? safeUrl(b.link) : null;
    const hub = safeUrl(data.site.myfiles_url || 'https://myfiles.sch.gr/');
    app.append(
      h('div', { class: 'book-head' }, cover(b), h('div', {},
        h('h1', {}, b.title),
        b.author ? h('div', { class: 'meta' }, 'Συγγραφέας: ', h('b', {}, b.author)) : null,
        (b.readers || []).length ? [h('span', { class: 'lbl' }, 'Αναγνώστες'), b.readers.map((r) => h('span', { class: 'chip' }, r))] : null,
        b.description ? h('p', { class: 'desc' }, b.description) : null)),
      h('div', { class: 'card' },
        h('h3', {}, 'Πώς θα το ακούσετε'),
        h('p', {}, 'Τα αρχεία ήχου βρίσκονται στο myfiles του ΠΣΔ. Συνδεθείτε με τον λογαριασμό σας sch.gr και ανοίξτε:'),
        b.location ? h('div', { class: 'path' }, b.location) : null,
        h('div', {}, link ? h('a', { class: 'btn primary', href: link, target: '_blank', rel: 'noopener noreferrer' }, 'Άνοιγμα αρχείων') : null,
          hub ? h('a', { class: 'btn' + (link ? '' : ' primary'), href: hub, target: '_blank', rel: 'noopener noreferrer' }, 'Άνοιγμα myfiles.sch.gr') : null)),
      (b.tracks || []).length ? [h('h3', { style: 'margin-top:28px' }, 'Κεφάλαια'),
        h('ul', { class: 'tracks' }, b.tracks.map((t, i) => h('li', {}, h('span', { class: 'n' }, String(i + 1)), h('span', { class: 't' }, t.title),
          t.reader ? h('span', { class: 'r' }, 'Ανάγνωση: ' + t.reader) : null)))] : null);
    document.title = b.title + ' — ' + (data.site.title || 'Ηχητική Βιβλιοθήκη');
  }

  function route() {
    const r = location.hash.replace(/^#/, '') || '/';
    document.title = data.site.title || 'Ηχητική Βιβλιοθήκη';
    if (r.startsWith('/book/')) bookPage(decodeURIComponent(r.slice(6))); else library();
    window.scrollTo(0, 0);
  }

  fetch('books.json', { cache: 'no-cache' }).then((r) => r.json()).then((d) => {
    data = d;
    document.getElementById('brand').textContent = d.site.title || 'Ηχητική Βιβλιοθήκη';
    window.addEventListener('hashchange', route);
    route();
  }).catch(() => { app.replaceChildren(h('p', { class: 'empty' }, 'Δεν φορτώθηκε ο κατάλογος βιβλίων (books.json).')); });
})();
