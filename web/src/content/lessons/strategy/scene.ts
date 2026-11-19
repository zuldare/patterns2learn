import type { Category, Entity, Scene } from '../../../engine/types';

export const category: Category = 'behavioral';

const MAIN = 'behavioral/strategy/src/main/java/com/patterns2learn/box/strategy';
const TEST = 'behavioral/strategy/src/test/java/com/patterns2learn/box/strategy';

/** Platform height: everything inside the Spring context stands on it. */
const FLOOR = 0.25;
const BLOCK = { w: 1, d: 1, h: 0.6 };
const SMALL = { w: 1, d: 1, h: 0.45 };
const IFACE = { w: 1.4, d: 1.4, h: 0.6 };

/** Block centred on (cx, cy), standing on the context platform. */
const at = (cx: number, cy: number, size = BLOCK) => ({
  pos: { x: cx - size.w / 2, y: cy - size.d / 2, z: FLOOR },
  size,
});

/*
 * Layout notes (checked against every step for label/packet/block overlaps):
 * - controller → service runs horizontally on screen and is long enough for two
 *   resting packets (plan=ten-pack going, 240.00 € coming back) without touching
 *   either block's label.
 * - Strategy blocks sit level with or below the interface so the implements
 *   arrows never cross a label (labels are drawn above each block).
 * - legacy/service share a spot (never visible together); encoder only shows in
 *   spring-does-it, alone on the platform with the athlete.
 */
const entities: Entity[] = [
  { id: 'athlete', kind: 'actor', label: 'Athlete', pos: { x: 2.45, y: 11.4 }, size: { w: 1.2, d: 1.2, h: 0.5 }, tone: 'neutral' },
  { id: 'context', kind: 'container', label: 'Spring context', pos: { x: 0, y: 0 }, size: { w: 12.4, d: 9.8, h: FLOOR }, tone: 'neutral' },
  { id: 'controller', kind: 'block', label: 'PricingController', ...at(1.3, 6.1), tone: 'neutral', icon: 'arrow-in' },
  { id: 'legacy', kind: 'block', label: 'LegacyPricingService', ...at(6.15, 1.85), tone: 'danger', icon: 'warning' },
  { id: 'service', kind: 'block', label: 'PricingService', ...at(6.15, 1.85), tone: 'accent', icon: 'gear' },
  { id: 'iface', kind: 'interface', label: 'PricingStrategy', ...at(8.85, 1.15, IFACE), tone: 'neutral' },
  { id: 'monthly', kind: 'block', label: 'monthly', ...at(8.95, 8.6, SMALL), tone: 'neutral', icon: 'calendar' },
  { id: 'tenpack', kind: 'block', label: 'ten-pack', ...at(6.5, 5.75, SMALL), tone: 'neutral', icon: 'ten' },
  { id: 'dropin', kind: 'block', label: 'drop-in', ...at(11.15, 0.85, SMALL), tone: 'neutral', icon: 'ticket' },
  { id: 'student', kind: 'block', label: 'student', ...at(4.25, 8, SMALL), tone: 'accent', icon: 'cap' },
  { id: 'encoder', kind: 'block', label: 'DelegatingPasswordEncoder', ...at(6.5, 4.4), tone: 'accent', icon: 'key' },
];

const STRATEGIES = ['monthly', 'tenpack', 'dropin'];
const ALL = ['athlete', 'context', 'controller', 'service', 'iface', ...STRATEGIES, 'student'];

const scene: Scene = {
  entities,
  links: [
    { id: 'l-athlete-controller', from: 'athlete', to: 'controller', style: 'call' },
    { id: 'l-controller-service', from: 'controller', to: 'service', style: 'call' },
    { id: 'l-controller-legacy', from: 'controller', to: 'legacy', style: 'call' },
    { id: 'l-service-iface', from: 'service', to: 'iface', style: 'injects' },
    { id: 'l-monthly-iface', from: 'monthly', to: 'iface', style: 'implements' },
    { id: 'l-tenpack-iface', from: 'tenpack', to: 'iface', style: 'implements' },
    { id: 'l-dropin-iface', from: 'dropin', to: 'iface', style: 'implements' },
    { id: 'l-student-iface', from: 'student', to: 'iface', style: 'implements' },
    { id: 'l-athlete-encoder', from: 'athlete', to: 'encoder', style: 'call' },
  ],
  steps: [
    {
      id: 'problem',
      visible: ['athlete', 'controller', 'legacy'],
      highlight: ['legacy'],
      packets: [{ link: 'l-athlete-controller', label: 'plan=ten-pack' }],
      code: { file: `${MAIN}/before/LegacyPricingService.java`, region: 'legacy-switch', highlight: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
    },
    {
      id: 'smell',
      visible: ['athlete', 'controller', 'legacy'],
      highlight: ['legacy'],
      packets: [],
      code: { file: `${MAIN}/before/LegacyPricingService.java`, region: 'legacy-switch', highlight: [9] },
    },
    {
      id: 'interface',
      visible: ['athlete', 'controller', 'legacy', 'iface'],
      highlight: ['iface'],
      packets: [],
      code: { file: `${MAIN}/PricingStrategy.java`, region: 'pricing-interface', highlight: [1, 2, 3] },
    },
    {
      id: 'strategies',
      visible: ['athlete', 'controller', 'legacy', 'iface', ...STRATEGIES],
      highlight: STRATEGIES,
      packets: [],
      code: { file: `${MAIN}/TenPackPricing.java`, region: 'ten-pack-strategy', highlight: [1] },
    },
    {
      id: 'injection',
      visible: ['athlete', 'context', 'controller', 'service', 'iface', ...STRATEGIES],
      highlight: ['context', 'service'],
      packets: [],
      code: { file: `${MAIN}/PricingService.java`, region: 'service-map', highlight: [3, 4, 5] },
    },
    {
      id: 'request',
      visible: ['athlete', 'context', 'controller', 'service', 'iface', ...STRATEGIES],
      highlight: ['tenpack'],
      packets: [
        { link: 'l-athlete-controller', label: 'plan=ten-pack' },
        { link: 'l-controller-service', label: 'plan=ten-pack' },
        { link: 'l-controller-service', label: '240.00 €', reverse: true },
      ],
      code: { file: `${MAIN}/web/PricingController.java`, region: 'controller', highlight: [3] },
    },
    {
      id: 'extend',
      visible: ALL,
      highlight: ['student'],
      packets: [],
      code: { file: `${MAIN}/StudentPricing.java`, region: 'student-strategy', highlight: [1, 2, 5] },
    },
    {
      id: 'spring-does-it',
      visible: ['athlete', 'context', 'encoder'],
      highlight: ['encoder'],
      packets: [{ link: 'l-athlete-encoder', label: '{bcrypt}…' }],
      code: { file: `${TEST}/SpringDoesItTooTest.java`, region: 'delegating-encoder', highlight: [1, 3, 5] },
    },
    {
      id: 'recap',
      visible: ALL,
      highlight: [],
      packets: [],
      code: { file: `${MAIN}/PricingService.java`, region: 'service-map', highlight: [1, 8, 12] },
    },
  ],
};

export default scene;
