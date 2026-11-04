import { import3mf, export3mfResult } from './three-mf.js';
import { splitMesh, splitMeshesByMaterial } from './geometry.js';
import { demoProject } from './demo.js';

let project = null,
  pieces = [],
  history = [],
  serial = 0;
function snapshot() {
  return { ...project, pieces, undoCount: history.length };
}
onmessage = ({ data }) => {
  const { id, action } = data;
  try {
    let result;
    if (action === 'restore') {
      project = data.project;
      pieces = project.pieces;
      history = [];
      serial = Math.max(...pieces.map((p) => p.id));
      result = snapshot();
    } else if (action === 'import' || action === 'demo') {
      const next =
        action === 'demo'
          ? demoProject()
          : import3mf(data.buffer, data.filename, (message) =>
              postMessage({ id, progress: message }),
            );
      project = next;
      pieces = next.pieces.map((p) => ({ ...p, id: ++serial }));
      history = [];
      result = snapshot();
    } else if (action === 'cut') {
      const selected = pieces.find((p) => p.id === data.pieceId);
      if (!selected) throw new Error('Select a piece first.');
      const cut = splitMesh(selected, data.normal, data.offset, data.capMaterial).map((p) => ({
        ...p,
        id: ++serial,
        parentId: selected.id,
      }));
      if (history.length >= 12) history.shift();
      history.push(pieces);
      pieces = pieces.flatMap((p) => (p.id === selected.id ? cut : [p]));
      result = snapshot();
      result.selectedId = cut[0].id;
    } else if (action === 'splitColors') {
      const separated = splitMeshesByMaterial(pieces, project.palette).map((piece) => ({
        ...piece,
        id: ++serial,
      }));
      if (!separated.length) throw new Error('No painted color regions were found.');
      history = [];
      pieces = separated;
      result = snapshot();
      result.selectedId = separated[0].id;
      result.colorSeparated = true;
    } else if (action === 'undo') {
      if (history.length) pieces = history.pop();
      result = snapshot();
    } else if (action === 'export') {
      const selected = pieces.filter((p) => data.ids.includes(p.id)).map((piece) => {
        const translation = data.positions?.[piece.id] || [0, 0, 0];
        if (!Array.isArray(translation) || translation.length !== 3 || !translation.every(Number.isFinite))
          throw new Error('Posição inválida para uma peça da mesa.');
        return {
          ...piece,
          vertices: piece.vertices.map((vertex) => vertex.map((coordinate, axis) => coordinate + translation[axis])),
        };
      });
      const exported = export3mfResult(selected, data.palette, data.options);
      postMessage({ id, result: data.includeDetails ? exported : exported.bytes }, [
        exported.bytes.buffer,
      ]);
      return;
    } else throw new Error('Unknown operation.');
    postMessage({ id, result });
  } catch (error) {
    postMessage({ id, error: error.message || String(error) });
  }
};
