import earcut from 'earcut';
import { Vector3, Ray, Triangle } from 'three';
import {
  bounds,
  makeMesh,
  meshHealth,
  add,
  sub,
  mul,
  dot,
  cross,
  normalize,
  length,
  pointKey,
} from './geometry.js';

// Partition a star-shaped solid into material volumes, retaining its painted surface.
// A point in the visibility kernel makes the interior triangle fans non-overlapping.
export function solidColorParts(mesh, palette) {
  if (!meshHealth(mesh).closed)
    throw new Error('Para criar junções por cor, a peça precisa ser uma malha fechada.');
  const planes = mesh.faces.map((f) => {
    const [a, b, c] = f.v.map((i) => mesh.vertices[i]);
    return { n: normalize(cross(sub(b, a), sub(c, a))), a };
  });
  let center = bounds([mesh]).center;
  const margin = Math.max(...bounds([mesh]).size) * 1e-6;
  for (let pass = 0; pass < 200; pass++) {
    let violation = 0;
    for (const { n, a } of planes) {
      const d = dot(n, sub(center, a)) + margin;
      if (d > 0) {
        center = sub(center, mul(n, d));
        violation = Math.max(violation, d);
      }
    }
    if (violation < margin * 0.01) break;
  }
  if (planes.some(({ n, a }) => dot(n, sub(center, a)) > -margin * 0.5))
    throw new Error(
      'Esta geometria não permite junções por cor automáticas. Divida-a primeiro com cortes por linha em partes mais simples.',
    );
  const groups = new Map();
  for (const face of mesh.faces) {
    if (!groups.has(face.material)) groups.set(face.material, new Map());
    const group = groups.get(face.material);
    const v = face.v.map((i) => mesh.vertices[i]);
    const triangles = [
      { v, material: face.material, cap: face.cap },
      ...[0, 1, 2].map((i) => ({
        v: [v[(i + 1) % 3], v[i], center],
        material: face.material,
        cap: true,
      })),
    ];
    for (const triangle of triangles) {
      const key = triangle.v.map(pointKey).sort().join('|');
      if (group.has(key)) group.delete(key);
      else group.set(key, triangle);
    }
  }
  const pieces = [...groups].map(([material, triangles]) => {
    const part = makeMesh(
      [...triangles.values()],
      `Cor ${material} · ${palette[material - 1] || ''}`,
    );
    part.colorMaterial = material;
    part.health = meshHealth(part);
    if (!part.health.closed)
      throw new Error(
        'Não foi possível fechar os volumes de cor para criar junções. A peça original foi mantida.',
      );
    return part;
  });
  const volume = pieces.reduce((s, p) => s + p.health.volume, 0);
  const original = meshHealth(mesh).volume;
  if (Math.abs(volume - original) > Math.max(1e-5, original * 1e-5))
    throw new Error('Falha na validação dos volumes de cor.');
  return pieces;
}
const trianglePoints = (mesh, face) => face.v.map((i) => mesh.vertices[i]);
const normalOf = (p) => normalize(cross(sub(p[1], p[0]), sub(p[2], p[0])));
function clearance(point, triangle, n) {
  return Math.min(
    ...triangle.map(
      (a, i) =>
        dot(cross(sub(triangle[(i + 1) % 3], a), sub(point, a)), n) /
        length(sub(triangle[(i + 1) % 3], a)),
    ),
  );
}
function depthAt(mesh, point, direction) {
  const ray = new Ray(new Vector3(...add(point, mul(direction, 1e-5))), new Vector3(...direction));
  let distance = Infinity;
  for (const face of mesh.faces) {
    const p = trianglePoints(mesh, face).map((v) => new Vector3(...v));
    const hit = ray.intersectTriangle(...p, false, new Vector3());
    if (hit) distance = Math.min(distance, hit.distanceTo(ray.origin));
  }
  return distance;
}
function socketFits(mesh, center, normal, radius, depth) {
  const middle = new Vector3(...add(center, mul(normal, depth / 2)));
  // Enclose the entire socket in a sphere and retain 0.8 mm around it.
  const protectedRadius = Math.hypot(radius, depth / 2) + 0.8;
  for (const face of mesh.faces) {
    const points = trianglePoints(mesh, face);
    if (points.every((p) => Math.abs(dot(normal, sub(p, center))) < 1e-5)) continue;
    const triangle = new Triangle(...points.map((p) => new Vector3(...p)));
    if (triangle.closestPointToPoint(middle, new Vector3()).distanceTo(middle) < protectedRadius)
      return false;
  }
  return true;
}
function feature(mesh, faceIndex, center, radius, depth) {
  const face = mesh.faces[faceIndex],
    p = trianglePoints(mesh, face),
    n = normalOf(p);
  const u = normalize(sub(p[1], p[0])),
    v = cross(n, u),
    count = 24;
  const ring = Array.from({ length: count }, (_, i) =>
    add(
      center,
      add(
        mul(u, radius * Math.cos((i * 2 * Math.PI) / count)),
        mul(v, radius * Math.sin((i * 2 * Math.PI) / count)),
      ),
    ),
  );
  const tip = ring.map((q) => add(q, mul(n, depth)));
  const points = [...p, ...ring];
  const flat = points.flatMap((q) => [dot(sub(q, center), u), dot(sub(q, center), v)]);
  const indices = earcut(flat, [3], 2),
    triangles = [];
  const emit = (a, b, c) => triangles.push({ v: [a, b, c], material: face.material, cap: true });
  for (let i = 0; i < indices.length; i += 3) {
    const tri = indices.slice(i, i + 3).map((j) => points[j]);
    if (dot(normalOf(tri), n) < 0) tri.reverse();
    emit(...tri);
  }
  for (let i = 0; i < count; i++) {
    const j = (i + 1) % count;
    emit(ring[i], ring[j], tip[j]);
    emit(ring[i], tip[j], tip[i]);
    emit(tip[i], tip[j], add(center, mul(n, depth)));
  }
  const result = makeMesh(
    [
      ...mesh.faces.flatMap((f, i) =>
        i === faceIndex ? [] : [{ ...f, v: trianglePoints(mesh, f) }],
      ),
      ...triangles,
    ],
    mesh.name,
  );
  result.health = meshHealth(result);
  if (!result.health.closed)
    throw new Error('Não foi possível criar uma junção fechada. A peça original foi mantida.');
  return { ...mesh, ...result };
}

