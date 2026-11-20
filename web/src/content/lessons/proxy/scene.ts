import type { Category, Entity, Scene } from '../../../engine/types';

export const category: Category = 'structural';

const MAIN = 'structural/proxy/src/main/java/com/patterns2learn/box/proxy';
const TEST = 'structural/proxy/src/test/java/com/patterns2learn/box/proxy';

/** Platform height: everything inside the Spring context stands on it. */
const FLOOR = 0.25;
const BLOCK = { w: 1, d: 1, h: 0.6 };
const IFACE = { w: 1.4, d: 1.4, h: 0.6 };

/** Block centred on (cx, cy), standing on the context platform. */
const at = (cx: number, cy: number, size = BLOCK) => ({
  pos: { x: cx - size.w / 2, y: cy - size.d / 2, z: FLOOR },
  size,
});

/*
 * Layout notes (screen x ∝ x − y, screen y ∝ x + y). A staircase, so the scene stays narrow and its labels readable:
 * - The athlete stands off the platform's back-left edge, high above the controller, and calls down into it.
 * - Middle row, left to right: controller → (proxy) → service, about 6 units of x − y apart so each
 *   parked packet sits between two blocks.
 * - The database sits a row below, just right of the service, so INSERT + UPDATE parks on the drop.
 * - manual / handProxy / proxy share the "in front of the service" spot and
 *   real / service share the service spot: never visible together.
 * - BookingOperations sits in the lower row between proxy and service so both implements arrows point down.
 * - ProxyFactory only appears in spring-does-it, in the controller's spot (hidden then), left of the proxy it builds.
 */
const entities: Entity[] = [
  { id: 'athlete', kind: 'actor', label: 'Athlete', pos: { x: -3.6, y: -1.6 }, size: { w: 1.2, d: 1.2, h: 0.5 }, tone: 'neutral' },
  { id: 'context', kind: 'container', label: 'Spring context', pos: { x: 1.5, y: -4.3 }, size: { w: 13.55, d: 8.8, h: FLOOR }, tone: 'neutral' },
  { id: 'controller', kind: 'block', label: 'BookingController', ...at(3, 3), tone: 'neutral', icon: 'arrow-in' },
  { id: 'manual', kind: 'block', label: 'ManualTxBookingService', ...at(5.9, 0.1), tone: 'danger', icon: 'warning' },
  { id: 'handProxy', kind: 'block', label: 'TxBookingProxy', ...at(5.9, 0.1), tone: 'warn', icon: 'shield' },
  { id: 'proxy', kind: 'block', label: 'BookingService (proxy)', ...at(5.9, 0.1), tone: 'accent', icon: 'shield' },
  { id: 'real', kind: 'block', label: 'PlainBookingService', ...at(8.8, -2.8), tone: 'neutral', icon: 'calendar' },
  { id: 'service', kind: 'block', label: 'BookingService', ...at(8.8, -2.8), tone: 'neutral', icon: 'calendar' },
  { id: 'ops', kind: 'interface', label: 'BookingOperations', ...at(10.85, 2.15, IFACE), tone: 'neutral' },
  { id: 'db', kind: 'block', label: 'Database', ...at(13.55, -0.05), tone: 'neutral', icon: 'db' },
  { id: 'pf', kind: 'block', label: 'ProxyFactory', ...at(3, 3), tone: 'accent', icon: 'gear' },
];

const SPRING = ['athlete', 'context', 'controller', 'proxy', 'service', 'db'];
const GOF = ['athlete', 'controller', 'handProxy', 'real', 'ops', 'db'];

