// DOM-level tests for Lares. index.html is booted in jsdom; each test
// gets a fresh window and a fresh localStorage.
//
//   cd tests && npm install && npm test

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const HTML = readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const SW = readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
const KEY = 'lares:v1';

// Boot the page. `seed` pre-populates localStorage (values are JSON-encoded).
// All data here is made up (Charter: the repo never holds a real thing).
function boot({ seed = {}, confirmAnswer = true } = {}) {
  const dom = new JSDOM(HTML, {
    url: 'http://localhost/',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    beforeParse(window) {
      for (const [k, v] of Object.entries(seed)) window.localStorage.setItem(k, JSON.stringify(v));
      window.asked = [];
      window.confirm = m => { window.asked.push(m); return confirmAnswer; };
    },
  });
  const w = dom.window;
  const d = w.document;
  const space = name => [...d.querySelectorAll('.space')].find(e => e.querySelector('.space-name').textContent === name);
  return {
    w,
    $: s => d.querySelector(s),
    $$: s => [...d.querySelectorAll(s)],
    stored: () => { const r = w.localStorage.getItem(KEY); return r == null ? null : JSON.parse(r); },
    space,
    addSpace(name) { d.getElementById('field').value = name; d.getElementById('add').click(); },
    addThing(spaceName, name, kind) {
      const s = space(spaceName);
      s.querySelector('[data-f="new-thing"]').value = name;
      if (kind) s.querySelector('[data-f="new-kind"]').value = kind;
      s.querySelector('[data-act="add-thing"]').click();
    },
    thingsIn: spaceName => [...space(spaceName).querySelectorAll('.thing')].map(e => e.textContent),
    open(thingName) { [...d.querySelectorAll('[data-thing]')].find(r => r.querySelector('.thing').textContent === thingName).click(); },
  };
}

const SEED = {
  [KEY]: {
    spaces: [{ id: 's1', name: 'Hall' }, { id: 's2', name: 'Cellar' }],
    things: [
      { id: 't1', name: 'the boiler', kind: 'appliance', space: 's2' },
      { id: 't2', name: 'coat stand', kind: 'furniture', space: 's1' },
    ],
  },
};

test('a fresh page is empty and says so', () => {
  const { $ } = boot();
  assert.match($('#list').textContent, /No spaces yet/);
  assert.equal($('#count').textContent, '');
});

test('adding a space renders it and persists it', () => {
  const { $$, stored, addSpace } = boot();
  addSpace('Studio');
  addSpace('   ');
  assert.deepEqual($$('.space-name').map(e => e.textContent), ['Studio']);
  assert.equal(stored().spaces.length, 1);
});

test('a thing is added to its space with name and kind, several in a row', () => {
  const { stored, addSpace, addThing, thingsIn, $, w } = boot();
  addSpace('Studio');
  addThing('Studio', 'the kiln', 'appliance');
  addThing('Studio', 'workbench', 'furniture');
  assert.deepEqual(thingsIn('Studio'), ['Kiln', 'Workbench']);
  const [a, b] = stored().things;
  assert.equal(a.space, stored().spaces[0].id);
  assert.deepEqual([a.kind, b.kind], ['appliance', 'furniture']);
  assert.equal($('#count').textContent, '1 space · 2 things');
  // the cursor stays in the space's field for the next one
  assert.equal(w.document.activeElement.dataset.f, 'new-thing');
});

test('each space shows only its own things', () => {
  const { thingsIn } = boot({ seed: SEED });
  assert.deepEqual(thingsIn('Hall'), ['coat stand']);
  assert.deepEqual(thingsIn('Cellar'), ['the boiler']);
});

test("moving a thing to another space changes the thing's space", () => {
  const { $, open, thingsIn, stored } = boot({ seed: SEED });
  open('the boiler');
  $('.edit [data-f="space"]').value = 's1';
  $('.edit [data-f="name"]').value = 'the old boiler';
  $('.edit [data-act="save"]').click();
  assert.deepEqual(thingsIn('Hall').sort(), ['coat stand', 'the old boiler']);
  assert.deepEqual(thingsIn('Cellar'), []);
  assert.equal(stored().things.find(t => t.id === 't1').space, 's1');
});