// A peg and matching blind socket are carved directly into opposing interface faces.
// Keep radial glue clearance and a deeper socket, without crossing the outer skin.
export function addGlueJoints(input) {
  const pieces = input.map((p) => ({ ...p }));
  let created = 0;
  for (let a = 0; a < pieces.length; a++)
    for (let b = a + 1; b < pieces.length; b++) {
      if (!pieces[a].health.closed || !pieces[b].health.closed) continue;
      const candidates = pieces[a].faces
        .map((face, i) => {
          const [p, q, r] = trianglePoints(pieces[a], face);
          return { face, i, area: face.cap ? length(cross(sub(q, p), sub(r, p))) : 0 };
        })
        .filter((item) => item.area > 0)
        .sort((x, y) => y.area - x.area)
        .slice(0, 256);
      let connected = false;
      for (const { face, i } of candidates) {
        const pa = trianglePoints(pieces[a], face),
          n = normalOf(pa);
        const center = mul(add(add(pa[0], pa[1]), pa[2]), 1 / 3);
        for (let j = 0; j < pieces[b].faces.length; j++) {
          if (!pieces[b].faces[j].cap) continue;
          const pb = trianglePoints(pieces[b], pieces[b].faces[j]),
            nb = normalOf(pb);
          if (dot(n, nb) > -0.999999 || Math.abs(dot(n, sub(pb[0], center))) > 1e-5) continue;
          const radius =
            Math.min(2, clearance(center, pa, n) * 0.55, clearance(center, pb, nb) * 0.55) - 0.2;
          if (radius < 0.6) continue;
          const u = normalize(sub(pa[1], pa[0])),
            v = cross(n, u);
          const samples = [
            center,
            ...Array.from({ length: 24 }, (_, k) =>
              add(
                center,
                add(
                  mul(u, (radius + 0.2) * Math.cos((k * Math.PI) / 12)),
                  mul(v, (radius + 0.2) * Math.sin((k * Math.PI) / 12)),
                ),
              ),
            ),
          ];
          const available = Math.min(...samples.map((p) => depthAt(pieces[b], p, n)));
          const backing = Math.min(...samples.map((p) => depthAt(pieces[a], p, mul(n, -1))));
          const depth = Math.min(3, available - 1);
          if (!Number.isFinite(depth) || depth < 1 || backing < 0.8) continue;
          if (!socketFits(pieces[b], center, n, radius + 0.2, depth + 0.2)) continue;
          pieces[a] = feature(pieces[a], i, center, radius, depth);
          pieces[b] = feature(pieces[b], j, center, radius + 0.2, -(depth + 0.2));
          created++;
          connected = true;
          break;
        }
        if (connected) break;
      }
    }
  if (!created)
    throw new Error(
      'Sem espaço seguro para junções neste corte (mínimo: pino de 1,2 mm e parede de 0,8 mm). Mova a linha ou desmarque as junções.',
    );
  return { pieces, created };
}
