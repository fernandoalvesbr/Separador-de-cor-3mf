import './style.css';
import './pt-br.js';
import { Viewer } from './viewer.js';
import { bounds, dot } from './geometry.js';
import { paintTargets, VIRTUAL_EXTRUDER_PALETTE } from './vendor/three-mf/index.js';

const $ = (id) => document.getElementById(id);
let project = null,
  selectedId = null,
  selectedIds = new Set(),
  lineCuts = [],
  busy = false,
  requestId = 0,
  worker,
  pending = new Map(),
  planeNormal = [0, 0, 1],
  planeOffset = 0,
  offsetRange = [-25, 25];
let physicalPaintTarget = paintTargets()[0].id;
const physicalFilamentColors = VIRTUAL_EXTRUDER_PALETTE.map((swatch) => swatch.color);
function renderPhysicalFilamentColors() {
  const count = Number($('physical-extruders').value);
  $('physical-colors').replaceChildren(
    ...physicalFilamentColors.slice(0, count).map((color, index) => {
      const label = document.createElement('label');
      label.className = 'swatch';
      const input = document.createElement('input');
      input.type = 'color';
      input.value = color;
      input.disabled = busy || !project || !$('virtual-extruders').checked;
      input.setAttribute('aria-label', `Physical filament color for slot ${index + 1}`);
      input.title = `Slot ${index + 1}: ${color.toUpperCase()} · Click to edit`;
      input.oninput = () => {
        physicalFilamentColors[index] = input.value.toUpperCase();
        input.title = `Slot ${index + 1}: ${physicalFilamentColors[index]} · Click to edit`;
      };
      label.append(input, document.createTextNode(String(index + 1)));
      return label;
    }),
  );
}
function syncVirtualExtruderUI() {
  const enabled = $('virtual-extruders').checked;
  const targets = paintTargets({ virtualExtruders: enabled });
  const preferred = enabled ? $('export-format').value : physicalPaintTarget;
  $('export-format').replaceChildren(
    ...targets.map((target) => new Option(target.name, target.id)),
  );
  $('export-format').value = targets.some((target) => target.id === preferred)
    ? preferred
    : targets[0].id;
  $('virtual-settings').hidden = !enabled;
  $('export-label').textContent = enabled
    ? 'Baixar mesa com extrusores virtuais'
    : 'Baixar mesa completa em 3MF';
  $('export-note').textContent = enabled
    ? 'Select the matching printer, then use File → Open Project in PrusaSlicer 2.9.6+.'
    : 'Meshes and paint only. Uses your slicer’s current printer.';
  renderPhysicalFilamentColors();
  syncPhysicalControls();
}
function syncPhysicalControls() {
  $('virtual-settings')
    .querySelectorAll('input,select')
    .forEach((el) => {
      el.disabled = busy || !project || !$('virtual-extruders').checked;
    });
}
$('virtual-extruders').onchange = syncVirtualExtruderUI;
$('physical-extruders').onchange = renderPhysicalFilamentColors;
$('export-format').onchange = () => {
  if (!$('virtual-extruders').checked) physicalPaintTarget = $('export-format').value;
};
function showPhysicalSlotHelp(open) {
  $('virtual-note').hidden = !open;
  $('physical-slot-help-button').setAttribute('aria-expanded', open);
}
for (const event of ['mouseenter', 'focus', 'click'])
  $('physical-slot-help-button').addEventListener(event, () => showPhysicalSlotHelp(true));
