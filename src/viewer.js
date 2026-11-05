import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { bounds } from './geometry.js';

export class Viewer {
  constructor(host, onPlaneChange, onPieceSelect, onPieceMove) {
    this.host = host;
    this.onPieceSelect = onPieceSelect;
    this.onPieceMove = onPieceMove;
    this.interactionEnabled = true;
    this.onPlaneChange = onPlaneChange;
    this.meshes = new Map();
    this.explode = 0;
    this.pieceOffsets = new Map();
    this.pieceTranslations = new Map();
    this.pieceDirections = new Map();
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(0x000000, 0);
    host.appendChild(this.renderer.domElement);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.01, 10000);
    this.camera.up.set(0, 0, 1);
    this.camera.position.set(100, -140, 100);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.navigationLocked = false;
    this.controls.enabled = true;
    this.controls.target.set(0, 0, 20);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x54657a, 2.2));
    const key = new THREE.DirectionalLight(0xfff5e7, 2.2);
    key.position.set(-30, -80, 140);
    this.scene.add(key);
    const fill = new THREE.DirectionalLight(0xbedbff, 1.1);
    fill.position.set(60, 50, 60);
    this.scene.add(fill);
    this.grid = new THREE.GridHelper(200, 20, 0x607486, 0x3a4b5d);
    this.grid.rotation.x = Math.PI / 2;
    this.grid.material.transparent = true;
    this.grid.material.opacity = 0.3;
    this.scene.add(this.grid);
    this.plane = new THREE.Group();
    this.planeFill = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({
        color: 0xf8b868,
        transparent: true,
        opacity: 0.16,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    this.planeOutline = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.PlaneGeometry(1, 1)),
      new THREE.LineBasicMaterial({ color: 0xf8bc75, transparent: true, opacity: 0.9 }),
    );
    this.plane.add(this.planeFill, this.planeOutline);
    this.scene.add(this.plane);
    this.plane.visible = false;
    this.transform = new TransformControls(this.camera, this.renderer.domElement);
    this.transform.setSize(0.8);
    this.transform.setSpace('local');
    this.scene.add(this.transform.getHelper());
    this.transform.addEventListener('dragging-changed', (e) => {
      this.planeDragging = e.value;
      this.syncNavigation();
    });
    this.transform.addEventListener('objectChange', () => {
      if (this.settingPlane) return;
      const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(this.plane.quaternion).normalize();
      const shift = this.pieceTranslations.get(this.selectedId) || new THREE.Vector3();
      this.onPlaneChange(normal.toArray(), this.plane.position.dot(normal) - shift.dot(normal));
    });
    this.setMode('translate');
    this.pieceHandle = new THREE.Object3D();
    this.scene.add(this.pieceHandle);
    this.pieceTransform = new TransformControls(this.camera, this.renderer.domElement);
    this.pieceTransform.setMode('translate');
    this.pieceTransform.setSpace('world');
    this.pieceTransform.setSize(0.9);
    this.scene.add(this.pieceTransform.getHelper());
    this.pieceTransform.addEventListener('dragging-changed', ({ value }) => {
      this.pieceDragging = value;
      this.syncNavigation();
      if (value) this.pieceDragStarted = true;
    });
    this.pieceTransform.addEventListener('objectChange', () => {
      const piece = this.pieces?.find((item) => item.id === this.selectedId);
      if (!piece || this.syncingHandle) return;
      const translation = this.pieceHandle.position
        .clone()
        .sub(new THREE.Vector3(...bounds([piece]).center));
      this.pieceTranslations.set(piece.id, translation);
      const axis = this.pieceDirections.get(piece.id) || 'horizontal';
      this.explode = translation[axis === 'z' ? 'z' : axis === 'vertical' ? 'y' : 'x'];
      this.pieceOffsets.set(piece.id, this.explode);
      this.applyOffsets();
      this.onPieceMove?.(piece.id);
    });
    const canvas = this.renderer.domElement;
    canvas.addEventListener('pointerdown', (event) => {
      this.pointerStart = event.button === 0 ? [event.clientX, event.clientY] : null;
      this.pieceDragStarted =
        !!this.pieceTransform.dragging ||
        this.pieceTransform.axis !== null ||
        this.transform.axis !== null;
    });
    canvas.addEventListener('pointercancel', () => {
      this.pointerStart = null;
    });
    canvas.addEventListener('pointerup', (event) => {
      const start = this.pointerStart;
      this.pointerStart = null;
      if (
        !this.interactionEnabled ||
        !start ||
        this.pieceDragStarted ||
        Math.hypot(event.clientX - start[0], event.clientY - start[1]) > 5
      )
        return;
      const rect = canvas.getBoundingClientRect();
      const pointer = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      this.scene.updateMatrixWorld(true);
      const ray = new THREE.Raycaster();
      ray.setFromCamera(pointer, this.camera);
      const hit = ray.intersectObjects([...this.meshes.values()], false)[0];
      if (hit)
        this.onPieceSelect?.(
          hit.object.userData.pieceId,
          event.ctrlKey || event.metaKey || event.shiftKey,
        );
    });
    this.installCutLine();
    new ResizeObserver(() => this.resize()).observe(host);
    this.resize();
    this.renderer.setAnimationLoop(() => {
      if (this.controls.enabled) this.controls.update();
      this.renderer.render(this.scene, this.camera);
    });
  }
  setNavigationLocked(locked) {
    this.navigationLocked = locked;
    this.syncNavigation();
  }
  syncNavigation() {
    const enabled =
      !this.navigationLocked &&
      this.interactionEnabled &&
      !this.drawingLine &&
      !this.pieceDragging &&
      !this.planeDragging;
    if (!enabled && this.controls.enabled) {
      // Discard orbit inertia without moving the camera when locking or grabbing a piece.
      const position = this.camera.position.clone();
      const target = this.controls.target.clone();
      const damping = this.controls.enableDamping;
      this.controls.enableDamping = false;
      this.controls.update();
      this.camera.position.copy(position);
      this.controls.target.copy(target);
      this.controls.update();
      this.controls.enableDamping = damping;
    }
    this.controls.enabled = enabled;
  }
  installCutLine() {
    const canvas = this.renderer.domElement;
    this.lineOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.lineOverlay.classList.add('cut-line-overlay');
    this.lineOverlay.setAttribute('aria-hidden', 'true');
    this.lineStroke = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    this.lineOverlay.appendChild(this.lineStroke);
    this.host.appendChild(this.lineOverlay);
    this.lineOverlay.style.display = 'none';
    const point = (event) => {
      const r = canvas.getBoundingClientRect();
      return [event.clientX - r.left, event.clientY - r.top];
    };
    canvas.addEventListener(
      'pointerdown',
      (event) => {
        if (!this.drawingLine || event.button !== 0 || !this.interactionEnabled) return;
        event.stopImmediatePropagation();
        event.preventDefault();
        this.lineStart = point(event);
        canvas.setPointerCapture(event.pointerId);
        this.lineOverlay.style.display = '';
        this.drawLine(this.lineStart, this.lineStart);
      },
      true,
    );
    canvas.addEventListener(
      'pointermove',
      (event) => {
        if (!this.drawingLine) return;
        event.stopImmediatePropagation();
        if (this.lineStart) this.drawLine(this.lineStart, point(event));
      },
      true,
    );
    canvas.addEventListener(
      'pointerup',
      (event) => {
        if (!this.drawingLine || !this.lineStart) return;
        event.stopImmediatePropagation();
        event.preventDefault();
        const start = this.lineStart,
          end = point(event);
        this.lineStart = null;
        if (canvas.hasPointerCapture(event.pointerId))
          canvas.releasePointerCapture(event.pointerId);
        if (Math.hypot(end[0] - start[0], end[1] - start[1]) < 8) return;
        this.drawLine(start, end);
        const rect = canvas.getBoundingClientRect();
        this.camera.updateMatrixWorld();
        const unproject = (p) =>
          new THREE.Vector3((p[0] / rect.width) * 2 - 1, 1 - (p[1] / rect.height) * 2, 0).unproject(
            this.camera,
          );
        const a = unproject(start),
          b = unproject(end);
        const n = b.clone().sub(a).cross(this.camera.position.clone().sub(a)).normalize();
        const shift = this.pieceTranslations.get(this.selectedId) || new THREE.Vector3();
        this.onCutLine?.(n.toArray(), n.dot(a) - n.dot(shift));
      },
      true,
    );
    canvas.addEventListener('pointercancel', () => this.clearCutLine());
    this.controls.addEventListener('start', () => {
      this.lineOverlay.style.display = 'none';
    });
  }
  setQueuedCutPlanes(cuts) {
    for (const preview of this.cutPreviews || []) {
      this.scene.remove(preview);
      preview.geometry.dispose();
      preview.material.dispose();
    }
    this.cutPreviews = [];
    const piece = this.pieces?.find((p) => p.id === this.selectedId);
    if (!piece) return;
    const center = new THREE.Vector3(...bounds([piece]).center);
    const size = Math.max(...bounds([piece]).size) * 1.35;
    const shift = this.pieceTranslations.get(piece.id) || new THREE.Vector3();
    for (const cut of cuts) {
      const normal = new THREE.Vector3(...cut.normal);
      const geometry = new THREE.PlaneGeometry(size, size);
      const preview = new THREE.LineSegments(
        new THREE.EdgesGeometry(geometry),
        new THREE.LineBasicMaterial({ color: 0xec7828 }),
      );
      geometry.dispose();
      preview.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
      preview.position
        .copy(center)
        .addScaledVector(normal, cut.offset - center.dot(normal))
        .add(shift);
      this.scene.add(preview);
      this.cutPreviews.push(preview);
    }
  }
  stopDrawingLine() {
    this.drawingLine = false;
    this.lineStart = null;
    this.syncNavigation();
    this.renderer.domElement.style.cursor = '';
    this.syncPieceHandle();
  }
  drawLine(a, b) {
    for (const [name, value] of Object.entries({ x1: a[0], y1: a[1], x2: b[0], y2: b[1] }))
      this.lineStroke.setAttribute(name, value);
  }
  beginCutLine() {
    this.drawingLine = true;
    this.lineStart = null;
    this.syncNavigation();
    this.pieceTransform.detach();
    this.transform.detach();
    this.plane.visible = false;
    this.renderer.domElement.style.cursor = 'crosshair';
  }
  clearCutLine() {
    this.drawingLine = false;
    this.lineStart = null;
    this.syncNavigation();
    this.renderer.domElement.style.cursor = '';
    if (this.lineOverlay) this.lineOverlay.style.display = 'none';
    this.plane.visible = false;
    this.transform.detach();
    this.syncPieceHandle();
  }
  resize() {
    const { width, height } = this.host.getBoundingClientRect();
    if (!width || !height) return;
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
  load(pieces, palette, selectedId, fit = true) {
    this.pieceTransform.detach();
    if (fit) {
      this.pieceTranslations.clear();
      this.pieceOffsets.clear();
      this.pieceDirections.clear();
    }
    for (const piece of pieces) {
      if (piece.parentId && !this.pieceTranslations.has(piece.id)) {
        this.pieceTranslations.set(
          piece.id,
          (this.pieceTranslations.get(piece.parentId) || new THREE.Vector3()).clone(),
        );
        this.pieceOffsets.set(piece.id, this.pieceOffsets.get(piece.parentId) || 0);
        this.pieceDirections.set(
          piece.id,
          this.pieceDirections.get(piece.parentId) || 'horizontal',
        );
      }
    }
    for (const mesh of this.meshes.values()) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
    }
    this.meshes.clear();
    this.pieces = pieces;
    this.palette = palette;
    this.box = pieces.length ? bounds(pieces) : null;
    for (const piece of pieces) {
      const positions = new Float32Array(piece.faces.length * 9),
        colors = new Float32Array(positions.length);
      let i = 0;
      const colorCache = palette.map((c) => new THREE.Color(c));
      for (const face of piece.faces) {
        const color = colorCache[face.material - 1] || colorCache[0];
        for (const id of face.v) {
          positions.set(piece.vertices[id], i);
          colors.set([color.r, color.g, color.b], i);
          i += 3;
        }
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geometry.computeVertexNormals();
      const material = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.88,
        metalness: 0.02,
        flatShading: true,
        side: THREE.DoubleSide,
        wireframe: !!this.wireframe,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.userData.pieceId = piece.id;
      this.meshes.set(piece.id, mesh);
      this.scene.add(mesh);
    }
    this.grid.position.set(this.box?.center[0] || 0, this.box?.center[1] || 0, -0.1);
    const extent = Math.max(...(this.box?.size || [20]), 20);
    this.grid.scale.setScalar(Math.max(1, extent / 100));
    this.select(selectedId);
    this.applyOffsets();
    if (fit) this.fit();
  }
  select(id, ids = new Set(id == null ? [] : [id])) {
    this.selectedIds = new Set(ids);
    this.selectedId = id;
    this.explode = this.pieceOffsets.get(id) || 0;
    this.syncPieceHandle();
    for (const [key, mesh] of this.meshes)
      mesh.material.emissive.setHex(this.selectedIds.has(key) ? 0x305040 : 0x000000);
  }
  syncPieceHandle() {
    const piece = this.pieces?.find((item) => item.id === this.selectedId);
    if (!piece || !this.interactionEnabled || this.drawingLine || this.plane.visible) {
      this.pieceTransform.detach();
      return;
    }
    this.syncingHandle = true;
    this.pieceHandle.position
      .set(...bounds([piece]).center)
      .add(this.pieceTranslations.get(piece.id) || new THREE.Vector3());
    this.pieceTransform.attach(this.pieceHandle);
    this.syncingHandle = false;
  }
  setInteractionEnabled(enabled) {
    this.interactionEnabled = enabled;
    this.syncNavigation();
    this.pieceTransform.enabled = enabled;
    this.transform.enabled = enabled;
    this.syncPieceHandle();
  }
  setPalette(palette) {
    if (this.pieces) {
      const ids = this.selectedIds;
      this.load(this.pieces, palette, this.selectedId, false);
      this.select(this.selectedId, ids);
    }
  }
  setPlane(normal, offset, center, visible = true, editable = true) {
    this.settingPlane = true;
    this.plane.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(...normal),
    );
    const c = new THREE.Vector3(...center),
      n = new THREE.Vector3(...normal);
    this.plane.position.copy(c).addScaledVector(n, offset - c.dot(n));
    const piece = this.pieces?.find((p) => p.id === this.selectedId),
      box = piece ? bounds([piece]) : this.box;
    const size = Math.max(...(box?.size || [50])) * 1.35;
    this.planeFill.scale.set(size, size, 1);
    this.planeOutline.scale.copy(this.planeFill.scale);
    this.plane.position.add(this.pieceTranslations.get(this.selectedId) || new THREE.Vector3());
    visible = visible && !!piece;
    this.plane.visible = visible;
    if (visible && editable) this.transform.attach(this.plane);
    else this.transform.detach();
    this.settingPlane = false;
    this.syncPieceHandle();
  }
  setMode(mode) {
    this.transform.setMode(mode);
    this.transform.showX = mode === 'rotate';
    this.transform.showY = mode === 'rotate';
    this.transform.showZ = true;
  }
  setExplode(value, axis = 'horizontal') {
    this.explode = value;
    this.pieceOffsets.set(this.selectedId, value);
    this.pieceDirections.set(this.selectedId, axis);
    const piece = this.pieces?.find((item) => item.id === this.selectedId);
    if (piece) {
      const translation = (this.pieceTranslations.get(piece.id) || new THREE.Vector3()).clone();
      translation[axis === 'z' ? 'z' : axis === 'vertical' ? 'y' : 'x'] = value;
      this.pieceTranslations.set(piece.id, translation);
    }
    this.applyOffsets();
  }
  moveToBed() {
    const piece = this.pieces?.find((item) => item.id === this.selectedId);
    if (!piece?.faces.length) return false;
    let minZ = Infinity;
    for (const face of piece.faces)
      for (const index of face.v) minZ = Math.min(minZ, piece.vertices[index][2]);
    if (!Number.isFinite(minZ)) return false;
    const translation = (this.pieceTranslations.get(piece.id) || new THREE.Vector3()).clone();
    translation.z = -minZ;
    this.pieceTranslations.set(piece.id, translation);
    if (this.pieceDirections.get(piece.id) === 'z') {
      this.pieceOffsets.set(piece.id, translation.z);
      this.explode = translation.z;
    }
    this.applyOffsets();
    return true;
  }
  applyOffsets() {
    if (!this.pieces) return;
    for (const piece of this.pieces) {
      this.meshes
        .get(piece.id)
        .position.copy(this.pieceTranslations.get(piece.id) || new THREE.Vector3());
    }
    this.syncPieceHandle();
  }
  fit(view = 'iso') {
    if (!this.box) return;
    const box = new THREE.Box3();
    for (const mesh of this.meshes.values()) box.expandByObject(mesh);
    if (box.isEmpty()) return;
    const center = box.getCenter(new THREE.Vector3()),
      dimensions = box.getSize(new THREE.Vector3()),
      size = Math.max(dimensions.x, dimensions.y, dimensions.z, 1);
    const dirs = { iso: [1, -1.5, 0.95], top: [0, 0, 1], front: [0, -1, 0], right: [1, 0, 0] },
      direction = new THREE.Vector3(...dirs[view]).normalize();
    this.camera.up.set(0, view === 'top' ? 1 : 0, view === 'top' ? 0 : 1);
    const distance =
      ((size / (2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)))) * 1.4) /
      Math.min(this.camera.aspect, 1);
    this.camera.position.copy(center).addScaledVector(direction, distance);
    this.camera.near = Math.max(0.001, distance / 10000);
    this.camera.far = Math.max(10000, distance * 20);
    this.camera.updateProjectionMatrix();
    this.controls.target.copy(center);
    this.controls.update();
  }
  setWireframe(value) {
    this.wireframe = value;
    for (const mesh of this.meshes.values()) mesh.material.wireframe = value;
  }
}
