import type { Category, Entity, Scene } from '../../../engine/types';

export const category: Category = 'creational';

const MAIN = 'creational/abstract-factory/src/main/java/com/patterns2learn/box/abstractfactory';
const TEST = 'creational/abstract-factory/src/test/java/com/patterns2learn/box/abstractfactory';

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
 * Layout notes. Positions come from screen coordinates (sx = x − y, sy = (x + y) / 2), shifted by +4.5:
 * - Left to right: controller (sx −12.5) → WodService (sx −8) → FranPlanner, the client (sx −3.5) →
 *   DivisionKit, the abstract factory (sx 1) → the three kits in a column (sx 5.5) → the Rx family's
 *   three products in a column (sx 10.5).
 * - IfElseFranPlanner (before) takes FranPlanner's spot.
 * - spring-does-it reuses the spots: DataSource (service), Connection (DivisionKit), its statements (products).
 */
const entities: Entity[] = [
  { id: 'coach', kind: 'actor', label: 'Coach', pos: { x: 3.65, y: 20.15 }, size: { w: 1.2, d: 1.2, h: 0.5 }, tone: 'neutral' },
  { id: 'context', kind: 'container', label: 'Spring context', pos: { x: 0, y: 0 }, size: { w: 18.4, d: 18.4, h: FLOOR }, tone: 'neutral' },
  { id: 'controller', kind: 'block', label: 'WodController', ...at(5.25, 17.75), tone: 'neutral', icon: 'arrow-in' },
  { id: 'service', kind: 'block', label: 'WodService', ...at(7.5, 15.5), tone: 'neutral', icon: 'gear' },
  { id: 'ifElse', kind: 'block', label: 'IfElseFranPlanner', ...at(9.75, 13.25), tone: 'danger', icon: 'warning' },
  { id: 'planner', kind: 'block', label: 'FranPlanner', ...at(9.75, 13.25), tone: 'accent', icon: 'board' },
  { id: 'kit', kind: 'interface', label: 'DivisionKit', ...at(12.0, 11.0, IFACE), tone: 'neutral' },
  { id: 'rx', kind: 'block', label: 'RxKit', ...at(10.75, 5.25), tone: 'accent', icon: 'medal' },
  { id: 'scaled', kind: 'block', label: 'ScaledKit', ...at(14.25, 8.75), tone: 'neutral', icon: 'tag' },
  { id: 'teens', kind: 'block', label: 'TeensKit', ...at(17.75, 12.25), tone: 'neutral', icon: 'cap' },
  { id: 'barbell', kind: 'block', label: 'Barbell 43 kg', ...at(11.25, 0.75), tone: 'neutral', icon: 'ten' },
  { id: 'pull', kind: 'block', label: 'pull-ups', ...at(13.75, 3.25), tone: 'neutral', icon: 'plus' },
  { id: 'scorecard', kind: 'block', label: "Rx · 10'", ...at(16.25, 5.75), tone: 'neutral', icon: 'timer' },
  { id: 'dataSource', kind: 'block', label: 'DataSource', ...at(7.5, 15.5), tone: 'neutral', icon: 'db' },
  { id: 'connection', kind: 'block', label: 'Connection (H2)', ...at(12.0, 11.0), tone: 'accent', icon: 'key' },
  { id: 'statement', kind: 'block', label: 'Statement', ...at(11.25, 0.75), tone: 'neutral', icon: 'file' },
  { id: 'prepared', kind: 'block', label: 'PreparedStatement', ...at(13.75, 3.25), tone: 'neutral', icon: 'file' },
  { id: 'metadata', kind: 'block', label: 'DatabaseMetaData', ...at(16.25, 5.75), tone: 'neutral', icon: 'file' },
];

const KITS = ['kit', 'rx', 'scaled', 'teens'];
const PRODUCTS = ['barbell', 'pull', 'scorecard'];
const SPRING = ['context', 'coach', 'controller', 'service', 'planner', ...KITS, ...PRODUCTS];

