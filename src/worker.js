import { import3mf, export3mfResult } from './three-mf.js';
import { splitMesh, splitMeshesByMaterial, bounds, meshHealth, dot, EPS } from './geometry.js';
import { addGlueJoints, solidColorParts } from './assembly.js';
import { Vector3 } from 'three';
import { demoProject } from './demo.js';

let project = null,
  pieces = [],
  history = [],
  serial = 0;
function snapshot() {
  return { ...project, pieces, undoCount: history.length };
}
function remember() {
  if (history.length >= 12) history.shift();
  history.push(pieces);
}
function chosen(data) {
  const ids = data.ids || (data.pieceId ? [data.pieceId] : pieces.map((p) => p.id));
  const selected = pieces.filter((p) => ids.includes(p.id));
  if (!selected.length) throw new Error('Selecione pelo menos uma peça.');
  return selected;
}
onmessage = ({ data }) => {
  const { id, action } = data;
  try {
    let result;
    if (action === 'restore') {
      project = data.project;
      pieces = project.pieces;
      history = [];
      serial = Math.max(0, ...pieces.map((p) => p.id));
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
    } else if (action === 'rotate') {
      const selected = chosen(data);
      if (!['x', 'y', 'z'].includes(data.axis) || !Number.isFinite(data.angle))
        throw new Error('Informe um eixo e um ângulo válidos.');
      const axis = new Vector3(...{ x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] }[data.axis]);
      const rotated = new Map(
        selected.map((piece) => {
          const center = new Vector3(...bounds([piece]).center);
          const vertices = piece.vertices.map((p) =>
            new Vector3(...p)
              .sub(center)
              .applyAxisAngle(axis, (data.angle * Math.PI) / 180)
              .add(center)
              .toArray(),
          );
          const next = { ...piece, vertices, id: ++serial, parentId: piece.id };
          next.health = meshHealth(next);
          return [piece.id, next];
        }),
      );
      remember();
      pieces = pieces.map((p) => rotated.get(p.id) || p);
      result = snapshot();
      result.selectedIds = [...rotated.values()].map((p) => p.id);
      result.selectedId = result.selectedIds[0];
    } else if (action === 'delete') {
      const ids = new Set(chosen(data).map((p) => p.id));
      remember();
      pieces = pieces.filter((p) => !ids.has(p.id));
      result = snapshot();
    } else if (action === 'cut') {
      const selected = pieces.find((p) => p.id === data.pieceId);
      if (!selected) throw new Error('Select a piece first.');
      const planes = data.cuts || [{ normal: data.normal, offset: data.offset }];
      if (!Array.isArray(planes) || !planes.length)
        throw new Error('Desenhe pelo menos uma linha de corte.');
      let cut = [selected],
        joints = 0,
        applied = 0;
      for (let index = 0; index < planes.length; index++) {
        const { normal, offset } = planes[index];
        const size =
          Array.isArray(normal) && normal.length === 3 && normal.every(Number.isFinite)
            ? Math.hypot(...normal)
            : 0;
        if (size < EPS || !Number.isFinite(offset)) throw new Error('Plano de corte inválido.');
        let changed = false;
        try {
          cut = cut.flatMap((part) => {
            const distances = part.vertices.map((p) => (dot(p, normal) - offset) / size);
            if (!distances.some((d) => d > EPS) || !distances.some((d) => d < -EPS)) return [part];
            let halves = splitMesh(part, normal, offset, data.capMaterial);
            if (data.joints) {
              const joined = addGlueJoints(halves);
              halves = joined.pieces;
              joints += joined.created;
            }
            changed = true;
            return halves;
          });
        } catch (error) {
          throw new Error(
            `Corte ${index + 1}: ${error.message} Nenhum corte deste lote foi aplicado.`,
          );
        }
        if (changed) applied++;
      }
      if (!applied)
        throw new Error('As linhas precisam atravessar o interior da peça selecionada.');
      cut = cut.map((p) => ({ ...p, id: ++serial, parentId: selected.id }));
      remember();
      pieces = pieces.flatMap((p) => (p.id === selected.id ? cut : [p]));
      result = snapshot();
      result.selectedId = cut[0].id;
      result.jointsCreated = joints;
      result.cutsApplied = applied;
      result.cutsSkipped = planes.length - applied;
    } else if (action === 'splitColors') {
      const selected = chosen(data);
      let joints = 0;
      const replacements = new Map(
        selected.map((source) => {
          let parts;
          if (new Set(source.faces.map((f) => f.material)).size < 2) return [source.id, [source]];
          if (data.joints) {
            const joined = addGlueJoints(solidColorParts(source, project.palette));
            parts = joined.pieces;
            joints += joined.created;
          } else {
            try {
              parts = solidColorParts(source, project.palette);
            } catch {
              parts = splitMeshesByMaterial([source], project.palette);
            }
          }
          return [source.id, parts.map((p) => ({ ...p, id: ++serial, parentId: source.id }))];
        }),
      );
      if (![...replacements.values()].some((parts) => parts.length > 1))
        throw new Error('As peças selecionadas já têm uma única cor.');
      remember();
      pieces = pieces.flatMap((p) => replacements.get(p.id) || [p]);
      result = snapshot();
      result.selectedId = replacements.get(selected[0].id)[0].id;
      result.colorSeparated = true;
      result.openColorParts = pieces.some((p) => !p.health.closed);
      result.jointsCreated = joints;
    } else if (action === 'undo') {
      if (history.length) pieces = history.pop();
      result = snapshot();
    } else if (action === 'export') {
      const selected = pieces
        .filter((p) => data.ids.includes(p.id))
        .map((piece) => {
          const translation = data.positions?.[piece.id] || [0, 0, 0];
          if (
            !Array.isArray(translation) ||
            translation.length !== 3 ||
            !translation.every(Number.isFinite)
          )
            throw new Error('Posição inválida para uma peça da mesa.');
          return {
            ...piece,
            vertices: piece.vertices.map((vertex) =>
              vertex.map((coordinate, axis) => coordinate + translation[axis]),
            ),
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
