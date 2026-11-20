import type { Category, Entity, Scene } from '../../../engine/types';

export const category: Category = 'creational';

const MAIN = 'creational/prototype/src/main/java/com/patterns2learn/box/prototype';
const TEST = 'creational/prototype/src/test/java/com/patterns2learn/box/prototype';

/** Platform height: everything inside the Spring context stands on it. */
const FLOOR = 0.25;
const BLOCK = { w: 1, d: 1, h: 0.6 };

/** Block centred on (cx, cy), standing on the context platform. */
const at = (cx: number, cy: number, size = BLOCK) => ({
  pos: { x: cx - size.w / 2, y: cy - size.d / 2, z: FLOOR },
  size,
});

/*
 * Layout notes. Positions come from screen coordinates (sx = x − y, sy = (x + y) / 2), shifted by +3:
 * - Left to right: controller (sx −10) → WeekService (sx −5.5) → ProgramLibrary (sx −1, up).
 * - On the right, the template week (up) and the copied week (down), each with its Wednesday next to it.
 * - Week 46 (last week) takes the template's spot in the first four steps; the template comes in with the registry.
 * - Before: ShallowCopyService takes WeekService's spot and Week 47 points at Week 46's Wednesday.
 * - spring-does-it: the base bean definition in the template week's spot, its clone in the copy's spot.
 */
const entities: Entity[] = [
  { id: 'coach', kind: 'actor', label: 'Coach', pos: { x: 4.4, y: 18.5 }, size: { w: 1.2, d: 1.2, h: 0.5 }, tone: 'neutral' },
  { id: 'context', kind: 'container', label: 'Spring context', pos: { x: 0, y: 0 }, size: { w: 18.0, d: 17.2, h: FLOOR }, tone: 'neutral' },
  { id: 'controller', kind: 'block', label: 'WeekController', ...at(6.0, 16.0), tone: 'neutral', icon: 'arrow-in' },
  { id: 'shallow', kind: 'block', label: 'ShallowCopyService', ...at(8.25, 13.75), tone: 'danger', icon: 'warning' },
  { id: 'service', kind: 'block', label: 'WeekService', ...at(8.25, 13.75), tone: 'neutral', icon: 'gear' },
  { id: 'library', kind: 'block', label: 'ProgramLibrary', ...at(7.0, 8.0), tone: 'accent', icon: 'board' },
  { id: 'tmplWeek', kind: 'block', label: 'Strength block', ...at(9.25, 5.75), tone: 'neutral', icon: 'calendar' },
  { id: 'tmplDay', kind: 'block', label: 'Wed: back squat', ...at(11.5, 3.5), tone: 'neutral', icon: 'file' },
  { id: 'week46', kind: 'block', label: 'Week 46', ...at(9.25, 5.75), tone: 'neutral', icon: 'calendar' },
  { id: 'week46Day', kind: 'block', label: 'Wed (week 46)', ...at(11.5, 3.5), tone: 'neutral', icon: 'file' },
  { id: 'copyWeek', kind: 'block', label: 'Week 47', ...at(14.75, 11.25), tone: 'accent', icon: 'calendar' },
  { id: 'copyDay', kind: 'block', label: 'Wed (week 47)', ...at(17.0, 9.0), tone: 'accent', icon: 'file' },
  { id: 'baseDef', kind: 'block', label: 'BeanDefinition (singleton)', ...at(9.25, 5.75), tone: 'neutral', icon: 'file' },
  { id: 'copyDef', kind: 'block', label: 'clone (prototype)', ...at(14.75, 11.25), tone: 'accent', icon: 'file' },
];

const SPRING = ['context', 'coach', 'controller', 'service', 'library', 'tmplWeek', 'tmplDay', 'copyWeek', 'copyDay'];

