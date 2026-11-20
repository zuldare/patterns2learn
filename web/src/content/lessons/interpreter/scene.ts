import type { Category, Entity, Scene } from '../../../engine/types';

export const category: Category = 'behavioral';

const MAIN = 'behavioral/interpreter/src/main/java/com/patterns2learn/box/interpreter';
const TEST = 'behavioral/interpreter/src/test/java/com/patterns2learn/box/interpreter';

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
 * Layout notes. Positions come from screen coordinates (sx = x − y, sy = (x + y) / 2), shifted by +3:
 * - Left to right: controller (sx −10) → WodParser (sx −5.5) → the tree for "3 x (10 burpees + 15 air-squats)":
 *   Repeat (sx −1) → Sequence (sx 3.5) → two Movement leaves (sx 8, up and down).
 * - The Tally (the context) below the leaves; the WodExpression interface top left, only where it's explained.
 * - Before: SplitCounter in the parser's spot and the lost pull-ups in the Repeat's.
 * - spring-does-it: the SpEL tree for "reps * rounds + 10" in the same spots.
 */
const entities: Entity[] = [
  { id: 'coach', kind: 'actor', label: 'Coach', pos: { x: 4.4, y: 18.4 }, size: { w: 1.2, d: 1.2, h: 0.5 }, tone: 'neutral' },
  { id: 'context', kind: 'container', label: 'Spring context', pos: { x: 0, y: 0 }, size: { w: 20.0, d: 17.6, h: FLOOR }, tone: 'neutral' },
  { id: 'controller', kind: 'block', label: 'WodController', ...at(6.0, 16.0), tone: 'neutral', icon: 'arrow-in' },
  { id: 'split', kind: 'block', label: 'SplitCounter (regex)', ...at(8.25, 13.75), tone: 'danger', icon: 'warning' },
  { id: 'lost', kind: 'block', label: '3 x (5 pull-ups) → ?', ...at(10.5, 11.5), tone: 'danger', icon: 'warning' },
  { id: 'kept', kind: 'block', label: 'burpees: 20', ...at(12.75, 9.25), tone: 'neutral', icon: 'file' },
  { id: 'parser', kind: 'block', label: 'WodParser', ...at(8.25, 13.75), tone: 'neutral', icon: 'gear' },
  { id: 'iface', kind: 'interface', label: 'WodExpression', ...at(5.0, 6.0, IFACE), tone: 'accent' },
  { id: 'repeat', kind: 'block', label: 'Repeat 3 x', ...at(10.5, 11.5), tone: 'accent', icon: 'timer' },
  { id: 'seq', kind: 'block', label: 'Sequence +', ...at(12.75, 9.25), tone: 'accent', icon: 'plus' },
  { id: 'leaf1', kind: 'block', label: 'Movement 10 burpees', ...at(12.0, 4.0), tone: 'accent', icon: 'medal' },
  { id: 'leaf2', kind: 'block', label: 'Movement 15 air-squats', ...at(18.0, 10.0), tone: 'accent', icon: 'medal' },
  { id: 'tally', kind: 'block', label: 'Tally', ...at(18.25, 14.75), tone: 'neutral', icon: 'board' },
  { id: 'spelParser', kind: 'block', label: 'SpelExpressionParser', ...at(8.25, 13.75), tone: 'neutral', icon: 'gear' },
  { id: 'opPlus', kind: 'block', label: 'OpPlus', ...at(10.5, 11.5), tone: 'accent', icon: 'plus' },
  { id: 'opMul', kind: 'block', label: 'OpMultiply', ...at(12.75, 9.25), tone: 'accent', icon: 'plus' },
  { id: 'reps', kind: 'block', label: 'reps', ...at(12.0, 4.0), tone: 'neutral', icon: 'tag' },
  { id: 'rounds', kind: 'block', label: 'rounds', ...at(18.0, 10.0), tone: 'neutral', icon: 'tag' },
  { id: 'ten', kind: 'block', label: '10', ...at(7.75, 4.25), tone: 'neutral', icon: 'ten' },
];

const TREE = ['repeat', 'seq', 'leaf1', 'leaf2'];
const SPRING = ['context', 'coach', 'controller', 'parser', ...TREE, 'tally'];

