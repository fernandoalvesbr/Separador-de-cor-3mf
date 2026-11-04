import test from 'node:test';
import assert from 'node:assert/strict';
import { splitMeshesByMaterial } from '../src/geometry.js';

test('automatically groups painted triangles into one piece per material', () => {
  const mesh = {
    vertices: [
      [0, 0, 0],
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ],
    faces: [
      { v: [0, 2, 1], material: 1 },
      { v: [0, 1, 3], material: 2 },
      { v: [1, 2, 3], material: 2 },
      { v: [2, 0, 3], material: 1 },
    ],
  };
  const pieces = splitMeshesByMaterial([mesh], ['#ff0000', '#00ff00']);
  assert.equal(pieces.length, 2);
  assert.deepEqual(
    pieces.map((piece) => piece.faces.length),
    [2, 2],
  );
  assert.deepEqual(
    pieces.map((piece) => piece.colorMaterial),
    [1, 2],
  );
  assert.match(pieces[0].name, /#FF0000/);
  assert.ok(pieces.every((piece) => piece.faces.every((face) => face.material === piece.colorMaterial)));
});