const scene: Scene = {
  entities,
  links: [
    { id: 'l-athlete-controller', from: 'athlete', to: 'controller', style: 'call' },
    { id: 'l-controller-manual', from: 'controller', to: 'manual', style: 'call' },
    { id: 'l-manual-db', from: 'manual', to: 'db', style: 'call' },
    { id: 'l-controller-handproxy', from: 'controller', to: 'handProxy', style: 'call' },
    { id: 'l-handproxy-real', from: 'handProxy', to: 'real', style: 'call' },
    { id: 'l-handproxy-ops', from: 'handProxy', to: 'ops', style: 'implements' },
    { id: 'l-real-ops', from: 'real', to: 'ops', style: 'implements' },
    { id: 'l-real-db', from: 'real', to: 'db', style: 'call' },
    { id: 'l-controller-proxy', from: 'controller', to: 'proxy', style: 'call' },
    { id: 'l-proxy-service', from: 'proxy', to: 'service', style: 'call' },
    { id: 'l-service-db', from: 'service', to: 'db', style: 'call' },
    { id: 'l-pf-proxy', from: 'pf', to: 'proxy', style: 'call' },
  ],
  steps: [
    {
      id: 'problem',
      visible: ['athlete', 'controller', 'manual', 'db'],
      highlight: ['manual'],
      packets: [{ link: 'l-athlete-controller', label: 'POST booking' }],
      code: { file: `${MAIN}/before/ManualTxBookingService.java`, region: 'manual-tx', highlight: [2, 8, 10, 11] },
    },
    {
      id: 'smell',
      visible: ['athlete', 'controller', 'manual', 'db'],
      highlight: ['manual'],
      packets: [],
      code: { file: `${MAIN}/before/ManualTxBookingService.java`, region: 'manual-repeat', highlight: [2, 6, 7, 8] },
    },
    {
      id: 'gof-proxy',
      visible: GOF,
      highlight: ['handProxy', 'ops'],
      packets: [
        { link: 'l-controller-handproxy', label: 'book()' },
        { link: 'l-handproxy-real', label: 'book()' },
      ],
      code: { file: `${MAIN}/before/TxBookingProxy.java`, region: 'hand-proxy', highlight: [1, 14] },
    },
    {
      id: 'gof-cons',
      visible: GOF,
      highlight: ['handProxy'],
      packets: [],
      code: { file: `${MAIN}/before/TxBookingProxy.java`, region: 'hand-proxy', highlight: [12, 15, 18] },
    },
    {
      id: 'spring-tx',
      visible: SPRING,
      highlight: ['context', 'proxy'],
      packets: [],
      code: { file: `${MAIN}/BookingService.java`, region: 'tx-annotation', highlight: [1] },
    },
    {
      id: 'request',
      visible: SPRING,
      highlight: ['proxy'],
      packets: [
        { link: 'l-athlete-controller', label: 'POST booking' },
        { link: 'l-controller-proxy', label: 'book()' },
        { link: 'l-proxy-service', label: 'BEGIN · book()' },
        { link: 'l-service-db', label: 'INSERT + UPDATE' },
        { link: 'l-controller-proxy', label: 'ROLLBACK · 409', reverse: true },
      ],
      code: { file: `${TEST}/BookingServiceTest.java`, region: 'rollback', highlight: [2, 4, 7] },
    },
    {
      id: 'self-call',
      visible: SPRING,
      highlight: ['service'],
      packets: [
        { link: 'l-controller-proxy', label: 'bookPair()' },
        { link: 'l-proxy-service', label: 'bookPair()' },
      ],
      code: { file: `${MAIN}/BookingService.java`, region: 'self-call', highlight: [3, 4] },
    },
    {
      id: 'spring-does-it',
      visible: ['context', 'pf', 'proxy', 'service'],
      highlight: ['pf', 'proxy'],
      packets: [{ link: 'l-pf-proxy', label: 'getProxy()' }],
      code: { file: `${TEST}/SpringDoesItTooTest.java`, region: 'proxy-factory', highlight: [1, 2, 5, 9, 13] },
    },
    {
      id: 'recap',
      visible: SPRING,
      highlight: [],
      packets: [],
      code: { file: `${MAIN}/BookingService.java`, region: 'tx-annotation', highlight: [1, 2] },
    },
  ],
};

export default scene;