$('physical-slot-help').onmouseleave = () => {
  if (document.activeElement !== $('physical-slot-help-button')) showPhysicalSlotHelp(false);
};
$('physical-slot-help-button').onblur = () => showPhysicalSlotHelp(false);
document.addEventListener('click', (e) => {
  if (!$('physical-slot-help').contains(e.target)) showPhysicalSlotHelp(false);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    showPhysicalSlotHelp(false);
    invalidateLine();
  }
});
syncVirtualExtruderUI();
function startWorker() {
  worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
  worker.onmessage = ({ data }) => {
    if (data.progress) {
      $('busy-message').textContent = data.progress;
      return;
    }
    const p = pending.get(data.id);
    if (!p) return;
    pending.delete(data.id);
    data.error ? p.reject(new Error(data.error)) : p.resolve(data.result);
  };
  worker.onerror = () => {
    for (const p of pending.values())
      p.reject(new Error('The model worker stopped. Try a smaller file or reload the app.'));
    pending.clear();
  };
}
startWorker();
function request(action, data = {}, transfer = []) {
  return new Promise((resolve, reject) => {
    const id = ++requestId;
    pending.set(id, { resolve, reject });
    worker.postMessage({ id, action, ...data }, transfer);
  });
}
function toast(message, error = false) {
  $('toast-message').textContent = message;
  $('toast').classList.toggle('error', error);
  $('toast').hidden = false;
}
$('dismiss-toast').onclick = () => ($('toast').hidden = true);
let viewer;
try {
  viewer = new Viewer(
    $('canvas-host'),
    (normal, offset) => {
      planeNormal = normal;
      planeOffset = offset;
      const center = bounds([selectedPiece()]).center;
      $('offset').value = (offset - dot(normal, center)).toFixed(2);
      $('tilt').value = ((Math.acos(Math.max(-1, Math.min(1, normal[2]))) * 180) / Math.PI).toFixed(
        1,
      );
      $('azimuth').value = ((Math.atan2(normal[1], normal[0]) * 180) / Math.PI).toFixed(1);
      syncRange();
      syncAxes();
    },
    (id, additive) => {
      if (!busy && project) selectPiece(id, additive);
    },
    () => {
      syncPieceOffset();
      invalidateLine();
      updatePlane();
    },
  );
  viewer.onCutLine = (normal, offset) => {
    lineCuts.push({ normal, offset, pieceId: selectedId });
    syncCutQueue();
  };
} catch {
  toast(
    'This browser could not start the 3D viewer. Enable WebGL / hardware acceleration and reload.',
    true,
  );
}
const selectedPiece = () => project?.pieces.find((p) => p.id === selectedId);
function setBusy(value, message = 'Working…') {
  busy = value;
  viewer?.setInteractionEnabled(!value);
  $('busy-overlay').hidden = !value;
  $('busy-message').textContent = message;
  document
    .querySelectorAll('.inspector button,.inspector input,.inspector select')
    .forEach((el) => (el.disabled = value || !project?.pieces.length));
  $('undo').disabled = value || !project?.undoCount;
  $('remove-cut-line').disabled = value || !lineCuts.length;
  $('clear-cut-lines').disabled = value || !lineCuts.length;
  $('open-button').disabled = value;
  $('empty-open').disabled = value;
  $('demo-button').disabled = value;
  syncPhysicalControls();
  syncGlueJointControl();
}
function syncGlueJointControl() {
  const colors = $('cut-method').value === 'colors';
  if (colors) $('glue-joints').checked = false;
  $('glue-joints').disabled = busy || colors || !project?.pieces.length;
  $('glue-joints').classList.toggle('unavailable-for-colors', colors);
  $('glue-joints').onclick = (event) => {
    if ($('cut-method').value === 'colors') {
      event.preventDefault();
      event.stopImmediatePropagation();
      event.currentTarget.checked = false;
      return false;
    }
  };
  $('glue-joints').title = colors
    ? 'Junções não estão disponíveis na separação por cores'
    : 'Criar pinos e furos para facilitar a colagem';
}
$('glue-joints').onchange = () => {
  if ($('cut-method').value === 'colors') $('glue-joints').checked = false;
};
async function run(message, fn) {
  if (busy) return;
  setBusy(true, message);
  try {
    await fn();
  } catch (e) {
    toast(e.message, true);
  } finally {
    setBusy(false);
  }
}
function syncAxes() {
  const axis = planeNormal.findIndex((x) => Math.abs(x - 1) < 0.001);
  document
    .querySelectorAll('[data-axis]')
    .forEach((el) => el.classList.toggle('active', el.dataset.axis === 'XYZ'[axis]));
}
function syncRange() {
  const piece = selectedPiece();
  if (!piece) return;
  const center = bounds([piece]).center;
  let lo = Infinity,
    hi = -Infinity;
  for (const p of piece.vertices) {
    const d = dot(planeNormal, p) - dot(planeNormal, center);
    lo = Math.min(lo, d);
    hi = Math.max(hi, d);
  }
  offsetRange = [lo, hi];
  $('offset-slider').min = lo.toFixed(3);
  $('offset-slider').max = hi.toFixed(3);
  $('offset-slider').step = Math.max(0.001, (hi - lo) / 1000);
  $('offset-slider').value = $('offset').value;
}
function updatePlane(reset = false) {
  if (!selectedPiece()) return;
  const tilt = (Number($('tilt').value) * Math.PI) / 180,
    az = (Number($('azimuth').value) * Math.PI) / 180;
  planeNormal = [Math.sin(tilt) * Math.cos(az), Math.sin(tilt) * Math.sin(az), Math.cos(tilt)];
  const center = bounds([selectedPiece()]).center;
  if (reset) $('offset').value = 0;
  planeOffset = dot(planeNormal, center) + Number($('offset').value);
  syncRange();
  syncAxes();
  viewer?.setPlane(planeNormal, planeOffset, center, $('cut-method').value === 'plane');
}
function syncPieceOffset() {
  const offset = viewer?.pieceOffsets.get(selectedId) || 0;
  $('explode').min = Math.min(-100, offset);
  $('explode').max = Math.max(100, offset);
  $('explode').value = offset;
  $('explode-value').value = `${Number(offset.toFixed(2))} mm`;
}
function invalidateLine() {
  lineCuts = [];
  syncCutQueue();
  viewer?.clearCutLine();
  $('line-status').textContent =
    'Escolha uma vista, desenhe quantas linhas precisar e clique em Aplicar corte.';
  $('draw-cut-line').textContent = 'Adicionar linhas de corte';
}
function selectPiece(id, additive = false) {
  if (!project?.pieces.some((p) => p.id === id)) return;
  if (additive) {
    if (selectedIds.has(id) && selectedIds.size > 1) selectedIds.delete(id);
    else selectedIds.add(id);
  } else selectedIds = new Set([id]);
  selectedId = selectedIds.has(id) ? id : [...selectedIds].at(-1);
  $('piece-select').value = selectedId;
  viewer?.select(selectedId, selectedIds);
  syncPieceOffset();
  $('separation-direction').value = viewer?.pieceDirections.get(selectedId) || 'horizontal';
  invalidateLine();
  updatePlane(true);
  renderPieces();
}
function renderPieces() {
  $('piece-count').textContent = project.pieces.length;
  const selectedOnly = $('export-scope').value === 'selected';
  $('export-count').textContent = selectedOnly ? selectedIds.size : project.pieces.length;
  $('export-label').textContent = selectedOnly
    ? 'Baixar peças selecionadas em 3MF'
    : 'Baixar mesa completa em 3MF';
  $('export-note').textContent = selectedOnly
    ? 'Exporta somente a peça selecionada, com sua cor e posição na mesa.'
    : 'Exporta todas as peças, com suas cores e posições na mesa.';
  $('piece-list').replaceChildren();
  for (const piece of project.pieces) {
    const button = document.createElement('button');
    button.className = 'piece-row' + (selectedIds.has(piece.id) ? ' selected' : '');
    button.setAttribute('aria-pressed', selectedIds.has(piece.id));
    button.disabled = busy;
    const marker = document.createElement('span');
    marker.className = 'piece-marker';
    marker.textContent = '◇';
    const content = document.createElement('span');
    content.className = 'piece-content';
    const name = document.createElement('span');
    name.className = 'piece-name';
    name.textContent = piece.name;
    name.title = piece.name;
    const info = document.createElement('span');
    info.className = 'piece-info';
    info.textContent =
      bounds([piece])
        .size.map((n) => n.toFixed(1))
        .join(' × ') + ' mm';
    content.append(name, info);
    const health = document.createElement('span');
    health.className = 'piece-status' + (piece.health.closed ? '' : ' bad');
    health.textContent = piece.health.closed ? 'CLOSED' : 'CHECK';
    health.title = piece.health.closed
      ? 'Closed, consistently oriented mesh'
      : `${piece.health.boundary} open edges; ${piece.health.nonmanifold} non-manifold edges; ${piece.health.inconsistent} inconsistent edges`;
    button.append(marker, content, health);
    button.onclick = (event) =>
      selectPiece(piece.id, event.ctrlKey || event.metaKey || event.shiftKey);
    $('piece-list').append(button);
  }
}
function renderProject(next, fit = true) {
  if (fit) {
    physicalPaintTarget = next.format || 'universal';
    syncVirtualExtruderUI();
  }
  const oldPalette = project?.palette;
  project = next;
  if (!fit && oldPalette) project.palette = oldPalette;
  selectedId = next.selectedId || next.pieces[0]?.id || null;
  selectedIds = new Set(next.selectedIds || (selectedId === null ? [] : [selectedId]));
  invalidateLine();
  $('empty-state').hidden = true;
  $('view-toolbar').hidden = false;
  $('demo-tag').hidden = !project.demo;
  $('model-title').textContent = project.filename;
  $('model-title').dataset.noTranslate = '';
  const count = project.pieces.reduce((sum, p) => sum + p.faces.length, 0);
  $('model-detail').textContent =
    `${count.toLocaleString()} triangles · ${project.palette.length} materials · millimeters`;

  $('piece-select').replaceChildren();
  for (const p of project.pieces) {
    const option = document.createElement('option');
    option.value = p.id;
    option.textContent = p.name;
    $('piece-select').append(option);
  }
  $('piece-select').value = selectedId;
  $('cap-material').replaceChildren();
  $('palette').replaceChildren();
  for (let i = 0; i < project.palette.length; i++) {
    const option = document.createElement('option');
    option.value = i + 1;
    option.textContent = `Material ${i + 1}`;
    $('cap-material').append(option);
    const label = document.createElement('label');
    label.className = 'swatch';
    label.title = `Material ${i + 1} display and export color`;
    const input = document.createElement('input');
    input.type = 'color';
    input.value = project.palette[i];
    input.setAttribute('aria-label', `Material ${i + 1} color`);
    input.oninput = () => {
      project.palette[i] = input.value;
      viewer?.setPalette(project.palette);
    };
    label.append(input, document.createTextNode(String(i + 1)));
    $('palette').append(label);
  }
  $('material-count').textContent = `${project.palette.length} slots`;
  viewer?.load(project.pieces, project.palette, selectedId, fit);
  syncTableLock();
  syncGlueJointControl();
  viewer?.select(selectedId, selectedIds);
  syncPieceOffset();
  $('separation-direction').value = viewer?.pieceDirections.get(selectedId) || 'horizontal';
  renderPieces();
  updatePlane(true);
}
function openFile(file) {
  if (!file || busy) return;
  if (!/\.3mf$/i.test(file.name)) {
    toast('Choose a .3mf model file.', true);
    return;
  }
  run('Reading 3MF and resolving paint…', async () => {
    const buffer = await file.arrayBuffer();
    const next = await request('import', { buffer, filename: file.name }, [buffer]);
    renderProject(next);
    toast(
      next.warnings.length
        ? next.warnings.join(' ')
        : 'Modelo aberto inteiro. Escolha o tipo de corte e clique em Aplicar corte.',
      next.warnings.length > 0 || next.pieces.some((piece) => !piece.health.closed),
    );
  });
}
for (const id of ['open-button', 'empty-open']) $(id).onclick = () => $('file-input').click();
$('file-input').onchange = (e) => {
  openFile(e.target.files[0]);
  e.target.value = '';
};
$('demo-button').onclick = () =>
  run('Loading painted demo…', async () => {
    const next = await request('demo');
    renderProject(next);
    toast('Exemplo aberto inteiro. Use Aplicar corte para separar.');
  });
