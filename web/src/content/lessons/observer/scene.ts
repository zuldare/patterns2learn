import type { Category, Entity, Scene } from '../../../engine/types';

export const category: Category = 'behavioral';

const MAIN = 'behavioral/observer/src/main/java/com/patterns2learn/box/observer';
const TEST = 'behavioral/observer/src/test/java/com/patterns2learn/box/observer';

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
 * Layout notes (u = x − y across, v = x + y down):
 * - Two rows. Bottom row (v 23–26): the athlete in front of the platform
 *   (u −7.5) → LiftController (u −3), which climbs to the main row.
 * - Main row (v 16), left to right: the service spot (u 0) → the notifier spot
 *   (u 5.5) → the three interested parties (notifications, leaderboard,
 *   badges) in a column on the right (u 11.5: v 9, 16, 22), 6 units right of
 *   the notifier so the long publisher label clears the leaderboard's and the
 *   packets park between them.
 * - Whatever notifies them (the coupled service, the GoF observer interface or
 *   Spring's event publisher) sits in the middle.
 * - coupled / subject / service share one spot; iface / bus share another.
 * - The coupled collaborators (Notifier, Leaderboard, Badges) and the two GoF
 *   observers reuse the listeners' spots: never visible together with them.
 * - ApplicationContext only appears in spring-does-it, straight above the
 *   publisher (u 8.5, v 8.5) so its event parks on the way down.
 * - The controller is the leftmost block, so the context label lands under it,
 *   clear of the athlete's request.
 */
const entities: Entity[] = [
  { id: 'athlete', kind: 'actor', label: 'Athlete', pos: { x: 8.65, y: 16.15 }, size: { w: 1.2, d: 1.2, h: 0.5 }, tone: 'neutral' },
  { id: 'context', kind: 'container', label: 'Spring context', pos: { x: 6.5, y: -2.75 }, size: { w: 11.75, d: 17.25, h: FLOOR }, tone: 'neutral' },
  { id: 'controller', kind: 'block', label: 'LiftController', ...at(10, 13), tone: 'neutral', icon: 'arrow-in' },
  { id: 'coupled', kind: 'block', label: 'CoupledResultService', ...at(8, 8), tone: 'danger', icon: 'warning' },
  { id: 'subject', kind: 'block', label: 'ManualPrSubject', ...at(8, 8), tone: 'warn', icon: 'gear' },
  { id: 'service', kind: 'block', label: 'ResultService', ...at(8, 8), tone: 'neutral', icon: 'gear' },
  { id: 'iface', kind: 'interface', label: 'PrObserver', ...at(10.75, 5.25, IFACE), tone: 'neutral' },
  { id: 'bus', kind: 'block', label: 'ApplicationEventPublisher', ...at(10.75, 5.25), tone: 'accent', icon: 'shield' },
  { id: 'notif', kind: 'block', label: 'NotificationListener', ...at(10.25, -1.25), tone: 'neutral', icon: 'bell' },
  { id: 'board', kind: 'block', label: 'LeaderboardListener', ...at(13.75, 2.25), tone: 'neutral', icon: 'board' },
  { id: 'badges', kind: 'block', label: 'BadgeListener', ...at(16.75, 5.25), tone: 'neutral', icon: 'medal' },
  { id: 'cNotifier', kind: 'block', label: 'Notifier', ...at(10.25, -1.25), tone: 'neutral', icon: 'bell' },
  { id: 'cBoard', kind: 'block', label: 'Leaderboard', ...at(13.75, 2.25), tone: 'neutral', icon: 'board' },
  { id: 'cBadges', kind: 'block', label: 'Badges', ...at(16.75, 5.25), tone: 'neutral', icon: 'medal' },
  { id: 'oBoard', kind: 'block', label: 'leaderboard observer', ...at(13.75, 2.25), tone: 'neutral', icon: 'board' },
  { id: 'oBadges', kind: 'block', label: 'badges observer', ...at(16.75, 5.25), tone: 'neutral', icon: 'medal' },
  { id: 'app', kind: 'block', label: 'ApplicationContext', ...at(8.5, 0), tone: 'accent', icon: 'gear' },
];

const PARTIES = ['notif', 'board', 'badges'];
const COUPLED = ['cNotifier', 'cBoard', 'cBadges'];
const SPRING = ['context', 'athlete', 'controller', 'service', 'bus', ...PARTIES];

const scene: Scene = {
  entities,
  links: [
    { id: 'l-athlete-controller', from: 'athlete', to: 'controller', style: 'call' },
    { id: 'l-controller-coupled', from: 'controller', to: 'coupled', style: 'call' },
    { id: 'l-coupled-notif', from: 'coupled', to: 'cNotifier', style: 'call' },
    { id: 'l-coupled-board', from: 'coupled', to: 'cBoard', style: 'call' },
    { id: 'l-coupled-badges', from: 'coupled', to: 'cBadges', style: 'call' },
    { id: 'l-subject-iface', from: 'subject', to: 'iface', style: 'call' },
    { id: 'l-oboard-iface', from: 'oBoard', to: 'iface', style: 'implements' },
    { id: 'l-obadges-iface', from: 'oBadges', to: 'iface', style: 'implements' },
    { id: 'l-controller-service', from: 'controller', to: 'service', style: 'call' },
    { id: 'l-service-bus', from: 'service', to: 'bus', style: 'call' },
    { id: 'l-bus-notif', from: 'bus', to: 'notif', style: 'call' },
    { id: 'l-bus-board', from: 'bus', to: 'board', style: 'call' },
    { id: 'l-bus-badges', from: 'bus', to: 'badges', style: 'call' },
    { id: 'l-app-bus', from: 'app', to: 'bus', style: 'call' },
  ],
  steps: [
    {
      id: 'problem',
      visible: ['athlete', 'controller', 'coupled', ...COUPLED],
      highlight: ['coupled'],
      packets: [{ link: 'l-athlete-controller', label: '105 kg' }],
      code: { file: `${MAIN}/before/CoupledResultService.java`, region: 'coupled', highlight: [5, 6, 7] },
    },
    {
      id: 'smell',
      visible: ['athlete', 'controller', 'coupled', ...COUPLED],
      highlight: ['cBadges'],
      packets: [{ link: 'l-coupled-badges', label: 'award() ✗' }],
      code: { file: `${MAIN}/before/CoupledResultService.java`, region: 'coupled', highlight: [7, 8] },
    },
    {
      id: 'gof',
      visible: ['subject', 'iface', 'oBoard', 'oBadges'],
      highlight: ['subject', 'iface'],
      packets: [{ link: 'l-subject-iface', label: 'onRecord()' }],
      code: { file: `${MAIN}/before/ManualPrSubject.java`, region: 'gof-subject', highlight: [1, 3, 14, 15] },
    },
    {
      id: 'spring-events',
      visible: SPRING,
      highlight: ['context', 'bus'],
      packets: [],
      code: { file: `${MAIN}/ResultService.java`, region: 'publish', highlight: [6] },
    },
    {
      id: 'listeners',
      visible: SPRING,
      highlight: PARTIES,
      packets: [],
      code: { file: `${MAIN}/LeaderboardListener.java`, region: 'listeners', highlight: [1, 2] },
    },
    {
      id: 'request',
      visible: SPRING,
      highlight: ['service'],
      packets: [
        { link: 'l-athlete-controller', label: '105 kg' },
        { link: 'l-controller-service', label: 'record()' },
        { link: 'l-service-bus', label: 'PR event' },
        { link: 'l-bus-board', label: 'PR event' },
        { link: 'l-bus-badges', label: 'PR event' },
      ],
      code: { file: `${TEST}/ResultServiceTest.java`, region: 'pr-flow', highlight: [1, 4, 5, 7] },
    },
    {
      id: 'sync',
      visible: SPRING,
      highlight: ['badges'],
      packets: [
        { link: 'l-service-bus', label: 'PR event' },
        { link: 'l-bus-badges', label: 'exception ✗', reverse: true },
      ],
      code: { file: `${TEST}/SyncByDefaultTest.java`, region: 'sync-by-default', highlight: [1, 2, 3] },
    },
    {
      id: 'async',
      visible: SPRING,
      highlight: ['notif'],
      packets: [{ link: 'l-bus-notif', label: 'PR event' }],
      code: { file: `${MAIN}/NotificationListener.java`, region: 'async', highlight: [1, 2] },
    },
    {
      id: 'spring-does-it',
      visible: ['context', 'app', 'bus'],
      highlight: ['app', 'bus'],
      packets: [{ link: 'l-app-bus', label: 'ContextRefreshedEvent' }],
      code: { file: `${TEST}/SpringDoesItTooTest.java`, region: 'context-events', highlight: [2, 7] },
    },
    {
      id: 'recap',
      visible: SPRING,
      highlight: [],
      packets: [],
      code: { file: `${MAIN}/ResultService.java`, region: 'publish', highlight: [1, 6] },
    },
  ],
};

export default scene;
