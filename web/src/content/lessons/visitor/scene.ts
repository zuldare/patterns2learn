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
 * Layout notes. Positions come from screen coordinates (u = x − y across, v = x + y down):
 * - Left to right on the middle row (v 22): controller (u −12) → Workout, the structure (u −6.5) → the
 *   element column (u 0.5: Lift v 15, Gymnastics v 22, Cardio v 29) → the two visitors (u 6.5: v 18 and
 *   v 26) → the WorkoutVisitor interface (u 11.5, v 22).
 * - Workout sits 7 units left of the elements so "instanceof Gymnastics?" parks between them; the
 *   visitors sit 6 to the right so "barbell + plates" clears Lift.
 * - The coach stands below-left, outside the platform (u −14, v 31): the request climbs to the
 *   controller and its long packet parks under the controller, clear of the context label.
 * - InstanceofAnalyzer (before) takes Workout's spot.
 * - spring-does-it: BeanDefinitionVisitor in EquipmentVisitor's spot, the parts of a bean definition in the element column.
 */
const entities: Entity[] = [
  { id: 'coach', kind: 'actor', label: 'Coach', pos: { x: 7.9, y: 21.9 }, size: { w: 1.2, d: 1.2, h: 0.5 }, tone: 'neutral' },
  { id: 'context', kind: 'container', label: 'Spring context', pos: { x: 3.5, y: 3.5 }, size: { w: 15, d: 15, h: FLOOR }, tone: 'neutral' },
  { id: 'controller', kind: 'block', label: 'AnalysisController', ...at(5.0, 17.0), tone: 'neutral', icon: 'arrow-in' },
  { id: 'analyzer', kind: 'block', label: 'InstanceofAnalyzer', ...at(7.75, 14.25), tone: 'danger', icon: 'warning' },
  { id: 'workout', kind: 'block', label: 'Workout', ...at(7.75, 14.25), tone: 'neutral', icon: 'board' },
  { id: 'lift', kind: 'block', label: 'Lift', ...at(7.75, 7.25), tone: 'neutral', icon: 'ten' },
  { id: 'gym', kind: 'block', label: 'Gymnastics', ...at(11.25, 10.75), tone: 'neutral', icon: 'plus' },
  { id: 'cardio', kind: 'block', label: 'Cardio', ...at(14.75, 14.25), tone: 'neutral', icon: 'timer' },
  { id: 'equip', kind: 'block', label: 'EquipmentVisitor', ...at(12.25, 5.75), tone: 'accent', icon: 'key' },
  { id: 'cal', kind: 'block', label: 'CalorieVisitor', ...at(16.25, 9.75), tone: 'accent', icon: 'heart' },
  { id: 'visitor', kind: 'interface', label: 'WorkoutVisitor', ...at(16.75, 5.25, IFACE), tone: 'neutral' },
  { id: 'bdVisitor', kind: 'block', label: 'BeanDefinitionVisitor', ...at(12.25, 5.75), tone: 'accent', icon: 'gear' },
  { id: 'bdClass', kind: 'block', label: 'class name', ...at(7.75, 7.25), tone: 'neutral', icon: 'file' },
  { id: 'bdProps', kind: 'block', label: 'coach = ${coach}', ...at(11.25, 10.75), tone: 'neutral', icon: 'file' },
  { id: 'bdArgs', kind: 'block', label: 'arg = ${city}', ...at(14.75, 14.25), tone: 'neutral', icon: 'file' },
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
      code: { file: `${MAIN}/EquipmentVisitor.java`, region: 'equipment', highlight: [2, 8, 14, 15, 16] },
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
