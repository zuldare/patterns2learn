import type { Category, Entity, Scene } from '../../../engine/types';

export const category: Category = 'structural';

const MAIN = 'structural/decorator/src/main/java/com/patterns2learn/box/decorator';
const TEST = 'structural/decorator/src/test/java/com/patterns2learn/box/decorator';

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
 * - The decorator chain runs diagonally from the quoter to the basic plan:
 *   NutritionAddOn → PhysioAddOn → BasicMembership, each wrapping the next.
 * - The "one subclass per combination" blocks of the before steps reuse those
 *   three spots, so the explosion and the chain occupy the same place.
 * - StudentDiscount sits in front of the chain; Membership below it. The
 *   decorators are drawn on the platform for readability, but they're plain
 *   objects the quoter creates per quote, not beans (the text says so).
 * - BeanPostProcessor and AuditedMembership only appear in spring-does-it.
 */
const entities: Entity[] = [
  { id: 'athlete', kind: 'actor', label: 'Athlete', pos: { x: 1.9, y: 10.9 }, size: { w: 1.2, d: 1.2, h: 0.5 }, tone: 'neutral' },
  { id: 'context', kind: 'container', label: 'Spring context', pos: { x: 0, y: 0 }, size: { w: 12.4, d: 9.8, h: FLOOR }, tone: 'neutral' },
  { id: 'controller', kind: 'block', label: 'MembershipController', ...at(1.8, 7.4), tone: 'neutral', icon: 'arrow-in' },
  { id: 'quoter', kind: 'block', label: 'MembershipQuoter', ...at(3.6, 3.6), tone: 'neutral', icon: 'gear' },
  { id: 'c1', kind: 'block', label: 'BasicWithPhysio', ...at(6.4, 1.4), tone: 'warn', icon: 'plus' },
  { id: 'c2', kind: 'block', label: 'BasicWithNutrition', ...at(9.2, 2.4), tone: 'warn', icon: 'plus' },
  { id: 'c3', kind: 'block', label: 'BasicWithPhysioAndNutrition', ...at(11.4, 4.8), tone: 'danger', icon: 'warning' },
  { id: 'nutrition', kind: 'block', label: 'NutritionAddOn', ...at(6.4, 1.4), tone: 'neutral', icon: 'plus' },
  { id: 'physio', kind: 'block', label: 'PhysioAddOn', ...at(9.2, 2.4), tone: 'neutral', icon: 'plus' },
  { id: 'basic', kind: 'block', label: 'BasicMembership', ...at(11.4, 4.8), tone: 'neutral', icon: 'calendar' },
  { id: 'student', kind: 'block', label: 'StudentDiscount', ...at(5.6, 6.0), tone: 'neutral', icon: 'tag' },
  { id: 'iface', kind: 'interface', label: 'Membership', ...at(8.6, 8.4, IFACE), tone: 'neutral' },
  { id: 'bpp', kind: 'block', label: 'BeanPostProcessor', ...at(2.0, 1.6), tone: 'accent', icon: 'gear' },
  { id: 'audited', kind: 'block', label: 'AuditedMembership', ...at(6.4, 1.4), tone: 'accent', icon: 'shield' },
];

const BEFORE = ['athlete', 'controller', 'c1', 'c2', 'c3'];
const CHAIN = ['iface', 'nutrition', 'physio', 'basic'];
const SPRING = ['context', 'athlete', 'controller', 'quoter', 'student', ...CHAIN];

