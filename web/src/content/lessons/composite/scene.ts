import type { Category, Entity, Scene } from '../../../engine/types';

export const category: Category = 'structural';

const MAIN = 'structural/composite/src/main/java/com/patterns2learn/box/composite';
const TEST = 'structural/composite/src/test/java/com/patterns2learn/box/composite';

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
 * Layout notes. Positions come from screen coordinates (sx = x − y, sy = (x + y) / 2):
 * - Classes (component, leaf, composite steps): WorkoutPart in the middle (sx −1), the three
 *   implementations in a column on the right (sx 5).
 * - Objects (Murph's tree): Murph on the left (sx −6), its three children in the middle column (sx −1),
 *   and the 20-rounds block's three movements on the right (sx 5). The tree reads left to right.
 * - Controller and coach further left (sx −10.5, −14.5). The flat WOD (before) and the
 *   CompositePropertySource (spring-does-it) take Murph's spot.
 */
const entities: Entity[] = [
  { id: 'coach', kind: 'actor', label: 'Coach', pos: { x: -0.85, y: 13.65 }, size: { w: 1.2, d: 1.2, h: 0.5 }, tone: 'neutral' },
  { id: 'context', kind: 'container', label: 'Spring context', pos: { x: 0, y: 0 }, size: { w: 13.2, d: 12.4, h: FLOOR }, tone: 'neutral' },
  { id: 'controller', kind: 'block', label: 'WodController', ...at(1.25, 11.75), tone: 'neutral', icon: 'arrow-in' },
  { id: 'flat', kind: 'block', label: 'FlatWod', ...at(3.5, 9.5), tone: 'danger', icon: 'warning' },
  { id: 'part', kind: 'interface', label: 'WorkoutPart', ...at(6.0, 7.0, IFACE), tone: 'neutral' },
  { id: 'movementC', kind: 'block', label: 'Movement', ...at(5.5, 0.5), tone: 'neutral', icon: 'ten' },
  { id: 'runC', kind: 'block', label: 'Run', ...at(9.0, 4.0), tone: 'neutral', icon: 'timer' },
  { id: 'blockC', kind: 'block', label: 'Block', ...at(12.5, 7.5), tone: 'accent', icon: 'board' },
  { id: 'murph', kind: 'block', label: 'Murph', ...at(3.5, 9.5), tone: 'accent', icon: 'board' },
  { id: 'run1', kind: 'block', label: 'Run 1600 m', ...at(2.5, 3.5), tone: 'neutral', icon: 'timer' },
  { id: 'rounds', kind: 'block', label: '20 rounds', ...at(6.0, 7.0), tone: 'accent', icon: 'board' },
  { id: 'run2', kind: 'block', label: 'Run 1600 m', ...at(9.5, 10.5), tone: 'neutral', icon: 'timer' },
  { id: 'pu', kind: 'block', label: '5 pull-ups', ...at(6.4, 1.4), tone: 'neutral', icon: 'ten' },
  { id: 'ps', kind: 'block', label: '10 push-ups', ...at(9.0, 4.0), tone: 'neutral', icon: 'ten' },
  { id: 'sq', kind: 'block', label: '15 air squats', ...at(11.6, 6.6), tone: 'neutral', icon: 'ten' },
  { id: 'config', kind: 'block', label: 'CompositePropertySource', ...at(3.5, 9.5), tone: 'accent', icon: 'file' },
  { id: 'downtown', kind: 'block', label: 'downtown', ...at(2.5, 3.5), tone: 'neutral', icon: 'file' },
  { id: 'defaults', kind: 'block', label: 'box-defaults', ...at(9.5, 10.5), tone: 'neutral', icon: 'file' },
];

const CLASSES = ['part', 'movementC', 'runC', 'blockC'];
const TREE = ['murph', 'run1', 'rounds', 'run2', 'pu', 'ps', 'sq'];

const scene: Scene = {
  entities,
  links: [
    { id: 'l-coach-controller', from: 'coach', to: 'controller', style: 'call' },
    { id: 'l-controller-flat', from: 'controller', to: 'flat', style: 'call' },
    { id: 'l-controller-murph', from: 'controller', to: 'murph', style: 'call' },
    { id: 'l-movement-part', from: 'movementC', to: 'part', style: 'implements' },
    { id: 'l-run-part', from: 'runC', to: 'part', style: 'implements' },
    { id: 'l-block-part', from: 'blockC', to: 'part', style: 'implements' },
    { id: 'l-block-parts', from: 'blockC', to: 'part', style: 'call' },
    { id: 'l-murph-run1', from: 'murph', to: 'run1', style: 'call' },
    { id: 'l-murph-rounds', from: 'murph', to: 'rounds', style: 'call' },
    { id: 'l-murph-run2', from: 'murph', to: 'run2', style: 'call' },
    { id: 'l-rounds-pu', from: 'rounds', to: 'pu', style: 'call' },
    { id: 'l-rounds-ps', from: 'rounds', to: 'ps', style: 'call' },
    { id: 'l-rounds-sq', from: 'rounds', to: 'sq', style: 'call' },
    { id: 'l-config-downtown', from: 'config', to: 'downtown', style: 'call' },
    { id: 'l-config-defaults', from: 'config', to: 'defaults', style: 'call' },
  ],
  steps: [
    {
      id: 'problem',
      visible: ['coach', 'controller', 'flat'],
      highlight: ['flat'],
      packets: [{ link: 'l-controller-flat', label: 'reps()' }],
      code: { file: `${MAIN}/before/FlatWod.java`, region: 'flat', highlight: [1, 2, 3, 4] },
    },
    {
      id: 'smell',
      visible: ['coach', 'controller', 'flat'],
      highlight: ['flat'],
      packets: [{ link: 'l-controller-flat', label: 'Helen?' }],
      code: { file: `${MAIN}/before/FlatWod.java`, region: 'flat', highlight: [7, 10, 11] },
    },
    {
      id: 'component',
      visible: CLASSES,
      highlight: ['part'],
      packets: [],
      code: { file: `${MAIN}/WorkoutPart.java`, region: 'component', highlight: [8, 9, 10, 11] },
    },
    {
      id: 'leaf',
      visible: CLASSES,
      highlight: ['movementC', 'runC'],
      packets: [],
      code: { file: `${MAIN}/Movement.java`, region: 'leaf', highlight: [3, 8] },
    },
    {
      id: 'composite',
      visible: CLASSES,
      highlight: ['blockC'],
      packets: [{ link: 'l-block-parts', label: 'parts: List<WorkoutPart>' }],
      code: { file: `${MAIN}/Block.java`, region: 'composite', highlight: [3, 15, 16] },
    },
    {
      id: 'tree',
      visible: TREE,
      highlight: ['murph', 'rounds'],
      packets: [],
      code: { file: `${MAIN}/WodLibrary.java`, region: 'murph', highlight: [1, 3, 4, 5, 6, 7] },
    },
    {
      id: 'request',
      visible: ['context', 'coach', 'controller', ...TREE],
      highlight: TREE,
      packets: [
        { link: 'l-coach-controller', label: 'GET /api/wods/murph' },
        { link: 'l-controller-murph', label: 'reps()' },
        { link: 'l-murph-rounds', label: 'reps()' },
        { link: 'l-rounds-pu', label: 'reps()' },
        { link: 'l-rounds-ps', label: 'reps()' },
        { link: 'l-rounds-sq', label: 'reps()' },
      ],
      code: { file: `${TEST}/web/WodApiTest.java`, region: 'request', highlight: [1, 3, 4, 5] },
    },
    {
      id: 'spring-does-it',
      visible: ['context', 'config', 'downtown', 'defaults'],
      highlight: ['config'],
      packets: [
        { link: 'l-config-downtown', label: 'capacity? 20' },
        { link: 'l-config-defaults', label: 'minutes? 60' },
      ],
      code: { file: `${TEST}/SpringDoesItTooTest.java`, region: 'property-sources', highlight: [4, 5, 6, 8, 9] },
    },
    {
      id: 'recap',
      visible: ['context', 'coach', 'controller', ...TREE],
      highlight: [],
      packets: [],
      code: { file: `${MAIN}/WorkoutPart.java`, region: 'component', highlight: [8, 9, 10] },
    },
  ],
};

export default scene;
