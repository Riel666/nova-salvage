// Seeded randomness (mulberry32) so a staged screenshot is the same frame
// every run: the same seed always deals the same field.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const range = (rng, min, max) => min + rng() * (max - min);
export const pick = (rng, items) => items[Math.floor(rng() * items.length)];
export const chance = (rng, p) => rng() < p;
export const TAU = Math.PI * 2;
