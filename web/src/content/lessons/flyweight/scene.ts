import type { Category, Entity, Scene } from '../../../engine/types';

export const category: Category = 'structural';

const MAIN = 'structural/flyweight/src/main/java/com/patterns2learn/box/flyweight';
const TEST = 'structural/flyweight/src/test/java/com/patterns2learn/box/flyweight';

/** Platform height: everything inside the Spring context stands on it. */
const FLOOR = 0.25;
const BLOCK = { w: 1, d: 1, h: 0.6 };
const SMALL = { w: 0.8, d: 0.8, h: 0.4 };

/** Block centred on (cx, cy), standing on the context platform. */
const at = (cx: number, cy: number, size = BLOCK) => ({
  pos: { x: cx - size.w / 2, y: cy - size.d / 2, z: FLOOR },
  size,
});

/*
 * Layout notes (u = x − y across, v = x + y down; 32 / 16 px per unit):
 * - Sets column (u 0): Ana's set on top, Leo's 10 v below, Eva's at the bottom row.
 * - Movements column (u 6.5): the back squat halfway between Ana and Leo (so each long line(…)
 *   pill parks on a diagonal, clear of both labels), MovementCatalog below it and the deadlift on
 *   Eva's row; the catalog feeds both movements along short vertical links.
 * - Bottom row, left to right: SetLog → Eva's set → deadlift. SetController sits up-left of SetLog
 *   (the long log(…) pill parks on that diagonal) and the athletes stand off the back-left edge,
 *   up-left of the controller.
 * - Before: three movement copies, each to the right of its set.
 * - spring-does-it: Integer.valueOf in Ana's spot, MimeTypeUtils in Eva's; the cached instances
 *   where the movements are.
 */
const entities: Entity[] = [
  { id: 'coach', kind: 'actor', label: 'Athletes', pos: { x: -1.6, y: 10.9 }, size: { w: 1.2, d: 1.2, h: 0.5 }, tone: 'neutral' },
  { id: 'context', kind: 'container', label: 'Spring context', pos: { x: 2.1, y: 0 }, size: { w: 16.65, d: 19, h: FLOOR }, tone: 'neutral' },
  { id: 'controller', kind: 'block', label: 'SetController', ...at(5.5, 15), tone: 'neutral', icon: 'arrow-in' },
  { id: 'service', kind: 'block', label: 'SetLog', ...at(11, 17.5), tone: 'neutral', icon: 'gear' },
  { id: 'set1', kind: 'block', label: 'Ana · 5 × squat', ...at(3.5, 4, SMALL), tone: 'neutral', icon: 'file' },
  { id: 'set2', kind: 'block', label: 'Leo · 3 × squat', ...at(8.5, 9, SMALL), tone: 'neutral', icon: 'file' },
  { id: 'set3', kind: 'block', label: 'Eva · 5 × deadlift', ...at(14, 14.5, SMALL), tone: 'neutral', icon: 'file' },
  { id: 'copy1', kind: 'block', label: 'squat copy', ...at(6, 1.5), tone: 'danger', icon: 'warning' },
  { id: 'copy2', kind: 'block', label: 'squat copy', ...at(11, 6.5), tone: 'danger', icon: 'warning' },
  { id: 'copy3', kind: 'block', label: 'deadlift copy', ...at(16.5, 12), tone: 'danger', icon: 'warning' },
  { id: 'squat', kind: 'block', label: 'Movement: back squat', ...at(9.25, 3.25), tone: 'accent', icon: 'medal' },
  { id: 'dead', kind: 'block', label: 'Movement: deadlift', ...at(17.25, 11.25), tone: 'accent', icon: 'medal' },
  { id: 'catalog', kind: 'block', label: 'MovementCatalog', ...at(13.25, 7.25), tone: 'accent', icon: 'db' },
  { id: 'valueOf', kind: 'block', label: 'Integer.valueOf(100)', ...at(3.5, 4, SMALL), tone: 'neutral', icon: 'ten' },
  { id: 'int100', kind: 'block', label: 'Integer 100 (cached)', ...at(9.25, 3.25), tone: 'accent', icon: 'ten' },
  { id: 'parse', kind: 'block', label: 'MimeTypeUtils.parseMimeType', ...at(14, 14.5, SMALL), tone: 'neutral', icon: 'file' },
  { id: 'json', kind: 'block', label: 'application/json (cached)', ...at(17.25, 11.25), tone: 'accent', icon: 'tag' },
];

const SETS = ['set1', 'set2', 'set3'];
const SHARED = [...SETS, 'squat', 'dead'];
const SPRING = ['context', 'coach', 'controller', 'service', ...SHARED, 'catalog'];

