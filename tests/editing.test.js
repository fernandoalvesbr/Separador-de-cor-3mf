import test from 'node:test';
import assert from 'node:assert/strict';
import { Worker } from 'node:worker_threads';
import { cubeMesh } from '../src/demo.js';
import { bounds, meshHealth, splitMesh } from '../src/geometry.js';
import { solidColorParts, addGlueJoints } from '../src/assembly.js';
import { export3mf, import3mf } from '../src/three-mf.js';

const palette = ['#ff0000', '#00ff00', '#0000ff'];
function session(t) {
  const worker = new Worker(new URL('./helpers/worker-harness.js', import.meta.url));
  t.after(() => worker.terminate());
  const pending = new Map();
  let serial = 0;
  worker.on('message', (m) => {
    if (m.progress) return;
    const p = pending.get(m.id);
    pending.delete(m.id);
    if (m.error) p.reject(new Error(m.error));
    else p.resolve(m.result);
  });
  worker.on('error', (e) => {
    for (const p of pending.values()) p.reject(e);
    pending.clear();
  });
  return (action, data = {}) =>
    new Promise((resolve, reject) => {
      const id = ++serial;
      pending.set(id, { resolve, reject });
      worker.postMessage({ id, action, ...data });
    });
}
function model(size = 30) {
  const m = cubeMesh(size);
  m.health = meshHealth(m);
  return m;
}

test('line cut joints produce a closed peg and larger blind socket, preserving source', () => {
  const source = model(),
    saved = structuredClone(source);
  const plain = splitMesh(source, [0, 0, 1], 0);
  const { pieces, created } = addGlueJoints(plain);
  assert.equal(created, 1);
  assert.ok(pieces.every((p) => meshHealth(p).closed));
  const added = pieces[0].health.volume - plain[0].health.volume;
  const removed = plain[1].health.volume - pieces[1].health.volume;
  assert.ok(added > 0 && removed > added, 'Socket has glue clearance');
  assert.deepEqual(source, saved);
  assert.ok(import3mf(export3mf(pieces, palette)).pieces.every((p) => p.health.closed));
});

test('color volumes preserve volume and paint and receive matching joints', () => {
  const source = model(),
    parts = solidColorParts(source, palette);
  assert.equal(parts.length, 3);
  assert.equal(
    parts.reduce((s, p) => s + p.health.volume, 0),
    source.health.volume,
  );
  for (const p of parts) {
    assert.ok(p.health.closed);
    assert.ok(p.faces.every((f) => f.material === p.colorMaterial));
  }
  const joined = addGlueJoints(parts);
  assert.ok(joined.created >= 2);
  assert.ok(joined.pieces.every((p) => p.health.closed));
});

test('thin cut refuses connectors without modifying either half', () => {
  const parts = splitMesh(model(1), [0, 0, 1], 0),
    saved = structuredClone(parts);
  assert.throws(() => addGlueJoints(parts), /Sem espaço seguro/);
  assert.deepEqual(parts, saved);
});

test('import stays whole; rotation, multi-delete including all and undo preserve meshes', async (t) => {
  const rpc = session(t),
    mesh = model();
  mesh.vertices = mesh.vertices.map(([x, y, z]) => [x, y * 2, z * 3]);
  const initial = await rpc('import', { buffer: export3mf([mesh], palette), filename: 'box.3mf' });
  assert.equal(initial.pieces.length, 1);
  assert.equal(initial.undoCount, 0);
  const id = initial.pieces[0].id;
  const rotated = await rpc('rotate', { ids: [id], axis: 'z', angle: 90 });
  assert.deepEqual(bounds(rotated.pieces).size.map(Math.round), [60, 30, 90]);
  const moved = import3mf(
    await rpc('export', {
      ids: rotated.selectedIds,
      palette,
      positions: { [rotated.selectedId]: [100, 20, 5] },
    }),
  );
  assert.deepEqual(bounds(moved.pieces).center.map(Math.round), [100, 20, 5]);
  assert.deepEqual((await rpc('undo')).pieces, initial.pieces);
  const split = await rpc('cut', { pieceId: id, normal: [0, 0, 1], offset: 0, capMaterial: 1 });
  assert.equal(split.pieces.length, 2);
  const removed = await rpc('delete', { ids: split.pieces.map((p) => p.id) });
  assert.equal(removed.pieces.length, 0);
  assert.deepEqual((await rpc('undo')).pieces, split.pieces);
  await assert.rejects(
    rpc('rotate', { ids: [split.pieces[0].id], axis: 'q', angle: 90 }),
    /válidos/,
  );
});

