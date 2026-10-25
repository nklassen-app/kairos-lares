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
      window.confirm = () => confirmAnswer;
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
  assert.deepEqual(thingsIn('Studio'), ['kiln', 'workbench']);
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

test('only an empty space can be removed', () => {
  const { space, stored, $$ } = boot({ seed: SEED });
  assert.equal(space('Hall').querySelector('[data-act="drop-space"]'), null);
  const t = boot({ seed: { [KEY]: { spaces: [{ id: 's9', name: 'Attic' }], things: [] } } });
  t.space('Attic').querySelector('[data-act="drop-space"]').click();
  assert.deepEqual(t.stored().spaces, []);
  assert.equal($$('.space').length, 2);
  assert.equal(stored().spaces.length, 2);
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
  assert.deepEqual(thingsIn('Kitchen'), ['dishwasher', 'fridge', 'coffee machine']);
  assert.deepEqual(stored().things.map(t => t.kind), ['appliance', 'appliance', 'appliance']);
  assert.equal($('#status').textContent, 'Added 3 things to Kitchen.');
});

test('say a room into a space that exists adds to it, whatever the case', () => {
  const { addSpace, thingsIn, $$ } = boot({ seed: SEED });
  addSpace('in the hall: an umbrella stand and a mirror');
  assert.deepEqual($$('.space-name').map(e => e.textContent), ['Hall', 'Cellar']);
  assert.deepEqual(thingsIn('Hall'), ['coat stand', 'umbrella stand', 'mirror']);
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
  addThing('Studio', 'a sofa and two armchairs, a kiln', 'fixture');
  assert.deepEqual(thingsIn('Studio'), ['sofa', 'two armchairs', 'kiln']);
  assert.deepEqual(stored().things.map(t => t.kind), ['furniture', 'furniture', 'fixture']);
  assert.equal($('#status').textContent, 'Added 3 things to Studio.');
});

test('a whole room with unknown words files them as other', () => {
  const { addSpace, stored } = boot();
  addSpace('Garage: workbench and a lawnmower');
  assert.deepEqual(stored().things.map(t => [t.name, t.kind]), [['workbench', 'other'], ['lawnmower', 'other']]);
});

test('the version marker matches the service-worker cache name', () => {
  const { $ } = boot();
  const cache = SW.match(/const CACHE = '([^']+)'/)[1];
  assert.equal($('.ver').textContent, cache);
});
