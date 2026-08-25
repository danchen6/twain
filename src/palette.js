import { createSeededRandom } from "./generator.js";

function route(stops, accent) {
  return Object.freeze({
    accent,
    stops: Object.freeze(stops),
  });
}

function palette(id, a, b) {
  return Object.freeze({ id, a, b });
}

export const ROUTE_PALETTES = Object.freeze([
  palette(
    "sunset-ocean",
    route(["#ffb51b", "#f77a12", "#db3f25"], "#f06f10"),
    route(["#55d0c7", "#168fa8", "#3158c6"], "#168ca6"),
  ),
  palette(
    "violet-gold",
    route(["#bb8cff", "#7d55e7", "#4b35b7"], "#7449dd"),
    route(["#ffd35a", "#efa51c", "#cf6f0a"], "#d98200"),
  ),
  palette(
    "cobalt-coral",
    route(["#63b4ff", "#2879e7", "#303fb2"], "#216bd6"),
    route(["#ff9a73", "#ef5b47", "#c63248"], "#e64b3c"),
  ),
  palette(
    "fuchsia-cyan",
    route(["#ff83c2", "#d94092", "#92245f"], "#c92f82"),
    route(["#66ddd1", "#13a4b7", "#1765ad"], "#008fa3"),
  ),
  palette(
    "emerald-plum",
    route(["#61d49b", "#1a9c73", "#126146"], "#16835d"),
    route(["#d08aff", "#9a4ed6", "#5e2f9f"], "#8b3cc7"),
  ),
  palette(
    "aqua-crimson",
    route(["#58d6d2", "#0aa3aa", "#086477"], "#008b91"),
    route(["#ff8a8b", "#e4495b", "#a82149"], "#d3374e"),
  ),
]);

export function routePaletteForSeed(seed) {
  const random = createSeededRandom(`route-palette:v1:${String(seed ?? "")}`);
  const index = Math.floor(random() * ROUTE_PALETTES.length);
  return ROUTE_PALETTES[index];
}
