import type { Category, Entity, Scene } from '../../../engine/types';

export const category: Category = 'creational';

const MAIN = 'creational/factory-method/src/main/java/com/patterns2learn/box/factorymethod';
const TEST = 'creational/factory-method/src/test/java/com/patterns2learn/box/factorymethod';

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
 * - Creators (one planner per format) form a diagonal column in the middle;
 *   each one's product (the Workout it builds) sits to its right.
 * - The switching service and the Spring WodService share one spot.
 * - WodPlanner (the abstract creator) sits below the creators.
 * - DailyWodFactoryBean only appears in spring-does-it, in the AMRAP planner's spot.
 */
const entities: Entity[] = [
  { id: 'coach', kind: 'actor', label: 'Coach', pos: { x: 1.9, y: 10.9 }, size: { w: 1.2, d: 1.2, h: 0.5 }, tone: 'neutral' },
  { id: 'context', kind: 'container', label: 'Spring context', pos: { x: 0, y: 0 }, size: { w: 12.4, d: 9.8, h: FLOOR }, tone: 'neutral' },
  { id: 'controller', kind: 'block', label: 'WodController', ...at(1.8, 7.4), tone: 'neutral', icon: 'arrow-in' },
  { id: 'switcher', kind: 'block', label: 'SwitchingWodService', ...at(3.8, 4.2), tone: 'danger', icon: 'warning' },
  { id: 'service', kind: 'block', label: 'WodService', ...at(3.8, 4.2), tone: 'neutral', icon: 'gear' },
  { id: 'amrapP', kind: 'block', label: 'AmrapPlanner', ...at(6.4, 1.4), tone: 'neutral', icon: 'board' },
  { id: 'emomP', kind: 'block', label: 'EmomPlanner', ...at(8.4, 4.4), tone: 'neutral', icon: 'board' },
  { id: 'forTimeP', kind: 'block', label: 'ForTimePlanner', ...at(9.2, 7.4), tone: 'neutral', icon: 'board' },
  { id: 'planner', kind: 'interface', label: 'WodPlanner', ...at(5.0, 8.4, IFACE), tone: 'neutral' },
  { id: 'amrap', kind: 'block', label: 'Amrap', ...at(10.4, 0.8), tone: 'accent', icon: 'timer' },
  { id: 'emom', kind: 'block', label: 'Emom', ...at(11.6, 4.0), tone: 'accent', icon: 'timer' },
  { id: 'fortime', kind: 'block', label: 'ForTime', ...at(11.8, 7.6), tone: 'accent', icon: 'timer' },
  { id: 'factoryBean', kind: 'block', label: 'DailyWodFactoryBean', ...at(6.4, 1.4), tone: 'accent', icon: 'gear' },
];

const PLANNERS = ['amrapP', 'emomP', 'forTimeP'];
const PRODUCTS = ['amrap', 'emom', 'fortime'];
const SPRING = ['context', 'coach', 'controller', 'service', ...PLANNERS, 'planner', ...PRODUCTS];