const scene: Scene = {
  entities,
  links: [
    { id: 'l-coach-controller', from: 'coach', to: 'controller', style: 'call' },
    { id: 'l-controller-shallow', from: 'controller', to: 'shallow', style: 'call' },
    { id: 'l-shallow-copy', from: 'shallow', to: 'copyWeek', style: 'call' },
    { id: 'l-controller-service', from: 'controller', to: 'service', style: 'call' },
    { id: 'l-service-library', from: 'service', to: 'library', style: 'call' },
    { id: 'l-library-tmpl', from: 'library', to: 'tmplWeek', style: 'call' },
    { id: 'l-tmpl-day', from: 'tmplWeek', to: 'tmplDay', style: 'call' },
    { id: 'l-tmpl-copy', from: 'tmplWeek', to: 'copyWeek', style: 'call' },
    { id: 'l-copy-shared', from: 'copyWeek', to: 'week46Day', style: 'call' },
    { id: 'l-46-day', from: 'week46', to: 'week46Day', style: 'call' },
    { id: 'l-46-copy', from: 'week46', to: 'copyWeek', style: 'call' },
    { id: 'l-copy-day', from: 'copyWeek', to: 'copyDay', style: 'call' },
    { id: 'l-def-clone', from: 'baseDef', to: 'copyDef', style: 'call' },
  ],
  steps: [
    {
      id: 'problem',
      visible: ['controller', 'shallow', 'week46', 'week46Day', 'copyWeek'],
      highlight: ['shallow', 'week46Day'],
      packets: [
        { link: 'l-shallow-copy', label: 'new list, same days' },
        { link: 'l-copy-shared', label: 'edit Wed' },
      ],
      code: { file: `${MAIN}/before/ShallowCopyService.java`, region: 'shallow', highlight: [2] },
    },
    {
      id: 'smell',
      visible: ['controller', 'shallow', 'week46', 'week46Day', 'copyWeek'],
      highlight: ['shallow'],
      packets: [],
      code: { file: `${MAIN}/before/ShallowCopyService.java`, region: 'shallow', highlight: [1, 2] },
    },
    {
      id: 'prototype',
      visible: ['week46', 'week46Day', 'copyWeek', 'copyDay'],
      highlight: ['week46', 'copyWeek'],
      packets: [{ link: 'l-46-copy', label: 'copy()' }],
      code: { file: `${MAIN}/WeekProgram.java`, region: 'prototype', highlight: [2, 4, 5] },
    },
    {
      id: 'day-copy',
      visible: ['week46', 'week46Day', 'copyWeek', 'copyDay'],
      highlight: ['copyDay'],
      packets: [{ link: 'l-copy-day', label: 'own list' }],
      code: { file: `${MAIN}/DayPlan.java`, region: 'day-copy', highlight: [2, 3] },
    },
    {
      id: 'registry',
      visible: ['library', 'tmplWeek', 'tmplDay', 'copyWeek', 'copyDay'],
      highlight: ['library'],
      packets: [
        { link: 'l-library-tmpl', label: '"strength-block"' },
        { link: 'l-tmpl-copy', label: 'copy().rename("Week 47")' },
      ],
      code: { file: `${MAIN}/ProgramLibrary.java`, region: 'registry', highlight: [1, 2] },
    },
    {
      id: 'deep',
      visible: ['library', 'tmplWeek', 'tmplDay', 'copyWeek', 'copyDay'],
      highlight: ['tmplDay', 'copyDay'],
      packets: [{ link: 'l-copy-day', label: 'edit Wed' }],
      code: { file: `${TEST}/WeekProgramTest.java`, region: 'deep', highlight: [2, 4, 6] },
    },
    {
      id: 'request',
      visible: SPRING,
      highlight: ['service', 'copyWeek'],
      packets: [
        { link: 'l-coach-controller', label: 'POST /api/weeks' },
        { link: 'l-controller-service', label: 'create()' },
        { link: 'l-service-library', label: 'newWeek()' },
        { link: 'l-tmpl-copy', label: 'copy()' },
      ],
      code: { file: `${TEST}/web/WeekApiTest.java`, region: 'request', highlight: [1, 3, 5, 7, 8] },
    },
    {
      id: 'spring-does-it',
      visible: ['context', 'baseDef', 'copyDef'],
      highlight: ['copyDef'],
      packets: [{ link: 'l-def-clone', label: 'cloneBeanDefinition()' }],
      code: { file: `${TEST}/SpringDoesItTooTest.java`, region: 'clone-definition', highlight: [5, 6, 8] },
    },
    {
      id: 'recap',
      visible: SPRING,
      highlight: [],
      packets: [],
      code: { file: `${MAIN}/WeekProgram.java`, region: 'prototype', highlight: [2, 4, 5] },
    },
  ],
};

export default scene;