const scene: Scene = {
  entities,
  links: [
    { id: 'l-coach-controller', from: 'coach', to: 'controller', style: 'call' },
    { id: 'l-controller-service', from: 'controller', to: 'service', style: 'call' },
    { id: 'l-service-ifelse', from: 'service', to: 'ifElse', style: 'call' },
    { id: 'l-service-planner', from: 'service', to: 'planner', style: 'call' },
    { id: 'l-planner-kit', from: 'planner', to: 'kit', style: 'call' },
    { id: 'l-rx-kit', from: 'rx', to: 'kit', style: 'implements' },
    { id: 'l-scaled-kit', from: 'scaled', to: 'kit', style: 'implements' },
    { id: 'l-teens-kit', from: 'teens', to: 'kit', style: 'implements' },
    { id: 'l-rx-barbell', from: 'rx', to: 'barbell', style: 'call' },
    { id: 'l-rx-pull', from: 'rx', to: 'pull', style: 'call' },
    { id: 'l-rx-scorecard', from: 'rx', to: 'scorecard', style: 'call' },
    { id: 'l-ds-connection', from: 'dataSource', to: 'connection', style: 'call' },
    { id: 'l-conn-statement', from: 'connection', to: 'statement', style: 'call' },
    { id: 'l-conn-prepared', from: 'connection', to: 'prepared', style: 'call' },
    { id: 'l-conn-metadata', from: 'connection', to: 'metadata', style: 'call' },
  ],
  steps: [
    {
      id: 'problem',
      visible: ['coach', 'controller', 'service', 'ifElse'],
      highlight: ['ifElse'],
      packets: [
        { link: 'l-coach-controller', label: 'Fran · rx' },
        { link: 'l-service-ifelse', label: 'plan("rx")' },
      ],
      code: { file: `${MAIN}/before/IfElseFranPlanner.java`, region: 'if-else', highlight: [3, 8, 13] },
    },
    {
      id: 'smell',
      visible: ['coach', 'controller', 'service', 'ifElse'],
      highlight: ['ifElse'],
      packets: [{ link: 'l-service-ifelse', label: 'plan("RX") ✗' }],
      code: { file: `${MAIN}/before/IfElseFranPlanner.java`, region: 'if-else', highlight: [3, 13, 15] },
    },
    {
      id: 'abstract-factory',
      visible: KITS,
      highlight: ['kit'],
      packets: [],
      code: { file: `${MAIN}/DivisionKit.java`, region: 'abstract-factory', highlight: [3, 4, 5] },
    },
    {
      id: 'families',
      visible: [...KITS, ...PRODUCTS],
      highlight: ['rx', ...PRODUCTS],
      packets: [
        { link: 'l-rx-barbell', label: 'barbell()' },
        { link: 'l-rx-pull', label: 'pull()' },
        { link: 'l-rx-scorecard', label: 'scorecard()' },
      ],
      code: { file: `${MAIN}/RxKit.java`, region: 'rx', highlight: [4, 5, 6] },
    },
    {
      id: 'client',
      visible: ['planner', ...KITS, ...PRODUCTS],
      highlight: ['planner'],
      packets: [{ link: 'l-planner-kit', label: 'barbell() · pull() · scorecard()' }],
      code: { file: `${MAIN}/FranPlanner.java`, region: 'client', highlight: [2, 3, 4] },
    },
    {
      id: 'spring-kits',
      visible: SPRING,
      highlight: ['context', 'service'],
      packets: [],
      code: { file: `${MAIN}/WodService.java`, region: 'kits', highlight: [2, 8, 10] },
    },
    {
      id: 'request',
      visible: SPRING,
      highlight: ['planner', 'scaled'],
      packets: [
        { link: 'l-coach-controller', label: 'GET /api/wods/fran?division=scaled' },
        { link: 'l-controller-service', label: 'fran("scaled")' },
        { link: 'l-service-planner', label: 'plan(scaledKit)' },
        { link: 'l-planner-kit', label: 'barbell() · pull() · scorecard()' },
      ],
      code: { file: `${TEST}/web/WodApiTest.java`, region: 'request', highlight: [1, 3, 4, 5] },
    },
    {
      id: 'spring-does-it',
      visible: ['context', 'dataSource', 'connection', 'statement', 'prepared', 'metadata'],
      highlight: ['connection'],
      packets: [
        { link: 'l-ds-connection', label: 'getConnection()' },
        { link: 'l-conn-statement', label: 'createStatement()' },
        { link: 'l-conn-prepared', label: 'prepareStatement()' },
        { link: 'l-conn-metadata', label: 'getMetaData()' },
      ],
      code: { file: `${TEST}/SpringDoesItTooTest.java`, region: 'jdbc', highlight: [1, 2, 3, 5, 6, 7] },
    },
    {
      id: 'recap',
      visible: SPRING,
      highlight: [],
      packets: [],
      code: { file: `${MAIN}/DivisionKit.java`, region: 'abstract-factory', highlight: [3, 4, 5] },
    },
  ],
};

export default scene;
