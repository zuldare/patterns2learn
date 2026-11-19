import type { Category, Entity, Scene } from '../../../engine/types';

export const category: Category = 'structural';

const MAIN = 'structural/adapter/src/main/java/com/patterns2learn/box/adapter';
const TEST = 'structural/adapter/src/test/java/com/patterns2learn/box/adapter';

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
 * Layout notes (screen x ∝ x − y, screen y ∝ (x + y) / 2; horizontal gaps shrink by cos 30°, so keep them ≥ 4):
 * - Left to right on screen: controller → ZoneBoard → HeartRateMonitor (the socket).
 * - The two adapters plug into the socket from the right, PulseBand above, HeartLink below;
 *   each vendor SDK sits further right of its adapter.
 * - VendorBoundZoneBoard (before) takes ZoneBoard's spot.
 * - spring-does-it reuses the same spots: DispatcherServlet (board), HandlerAdapter (socket),
 *   the two HandlerAdapters (adapters); their handlers sit further right because the adapters' names are long.
 */
const entities: Entity[] = [
  { id: 'coach', kind: 'actor', label: 'Coach', pos: { x: 6.0, y: 14.6 }, size: { w: 1.2, d: 1.2, h: 0.5 }, tone: 'neutral' },
  { id: 'context', kind: 'container', label: 'Spring context', pos: { x: 0, y: 0 }, size: { w: 17.9, d: 13.2, h: FLOOR }, tone: 'neutral' },
  { id: 'controller', kind: 'block', label: 'ZoneController', ...at(7.5, 12.5), tone: 'neutral', icon: 'arrow-in' },
  { id: 'boundBoard', kind: 'block', label: 'VendorBoundZoneBoard', ...at(8.1, 9.1), tone: 'danger', icon: 'warning' },
  { id: 'board', kind: 'block', label: 'ZoneBoard', ...at(8.1, 9.1), tone: 'neutral', icon: 'board' },
  { id: 'monitor', kind: 'interface', label: 'HeartRateMonitor', ...at(10.1, 7.1, IFACE), tone: 'neutral' },
  { id: 'pulseAdapter', kind: 'block', label: 'PulseBandMonitor', ...at(9.85, 3.35), tone: 'accent', icon: 'plug' },
  { id: 'heartAdapter', kind: 'block', label: 'HeartLinkMonitor', ...at(13.25, 6.75), tone: 'accent', icon: 'plug' },
  { id: 'pulseSdk', kind: 'block', label: 'PulseBandClient', ...at(12.1, 1.1), tone: 'neutral', icon: 'heart' },
  { id: 'heartSdk', kind: 'block', label: 'HeartLinkHub', ...at(15.5, 4.5), tone: 'neutral', icon: 'heart' },
  { id: 'dispatcher', kind: 'block', label: 'DispatcherServlet', ...at(8.1, 9.1), tone: 'neutral', icon: 'arrow-in' },
  { id: 'handlerAdapter', kind: 'interface', label: 'HandlerAdapter', ...at(10.1, 7.1, IFACE), tone: 'neutral' },
  { id: 'rmha', kind: 'block', label: 'RequestMappingHandlerAdapter', ...at(9.85, 3.35), tone: 'accent', icon: 'plug' },
  { id: 'hrha', kind: 'block', label: 'HttpRequestHandlerAdapter', ...at(13.25, 6.75), tone: 'accent', icon: 'plug' },
  { id: 'restHandler', kind: 'block', label: '@GetMapping zone()', ...at(14.2, 0.7), tone: 'neutral', icon: 'gear' },
  { id: 'legacyHandler', kind: 'block', label: '/legacy/ping', ...at(17.2, 3.7), tone: 'neutral', icon: 'file' },
];

const SPRING = ['context', 'coach', 'controller', 'board', 'monitor', 'pulseAdapter', 'pulseSdk'];