$('piece-select').onchange = (e) => selectPiece(Number(e.target.value));
document.querySelectorAll('[data-axis]').forEach(
  (el) =>
    (el.onclick = () => {
      const axis = el.dataset.axis;
      $('tilt').value = axis === 'Z' ? 0 : 90;
      $('azimuth').value = axis === 'Y' ? 90 : 0;
      assemble();
      updatePlane(true);
    }),
);
function assemble() {
  invalidateLine();
}
for (const id of ['offset', 'tilt', 'azimuth'])
  $(id).oninput = () => {
    assemble();
    updatePlane();
  };
$('offset-slider').oninput = (e) => {
  $('offset').value = Number(e.target.value).toFixed(3);
  assemble();
  updatePlane();
};
$('center').onclick = () => {
  assemble();
  updatePlane(true);
};
$('show-plane').onchange = () => {
  assemble();
  updatePlane();
};
for (const [id, mode] of [
  ['move-mode', 'translate'],
  ['rotate-mode', 'rotate'],
])
  $(id).onclick = () => {
    assemble();
    viewer?.setMode(mode);
    $('move-mode').classList.toggle('active', mode === 'translate');
    $('rotate-mode').classList.toggle('active', mode === 'rotate');
  };
function setExplode() {
  const value = Number($('explode').value);
  $('explode-value').value = `${value} mm`;
  viewer?.setExplode(value, $('separation-direction').value);
  if (selectedPiece())
    viewer?.setPlane(
      planeNormal,
      planeOffset,
      bounds([selectedPiece()]).center,
      $('cut-method').value === 'plane',
    );
}
$('move-to-bed').onclick = () => {
  if (busy || !selectedPiece() || !viewer?.moveToBed()) return;
  const offset = viewer.pieceOffsets.get(selectedId) || 0;
  $('explode').min = Math.min(-100, offset);
  $('explode').max = Math.max(100, offset);
  $('explode').value = offset;
  $('explode-value').value = `${offset} mm`;
  invalidateLine();
  updatePlane();
  toast('Peça selecionada movida para a mesa.');
};
$('explode').oninput = setExplode;
$('separation-direction').onchange = () => {
  if (!viewer || !selectedPiece()) return;
  const axis = $('separation-direction').value;
  viewer.pieceDirections.set(selectedId, axis);
  viewer.pieceOffsets.set(
    selectedId,
    viewer.pieceTranslations.get(selectedId)?.[
      axis === 'z' ? 'z' : axis === 'vertical' ? 'y' : 'x'
    ] || 0,
  );
  syncPieceOffset();
};
$('cut-method').onchange = () => {
  invalidateLine();
  syncGlueJointControl();
  $('line-controls').hidden = $('cut-method').value !== 'line';
  $('plane-controls').hidden = $('cut-method').value !== 'plane';
  updatePlane(true);
};
function syncCutQueue() {
  $('line-status').textContent = lineCuts.length
    ? `${lineCuts.length} linha(s) preparada(s). Continue desenhando ou clique em Aplicar corte.`
    : 'Desenhe quantas linhas precisar e clique em Aplicar corte.';
  $('draw-cut-line').textContent = viewer?.drawingLine
    ? 'Parar desenho'
    : 'Adicionar linhas de corte';
  $('remove-cut-line').disabled = busy || !lineCuts.length;
  $('clear-cut-lines').disabled = busy || !lineCuts.length;
  viewer?.setQueuedCutPlanes(lineCuts);
}
$('draw-cut-line').onclick = () => {
  if (busy || !selectedPiece()) return;
  if (viewer?.drawingLine) viewer.stopDrawingLine();
  else viewer?.beginCutLine();
  syncCutQueue();
};
$('remove-cut-line').onclick = () => {
  lineCuts.pop();
  syncCutQueue();
};
$('clear-cut-lines').onclick = () => {
  invalidateLine();
};
$('select-all-pieces').onclick = () => {
  selectedIds = new Set(project.pieces.map((p) => p.id));
  viewer?.select(selectedId, selectedIds);
  renderPieces();
};
$('delete-pieces').onclick = () =>
  run('Excluindo peças selecionadas…', async () => {
    renderProject(await request('delete', { ids: [...selectedIds] }), false);
    toast('Peças excluídas. Use Desfazer para restaurar.');
  });