test('deleting a thing asks first', () => {
  const kept = boot({ seed: SEED, confirmAnswer: false });
  kept.open('coat stand');
  kept.$('.edit [data-act="delete"]').click();
  assert.ok(kept.$('.edit'));   // the editor stays open
  assert.equal(kept.stored().things.length, 2);
  const gone = boot({ seed: SEED });
  gone.open('coat stand');
  gone.$('.edit [data-act="delete"]').click();
  assert.deepEqual(gone.thingsIn('Hall'), []);
  assert.equal(gone.stored().things.length, 1);
});

test('an empty space is removed without asking', () => {
  const t = boot({ seed: { [KEY]: { spaces: [{ id: 's9', name: 'Attic' }], things: [] } } });
  t.space('Attic').querySelector('[data-act="drop-space"]').click();
  assert.deepEqual(t.stored().spaces, []);
  assert.deepEqual(t.w.asked, []);
});

// N., 2026-11-03: a space with things in it must be deletable too.
test('a space with things is removed with them, after a confirm that names the count', () => {
  const kept = boot({ seed: SEED, confirmAnswer: false });
  kept.space('Hall').querySelector('[data-act="drop-space"]').click();
  assert.deepEqual(kept.w.asked, ['Delete Hall and its 1 thing?']);
  assert.deepEqual(kept.stored(), SEED[KEY]);   // declined: nothing changed
  assert.deepEqual(kept.thingsIn('Hall'), ['coat stand']);

  const gone = boot({ seed: SEED });
  gone.space('Hall').querySelector('[data-act="drop-space"]').click();
  assert.deepEqual(gone.$$('.space-name').map(e => e.textContent), ['Cellar']);
  assert.deepEqual(gone.stored().spaces.map(s => s.name), ['Cellar']);
  assert.deepEqual(gone.stored().things.map(t => t.name), ['the boiler']);
});

test('every space shows its remove button', () => {
  const { $$ } = boot({ seed: SEED });
  assert.equal($$('.space [data-act="drop-space"]').length, 2);
});

test('the page says a thing can be tapped, once there is one', () => {
  const empty = boot();
  empty.addSpace('Attic');
  assert.equal(empty.$('#hint').textContent, '');
  const { $ } = boot({ seed: SEED });
  assert.equal($('#hint').textContent, 'Tap a thing to rename, move or delete it.');
});

test('names are shown as text, never as markup', () => {
  const { addSpace, addThing, $$ } = boot();
  addSpace('<b>x</b>');
  addThing('<b>x</b>', '<img src=x>');
  assert.equal($$('.space b').length, 0);
  assert.equal($$('.space img').length, 0);
});

test('say a room: the space is made and each item is a thing with a guessed kind', () => {
  const { addSpace, thingsIn, stored, $ } = boot();
  addSpace('Kitchen has a dishwasher, a fridge and the coffee machine.');
  assert.deepEqual(thingsIn('Kitchen'), ['Dishwasher', 'Fridge', 'Coffee machine']);
  assert.deepEqual(stored().things.map(t => t.kind), ['appliance', 'appliance', 'appliance']);
  assert.equal($('#status').textContent, 'Added 3 things to Kitchen.');
});

test('say a room into a space that exists adds to it, whatever the case', () => {
  const { addSpace, thingsIn, $$ } = boot({ seed: SEED });
  addSpace('in the hall: an umbrella stand and a mirror');
  assert.deepEqual($$('.space-name').map(e => e.textContent), ['Hall', 'Cellar']);
  assert.deepEqual(thingsIn('Hall'), ['coat stand', 'Umbrella stand', 'Mirror']);
});

test('a room name alone is still just a space, and a new space gets a capital', () => {
  const { addSpace, $$, stored } = boot();
  addSpace('living room');
  assert.deepEqual($$('.space-name').map(e => e.textContent), ['Living room']);
  assert.equal(stored().things.length, 0);
});

test('a list in a space field adds every item; unknown words take the selected kind', () => {
  const { addSpace, addThing, thingsIn, stored, $ } = boot();
  addSpace('Studio');
  addThing('Studio', 'a sofa and a kiln', 'fixture');
  assert.deepEqual(thingsIn('Studio'), ['Sofa', 'Kiln']);
  assert.deepEqual(stored().things.map(t => t.kind), ['furniture', 'fixture']);
  assert.equal($('#status').textContent, 'Added 2 things to Studio.');
});

test('a whole room with unknown words files them as other', () => {
  const { addSpace, stored } = boot();
  addSpace('Garage: workbench and a lawnmower');
  assert.deepEqual(stored().things.map(t => [t.name, t.kind]), [['Workbench', 'other'], ['Lawnmower', 'other']]);
});

