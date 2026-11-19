/**
 * Composition root: the only place that knows which systems run in the loop, and in what order.
 * core/loop.js stays a generic engine; add or reorder game logic here.
 */
import { eventBus } from './core/event_bus.js';
import { registerUpdate, setRenderFn } from './core/loop.js';
import { onNewDay } from './systems/daily.js';
import { updatePrologue, rotateDialogue } from './systems/story.js';
import { patchDeathEvents } from './systems/memorial.js';
import { updateColonists } from './entities/colonists.js';
import { updateEnvironment } from './world/environment.js';
import { render, updateFx } from './render/renderer.js';

let wired = false;

export function wireSystems() {
  if (wired) return;
  wired = true;

  eventBus.on('new_day', onNewDay);
  patchDeathEvents(); // colonist:death events -> memorial

  registerUpdate('prologue', updatePrologue);

  registerUpdate('game', rotateDialogue);
  registerUpdate('game', updateEnvironment);
  registerUpdate('game', updateColonists);
  registerUpdate('game', updateFx);

  setRenderFn(render);
}