function rotatePieces(angle) {
  if (!Number.isFinite(angle)) {
    toast('Informe um ângulo válido.', true);
    return;
  }
  run('Girando peças…', async () => {
    renderProject(
      await request('rotate', {
        ids: [...selectedIds],
        axis: $('piece-rotation-axis').value,
        angle,
      }),
      false,
    );
    toast(`Peças giradas ${angle}°. Use Mover para mesa para apoiar a peça.`);
  });
}
$('rotate-piece').onclick = () => rotatePieces($('piece-rotation-angle').valueAsNumber);
document.querySelectorAll('[data-piece-angle]').forEach((button) => {
  button.onclick = () => rotatePieces(Number(button.dataset.pieceAngle));
});
$('cut-button').onclick = () => {
  const method = $('cut-method').value;
  if (method !== 'colors' && selectedIds.size !== 1) {
    toast('Selecione apenas uma peça para cortar por linha ou plano.', true);
    return;
  }
  if (
    method === 'line' &&
    (!lineCuts.length || lineCuts.some((cut) => cut.pieceId !== selectedId))
  ) {
    toast('Desenhe a linha de corte primeiro.', true);
    return;
  }
  run('Aplicando corte…', async () => {
    const capMaterial = Number($('cap-material').value);
    const next = await request(method === 'colors' ? 'splitColors' : 'cut', {
      ids: [...selectedIds],
      pieceId: selectedId,
      normal: planeNormal,
      offset: planeOffset,
      cuts:
        method === 'line' ? lineCuts.map(({ normal, offset }) => ({ normal, offset })) : undefined,
      capMaterial,
      joints: $('glue-joints').checked,
    });
    renderProject(next, false);
    $('cap-material').value = capMaterial;
    toast(
      next.openColorParts
        ? 'Cores separadas como superfícies abertas: será necessário repará-las no fatiador antes de imprimir ou cortar novamente.'
        : next.jointsCreated
          ? `Corte aplicado com ${next.jointsCreated} junção(ões) para colagem.`
          : next.cutsApplied
            ? `${next.cutsApplied} corte(s) aplicado(s). ${next.cutsSkipped ? `${next.cutsSkipped} linha(s) sem interseção foram ignoradas. ` : ''}Selecione uma parte para continuar cortando.`
            : 'Corte aplicado. Use Desfazer para restaurar a peça.',
      !!next.openColorParts,
    );
  });
};
$('undo').onclick = () => {
  if (project?.undoCount)
    run('Restoring the previous cut…', async () => {
      renderProject(await request('undo'), false);
      toast('Last cut undone.');
    });
};
$('export-scope').onchange = renderPieces;
$('export-button').onclick = () =>
  run('Saving geometry and color assignments…', async () => {
    const virtual = $('virtual-extruders').checked;
    const physicalExtruderCount = Number($('physical-extruders').value);
    const ids =
        $('export-scope').value === 'selected'
          ? [...selectedIds]
          : project.pieces.map((piece) => piece.id),
      exported = await request('export', {
        ids,
        positions: Object.fromEntries(
          [...(viewer?.meshes || [])].map(([id, mesh]) => [id, mesh.position.toArray()]),
        ),
        palette: project.palette,
        includeDetails: true,
        options: {
          format: $('export-format').value,
          virtualExtruders: virtual
            ? {
                physicalExtruderCount,
                physicalColors: physicalFilamentColors.slice(0, physicalExtruderCount),
              }
            : undefined,
        },
      });
    const url = URL.createObjectURL(new Blob([exported.bytes], { type: 'model/3mf' })),
      link = document.createElement('a');
    link.href = url;
    link.download =
      project.filename.replace(/\.3mf$/i, '') +
      ($('export-scope').value === 'selected' ? '-cor-selecionada' : '-mesa-completa') +
      '.3mf';
    link.hidden = true;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    toast(
      exported.warnings.length
        ? exported.warnings.join(' ')
        : 'Mesh-and-paint 3MF prepared. Use your slicer’s current printer and keep material slots in the same order.',
    );
  });
