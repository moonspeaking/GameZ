/**
 * Slim pixel-art person in the proportions of the original video: small head, thin limbs, muted
 * clothes, a dark pixel outline and a white name tag. Origin is the feet, +x is "forward".
 * Shared by the prologue runners and the colonists in the game.
 */
const OUT = '#1d1612';

export const NAMES_RU = { ray: 'РЭЙ', nora: 'НОРА', walt: 'УОЛТ', eli: 'ЭЛАЙ' };

export const LOOKS = {
  ray: { jacket: '#8a5a3c', pants: '#3b4350', skin: '#d9a77c', hair: '#2b2118', hat: 'cap', hatColor: '#3a2a20' },
  nora: { jacket: '#b5524a', pants: '#3a3438', skin: '#e0b48c', hair: '#4a2f1c', hat: 'ponytail' },
  walt: { jacket: '#7a5638', pants: '#5e5648', skin: '#c99a72', hair: '#9a9a94', hat: 'hard', hatColor: '#d9a441', beard: true },
  eli: { jacket: '#3f7f86', pants: '#2c3340', skin: '#b98760', hair: '#1c1c20', hat: 'cap', hatColor: '#8a3a2e' },
  default: { jacket: '#5b6670', pants: '#34393f', skin: '#d4a782', hair: '#2b2b2b', hat: 'cap', hatColor: '#232a31' }
};

function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, Math.round(((n >> 16) & 255) * f)));
  const g = Math.max(0, Math.min(255, Math.round(((n >> 8) & 255) * f)));
  const b = Math.max(0, Math.min(255, Math.round((n & 255) * f)));
  return `rgb(${r},${g},${b})`;
}

function px(ctx, c, x, y, w, h) {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

/** A part with a 1px dark outline. */
function part(ctx, c, x, y, w, h) {
  px(ctx, OUT, x - 1, y - 1, w + 2, h + 2);
  px(ctx, c, x, y, w, h);
}

export function drawNameTag(ctx, x, y, name) {
  ctx.font = 'bold 7px sans-serif';
  const tw = Math.ceil(ctx.measureText(name).width);
  px(ctx, OUT, x - tw / 2 - 3, y, tw + 6, 11);
  px(ctx, '#f4efe4', x - tw / 2 - 2, y + 1, tw + 4, 9);
  ctx.fillStyle = OUT;
  ctx.fillText(name, Math.round(x - tw / 2), y + 8);
}

/**
 * opts: { id, pose: 'run'|'walk'|'stand'|'climb', facing: 1|-1, phase, color, tag }
 */
export function drawPerson(ctx, x, y, opts) {
  const look = { ...(LOOKS[opts.id] || LOOKS.default) };
  if (!LOOKS[opts.id] && opts.color) look.jacket = opts.color;
  const pose = opts.pose || 'stand';
  const facing = opts.facing || 1;
  const ph = opts.phase || 0;
  const climbing = pose === 'climb';
  // Pixel-art style: the cycle is quantised to 8 even frames instead of a continuous sine,
  // so the limbs move in clean steps rather than jittering between rounded positions.
  const frame = Math.floor(ph / (Math.PI / 4));
  const s = pose === 'stand' ? 0 : Math.sin(frame * Math.PI / 4);
  const stride = pose === 'run' ? 4 : pose === 'walk' ? 2 : 0;
  const bob = pose === 'run' ? Math.round(Math.abs(Math.cos(frame * Math.PI / 4)) * 2) : 0;
  const lean = pose === 'run' ? 1 : 0;

  const bx = Math.round(x);
  const by = Math.round(y - bob);

  // Ground shadow (not mirrored)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath(); ctx.ellipse(bx, y + 1, 7, 2, 0, 0, Math.PI * 2); ctx.fill();

  ctx.save();
  ctx.translate(bx, 0);
  ctx.scale(facing, 1);
  const X = 0;

  const dark = shade(look.pants, 0.7);

  // Far arm (behind the body) and far leg
  const armSwing = Math.round(s * (stride + 1));
  if (climbing) {
    part(ctx, shade(look.jacket, 0.75), X + 2, by - 36 - Math.round(s * 3), 2, 10);
  } else {
    part(ctx, shade(look.jacket, 0.75), X - 1 + armSwing, by - 26, 2, 9);
  }
  const legA = climbing ? 0 : Math.round(s * stride);
  const legLift = climbing ? Math.round(s * 3) : 0;
  part(ctx, dark, X - 2 + legA, by - 14 + legLift, 3, 12 - legLift);
  px(ctx, '#15110e', X - 2 + legA, by - 3 + legLift, 4, 3);

  // Near leg
  part(ctx, look.pants, X - 1 - legA, by - 14 - legLift, 3, 12 + legLift);
  px(ctx, '#15110e', X - 1 - legA, by - 3 - legLift, 4, 3);

  // Torso: slight lean when running, shading on the back side, hem and belt
  part(ctx, look.jacket, X - 3 + lean, by - 28, 7, 15);
  px(ctx, shade(look.jacket, 0.78), X - 3 + lean, by - 28, 2, 15);
  px(ctx, shade(look.jacket, 1.15), X + 2 + lean, by - 27, 1, 5);
  px(ctx, '#2b2119', X - 3 + lean, by - 16, 7, 1);

  // Near arm
  if (climbing) {
    part(ctx, look.jacket, X - 3, by - 36 + Math.round(s * 3), 2, 10);
    px(ctx, look.skin, X - 3, by - 37 + Math.round(s * 3), 2, 2);
    px(ctx, look.skin, X + 2, by - 37 - Math.round(s * 3), 2, 2);
  } else {
    part(ctx, look.jacket, X + 1 - armSwing, by - 26, 2, 9);
    px(ctx, look.skin, X + 1 - armSwing, by - 17, 2, 2);
  }

  // Head
  const hx = X - 2 + lean;
  px(ctx, look.skin, hx + 1, by - 30, 3, 2);                        // neck
  part(ctx, look.skin, hx, by - 37, 6, 8);
  if (!climbing) {
    px(ctx, '#1d1612', hx + 4, by - 34, 1, 2);                       // eye
    if (look.beard) px(ctx, look.hair, hx + 2, by - 31, 4, 2);
  }
  // Hair / headgear
  if (look.hat === 'hard') {
    part(ctx, look.hatColor, hx - 1, by - 40, 8, 4);
    px(ctx, look.hatColor, hx + 5, by - 37, 3, 1);
    px(ctx, '#fff6c9', hx + 5, by - 39, 1, 1);
  } else if (look.hat === 'cap') {
    part(ctx, look.hatColor, hx, by - 39, 6, 3);
    px(ctx, look.hatColor, hx + 5, by - 37, 3, 1);
    px(ctx, look.hair, hx - 1, by - 36, 1, 3);
  } else if (look.hat === 'ponytail') {
    part(ctx, look.hair, hx, by - 39, 6, 4);
    px(ctx, look.hair, hx - 2, by - 35, 2, 5);
  }
  if (climbing) px(ctx, look.hair, hx, by - 37, 6, 4);              // back of the head
  ctx.restore();

  if (opts.tag) drawNameTag(ctx, bx, by - 50, opts.tag);
}