const scene: Scene = {
  entities,
  links: [
    { id: 'l-coach-controller', from: 'coach', to: 'controller', style: 'call' },
    { id: 'l-controller-split', from: 'controller', to: 'split', style: 'call' },
    { id: 'l-split-lost', from: 'split', to: 'lost', style: 'call' },
    { id: 'l-lost-kept', from: 'lost', to: 'kept', style: 'call' },
    { id: 'l-controller-parser', from: 'controller', to: 'parser', style: 'call' },
    { id: 'l-parser-repeat', from: 'parser', to: 'repeat', style: 'call' },
    { id: 'l-repeat-seq', from: 'repeat', to: 'seq', style: 'call' },
    { id: 'l-seq-leaf1', from: 'seq', to: 'leaf1', style: 'call' },
    { id: 'l-seq-leaf2', from: 'seq', to: 'leaf2', style: 'call' },
    { id: 'l-leaf1-tally', from: 'leaf1', to: 'tally', style: 'call' },
    { id: 'l-leaf2-tally', from: 'leaf2', to: 'tally', style: 'call' },
    { id: 'l-repeat-iface', from: 'repeat', to: 'iface', style: 'implements' },
    { id: 'l-leaf1-iface', from: 'leaf1', to: 'iface', style: 'implements' },
    { id: 'l-spel-plus', from: 'spelParser', to: 'opPlus', style: 'call' },
    { id: 'l-plus-mul', from: 'opPlus', to: 'opMul', style: 'call' },
    { id: 'l-plus-ten', from: 'opPlus', to: 'ten', style: 'call' },
    { id: 'l-mul-reps', from: 'opMul', to: 'reps', style: 'call' },
    { id: 'l-mul-rounds', from: 'opMul', to: 'rounds', style: 'call' },
  ],
  steps: [
    {
      id: 'problem',
      visible: ['controller', 'split'],
      highlight: ['split'],
      packets: [{ link: 'l-controller-split', label: '"3 x (10 burpees + …)"' }],
      code: { file: `${MAIN}/before/SplitCounter.java`, region: 'split', highlight: [4, 5, 7, 8, 9] },
    },
    {
      id: 'smell',
      visible: ['controller', 'split', 'lost', 'kept'],
      highlight: ['lost'],
      packets: [{ link: 'l-split-lost', label: '"2 x (3 x (…) + …)"' }],
      code: { file: `${MAIN}/before/SplitCounter.java`, region: 'split', highlight: [5, 9, 10] },
    },
    {
      id: 'expression',
      visible: ['iface', 'repeat', 'leaf1'],
      highlight: ['iface'],
      packets: [],
      code: { file: `${MAIN}/WodExpression.java`, region: 'expression', highlight: [2, 4] },
    },
    {
      id: 'terminal',
      visible: [...TREE, 'tally'],
      highlight: ['leaf1', 'leaf2'],
      packets: [{ link: 'l-leaf1-tally', label: 'add("burpees", 10 × factor)' }],
      code: { file: `${MAIN}/Movement.java`, region: 'terminal', highlight: [1, 5] },
    },
    {
      id: 'repeat',
      visible: [...TREE, 'tally'],
      highlight: ['repeat'],
      packets: [{ link: 'l-repeat-seq', label: 'factor × 3' }],
      code: { file: `${MAIN}/Repeat.java`, region: 'repeat', highlight: [1, 5] },
    },
    {
      id: 'tree',
      visible: [...TREE, 'tally'],
      highlight: TREE,
      packets: [
        { link: 'l-repeat-seq', label: 'interpret(tally, 3)' },
        { link: 'l-seq-leaf1', label: 'interpret(tally, 3)' },
        { link: 'l-seq-leaf2', label: 'interpret(tally, 3)' },
      ],
      code: { file: `${TEST}/WodInterpreterTest.java`, region: 'tree', highlight: [1, 2, 3, 5, 6] },
    },
    {
      id: 'parser',
      visible: ['parser', ...TREE],
      highlight: ['parser'],
      packets: [{ link: 'l-parser-repeat', label: 'parse("3 x (…)")' }],
      code: { file: `${MAIN}/WodParser.java`, region: 'parser', highlight: [3, 4, 10, 13, 15] },
    },
    {
      id: 'interpret',
      visible: ['parser', ...TREE, 'tally'],
      highlight: ['tally'],
      packets: [
        { link: 'l-leaf1-tally', label: 'add()' },
        { link: 'l-leaf2-tally', label: 'add()' },
      ],
      code: { file: `${TEST}/WodInterpreterTest.java`, region: 'interpret', highlight: [1, 3, 5] },
    },
    {
      id: 'request',
      visible: SPRING,
      highlight: ['parser', 'tally'],
      packets: [
        { link: 'l-coach-controller', label: 'POST /api/wods/totals' },
        { link: 'l-controller-parser', label: 'parse(wod)' },
        { link: 'l-parser-repeat', label: 'interpret(tally, 1)' },
      ],
      code: { file: `${TEST}/web/WodApiTest.java`, region: 'request', highlight: [2, 4, 5, 6] },
    },
    {
      id: 'spring-does-it',
      visible: ['spelParser', 'opPlus', 'opMul', 'reps', 'rounds', 'ten'],
      highlight: ['opPlus', 'opMul'],
      packets: [
        { link: 'l-spel-plus', label: 'parseExpression()' },
        { link: 'l-plus-mul', label: 'getValue()' },
      ],
      code: { file: `${TEST}/SpringDoesItTooTest.java`, region: 'spel', highlight: [1, 2, 5] },
    },
    {
      id: 'recap',
      visible: SPRING,
      highlight: [],
      packets: [],
      code: { file: `${MAIN}/WodExpression.java`, region: 'expression', highlight: [2, 4] },
    },
  ],
};

export default scene;