$('cancel').onclick = () => {
  worker.terminate();
  for (const p of pending.values()) p.reject(new Error('Operation cancelled.'));
  pending.clear();
  startWorker();
  if (project) {
    request('restore', { project }).then((next) => {
      renderProject(next, false);
      setBusy(false);
      toast('Operation cancelled. Current pieces kept; undo history cleared.');
    });
    return;
  }
  selectedId = null;
  $('empty-state').hidden = false;
  $('view-toolbar').hidden = true;
  $('model-title').textContent = 'Your next clean cut.';
  delete $('model-title').dataset.noTranslate;
  $('model-detail').textContent = 'Painted surfaces. Separate pieces.';
  $('piece-list').replaceChildren();
  $('palette').replaceChildren();
  $('piece-count').textContent = '0';
  $('demo-tag').hidden = true;
  viewer?.transform.detach();
  viewer?.pieceTransform.detach();
  if (viewer) {
    viewer.plane.visible = false;
    for (const m of viewer.meshes.values()) {
      viewer.scene.remove(m);
      m.geometry.dispose();
      m.material.dispose();
    }
    viewer.meshes.clear();
  }
  setBusy(false);
};
$('fit').onclick = () => viewer?.fit();
document.querySelectorAll('[data-view]').forEach(
  (el) =>
    (el.onclick = () => {
      viewer?.fit(el.dataset.view);
      document
        .querySelectorAll('[data-view]')
        .forEach((b) => b.classList.toggle('active', b === el));
    }),
);
function syncTableLock() {
  const locked = viewer?.navigationLocked !== false;
  $('toggle-table-lock').setAttribute('aria-pressed', String(locked));
  $('toggle-table-lock').textContent = locked ? '🔒 Desbloquear mesa' : '🔓 Bloquear mesa';
  $('toggle-table-lock').title = locked
    ? 'Mesa bloqueada: clique para liberar a navegação'
    : 'Mesa desbloqueada: clique para travar a navegação';
  $('view-hint').textContent = locked
    ? 'Mesa bloqueada · Clique na peça e arraste as setas para mover'
    : 'Mesa desbloqueada · Arraste o fundo para girar · Role para ampliar';
}
$('toggle-table-lock').onclick = () => {
  if (busy || !viewer) return;
  viewer.setNavigationLocked(!viewer.navigationLocked);
  syncTableLock();
};
$('wireframe').onclick = () => {
  const value = $('wireframe').getAttribute('aria-pressed') !== 'true';
  $('wireframe').setAttribute('aria-pressed', value);
  viewer?.setWireframe(value);
};
$('help-button').onclick = () => $('help-dialog').showModal();
$('close-help').onclick = () => $('help-dialog').close();
$('help-dialog').onclick = (e) => {
  if (e.target === $('help-dialog')) {
    const b = e.target.getBoundingClientRect();
    if (e.clientX < b.left || e.clientX > b.right || e.clientY < b.top || e.clientY > b.bottom)
      e.target.close();
  }
};
document.addEventListener('keydown', (e) => {
  if ($('help-dialog').open) return;
  const deleteKey =
    e.key === 'Delete' || e.key === 'Backspace' || e.code === 'Delete' || e.code === 'Backspace';
  if (deleteKey && !busy && project && !/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) {
    e.preventDefault();
    e.stopPropagation();
    const ids = selectedIds.size ? [...selectedIds] : selectedId == null ? [] : [selectedId];
    if (ids.length) {
      run('Excluindo peças selecionadas…', async () => {
        renderProject(await request('delete', { ids }), false);
        toast('Peças excluídas. Use Desfazer para restaurar.');
      });
    }
    return;
  }
  if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
    e.preventDefault();
    if (!busy) $('undo').click();
  } else if (e.key.toLowerCase() === 'f') viewer?.fit();
  else if (e.key.toLowerCase() === 'c' && !busy) $('cut-button').click();
});
let dragDepth = 0;
window.addEventListener('dragenter', (e) => {
  e.preventDefault();
  if (e.dataTransfer.types.includes('Files')) {
    dragDepth++;
    $('drop-overlay').hidden = false;
  }
});
window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('dragleave', (e) => {
  e.preventDefault();
  if (--dragDepth <= 0) $('drop-overlay').hidden = true;
});
window.addEventListener('drop', (e) => {
  e.preventDefault();
  dragDepth = 0;
  $('drop-overlay').hidden = true;
  openFile(e.dataTransfer.files[0]);
});
