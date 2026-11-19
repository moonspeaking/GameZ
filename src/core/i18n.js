/** Display names for roles. The English keys stay the identifiers used by the game logic. */
export const ROLE_RU = {
  ELEC: 'электрик', MED: 'медик', ENG: 'инженер', SCOUT: 'разведчик', GUARD: 'охранник',
  FARM: 'фермер', CHILD: 'ребёнок', INFANT: 'младенец', TECH: 'техник', STUDENT: 'ученик',
  ELDER: 'старейшина', OUTSIDE: 'на поверхности', LEADER: 'лидер',
  WORKER: 'рабочий', FARMER: 'фермер', MEDIC: 'медик', ENGINEER: 'инженер', TEACHER: 'учитель'
};

export function roleLabel(role) {
  return ROLE_RU[role] || String(role || '').toLowerCase();
}
