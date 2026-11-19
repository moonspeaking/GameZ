/**
 * Camera math. G.cam.x / G.cam.y is the world position of the viewport's top-left corner;
 * G.cam.zoom scales the world (1 = native pixels, <1 = zoomed out).
 * screen = (world - cam) * zoom, so world = screen / zoom + cam.
 */
import { G } from './state.js';
import { viewport } from './viewport.js';
import { eventBus } from './event_bus.js';

export const MIN_ZOOM = 0.35;
export const MAX_ZOOM = 1.6;
export const GAME_DEFAULT_ZOOM = 0.8;

export function clampZoom(z) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
}

export function getZoom() {
  return G.cam.zoom || 1;
}

export function screenToWorld(sx, sy) {
  const z = getZoom();
  return { x: sx / z + G.cam.x, y: sy / z + G.cam.y };
}

/** Zoom by `factor`, keeping the world point under screen position (sx, sy) fixed. */
export function zoomAt(sx, sy, factor) {
  const before = screenToWorld(sx, sy);
  G.cam.zoom = clampZoom(getZoom() * factor);
  G.cam.x = before.x - sx / G.cam.zoom;
  G.cam.y = before.y - sy / G.cam.zoom;
  eventBus.emit('zoom_changed');
}

export function zoomAtCenter(factor) {
  zoomAt(viewport.visibleW / 2, viewport.h / 2, factor);
}

/** Pan by a screen-space delta (pixels), independent of zoom. */
export function panByScreen(dx, dy) {
  const z = getZoom();
  G.cam.x += dx / z;
  G.cam.y += dy / z;
}

/** Put the world point (wx, wy) in the middle of the screen. */
export function centerOn(wx, wy) {
  const z = getZoom();
  G.cam.x = wx - viewport.visibleW / z / 2;
  G.cam.y = wy - viewport.h / z / 2;
}
