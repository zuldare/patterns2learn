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
 * Layout notes:
 * - The three interested parties (notifications, leaderboard, badges) form a
 *   column on the right; whatever notifies them (the coupled service, the GoF
 *   observer interface or Spring's event publisher) sits in the middle.
 * - coupled / subject / service share one spot; iface / bus share another.
 * - SpringApplication only appears in spring-does-it, in an empty corner.
 */
const entities: Entity[] = [
  { id: 'athlete', kind: 'actor', label: 'Athlete', pos: { x: 1.9, y: 10.9 }, size: { w: 1.2, d: 1.2, h: 0.5 }, tone: 'neutral' },
  { id: 'context', kind: 'container', label: 'Spring context', pos: { x: 0, y: 0 }, size: { w: 12.4, d: 9.8, h: FLOOR }, tone: 'neutral' },
  { id: 'controller', kind: 'block', label: 'LiftController', ...at(2.0, 7.0), tone: 'neutral', icon: 'arrow-in' },
  { id: 'coupled', kind: 'block', label: 'CoupledResultService', ...at(4.0, 3.0), tone: 'danger', icon: 'warning' },
  { id: 'subject', kind: 'block', label: 'ManualPrSubject', ...at(4.0, 3.0), tone: 'warn', icon: 'gear' },
  { id: 'service', kind: 'block', label: 'ResultService', ...at(4.0, 3.0), tone: 'neutral', icon: 'gear' },
  { id: 'iface', kind: 'interface', label: 'PrObserver', ...at(7.5, 5.5, IFACE), tone: 'neutral' },
  { id: 'bus', kind: 'block', label: 'ApplicationEventPublisher', ...at(7.5, 5.5), tone: 'accent', icon: 'shield' },
  { id: 'notif', kind: 'block', label: 'NotificationListener', ...at(10.5, 1.2), tone: 'neutral', icon: 'bell' },
  { id: 'board', kind: 'block', label: 'LeaderboardListener', ...at(11.4, 5.2), tone: 'neutral', icon: 'board' },
  { id: 'badges', kind: 'block', label: 'BadgeListener', ...at(9.5, 9.0), tone: 'neutral', icon: 'medal' },
  { id: 'app', kind: 'block', label: 'SpringApplication', ...at(2.0, 1.6), tone: 'accent', icon: 'gear' },
];

const PARTIES = ['notif', 'board', 'badges'];
const SPRING = ['context', 'athlete', 'controller', 'service', 'bus', ...PARTIES];

const scene: Scene = {
  entities,
  links: [
    { id: 'l-athlete-controller', from: 'athlete', to: 'controller', style: 'call' },
    { id: 'l-controller-coupled', from: 'controller', to: 'coupled', style: 'call' },
    { id: 'l-coupled-notif', from: 'coupled', to: 'notif', style: 'call' },
    { id: 'l-coupled-board', from: 'coupled', to: 'board', style: 'call' },
    { id: 'l-coupled-badges', from: 'coupled', to: 'badges', style: 'call' },
    { id: 'l-controller-subject', from: 'controller', to: 'subject', style: 'call' },
    { id: 'l-subject-iface', from: 'subject', to: 'iface', style: 'call' },
    { id: 'l-notif-iface', from: 'notif', to: 'iface', style: 'implements' },
    { id: 'l-board-iface', from: 'board', to: 'iface', style: 'implements' },
    { id: 'l-badges-iface', from: 'badges', to: 'iface', style: 'implements' },
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
      visible: ['athlete', 'controller', 'coupled', ...PARTIES],
      highlight: ['coupled'],
      packets: [{ link: 'l-athlete-controller', label: '105 kg' }],
      code: { file: `${MAIN}/before/CoupledResultService.java`, region: 'coupled', highlight: [5, 6, 7] },
    },
    {
      id: 'smell',
      visible: ['athlete', 'controller', 'coupled', ...PARTIES],
      highlight: ['badges'],
      packets: [{ link: 'l-coupled-badges', label: 'award() ✗' }],
      code: { file: `${MAIN}/before/CoupledResultService.java`, region: 'coupled', highlight: [7, 8] },
    },
    {
      id: 'gof',
      visible: ['athlete', 'controller', 'subject', 'iface', ...PARTIES],
      highlight: ['subject', 'iface'],
      packets: [{ link: 'l-subject-iface', label: 'onRecord()' }],
      code: { file: `${MAIN}/before/ManualPrSubject.java`, region: 'gof-subject', highlight: [1, 3, 13, 14] },
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
