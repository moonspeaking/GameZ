/**
 * Current viewport size in CSS pixels. Written by the renderer on resize,
 * read by logic that needs to position the camera. Zero dependencies.
 */
export const viewport = { w: 1200, h: 700, visibleW: 1200 };
// visibleW = width of the map area not covered by the sidebar HUD (used to centre the camera).
