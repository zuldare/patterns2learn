import type { Category, Entity, Scene } from '../../../engine/types';

export const category: Category = 'behavioral';

const MAIN = 'behavioral/visitor/src/main/java/com/patterns2learn/box/visitor';
const TEST = 'behavioral/visitor/src/test/java/com/patterns2learn/box/visitor';

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
 * - Left to right: controller (sx −10) → Workout, the structure (sx −5.5) → its three kinds of element
 *   in a column (sx −0.5) → the two visitors (sx 5) → the WorkoutVisitor interface (sx 10).
 * - InstanceofAnalyzer (before) takes Workout's spot.
 * - spring-does-it: BeanDefinitionVisitor in the visitors' spot, the parts of a bean definition in the element column.
 */
const entities: Entity[] = [
  { id: 'coach', kind: 'actor', label: 'Coach', pos: { x: 4.4, y: 18.5 }, size: { w: 1.2, d: 1.2, h: 0.5 }, tone: 'neutral' },
  { id: 'context', kind: 'container', label: 'Spring context', pos: { x: 0, y: 0 }, size: { w: 17.2, d: 17.2, h: FLOOR }, tone: 'neutral' },
  { id: 'controller', kind: 'block', label: 'AnalysisController', ...at(6.0, 16.0), tone: 'neutral', icon: 'arrow-in' },
  { id: 'analyzer', kind: 'block', label: 'InstanceofAnalyzer', ...at(8.25, 13.75), tone: 'danger', icon: 'warning' },
  { id: 'workout', kind: 'block', label: 'Workout', ...at(8.25, 13.75), tone: 'neutral', icon: 'board' },
  { id: 'lift', kind: 'block', label: 'Lift', ...at(7.25, 7.75), tone: 'neutral', icon: 'ten' },
  { id: 'gym', kind: 'block', label: 'Gymnastics', ...at(10.75, 11.25), tone: 'neutral', icon: 'plus' },
  { id: 'cardio', kind: 'block', label: 'Cardio', ...at(14.25, 14.75), tone: 'neutral', icon: 'timer' },
  { id: 'equip', kind: 'block', label: 'EquipmentVisitor', ...at(11.5, 6.5), tone: 'accent', icon: 'key' },
  { id: 'cal', kind: 'block', label: 'CalorieVisitor', ...at(15.5, 10.5), tone: 'accent', icon: 'heart' },
  { id: 'visitor', kind: 'interface', label: 'WorkoutVisitor', ...at(16.0, 6.0, IFACE), tone: 'neutral' },
  { id: 'bdVisitor', kind: 'block', label: 'BeanDefinitionVisitor', ...at(11.5, 6.5), tone: 'accent', icon: 'gear' },
  { id: 'bdClass', kind: 'block', label: 'class name', ...at(7.25, 7.75), tone: 'neutral', icon: 'file' },
  { id: 'bdProps', kind: 'block', label: 'coach = ${coach}', ...at(10.75, 11.25), tone: 'neutral', icon: 'file' },
  { id: 'bdArgs', kind: 'block', label: 'arg = ${city}', ...at(14.25, 14.75), tone: 'neutral', icon: 'file' },
];

const ELEMENTS = ['lift', 'gym', 'cardio'];
const VISITORS = ['equip', 'cal', 'visitor'];
const SPRING = ['context', 'coach', 'controller', 'workout', ...ELEMENTS, ...VISITORS];