const scene: Scene = {
  entities,
  links: [
    { id: 'l-coach-controller', from: 'coach', to: 'controller', style: 'call' },
    { id: 'l-controller-bound', from: 'controller', to: 'boundBoard', style: 'call' },
    { id: 'l-bound-pulsesdk', from: 'boundBoard', to: 'pulseSdk', style: 'call' },
    { id: 'l-bound-heartsdk', from: 'boundBoard', to: 'heartSdk', style: 'call' },
    { id: 'l-controller-board', from: 'controller', to: 'board', style: 'call' },
    { id: 'l-board-monitor', from: 'board', to: 'monitor', style: 'call' },
    { id: 'l-pulse-monitor', from: 'pulseAdapter', to: 'monitor', style: 'implements' },
    { id: 'l-heart-monitor', from: 'heartAdapter', to: 'monitor', style: 'implements' },
    { id: 'l-pulse-sdk', from: 'pulseAdapter', to: 'pulseSdk', style: 'call' },
    { id: 'l-heart-sdk', from: 'heartAdapter', to: 'heartSdk', style: 'call' },
    { id: 'l-dispatcher-ha', from: 'dispatcher', to: 'handlerAdapter', style: 'call' },
    { id: 'l-rmha-ha', from: 'rmha', to: 'handlerAdapter', style: 'implements' },
    { id: 'l-hrha-ha', from: 'hrha', to: 'handlerAdapter', style: 'implements' },
    { id: 'l-rmha-rest', from: 'rmha', to: 'restHandler', style: 'call' },
    { id: 'l-hrha-legacy', from: 'hrha', to: 'legacyHandler', style: 'call' },
  ],
  steps: [
    {
      id: 'problem',
      visible: ['coach', 'controller', 'boundBoard', 'pulseSdk'],
      highlight: ['boundBoard'],
      packets: [
        { link: 'l-coach-controller', label: 'GET /api/zones/ana' },
        { link: 'l-bound-pulsesdk', label: 'latestBeat("PB-0042")' },
      ],
      code: { file: `${MAIN}/before/VendorBoundZoneBoard.java`, region: 'vendor-bound', highlight: [3, 7, 11, 12] },
    },
    {
      id: 'smell',
      visible: ['coach', 'controller', 'boundBoard', 'pulseSdk', 'heartSdk'],
      highlight: ['boundBoard', 'heartSdk'],
      packets: [{ link: 'l-bound-heartsdk', label: 'readSample(3) ?' }],
      code: { file: `${MAIN}/before/VendorBoundZoneBoard.java`, region: 'vendor-bound', highlight: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
    },
    {
      id: 'target',
      visible: ['board', 'monitor'],
      highlight: ['monitor'],
      packets: [{ link: 'l-board-monitor', label: 'current("ana")' }],
      code: { file: `${MAIN}/HeartRateMonitor.java`, region: 'target', highlight: [2, 4] },
    },
    {
      id: 'adapter',
      visible: ['board', 'monitor', 'pulseAdapter', 'pulseSdk'],
      highlight: ['pulseAdapter'],
      packets: [
        { link: 'l-board-monitor', label: 'current("ana")' },
        { link: 'l-pulse-sdk', label: 'latestBeat("PB-0042")' },
      ],
      code: { file: `${MAIN}/PulseBandMonitor.java`, region: 'adapter', highlight: [3, 6, 7, 11, 13] },
    },
    {
      id: 'client',
      visible: SPRING,
      highlight: ['context', 'board'],
      packets: [],
      code: { file: `${MAIN}/ZoneBoard.java`, region: 'board', highlight: [4, 5] },
    },
    {
      id: 'request',
      visible: SPRING,
      highlight: ['board', 'pulseAdapter'],
      packets: [
        { link: 'l-coach-controller', label: 'GET /api/zones/ana' },
        { link: 'l-controller-board', label: 'zoneOf("ana")' },
        { link: 'l-board-monitor', label: 'current()' },
        { link: 'l-pulse-sdk', label: 'latestBeat("PB-0042")' },
      ],
      code: { file: `${TEST}/ZoneBoardTest.java`, region: 'request', highlight: [1, 3, 5, 6] },
    },
    {
      id: 'heartlink',
      visible: ['monitor', 'pulseAdapter', 'pulseSdk', 'heartAdapter', 'heartSdk'],
      highlight: ['heartAdapter'],
      packets: [{ link: 'l-heart-sdk', label: 'readSample(3)' }],
      code: { file: `${MAIN}/HeartLinkMonitor.java`, region: 'heartlink', highlight: [3, 5, 6, 8, 13] },
    },
    {
      id: 'switch',
      visible: ['context', 'coach', 'controller', 'board', 'monitor', 'heartAdapter', 'heartSdk'],
      highlight: ['heartAdapter'],
      packets: [
        { link: 'l-coach-controller', label: 'GET /api/zones/ana' },
        { link: 'l-board-monitor', label: 'current()' },
        { link: 'l-heart-sdk', label: '"HR=171;T=…"' },
      ],
      code: { file: `${MAIN}/HeartLinkConfig.java`, region: 'config', highlight: [3, 11, 12] },
    },
    {
      id: 'spring-does-it',
      visible: ['context', 'dispatcher', 'handlerAdapter', 'rmha', 'hrha', 'restHandler', 'legacyHandler'],
      highlight: ['handlerAdapter', 'hrha'],
      packets: [
        { link: 'l-dispatcher-ha', label: 'handle()' },
        { link: 'l-hrha-legacy', label: 'handleRequest()' },
      ],
      code: { file: `${TEST}/SpringDoesItTooTest.java`, region: 'handler-adapter', highlight: [3, 5, 13, 15, 16] },
    },
    {
      id: 'recap',
      visible: ['context', 'coach', 'controller', 'board', 'monitor', 'pulseAdapter', 'pulseSdk', 'heartAdapter', 'heartSdk'],
      highlight: [],
      packets: [],
      code: { file: `${MAIN}/HeartRateMonitor.java`, region: 'target', highlight: [2, 4] },
    },
  ],
};

export default scene;
