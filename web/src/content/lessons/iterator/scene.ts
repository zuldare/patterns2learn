import type { Category, Entity, Scene } from '../../../engine/types';

export const category: Category = 'behavioral';

const MAIN = 'behavioral/iterator/src/main/java/com/patterns2learn/box/iterator';
const TEST = 'behavioral/iterator/src/test/java/com/patterns2learn/box/iterator';

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
 * - Left to right: controller (sx −10) → Leaderboard, the client (sx −5.5) → PagedResultIterator (sx 3.5)
 *   → the result table (sx 8). ResultHistory, the aggregate, sits above (sx −1, up) and hands out iterators.
 * - The two "before" classes take the Leaderboard's spot.
 * - spring-does-it: JdbcClient in ResultHistory's spot, the Stream in the iterator's spot.
 */
const entities: Entity[] = [
  { id: 'coach', kind: 'actor', label: 'Coach', pos: { x: 3.9, y: 18.0 }, size: { w: 1.2, d: 1.2, h: 0.5 }, tone: 'neutral' },
  { id: 'context', kind: 'container', label: 'Spring context', pos: { x: 0, y: 0 }, size: { w: 15.4, d: 16.4, h: FLOOR }, tone: 'neutral' },
  { id: 'controller', kind: 'block', label: 'LeaderboardController', ...at(5.5, 15.5), tone: 'neutral', icon: 'arrow-in' },
  { id: 'loadAll', kind: 'block', label: 'LoadEverythingLeaderboard', ...at(7.75, 13.25), tone: 'danger', icon: 'warning' },
  { id: 'offsetLoop', kind: 'block', label: 'OffsetLoopReport', ...at(7.75, 13.25), tone: 'danger', icon: 'warning' },
  { id: 'leaderboard', kind: 'block', label: 'Leaderboard', ...at(7.75, 13.25), tone: 'neutral', icon: 'medal' },
  { id: 'history', kind: 'block', label: 'ResultHistory', ...at(6.5, 7.5), tone: 'accent', icon: 'board' },
  { id: 'iterator', kind: 'block', label: 'PagedResultIterator', ...at(12.25, 8.75), tone: 'accent', icon: 'arrow-in' },
  { id: 'db', kind: 'block', label: 'result table', ...at(14.5, 6.5), tone: 'neutral', icon: 'db' },
  { id: 'jdbc', kind: 'block', label: 'JdbcClient', ...at(6.5, 7.5), tone: 'accent', icon: 'gear' },
  { id: 'stream', kind: 'block', label: 'Stream<Result>', ...at(12.25, 8.75), tone: 'accent', icon: 'arrow-in' },
];

const SPRING = ['context', 'coach', 'controller', 'leaderboard', 'history', 'iterator', 'db'];

const scene: Scene = {
  entities,
  links: [
    { id: 'l-coach-controller', from: 'coach', to: 'controller', style: 'call' },
    { id: 'l-controller-loadall', from: 'controller', to: 'loadAll', style: 'call' },
    { id: 'l-loadall-db', from: 'loadAll', to: 'db', style: 'call' },
    { id: 'l-offset-db', from: 'offsetLoop', to: 'db', style: 'call' },
    { id: 'l-controller-leaderboard', from: 'controller', to: 'leaderboard', style: 'call' },
    { id: 'l-leaderboard-history', from: 'leaderboard', to: 'history', style: 'call' },
    { id: 'l-history-iterator', from: 'history', to: 'iterator', style: 'call' },
    { id: 'l-leaderboard-iterator', from: 'leaderboard', to: 'iterator', style: 'call' },
    { id: 'l-iterator-db', from: 'iterator', to: 'db', style: 'call' },
    { id: 'l-jdbc-stream', from: 'jdbc', to: 'stream', style: 'call' },
    { id: 'l-stream-db', from: 'stream', to: 'db', style: 'call' },
  ],
  steps: [
    {
      id: 'problem',
      visible: ['coach', 'controller', 'loadAll', 'db'],
      highlight: ['loadAll'],
      packets: [
        { link: 'l-coach-controller', label: 'top 3 · Fran' },
        { link: 'l-loadall-db', label: '230 rows' },
      ],
      code: { file: `${MAIN}/before/LoadEverythingLeaderboard.java`, region: 'load-all', highlight: [2, 3, 5] },
    },
    {
      id: 'smell',
      visible: ['offsetLoop', 'db'],
      highlight: ['offsetLoop'],
      packets: [{ link: 'l-offset-db', label: 'limit 50 offset ?' }],
      code: { file: `${MAIN}/before/OffsetLoopReport.java`, region: 'offset-loop', highlight: [3, 4, 5, 7, 8] },
    },
    {
      id: 'iterator',
      visible: ['iterator', 'db'],
      highlight: ['iterator'],
      packets: [{ link: 'l-iterator-db', label: 'next page' }],
      code: { file: `${MAIN}/PagedResultIterator.java`, region: 'iterator', highlight: [3, 5, 7, 13, 14] },
    },
    {
      id: 'aggregate',
      visible: ['history', 'iterator', 'db'],
      highlight: ['history'],
      packets: [{ link: 'l-history-iterator', label: 'new iterator' }],
      code: { file: `${MAIN}/ResultHistory.java`, region: 'aggregate', highlight: [2, 3] },
    },
    {
      id: 'client',
      visible: ['leaderboard', 'history', 'iterator', 'db'],
      highlight: ['leaderboard'],
      packets: [
        { link: 'l-leaderboard-history', label: 'fastest("fran")' },
        { link: 'l-leaderboard-iterator', label: 'next()' },
      ],
      code: { file: `${MAIN}/Leaderboard.java`, region: 'client', highlight: [4, 5, 6] },
    },
    {
      id: 'lazy',
      visible: ['leaderboard', 'history', 'iterator', 'db'],
      highlight: ['iterator', 'db'],
      packets: [{ link: 'l-iterator-db', label: '1 page of 5' }],
      code: { file: `${TEST}/ResultHistoryTest.java`, region: 'lazy', highlight: [3, 5, 7] },
    },
    {
      id: 'request',
      visible: SPRING,
      highlight: ['leaderboard', 'iterator'],
      packets: [
        { link: 'l-coach-controller', label: 'GET /api/leaderboard/fran?top=3' },
        { link: 'l-controller-leaderboard', label: 'top("fran", 3)' },
        { link: 'l-leaderboard-iterator', label: 'next() ×3' },
        { link: 'l-iterator-db', label: 'page 1' },
      ],
      code: { file: `${TEST}/web/LeaderboardApiTest.java`, region: 'request', highlight: [1, 3, 5] },
    },
    {
      id: 'spring-does-it',
      visible: ['context', 'jdbc', 'stream', 'db'],
      highlight: ['jdbc', 'stream'],
      packets: [
        { link: 'l-jdbc-stream', label: 'stream()' },
        { link: 'l-stream-db', label: 'rows as needed' },
      ],
      code: { file: `${TEST}/SpringDoesItTooTest.java`, region: 'stream', highlight: [2, 6, 7, 8] },
    },
    {
      id: 'recap',
      visible: SPRING,
      highlight: [],
      packets: [],
      code: { file: `${MAIN}/ResultHistory.java`, region: 'aggregate', highlight: [2, 3] },
    },
  ],
};

export default scene;