// Lares 7, after N.'s try (2026-11-03). Made-up makes only (Acme, Brandx).
test('a count makes one thing each, numbered', () => {
  const { addSpace, addThing, thingsIn } = boot();
  addSpace('Studio has a sofa and two armchairs');
  assert.deepEqual(thingsIn('Studio'), ['Sofa', 'Armchair 1', 'Armchair 2']);
  addThing('Studio', '3 Acme locks, 2 shelves and 2 benches');
  assert.deepEqual(thingsIn('Studio').slice(3),
    ['Acme lock 1', 'Acme lock 2', 'Acme lock 3', 'Shelf 1', 'Shelf 2', 'Bench 1', 'Bench 2']);
});

test('a big count stays one thing, as said', () => {
  const { addSpace, thingsIn } = boot();
  addSpace('Study has 40 books');
  assert.deepEqual(thingsIn('Study'), ['40 books']);
});

test('sentences split too, and a clause that only describes is skipped and named', () => {
  const { addSpace, thingsIn, $ } = boot();
  addSpace("Hall has 2 Acme, these are on the front. A Brandx lock. They're new");
  assert.deepEqual(thingsIn('Hall'), ['Acme 1', 'Acme 2', 'Brandx lock']);
  assert.equal($('#status').textContent,
    `Added 3 things to Hall. Skipped: "these are on the front", "They're new".`);
});

test('a skipped clause is named from a space field too', () => {
  const { addSpace, addThing, thingsIn, $ } = boot();
  addSpace('Hall');
  addThing('Hall', 'a Brandx lock, it is on the left');
  assert.deepEqual(thingsIn('Hall'), ['Brandx lock']);
  assert.equal($('#status').textContent, 'Added 1 thing to Hall. Skipped: "it is on the left".');
});

test('a count in front is not a room: nothing is added and the field says how', () => {
  for (const said of ['5 locks: 3 Acme and 2 Brandx', 'five locks', '4 chairs']) {
    const { addSpace, stored, $ } = boot();
    addSpace(said);
    assert.equal(stored(), null, said);
    assert.equal($('#status').textContent, 'Say a room first: "Hall has a lock".');
    assert.equal($('#field').value, said);
  }
});

test('lock words file as fixture', () => {
  const { addSpace, stored } = boot();
  addSpace('Garage has a keypad, a deadbolt and an Acme lock');
  assert.deepEqual(stored().things.map(t => t.kind), ['fixture', 'fixture', 'fixture']);
});

test("a space's kind picker starts on other", () => {
  const { addSpace, space } = boot();
  addSpace('Hall');
  assert.equal(space('Hall').querySelector('[data-f="new-kind"]').value, 'other');
});

test('the version marker matches the service-worker cache name', () => {
  const { $ } = boot();
  const cache = SW.match(/const CACHE = '([^']+)'/)[1];
  assert.equal($('.ver').textContent, cache);
});

// ---- Lares 3: the art collection, on the phone only ----
// Made-up works, built from the schema's field names (DESIGN_NOTE_house_twin.md);
// no real work, artist or price. Each work is a Crown-jewel record: no copy-out.
const ART_FILE = {
  schema_version: '9.9', generated: '2000-01-01', source: 'made up for tests',
  protection_tiers: { A: 'tier a', B: 'tier b', C: 'tier c' },
  works: [
    { id: 'w-001', title: 'Blue Study', artist: 'Ann Example', medium: 'etching',
      dimensions_cm: { plate: '10 x 12', sheet: '20 x 24' }, location: 'hall',
      acquisition: { date: '2000-01-02', price: { total: 1, currency: 'XXX' } } },
    { id: 'w-002', title: 'Grey Field', artist: 'Bo Sample', location: 'Storeroom' },
    { id: 'w-003', artist: 'Cy Fixture', exhibitions: ['Show One', 'Show Two'] },
  ],
};

