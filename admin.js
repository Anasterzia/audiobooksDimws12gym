'use strict';
(() => {
  const view = document.getElementById('view');
  let data = { site: {}, books: [] };
  let dirty = false;

  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'value') el.value = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    kids.flat().forEach((c) => { if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(String(c))); });
    return el;
  }
  const slug = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9α-ω]+/gi, '-').replace(/^-|-$/g, '') || 'vivlio';

  function list() {
    view.replaceChildren();
    const tbody = h('tbody');
    data.books.forEach((b, i) => tbody.append(h('tr', {},
      h('td', {}, h('b', {}, b.title), h('div', { class: 'meta' }, b.author || '')),
      h('td', {}, (b.readers || []).join(', ') || '—'),
      h('td', {}, String((b.tracks || []).length)),
      h('td', { style: 'text-align:right;white-space:nowrap' },
        h('button', { class: 'btn small', onclick: () => form(i) }, 'Επεξεργασία'), ' ',
        h('button', { class: 'btn small danger', onclick: () => { if (confirm('Διαγραφή του «' + b.title + '»;')) { data.books.splice(i, 1); dirty = true; list(); } } }, 'Διαγραφή')))));
    view.append(data.books.length
      ? h('table', {}, h('thead', {}, h('tr', {}, ['Βιβλίο', 'Αναγνώστες', 'Κεφάλαια', ''].map((x) => h('th', {}, x)))), tbody)
      : h('p', { class: 'empty' }, 'Δεν υπάρχουν βιβλία. Πατήστε «Νέο βιβλίο».'));
  }

  function form(idx) {
    const isNew = idx == null;
    const b = isNew ? { id: '', title: '', author: '', description: '', readers: [], cover: '', location: '', link: '', date: new Date().toISOString().slice(0, 10), tracks: [] }
      : JSON.parse(JSON.stringify(data.books[idx]));
    const f = {
      title: h('input', { type: 'text', value: b.title }),
      author: h('input', { type: 'text', value: b.author || '' }),
      readers: h('input', { type: 'text', value: (b.readers || []).join(', '), placeholder: 'π.χ. Μαρία, Γιάννης, Ελένη' }),
      description: h('textarea', {}),
      cover: h('input', { type: 'text', value: b.cover || '', placeholder: 'covers/onoma-arxeiou.jpg' }),
      location: h('input', { type: 'text', value: b.location || '', placeholder: 'myfiles → shared → groups → … → Όνομα φακέλου' }),
      link: h('input', { type: 'text', value: b.link || '', placeholder: 'https://… (προαιρετικό)' }),
    };
    f.description.value = b.description || '';
    const tracks = (b.tracks || []).map((t) => ({ ...t }));
    const tbox = h('div');
    const drawT = () => {
      tbox.replaceChildren();
      tracks.forEach((t, i) => tbox.append(h('div', { class: 'trk' },
        h('input', { type: 'text', value: t.title, placeholder: 'Τίτλος κεφαλαίου', 'aria-label': 'Τίτλος κεφαλαίου', oninput: (e) => { t.title = e.target.value; } }),
        h('input', { type: 'text', value: t.reader || '', placeholder: 'Αναγνώστης', 'aria-label': 'Αναγνώστης', oninput: (e) => { t.reader = e.target.value; } }),
        h('button', { class: 'btn small danger', type: 'button', onclick: () => { tracks.splice(i, 1); drawT(); } }, '✕'))));
    };
    drawT();
    const err = h('div', { style: 'color:#b3261e;margin-top:10px', role: 'alert' });
    view.replaceChildren(h('form', { class: 'card', style: 'margin-top:0', onsubmit: (e) => {
      e.preventDefault();
      if (!f.title.value.trim()) { err.textContent = 'Ο τίτλος είναι υποχρεωτικός.'; return; }
      const out = {
        id: b.id || slug(f.title.value) + '-' + Date.now().toString(36).slice(-4),
        title: f.title.value.trim(), author: f.author.value.trim(), description: f.description.value.trim(),
        readers: f.readers.value.split(',').map((x) => x.trim()).filter(Boolean),
        cover: f.cover.value.trim(), location: f.location.value.trim(), link: f.link.value.trim(), date: b.date,
        tracks: tracks.filter((t) => t.title.trim()).map((t) => ({ title: t.title.trim(), reader: (t.reader || '').trim() })),
      };
      if (isNew) data.books.unshift(out); else data.books[idx] = out;
      dirty = true; list();
    } },
      h('h2', {}, isNew ? 'Νέο βιβλίο' : 'Επεξεργασία βιβλίου'),
      h('div', { class: 'form-grid' },
        h('div', {}, h('label', {}, 'Τίτλος *'), f.title),
        h('div', {}, h('label', {}, 'Συγγραφέας'), f.author),
        h('div', { class: 'full' }, h('label', {}, 'Παιδιά που έκαναν την ανάγνωση ', h('span', { class: 'hint' }, '(χωρισμένα με κόμμα)')), f.readers),
        h('div', { class: 'full' }, h('label', {}, 'Περιγραφή'), f.description),
        h('div', {}, h('label', {}, 'Εξώφυλλο ', h('span', { class: 'hint' }, '(διαδρομή του αρχείου μέσα στο site)')), f.cover),
        h('div', {}, h('label', {}, 'Σύνδεσμος ', h('span', { class: 'hint' }, '(αν υπάρχει)')), f.link),
        h('div', { class: 'full' }, h('label', {}, 'Πού βρίσκεται στο myfiles'), f.location)),
      h('label', {}, 'Κεφάλαια ', h('span', { class: 'hint' }, '(προαιρετικά, μόνο για ενημέρωση)')), tbox,
      h('button', { class: 'btn small', type: 'button', onclick: () => { tracks.push({ title: '', reader: '' }); drawT(); } }, '+ Κεφάλαιο'),
      h('div', { class: 'row', style: 'margin-top:20px' },
        h('button', { class: 'btn primary', type: 'submit' }, 'Αποθήκευση στη λίστα'),
        h('button', { class: 'btn', type: 'button', onclick: list }, 'Ακύρωση')), err));
  }

  document.getElementById('new').addEventListener('click', () => form(null));
  document.getElementById('dl').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = h('a', { href: URL.createObjectURL(blob), download: 'books.json' });
    document.body.append(a); a.click(); a.remove(); dirty = false;
  });
  document.getElementById('open').addEventListener('change', (e) => {
    const file = e.target.files[0]; if (!file) return;
    file.text().then((t) => { const d = JSON.parse(t); if (!d.books) throw 0; data = d; dirty = false; list(); }).catch(() => alert('Μη έγκυρο books.json'));
  });
  window.addEventListener('beforeunload', (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  fetch('books.json', { cache: 'no-cache' }).then((r) => r.json()).then((d) => { data = d; list(); }).catch(() => list());
})();
