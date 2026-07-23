// Coarse polygon approximating mainland France's border, used to filter out
// points from neighboring countries that fall inside the bounding box (e.g.
// Belgium, Switzerland, Spain, Italy corners). Not survey-accurate, just
// tight enough to keep the map to France.
const FRANCE_POLYGON: [number, number][] = [
  [51.1, 2.5], // Dunkerque area
  [50.8, 4.2],
  [49.5, 5.9],
  [49.0, 6.4],
  [48.3, 8.2],
  [47.6, 7.6],
  [47.5, 7.2],
  [46.4, 6.9],
  [45.9, 7.0],
  [44.9, 7.7],
  [43.9, 7.6],
  [43.5, 7.6],
  [43.0, 6.5],
  [42.4, 3.2],
  [42.3, 1.8],
  [43.0, 0.0],
  [43.3, -1.8],
  [44.0, -1.3],
  [45.7, -1.2],
  [47.3, -2.5],
  [48.6, -4.8],
  [48.9, -1.9],
  [49.7, -1.9],
  [50.9, 1.6],
  [51.1, 2.5],
];

function pointInPolygon(lat: number, lon: number, polygon: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [latI, lonI] = polygon[i];
    const [latJ, lonJ] = polygon[j];
    const intersects =
      latI > lat !== latJ > lat &&
      lon < ((lonJ - lonI) * (lat - latI)) / (latJ - latI) + lonI;
    if (intersects) inside = !inside;
  }
  return inside;
}

// Corsica bounding box, checked separately since it's not attached to the mainland polygon.
function isInCorsica(lat: number, lon: number): boolean {
  return lat >= 41.3 && lat <= 43.1 && lon >= 8.5 && lon <= 9.6;
}

export function isInMainlandFrance(lat: number, lon: number): boolean {
  return pointInPolygon(lat, lon, FRANCE_POLYGON) || isInCorsica(lat, lon);
}