async function importArt(t, obj) {
  const input = t.$('#art-file');
  const file = new t.w.File([typeof obj === 'string' ? obj : JSON.stringify(obj)], 'artworks.json', { type: 'application/json' });
  Object.defineProperty(input, 'files', { value: [file], configurable: true });
  input.dispatchEvent(new t.w.Event('change'));
  for (let i = 0; i < 50 && !/Imported|isn't/.test(t.$('#status').textContent); i++) await new Promise(r => setTimeout(r, 10));
}

test('importing the art file makes one art thing per work, placed by its location', async () => {
  const t = boot({ seed: SEED });
  await importArt(t, ART_FILE);
  assert.deepEqual(t.thingsIn('Hall'), ['coat stand', 'Blue Study']);
  assert.deepEqual(t.thingsIn('Art to place'), ['Grey Field', 'Untitled (Cy Fixture)']);
  const art = t.stored().things.filter(x => x.kind === 'art');
  assert.equal(art.length, 3);
  assert.equal(art[0].art.dimensions_cm.sheet, '20 x 24');   // every field kept
  assert.equal(t.$('#status').textContent, 'Imported 3 works: 3 new, 0 updated.');
});

test('importing again updates each work by its id, never duplicates it', async () => {
  const t = boot();
  await importArt(t, ART_FILE);
  t.$('#status').textContent = '';
  const changed = structuredClone(ART_FILE);
  changed.works[1].title = 'Grey Field II';
  await importArt(t, changed);
  assert.equal(t.stored().things.length, 3);
  assert.ok(t.stored().things.some(x => x.name === 'Grey Field II'));
  assert.equal(t.$('#status').textContent, 'Imported 3 works: 0 new, 3 updated.');
});

test('an import the phone cannot store says so instead of "Imported"', async () => {
  const t = boot();
  t.w.Storage.prototype.setItem = () => { throw new Error('quota'); };   // this window only
  await importArt(t, ART_FILE);
  for (let i = 0; i < 50 && !t.$('#status').textContent; i++) await new Promise(r => setTimeout(r, 10));
  assert.equal(t.$('#status').textContent, 'Not saved — this browser is blocking storage.');
});

test("a file that isn't an art list adds nothing and says so", async () => {
  for (const bad of ['not json', { spaces: [] }]) {
    const t = boot();
    await importArt(t, bad);
    assert.equal(t.stored(), null);
    assert.equal(t.$('#status').textContent, "That file isn't an art list (no works in it).");
  }
});

test("a work's fields show when it is opened, nested ones by their path", async () => {
  const t = boot();
  await importArt(t, ART_FILE);
  t.open('Blue Study');
  const rows = t.$$('.edit .fields div').map(e => e.textContent);
  assert.ok(rows.includes('Artist: Ann Example'));
  assert.ok(rows.includes('Dimensions cm · sheet: 20 x 24'));
  assert.ok(rows.includes('Acquisition · price · total: 1'));
  t.$('.edit [data-act="cancel"]').click();
  t.open('Untitled (Cy Fixture)');
  assert.ok(t.$$('.edit .fields div').map(e => e.textContent).includes('Exhibitions: Show One; Show Two'));
});

test('art has no copy-out: no export, share, clipboard, download or network call in the page', () => {
  const code = HTML.replace(/<!--[\s\S]*?-->/g, '');
  for (const door of ['download', 'navigator.share', 'clipboard', 'createObjectURL', 'fetch(', 'XMLHttpRequest', 'sendBeacon', 'WebSocket', 'window.open', 'mailto:'])
    assert.ok(!code.includes(door), `the page must not contain ${door}`);
});

// ---- Lares 2: what each thing needs, and what's due across the house ----
// Dates are relative to today, so the suite runs on any day. Made-up vendors.
const iso = offsetDays => {
  const x = new Date(); x.setDate(x.getDate() + offsetDays);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};
const NEEDS = () => ({
  [KEY]: {
    spaces: [{ id: 's1', name: 'Hall' }, { id: 's2', name: 'Cellar' }],
    things: [
      { id: 't1', name: 'Boiler', kind: 'appliance', space: 's2',
        needs: [{ id: 'n1', what: 'service', every: 52, unit: 'weeks', who: 'Acme Heating', last: iso(-400) }] },
      { id: 't2', name: 'Coat stand', kind: 'furniture', space: 's1' },
      { id: 't3', name: 'Fridge', kind: 'appliance', space: 's1',
        needs: [{ id: 'n3', what: 'clean coils', every: 4, unit: 'weeks', who: 'me', last: iso(-20) }] },
      { id: 't4', name: 'Dryer', kind: 'appliance', space: 's2',
        needs: [{ id: 'n4', what: 'clean vent', every: 1, unit: 'years', who: 'me', last: iso(-30) }] },
      { id: 't5', name: 'Lamp', kind: 'fixture', space: 's1',
        needs: [{ id: 'n5', what: 'bulb check', every: 3, unit: 'months', who: '' }] },
    ],
  },
});
const dueRows = t => t.$$('#due .due-row').map(r => [r.querySelector('.due-what').textContent, r.querySelector('.due-when').textContent]);

test("the due list shows what's never done, overdue or due within two weeks, soonest first", () => {
  const t = boot({ seed: NEEDS() });
  assert.deepEqual(dueRows(t), [
    ['Lamp · bulb check', 'never done'],
    ['Boiler · service', 'overdue 36 days'],
    ['Fridge · clean coils', 'due in 8 days'],
  ]);
  assert.match(t.$$('#due .due-row')[1].textContent, /Cellar/);
  assert.match(t.$$('#due .due-row')[1].textContent, /Acme Heating/);
});

// N., 2026-11-07: a need in months or years is due during its whole month and
// is overdue only from the next month on. Days and weeks keep their exact day.
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const firstOf = (monthsFromNow, yearsBack = 0) => {
  const x = new Date(); x.setDate(1); x.setMonth(x.getMonth() + monthsFromNow); x.setFullYear(x.getFullYear() - yearsBack);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-01`;
};
const monthName = monthsFromNow => {   // with its year when that isn't this year
  const x = new Date(); x.setDate(1); x.setMonth(x.getMonth() + monthsFromNow);
  return MONTH_NAMES[x.getMonth()] + (x.getFullYear() === new Date().getFullYear() ? '' : ' ' + x.getFullYear());
};
const yearly = (id, what, last) => ({ id, name: what, kind: 'other', space: 's1', needs: [{ id: 'n' + id, what: 'check', every: 1, unit: 'years', who: '', last }] });

test('a need in months or years is due during its whole month, and overdue only from the next month', () => {
  const t = boot({ seed: { [KEY]: { spaces: [{ id: 's1', name: 'Garden' }], things: [
    yearly('a', 'Due this month', firstOf(0, 1)),        // fell due on the 1st of this month: not overdue
    yearly('b', 'Due last month', firstOf(-1, 1)),       // its month is over: overdue
    yearly('c', 'Due in two months', firstOf(2, 1)),     // too far ahead to show
  ] } } });
  assert.deepEqual(dueRows(t), [
    ['Due last month · check', `overdue since ${monthName(-1)}`],
    ['Due this month · check', 'due this month'],
  ]);
});

test('nothing due, no due list', () => {
  const { $ } = boot({ seed: SEED });
  assert.equal($('#due').textContent, '');
});

test('Done marks a need done today and takes it off the due list', () => {
  const t = boot({ seed: NEEDS() });
  t.$$('#due .due-row')[1].querySelector('[data-act="need-done"]').click();
  assert.equal(t.stored().things[0].needs[0].last, iso(0));
  assert.deepEqual(dueRows(t).map(r => r[0]), ['Lamp · bulb check', 'Fridge · clean coils']);
});

test("a need is added in the thing's editor: what, how often, who", () => {
  const t = boot({ seed: NEEDS() });
  t.open('Coat stand');
  const ed = t.$('.edit');
  ed.querySelector('[data-f="need-what"]').value = 'tighten screws';
  ed.querySelector('[data-f="need-every"]').value = '6';
  ed.querySelector('[data-f="need-unit"]').value = 'months';
  ed.querySelector('[data-f="need-who"]').value = 'me';
  ed.querySelector('[data-act="need-add"]').click();
  const n = t.stored().things[1].needs[0];
  assert.deepEqual([n.what, n.every, n.unit, n.who, n.last], ['tighten screws', 6, 'months', 'me', undefined]);
  assert.ok(t.$('.edit'));   // the editor stays open
  assert.deepEqual(t.$$('.edit .need').map(e => e.querySelector('.need-text').textContent), ['tighten screws · every 6 months · me']);
  assert.ok(dueRows(t).some(r => r[0] === 'Coat stand · tighten screws'));
});

test('a need without a what, or without a whole number for how often, is not added', () => {
  const t = boot({ seed: NEEDS() });
  t.open('Coat stand');
  const ed = t.$('.edit');
  ed.querySelector('[data-f="need-every"]').value = '3';
  ed.querySelector('[data-act="need-add"]').click();
  ed.querySelector('[data-f="need-what"]').value = 'oil';
  ed.querySelector('[data-f="need-every"]').value = '0';
  t.$('.edit [data-act="need-add"]').click();
  assert.equal(t.stored().things[1].needs, undefined);   // neither was added
});

test('a need is removed from the editor', () => {
  const t = boot({ seed: NEEDS() });
  t.open('Boiler');
  t.$('.edit [data-act="need-drop"]').click();
  assert.deepEqual(t.stored().things[0].needs, []);
  assert.ok(!dueRows(t).some(r => r[0].startsWith('Boiler')));
});

test('repair facts are saved with the thing; the manual is a link only when it is a web address', () => {
  const t = boot({ seed: NEEDS() });
  t.open('Fridge');
  const ed = t.$('.edit');
  ed.querySelector('[data-f="repair-manual"]').value = 'https://example.com/fridge-manual.pdf';
  ed.querySelector('[data-f="repair-codes"]').value = 'E1: door open';
  ed.querySelector('[data-f="repair-parts"]').value = 'filter F-1';
  ed.querySelector('[data-f="repair-warranty"]').value = '2030-01-31';
  ed.querySelector('[data-act="save"]').click();
  assert.deepEqual(t.stored().things[2].repair,
    { manual: 'https://example.com/fridge-manual.pdf', codes: 'E1: door open', parts: 'filter F-1', warranty: '2030-01-31' });
  t.open('Fridge');
  assert.equal(t.$('.edit a.manual').getAttribute('href'), 'https://example.com/fridge-manual.pdf');
  t.$('.edit [data-f="repair-manual"]').value = 'javascript:alert(1)';
  t.$('.edit [data-act="save"]').click();
  t.open('Fridge');
  assert.equal(t.$('.edit a.manual'), null);
});

// ---- Lares 9: an import list (spaces → things → needs), pasted on the phone ----
// The list is drafted in a session (from Domus's "Export for agent", or from
// appliance manuals) and pasted here. Made-up rooms, things and vendors only.
function pasteImport(t, obj) {
  t.$('#import-text').value = typeof obj === 'string' ? obj : JSON.stringify(obj);
  t.$('#import-go').click();
}
const LIST = {
  lares_import: 1,
  spaces: [
    { name: 'hall', things: [
      { name: 'Coat stand', needs: [{ what: 'tighten screws', every: 12, unit: 'months', who: 'me' }] },
      { name: 'Doormat', kind: 'furniture', needs: [{ what: 'replace', every: 2, unit: 'years', who: 'me', last: '2025-05-01' }] },
    ] },
    { name: 'Utility room', things: [
      { name: 'Water softener', kind: 'appliance',
        needs: [{ what: 'add salt', every: 6, unit: 'weeks', who: 'Example Water Co' }],
        repair: { manual: 'https://example.com/softener.pdf', codes: 'E3: low salt' } },
    ] },
  ],
};

test('an import list adds spaces, things and needs, matching existing ones by name', () => {
  const t = boot({ seed: SEED });
  pasteImport(t, LIST);
  assert.deepEqual(t.$$('.space-name').map(e => e.textContent), ['Hall', 'Cellar', 'Utility room']);
  assert.deepEqual(t.thingsIn('Hall'), ['coat stand', 'Doormat']);   // the existing coat stand is reused
  const things = t.stored().things;
  const stand = things.find(x => x.id === 't2');
  assert.deepEqual(stand.needs.map(n => [n.what, n.every, n.unit, n.who]), [['tighten screws', 12, 'months', 'me']]);
  const doormat = things.find(x => x.name === 'Doormat');
  assert.equal(doormat.kind, 'furniture');
  assert.equal(doormat.needs[0].last, '2025-05-01');
  const softener = things.find(x => x.name === 'Water softener');
  assert.deepEqual(softener.repair, { manual: 'https://example.com/softener.pdf', codes: 'E3: low salt' });
  assert.equal(t.$('#status').textContent, 'Imported 3 needs (3 new, 0 updated) · 2 new things · 1 new space.');
  assert.equal(t.$('#import-text').value, '');   // the box is cleared once it is in
});

test('importing the same list again changes nothing and adds nothing', () => {
  const t = boot({ seed: SEED });
  pasteImport(t, LIST);
  const before = JSON.stringify(t.stored());
  pasteImport(t, LIST);
  const after = t.stored();
  assert.equal(after.things.length, JSON.parse(before).things.length);
  assert.equal(after.spaces.length, 3);
  assert.equal(t.$('#status').textContent, 'Imported 3 needs (0 new, 3 updated) · 0 new things · 0 new spaces.');
});

test('a need is matched by what it is: a second import updates how often and who, and keeps when it was done', () => {
  const t = boot({ seed: SEED });
  pasteImport(t, LIST);
  t.$$('#due .due-row').find(r => /tighten screws/.test(r.textContent)).querySelector('[data-act="need-done"]').click();
  const changed = structuredClone(LIST);
  changed.spaces[0].things[0].needs[0] = { what: 'Tighten Screws', every: 6, unit: 'months', who: 'Example Handyman' };
  pasteImport(t, changed);
  const n = t.stored().things.find(x => x.id === 't2').needs;
  assert.equal(n.length, 1);
  assert.deepEqual([n[0].every, n[0].who], [6, 'Example Handyman']);
  assert.ok(n[0].last);   // the Done from the phone stands
});

test('a need without a what or a whole-number how often is skipped and counted', () => {
  const t = boot();
  pasteImport(t, { lares_import: 1, spaces: [{ name: 'Attic', things: [{ name: 'Fan', needs: [
    { what: 'clean', every: 3, unit: 'months' },
    { what: '', every: 3, unit: 'months' },
    { what: 'oil', every: 0, unit: 'months' },
    { what: 'check', every: 2, unit: 'fortnights' },
    { what: 'dust', every: 1, unit: 'weeks', last: 'last spring' },
  ] }] }] });
  const needs = t.stored().things[0].needs;
  assert.deepEqual(needs.map(n => n.what), ['clean', 'dust']);
  assert.equal(needs[1].last, undefined);   // a date that isn't YYYY-MM-DD is dropped
  assert.equal(t.$('#status').textContent, 'Imported 2 needs (2 new, 0 updated) · 1 new thing · 1 new space. Skipped 3 needs (no what, or no whole-number how often in days, weeks, months or years).');
});

test("text that isn't an import list adds nothing and says so", () => {
  for (const bad of ['not json', '{"works": []}', '{"spaces": []}']) {
    const t = boot();
    pasteImport(t, bad);
    assert.equal(t.stored(), null, bad);
    assert.equal(t.$('#status').textContent, "That isn't an import list (no spaces in it).");
    assert.equal(t.$('#import-text').value, bad);   // kept, so it can be fixed
  }
});

test('an import never makes art and never touches an art record', async () => {
  const t = boot();
  await importArt(t, ART_FILE);
  const art = structuredClone(t.stored().things[0].art);
  pasteImport(t, { lares_import: 1, spaces: [{ name: 'Hall', things: [
    { name: 'Blue Study', needs: [{ what: 'check frame', every: 1, unit: 'years' }] },
    { name: 'New Print', kind: 'art' },
  ] }] });
  const things = t.stored().things;
  assert.deepEqual(things.find(x => x.name === 'Blue Study').art, art);
  assert.equal(things.find(x => x.name === 'New Print').kind, 'other');
});

// ---- Lares 11b: a proper app (N.'s choices in docs/DESIGN_11a.md: Hearth,
// compact, sans, Due first; three tabs; a page per space and per thing) ----
const view = t => t.w.document.body.dataset.view;
const tap = (t, sel) => t.$(sel).click();

test('it opens on Due, and the three tabs switch the view', () => {
  const t = boot({ seed: SEED });
  assert.equal(view(t), 'due');
  assert.deepEqual(t.$$('#tabs [data-tab]').map(b => b.textContent.trim()), ['Due', 'Spaces', 'Art']);
  tap(t, '[data-tab="spaces"]');
  assert.equal(view(t), 'spaces');
  assert.equal(t.$('#tabs [aria-current="page"]').dataset.tab, 'spaces');
  tap(t, '[data-tab="art"]');
  assert.equal(view(t), 'art');
});

test('Spaces shows a tile per space; a tile opens that space, a thing opens its page, back returns', () => {
  const t = boot({ seed: SEED });
  tap(t, '[data-tab="spaces"]');
  assert.deepEqual(t.$$('#tiles [data-tile]').map(e => e.querySelector('.tile-name').textContent), ['Hall', 'Cellar']);
  t.$$('#tiles [data-tile]')[1].click();
  assert.equal(view(t), 'space');
  assert.equal(t.$('#title').textContent, 'Cellar');
  assert.deepEqual(t.$$('.space.on .thing').map(e => e.textContent), ['the boiler']);
  t.open('the boiler');
  assert.equal(view(t), 'thing');
  assert.ok(t.$('#thing .edit'));
  tap(t, '#back');
  assert.equal(view(t), 'space');
  assert.equal(t.$('.edit'), null);   // leaving the page closes it
  tap(t, '#back');
  assert.equal(view(t), 'spaces');
});

test('saving or deleting a thing returns to where it was opened from', () => {
  const t = boot({ seed: SEED });
  tap(t, '[data-tab="spaces"]');
  t.$$('#tiles [data-tile]')[0].click();
  t.open('coat stand');
  t.$('.edit [data-act="save"]').click();
  assert.equal(view(t), 'space');
  t.open('coat stand');
  t.$('.edit [data-act="delete"]').click();
  assert.equal(view(t), 'space');
  assert.deepEqual(t.thingsIn('Hall'), []);
});

test('deleting the open space returns to Spaces', () => {
  const t = boot({ seed: SEED });
  tap(t, '[data-tab="spaces"]');
  t.$$('#tiles [data-tile]')[0].click();
  t.$('.space.on [data-act="drop-space"]').click();
  assert.equal(view(t), 'spaces');
  assert.deepEqual(t.$$('#tiles [data-tile]').map(e => e.querySelector('.tile-name').textContent), ['Cellar']);
});

test('search finds things and spaces by name as you type, and a result opens it', () => {
  const t = boot({ seed: NEEDS() });
  tap(t, '[data-tab="spaces"]');
  const s = t.$('#search');
  s.value = 'ER';
  s.dispatchEvent(new t.w.Event('input'));
  assert.deepEqual(t.$$('#results [data-thing] .thing').map(e => e.textContent), ['Boiler', 'Dryer']);
  assert.deepEqual(t.$$('#results [data-tile]'), []);
  s.value = 'cell';
  s.dispatchEvent(new t.w.Event('input'));
  assert.deepEqual(t.$$('#results [data-tile] .tile-name').map(e => e.textContent), ['Cellar']);
  s.value = 'boil';
  s.dispatchEvent(new t.w.Event('input'));
  t.$('#results [data-thing]').click();
  assert.equal(view(t), 'thing');
  s.value = '';
  s.dispatchEvent(new t.w.Event('input'));
  assert.equal(t.$('#results').textContent, '');
});

test('Due counts what is overdue on its tab, and shows a calm line when nothing is due', () => {
  const t = boot({ seed: NEEDS() });
  assert.equal(t.$('[data-tab="due"] .badge').textContent, '1');   // the boiler; never-done isn't overdue
  const calm = boot({ seed: SEED });
  assert.equal(calm.$('[data-tab="due"] .badge'), null);
  assert.equal(calm.$('#due').textContent, '');
  assert.match(calm.$('.v-due').textContent, /Nothing due/);
});

test('Done on a thing page marks that need done today', () => {
  const t = boot({ seed: NEEDS() });
  t.open('Boiler');
  t.$('.edit .need [data-act="need-done"]').click();
  assert.equal(t.stored().things[0].needs[0].last, iso(0));
  assert.ok(t.$('.edit'));   // the page stays open
});

test('Art lists the works by the space they are in, and a work opens its page', async () => {
  const t = boot({ seed: SEED });
  await importArt(t, ART_FILE);
  tap(t, '[data-tab="art"]');
  assert.deepEqual(t.$$('#art-list h2').map(e => e.textContent), ['Hall', 'Art to place']);
  assert.deepEqual(t.$$('#art-list .thing').map(e => e.textContent), ['Blue Study', 'Grey Field', 'Untitled (Cy Fixture)']);
  t.$('#art-list [data-thing]').click();
  assert.equal(view(t), 'thing');
  assert.ok(t.$$('.edit .fields div').length);
});

test('the + on Spaces opens the say-a-room sheet; the importers sit under More', () => {
  const t = boot();
  tap(t, '[data-tab="spaces"]');
  assert.equal(t.$('#fab').hidden, false);
  tap(t, '#fab');
  assert.equal(t.$('#add-sheet').hidden, false);
  t.addSpace('Kitchen has a kettle');
  assert.equal(t.$('#add-sheet').hidden, true);   // closes once it is added
  tap(t, '[data-tab="due"]');
  assert.equal(t.$('#fab').hidden, true);
  tap(t, '#more-btn');
  assert.equal(t.$('#more-sheet').hidden, false);
  assert.ok(t.$('#more-sheet #art-file') && t.$('#more-sheet #import-text') && t.$('#more-sheet .ver'));
});