test('optional joints apply only on request and color cuts can be undone', async (t) => {
  const rpc = session(t);
  const initial = await rpc('import', {
    buffer: export3mf([model()], palette),
    filename: 'color.3mf',
  });
  const plain = await rpc('cut', {
    pieceId: initial.pieces[0].id,
    normal: [0, 0, 1],
    offset: 0,
    capMaterial: 1,
  });
  assert.equal(plain.jointsCreated, 0);
  assert.equal(
    plain.pieces.reduce((s, p) => s + p.health.volume, 0),
    27000,
  );
  await rpc('undo');
  const joined = await rpc('splitColors', { ids: [initial.pieces[0].id], joints: true });
  assert.ok(joined.jointsCreated > 0);
  assert.ok(joined.pieces.every((p) => p.health.closed));
  assert.deepEqual((await rpc('undo')).pieces, initial.pieces);
});

test('multiple cut planes split every resulting part, remain closed and undo as one edit', async (t) => {
  const rpc = session(t);
  const initial = await rpc('import', {
    buffer: export3mf([model()], palette),
    filename: 'batch.3mf',
  });
  const cuts = [
    { normal: [1, 0, 0], offset: -5 },
    { normal: [1, 0, 0], offset: 5 },
    { normal: [0, 1, 0], offset: 0 },
    { normal: [0, 0, 1], offset: 0 },
  ];
  const result = await rpc('cut', { pieceId: initial.pieces[0].id, cuts, capMaterial: 1 });
  assert.equal(result.pieces.length, 12);
  assert.equal(result.cutsApplied, 4);
  assert.equal(result.undoCount, 1);
  assert.ok(result.pieces.every((p) => p.health.closed));
  assert.ok(Math.abs(result.pieces.reduce((sum, p) => sum + p.health.volume, 0) - 27000) < 1e-5);
  const again = await rpc('cut', {
    pieceId: result.selectedId,
    normal: [0, 0, 1],
    offset: 7,
    capMaterial: 1,
  });
  assert.equal(again.pieces.length, 13);
  assert.deepEqual((await rpc('undo')).pieces, result.pieces);
  assert.deepEqual((await rpc('undo')).pieces, initial.pieces);
});

test('batch skips duplicate and outside planes and leaves source intact when a later plane fails', async (t) => {
  const rpc = session(t);
  const initial = await rpc('import', {
    buffer: export3mf([model()], palette),
    filename: 'batch.3mf',
  });
  const plane = { normal: [0, 0, 1], offset: 0 };
  const result = await rpc('cut', {
    pieceId: initial.pieces[0].id,
    cuts: [plane, plane, { normal: [0, 0, 1], offset: 100 }],
    capMaterial: 1,
  });
  assert.equal(result.pieces.length, 2);
  assert.equal(result.cutsSkipped, 2);
  await rpc('undo');
  await assert.rejects(
    rpc('cut', {
      pieceId: initial.pieces[0].id,
      cuts: [plane, { normal: [0, 0, 0], offset: 0 }],
      capMaterial: 1,
    }),
    /inválido/,
  );
  const unchanged = import3mf(await rpc('export', { ids: [initial.pieces[0].id], palette }));
  assert.deepEqual(unchanged.pieces[0].vertices, initial.pieces[0].vertices);
});