const scene: Scene = {
  entities,
  links: [
    { id: 'l-athlete-controller', from: 'athlete', to: 'controller', style: 'call' },
    { id: 'l-controller-c1', from: 'controller', to: 'c1', style: 'call' },
    { id: 'l-controller-c2', from: 'controller', to: 'c2', style: 'call' },
    { id: 'l-controller-c3', from: 'controller', to: 'c3', style: 'call' },
    { id: 'l-controller-quoter', from: 'controller', to: 'quoter', style: 'call' },
    { id: 'l-quoter-nutrition', from: 'quoter', to: 'nutrition', style: 'call' },
    { id: 'l-quoter-student', from: 'quoter', to: 'student', style: 'call' },
    { id: 'l-student-nutrition', from: 'student', to: 'nutrition', style: 'call' },
    { id: 'l-student-physio', from: 'student', to: 'physio', style: 'call' },
    { id: 'l-nutrition-physio', from: 'nutrition', to: 'physio', style: 'call' },
    { id: 'l-physio-basic', from: 'physio', to: 'basic', style: 'call' },
    { id: 'l-nutrition-iface', from: 'nutrition', to: 'iface', style: 'implements' },
    { id: 'l-physio-iface', from: 'physio', to: 'iface', style: 'implements' },
    { id: 'l-basic-iface', from: 'basic', to: 'iface', style: 'implements' },
    { id: 'l-student-iface', from: 'student', to: 'iface', style: 'implements' },
    { id: 'l-bpp-audited', from: 'bpp', to: 'audited', style: 'call' },
    { id: 'l-audited-basic', from: 'audited', to: 'basic', style: 'call' },
  ],
  steps: [
    {
      id: 'problem',
      visible: BEFORE,
      highlight: ['c3'],
      packets: [{ link: 'l-athlete-controller', label: 'physio + nutrition' }],
      code: { file: `${MAIN}/before/SubclassedPlans.java`, region: 'explosion', highlight: [6, 7] },
    },
    {
      id: 'smell',
      visible: BEFORE,
      highlight: ['c1', 'c2', 'c3'],
      packets: [],
      code: { file: `${MAIN}/before/SubclassedPlans.java`, region: 'explosion', highlight: [1, 5] },
    },
    {
      id: 'decorator',
      visible: ['iface', 'physio', 'basic'],
      highlight: ['physio'],
      packets: [{ link: 'l-physio-basic', label: 'monthlyFee()' }],
      code: { file: `${MAIN}/PhysioAddOn.java`, region: 'physio', highlight: [1, 8, 13] },
    },
    {
      id: 'stacking',
      visible: CHAIN,
      highlight: ['nutrition', 'physio'],
      packets: [
        { link: 'l-nutrition-physio', label: 'fee?' },
        { link: 'l-physio-basic', label: 'fee?' },
        { link: 'l-physio-basic', label: '59.00', reverse: true },
        { link: 'l-nutrition-physio', label: '84.00', reverse: true },
      ],
      code: { file: `${TEST}/MembershipTest.java`, region: 'stacking', highlight: [1, 4] },
    },
    {
      id: 'spring-addons',
      visible: SPRING,
      highlight: ['context', 'quoter'],
      packets: [],
      code: { file: `${MAIN}/AddOns.java`, region: 'addon-beans', highlight: [1, 6, 11, 16] },
    },
    {
      id: 'request',
      visible: SPRING,
      highlight: ['nutrition', 'physio'],
      packets: [
        { link: 'l-athlete-controller', label: 'physio + nutrition' },
        { link: 'l-controller-quoter', label: 'quote()' },
        { link: 'l-quoter-nutrition', label: 'monthlyFee()' },
        { link: 'l-nutrition-physio', label: 'monthlyFee()' },
        { link: 'l-physio-basic', label: 'monthlyFee()' },
      ],
      code: { file: `${MAIN}/MembershipQuoter.java`, region: 'quoter', highlight: [3, 11] },
    },
    {
      id: 'order',
      visible: SPRING.filter((id) => id !== 'nutrition'),
      highlight: ['student'],
      packets: [
        { link: 'l-quoter-student', label: 'monthlyFee()' },
        { link: 'l-student-physio', label: 'monthlyFee()' },
        { link: 'l-student-physio', label: '84.00', reverse: true },
        { link: 'l-quoter-student', label: '67.20', reverse: true },
      ],
      code: { file: `${TEST}/MembershipTest.java`, region: 'order-matters', highlight: [1, 2, 4, 5] },
    },
    {
      id: 'spring-does-it',
      visible: ['context', 'bpp', 'audited', 'basic'],
      highlight: ['bpp', 'audited'],
      packets: [
        { link: 'l-bpp-audited', label: 'wrap' },
        { link: 'l-audited-basic', label: 'monthlyFee()' },
      ],
      code: { file: `${TEST}/SpringDoesItTooTest.java`, region: 'bpp', highlight: [3, 5] },
    },
    {
      id: 'recap',
      visible: SPRING,
      highlight: [],
      packets: [],
      code: { file: `${MAIN}/PhysioAddOn.java`, region: 'physio', highlight: [1, 8, 13] },
    },
  ],
};

export default scene;