const scene: Scene = {
  entities,
  links: [
    { id: 'l-coach-controller', from: 'coach', to: 'controller', style: 'call' },
    { id: 'l-controller-switcher', from: 'controller', to: 'switcher', style: 'call' },
    { id: 'l-switcher-amrap', from: 'switcher', to: 'amrap', style: 'call' },
    { id: 'l-switcher-emom', from: 'switcher', to: 'emom', style: 'call' },
    { id: 'l-switcher-fortime', from: 'switcher', to: 'fortime', style: 'call' },
    { id: 'l-controller-service', from: 'controller', to: 'service', style: 'call' },
    { id: 'l-service-amrapp', from: 'service', to: 'amrapP', style: 'call' },
    { id: 'l-service-emomp', from: 'service', to: 'emomP', style: 'call' },
    { id: 'l-service-fortimep', from: 'service', to: 'forTimeP', style: 'call' },
    { id: 'l-amrapp-amrap', from: 'amrapP', to: 'amrap', style: 'call' },
    { id: 'l-emomp-emom', from: 'emomP', to: 'emom', style: 'call' },
    { id: 'l-fortimep-fortime', from: 'forTimeP', to: 'fortime', style: 'call' },
    { id: 'l-amrapp-planner', from: 'amrapP', to: 'planner', style: 'implements' },
    { id: 'l-emomp-planner', from: 'emomP', to: 'planner', style: 'implements' },
    { id: 'l-fortimep-planner', from: 'forTimeP', to: 'planner', style: 'implements' },
    { id: 'l-factorybean-amrap', from: 'factoryBean', to: 'amrap', style: 'call' },
  ],
  steps: [
    {
      id: 'problem',
      visible: ['coach', 'controller', 'switcher', ...PRODUCTS],
      highlight: ['switcher'],
      packets: [{ link: 'l-coach-controller', label: "AMRAP 20'" }],
      code: { file: `${MAIN}/before/SwitchingWodService.java`, region: 'switch', highlight: [3, 4, 5, 6] },
    },
    {
      id: 'smell',
      visible: ['coach', 'controller', 'switcher', ...PRODUCTS],
      highlight: ['switcher'],
      packets: [],
      code: { file: `${MAIN}/before/SwitchingWodService.java`, region: 'switch', highlight: [9, 15] },
    },
    {
      id: 'factory-method',
      visible: ['planner', ...PLANNERS],
      highlight: ['planner'],
      packets: [],
      code: { file: `${MAIN}/WodPlanner.java`, region: 'factory-method', highlight: [1, 2, 6] },
    },
    {
      id: 'creators',
      visible: ['planner', ...PLANNERS, ...PRODUCTS],
      highlight: PLANNERS,
      packets: [
        { link: 'l-amrapp-amrap', label: 'new Amrap()' },
        { link: 'l-emomp-emom', label: 'new Emom()' },
        { link: 'l-fortimep-fortime', label: 'new ForTime()' },
      ],
      code: { file: `${MAIN}/AmrapPlanner.java`, region: 'creator', highlight: [2, 9, 10] },
    },
    {
      id: 'spring-planners',
      visible: SPRING,
      highlight: ['context', 'service'],
      packets: [],
      code: { file: `${MAIN}/WodService.java`, region: 'pick', highlight: [3, 8, 12] },
    },
    {
      id: 'request',
      visible: SPRING,
      highlight: ['amrapP', 'amrap'],
      packets: [
        { link: 'l-coach-controller', label: 'Cindy · AMRAP 20′' },
        { link: 'l-controller-service', label: 'plan()' },
        { link: 'l-service-amrapp', label: 'plan()' },
        { link: 'l-amrapp-amrap', label: 'new Amrap()' },
      ],
      code: { file: `${TEST}/WodServiceTest.java`, region: 'plan-request', highlight: [1, 3, 4] },
    },
    {
      id: 'for-time',
      visible: SPRING,
      highlight: ['forTimeP', 'fortime'],
      packets: [
        { link: 'l-service-fortimep', label: 'plan()' },
        { link: 'l-fortimep-fortime', label: 'new ForTime()' },
      ],
      code: { file: `${MAIN}/ForTimePlanner.java`, region: 'for-time', highlight: [3, 4] },
    },
    {
      id: 'spring-does-it',
      visible: ['context', 'factoryBean', 'amrap'],
      highlight: ['factoryBean'],
      packets: [{ link: 'l-factorybean-amrap', label: 'getObject()' }],
      code: { file: `${TEST}/SpringDoesItTooTest.java`, region: 'factory-bean', highlight: [2, 4, 5] },
    },
    {
      id: 'recap',
      visible: SPRING,
      highlight: [],
      packets: [],
      code: { file: `${MAIN}/WodPlanner.java`, region: 'factory-method', highlight: [1, 2, 6] },
    },
  ],
};

export default scene;