const scene: Scene = {
  entities,
  links: [
    { id: 'l-coach-controller', from: 'coach', to: 'controller', style: 'call' },
    { id: 'l-controller-analyzer', from: 'controller', to: 'analyzer', style: 'call' },
    { id: 'l-analyzer-lift', from: 'analyzer', to: 'lift', style: 'call' },
    { id: 'l-analyzer-gym', from: 'analyzer', to: 'gym', style: 'call' },
    { id: 'l-analyzer-cardio', from: 'analyzer', to: 'cardio', style: 'call' },
    { id: 'l-controller-workout', from: 'controller', to: 'workout', style: 'call' },
    { id: 'l-workout-lift', from: 'workout', to: 'lift', style: 'call' },
    { id: 'l-workout-gym', from: 'workout', to: 'gym', style: 'call' },
    { id: 'l-workout-cardio', from: 'workout', to: 'cardio', style: 'call' },
    { id: 'l-lift-equip', from: 'lift', to: 'equip', style: 'call' },
    { id: 'l-cardio-cal', from: 'cardio', to: 'cal', style: 'call' },
    { id: 'l-gym-cal', from: 'gym', to: 'cal', style: 'call' },
    { id: 'l-equip-visitor', from: 'equip', to: 'visitor', style: 'implements' },
    { id: 'l-cal-visitor', from: 'cal', to: 'visitor', style: 'implements' },
    { id: 'l-bd-class', from: 'bdVisitor', to: 'bdClass', style: 'call' },
    { id: 'l-bd-props', from: 'bdVisitor', to: 'bdProps', style: 'call' },
    { id: 'l-bd-args', from: 'bdVisitor', to: 'bdArgs', style: 'call' },
  ],
  steps: [
    {
      id: 'problem',
      visible: ['controller', 'analyzer', ...ELEMENTS],
      highlight: ['analyzer'],
      packets: [
        { link: 'l-analyzer-lift', label: 'instanceof Lift?' },
        { link: 'l-analyzer-gym', label: 'instanceof Gymnastics?' },
      ],
      code: { file: `${MAIN}/before/InstanceofAnalyzer.java`, region: 'instanceof', highlight: [4, 5] },
    },
    {
      id: 'smell',
      visible: ['controller', 'analyzer', ...ELEMENTS],
      highlight: ['analyzer', 'cardio'],
      packets: [{ link: 'l-analyzer-cardio', label: '0 kcal ?' }],
      code: { file: `${MAIN}/before/InstanceofAnalyzer.java`, region: 'instanceof', highlight: [6] },
    },
    {
      id: 'visitor',
      visible: [...ELEMENTS, ...VISITORS],
      highlight: ['visitor'],
      packets: [],
      code: { file: `${MAIN}/WorkoutVisitor.java`, region: 'visitor', highlight: [3, 4, 5, 6] },
    },
    {
      id: 'accept',
      visible: [...ELEMENTS, ...VISITORS],
      highlight: ['lift', 'equip'],
      packets: [{ link: 'l-lift-equip', label: 'visitLift(this)' }],
      code: { file: `${MAIN}/Lift.java`, region: 'accept', highlight: [2, 3] },
    },
    {
      id: 'equipment',
      visible: ['workout', ...ELEMENTS, ...VISITORS],
      highlight: ['equip'],
      packets: [
        { link: 'l-workout-lift', label: 'accept(v)' },
        { link: 'l-lift-equip', label: 'barbell + plates' },
      ],
      code: { file: `${MAIN}/EquipmentVisitor.java`, region: 'equipment', highlight: [2, 7, 13] },
    },
    {
      id: 'new-operation',
      visible: ['workout', ...ELEMENTS, ...VISITORS],
      highlight: ['cal'],
      packets: [
        { link: 'l-gym-cal', label: 'visitGymnastics' },
        { link: 'l-cardio-cal', label: 'visitCardio' },
      ],
      code: { file: `${MAIN}/CalorieVisitor.java`, region: 'calories', highlight: [1, 2, 3] },
    },
    {
      id: 'sealed',
      visible: [...ELEMENTS, ...VISITORS],
      highlight: ELEMENTS,
      packets: [],
      code: { file: `${MAIN}/PatternMatchingCalories.java`, region: 'sealed', highlight: [4, 5, 6, 7] },
    },
    {
      id: 'request',
      visible: SPRING,
      highlight: ['workout', 'equip', 'cal'],
      packets: [
        { link: 'l-coach-controller', label: 'POST /api/wods/analysis' },
        { link: 'l-controller-workout', label: 'visit(…) ×2' },
        { link: 'l-workout-cardio', label: 'accept(v)' },
        { link: 'l-cardio-cal', label: '60 kcal' },
      ],
      code: { file: `${TEST}/web/AnalysisApiTest.java`, region: 'request', highlight: [1, 6, 7] },
    },
    {
      id: 'spring-does-it',
      visible: ['context', 'bdVisitor', 'bdClass', 'bdProps', 'bdArgs'],
      highlight: ['bdVisitor'],
      packets: [
        { link: 'l-bd-props', label: '${coach} → Ana' },
        { link: 'l-bd-args', label: '${city} → Madrid' },
      ],
      code: { file: `${TEST}/SpringDoesItTooTest.java`, region: 'bean-visitor', highlight: [2, 3, 4] },
    },
    {
      id: 'recap',
      visible: SPRING,
      highlight: [],
      packets: [],
      code: { file: `${MAIN}/WorkoutVisitor.java`, region: 'visitor', highlight: [3, 4, 5, 6] },
    },
  ],
};

export default scene;