const scene: Scene = {
  entities,
  links: [
    { id: 'l-coach-controller', from: 'coach', to: 'controller', style: 'call' },
    { id: 'l-controller-service', from: 'controller', to: 'service', style: 'call' },
    { id: 'l-service-catalog', from: 'service', to: 'catalog', style: 'call' },
    { id: 'l-service-set3', from: 'service', to: 'set3', style: 'call' },
    { id: 'l-set1-copy', from: 'set1', to: 'copy1', style: 'call' },
    { id: 'l-set2-copy', from: 'set2', to: 'copy2', style: 'call' },
    { id: 'l-set3-copy', from: 'set3', to: 'copy3', style: 'call' },
    { id: 'l-set1-squat', from: 'set1', to: 'squat', style: 'call' },
    { id: 'l-set2-squat', from: 'set2', to: 'squat', style: 'call' },
    { id: 'l-set3-dead', from: 'set3', to: 'dead', style: 'call' },
    { id: 'l-catalog-squat', from: 'catalog', to: 'squat', style: 'call' },
    { id: 'l-catalog-dead', from: 'catalog', to: 'dead', style: 'call' },
    { id: 'l-valueof-int', from: 'valueOf', to: 'int100', style: 'call' },
    { id: 'l-parse-json', from: 'parse', to: 'json', style: 'call' },
  ],
  steps: [
    {
      id: 'problem',
      visible: [...SETS, 'copy1', 'copy2', 'copy3'],
      highlight: ['copy1', 'copy2', 'copy3'],
      packets: [],
      code: { file: `${MAIN}/before/CopiedMovementLog.java`, region: 'copies', highlight: [3, 4, 5] },
    },
    {
      id: 'flyweight',
      visible: ['squat', 'dead'],
      highlight: ['squat', 'dead'],
      packets: [],
      code: { file: `${MAIN}/Movement.java`, region: 'flyweight', highlight: [1, 2, 4] },
    },
    {
      id: 'extrinsic',
      visible: SHARED,
      highlight: ['set1', 'set2', 'squat'],
      packets: [
        { link: 'l-set1-squat', label: 'line("Ana", 5, 100)' },
        { link: 'l-set2-squat', label: 'line("Leo", 3, 120)' },
      ],
      code: { file: `${TEST}/MovementCatalogTest.java`, region: 'extrinsic', highlight: [2, 3, 5, 6, 7] },
    },
    {
      id: 'factory',
      visible: [...SHARED, 'catalog'],
      highlight: ['catalog'],
      packets: [
        { link: 'l-catalog-squat', label: 'computeIfAbsent' },
        { link: 'l-catalog-dead', label: 'computeIfAbsent' },
      ],
      code: { file: `${MAIN}/MovementCatalog.java`, region: 'factory', highlight: [3, 4, 9, 10, 11] },
    },
    {
      id: 'client',
      visible: ['service', ...SHARED, 'catalog'],
      highlight: ['service'],
      packets: [
        { link: 'l-service-catalog', label: 'get("deadlift")' },
        { link: 'l-service-set3', label: 'new LoggedSet(…)' },
      ],
      code: { file: `${MAIN}/SetLog.java`, region: 'client', highlight: [4] },
    },
    {
      id: 'share',
      visible: ['service', ...SHARED, 'catalog'],
      highlight: ['squat', 'dead', 'catalog'],
      packets: [],
      code: { file: `${TEST}/MovementCatalogTest.java`, region: 'share', highlight: [3, 4, 6, 7] },
    },
    {
      id: 'request',
      visible: ['context', 'coach', 'controller', 'service', 'set3', 'dead', 'catalog'],
      highlight: ['service', 'dead'],
      packets: [
        { link: 'l-coach-controller', label: 'POST /api/sets' },
        { link: 'l-controller-service', label: 'log("Eva", "deadlift", 5, 100)' },
        { link: 'l-service-catalog', label: 'get("deadlift")' },
        { link: 'l-set3-dead', label: 'shared' },
      ],
      code: { file: `${TEST}/web/SetApiTest.java`, region: 'request', highlight: [2, 4, 5, 7, 8, 9] },
    },
    {
      id: 'spring-does-it',
      visible: ['valueOf', 'int100', 'parse', 'json'],
      highlight: ['int100', 'json'],
      packets: [
        { link: 'l-valueof-int', label: 'same instance' },
        { link: 'l-parse-json', label: 'same instance' },
      ],
      code: { file: `${TEST}/SpringDoesItTooTest.java`, region: 'shared', highlight: [1, 2, 4, 5, 6] },
    },
    {
      id: 'recap',
      visible: SPRING,
      highlight: [],
      packets: [],
      code: { file: `${MAIN}/Movement.java`, region: 'flyweight', highlight: [2, 8] },
    },
  ],
};

export default scene;
