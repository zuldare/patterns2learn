import type { Category, Entity, Scene } from '../../../engine/types';

export const category: Category = 'creational';

const MAIN = 'creational/singleton/src/main/java/com/patterns2learn/box/singleton';
const TEST = 'creational/singleton/src/test/java/com/patterns2learn/box/singleton';

/** Platform height: everything inside the Spring context stands on it. */
const FLOOR = 0.25;
const BLOCK = { w: 1, d: 1, h: 0.6 };

/** Block centred on (cx, cy), standing on the context platform. */
const at = (cx: number, cy: number, size = BLOCK) => ({
  pos: { x: cx - size.w / 2, y: cy - size.d / 2, z: FLOOR },
  size,
});

/*
 * Layout notes:
 * - The coach (left) talks to WodController, the athlete (right) to BookingService;
 *   the athlete stands off the front-right edge so it never covers the "Spring context" label.
 * - catalogA/catalogB (the naive copies) sit next to their own consumer, so the
 *   two copies read as two separate objects; classic and the Spring catalog share
 *   one central spot (never visible together).
 * - The timers only appear in spring-does-it, alone with the catalog.
 */
const entities: Entity[] = [
  { id: 'coach', kind: 'actor', label: 'Coach', pos: { x: 1.0, y: 10.9 }, size: { w: 1.2, d: 1.2, h: 0.5 }, tone: 'neutral' },
  { id: 'athlete', kind: 'actor', label: 'Athlete', pos: { x: 13.4, y: 8.0 }, size: { w: 1.2, d: 1.2, h: 0.5 }, tone: 'neutral' },
  { id: 'context', kind: 'container', label: 'Spring context', pos: { x: 0, y: 0 }, size: { w: 12.4, d: 9.8, h: FLOOR }, tone: 'neutral' },
  { id: 'controller', kind: 'block', label: 'WodController', ...at(2.5, 6.5), tone: 'neutral', icon: 'arrow-in' },
  { id: 'booking', kind: 'block', label: 'BookingService', ...at(7.2, 7.2), tone: 'neutral', icon: 'calendar' },
  { id: 'catalogA', kind: 'block', label: 'WodCatalog #1', ...at(3.0, 2.4), tone: 'warn', icon: 'board' },
  { id: 'catalogB', kind: 'block', label: 'WodCatalog #2', ...at(10.6, 5.4), tone: 'warn', icon: 'board' },
  { id: 'classic', kind: 'block', label: 'ClassicWodCatalog', ...at(7.0, 2.6), tone: 'danger', icon: 'board' },
  { id: 'catalog', kind: 'block', label: 'WodCatalog', ...at(7.0, 2.6), tone: 'accent', icon: 'board' },
  { id: 'timer1', kind: 'block', label: 'WodTimer #1', ...at(9.6, 5.6), tone: 'neutral', icon: 'timer' },
  { id: 'timer2', kind: 'block', label: 'WodTimer #2', ...at(10.8, 3.2), tone: 'neutral', icon: 'timer' },
];

const PEOPLE = ['coach', 'athlete', 'controller', 'booking'];
const SPRING = ['context', ...PEOPLE, 'catalog'];

const scene: Scene = {
  entities,
  links: [
    { id: 'l-coach-controller', from: 'coach', to: 'controller', style: 'call' },
    { id: 'l-athlete-booking', from: 'athlete', to: 'booking', style: 'call' },
    { id: 'l-controller-catalogA', from: 'controller', to: 'catalogA', style: 'call' },
    { id: 'l-booking-catalogB', from: 'booking', to: 'catalogB', style: 'call' },
    { id: 'l-controller-classic', from: 'controller', to: 'classic', style: 'call' },
    { id: 'l-booking-classic', from: 'booking', to: 'classic', style: 'call' },
    { id: 'l-controller-catalog', from: 'controller', to: 'catalog', style: 'injects' },
    { id: 'l-booking-catalog', from: 'booking', to: 'catalog', style: 'injects' },
  ],
  steps: [
    {
      id: 'problem',
      visible: [...PEOPLE, 'catalogA', 'catalogB'],
      highlight: ['catalogA', 'catalogB'],
      packets: [],
      code: { file: `${MAIN}/before/NaiveWiring.java`, region: 'naive-new', highlight: [2, 9] },
    },
    {
      id: 'smell',
      visible: [...PEOPLE, 'catalogA', 'catalogB'],
      highlight: ['catalogB'],
      packets: [
        { link: 'l-coach-controller', label: 'Murph' },
        { link: 'l-controller-catalogA', label: 'Murph' },
      ],
      code: { file: `${TEST}/before/NaiveWiringTest.java`, region: 'naive-smell', highlight: [4, 7] },
    },
    {
      id: 'classic',
      visible: [...PEOPLE, 'classic'],
      highlight: ['classic'],
      packets: [],
      code: { file: `${MAIN}/before/ClassicWodCatalog.java`, region: 'classic', highlight: [4, 10, 13] },
    },
    {
      id: 'classic-cons',
      visible: [...PEOPLE, 'classic'],
      highlight: ['classic'],
      packets: [],
      code: { file: `${TEST}/before/ClassicWodCatalogTest.java`, region: 'classic-leak', highlight: [5, 6] },
    },
    {
      id: 'spring-bean',
      visible: SPRING,
      highlight: ['context', 'catalog'],
      packets: [],
      code: { file: `${MAIN}/WodCatalog.java`, region: 'catalog-bean', highlight: [1, 2, 5] },
    },
    {
      id: 'shared',
      visible: SPRING,
      highlight: ['catalog'],
      packets: [
        { link: 'l-coach-controller', label: 'POST Murph' },
        { link: 'l-controller-catalog', label: 'add Murph' },
        { link: 'l-athlete-booking', label: 'book Murph' },
        { link: 'l-booking-catalog', label: 'find Murph' },
      ],
      code: { file: `${TEST}/web/WodApiTest.java`, region: 'shared-instance', highlight: [1, 5] },
    },
    {
      id: 'threads',
      visible: SPRING,
      highlight: ['catalog'],
      packets: [
        { link: 'l-controller-catalog', label: 'add Murph' },
        { link: 'l-booking-catalog', label: 'find Fran' },
      ],
      code: { file: `${MAIN}/WodCatalog.java`, region: 'thread-safe', highlight: [4] },
    },
    {
      id: 'spring-does-it',
      visible: ['context', 'catalog', 'timer1', 'timer2'],
      highlight: ['timer1', 'timer2'],
      packets: [],
      code: { file: `${TEST}/SpringDoesItTooTest.java`, region: 'scopes', highlight: [2, 5] },
    },
    {
      id: 'recap',
      visible: SPRING,
      highlight: [],
      packets: [],
      code: { file: `${MAIN}/WodCatalog.java`, region: 'catalog-bean', highlight: [1, 2, 3] },
    },
  ],
};

export default scene;
