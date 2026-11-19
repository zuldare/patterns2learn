import type { Category, Entity, Scene } from '../../../engine/types';

export const category: Category = 'behavioral';

const MAIN = 'behavioral/chain-of-responsibility/src/main/java/com/patterns2learn/box/chain';
const TEST = 'behavioral/chain-of-responsibility/src/test/java/com/patterns2learn/box/chain';

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
 * - The chain runs as a diagonal row towards the back-right corner:
 *   AuditRule → MembershipRule → WaiverRule → CapacityRule, in @Order order.
 * - The GoF handlers reuse the last three spots; the monolith sits alone.
 * - AccessRule (the interface) sits below the row; the servlet filter demo
 *   reuses the empty middle of the platform.
 */
const entities: Entity[] = [
  { id: 'athlete', kind: 'actor', label: 'Athlete', pos: { x: 1.9, y: 10.9 }, size: { w: 1.2, d: 1.2, h: 0.5 }, tone: 'neutral' },
  { id: 'context', kind: 'container', label: 'Spring context', pos: { x: 0, y: 0 }, size: { w: 12.4, d: 9.8, h: FLOOR }, tone: 'neutral' },
  { id: 'controller', kind: 'block', label: 'CheckInController', ...at(1.8, 7.4), tone: 'neutral', icon: 'arrow-in' },
  { id: 'monolith', kind: 'block', label: 'MonolithicCheckIn', ...at(5.6, 3.4), tone: 'danger', icon: 'warning' },
  { id: 'gMember', kind: 'block', label: 'MembershipHandler', ...at(7.2, 1.9), tone: 'warn', icon: 'calendar' },
  { id: 'gWaiver', kind: 'block', label: 'WaiverHandler', ...at(9.8, 2.8), tone: 'warn', icon: 'file' },
  { id: 'gCapacity', kind: 'block', label: 'CapacityHandler', ...at(11.6, 4.6), tone: 'warn', icon: 'ten' },
  { id: 'access', kind: 'block', label: 'AccessControl', ...at(3.8, 4.6), tone: 'neutral', icon: 'gear' },
  { id: 'audit', kind: 'block', label: 'AuditRule', ...at(4.6, 1.0), tone: 'neutral', icon: 'board' },
  { id: 'membership', kind: 'block', label: 'MembershipRule', ...at(7.2, 1.9), tone: 'neutral', icon: 'calendar' },
  { id: 'waiver', kind: 'block', label: 'WaiverRule', ...at(9.8, 2.8), tone: 'neutral', icon: 'file' },
  { id: 'capacity', kind: 'block', label: 'CapacityRule', ...at(11.6, 4.6), tone: 'neutral', icon: 'ten' },
  { id: 'iface', kind: 'interface', label: 'AccessRule', ...at(7.6, 7.6, IFACE), tone: 'neutral' },
  { id: 'filter', kind: 'block', label: 'WaiverHeaderFilter', ...at(5.0, 4.6), tone: 'accent', icon: 'shield' },
  { id: 'servlet', kind: 'block', label: 'DispatcherServlet', ...at(9.4, 4.6), tone: 'neutral', icon: 'arrow-in' },
];

const RULES = ['audit', 'membership', 'waiver', 'capacity'];
const SPRING = ['context', 'athlete', 'controller', 'access', ...RULES, 'iface'];

const scene: Scene = {
  entities,
  links: [
    { id: 'l-athlete-controller', from: 'athlete', to: 'controller', style: 'call' },
    { id: 'l-controller-monolith', from: 'controller', to: 'monolith', style: 'call' },
    { id: 'l-controller-gmember', from: 'controller', to: 'gMember', style: 'call' },
    { id: 'l-gmember-gwaiver', from: 'gMember', to: 'gWaiver', style: 'call' },
    { id: 'l-gwaiver-gcapacity', from: 'gWaiver', to: 'gCapacity', style: 'call' },
    { id: 'l-controller-access', from: 'controller', to: 'access', style: 'call' },
    { id: 'l-access-audit', from: 'access', to: 'audit', style: 'call' },
    { id: 'l-audit-membership', from: 'audit', to: 'membership', style: 'call' },
    { id: 'l-membership-waiver', from: 'membership', to: 'waiver', style: 'call' },
    { id: 'l-waiver-capacity', from: 'waiver', to: 'capacity', style: 'call' },
    { id: 'l-audit-iface', from: 'audit', to: 'iface', style: 'implements' },
    { id: 'l-membership-iface', from: 'membership', to: 'iface', style: 'implements' },
    { id: 'l-waiver-iface', from: 'waiver', to: 'iface', style: 'implements' },
    { id: 'l-capacity-iface', from: 'capacity', to: 'iface', style: 'implements' },
    { id: 'l-athlete-filter', from: 'athlete', to: 'filter', style: 'call' },
    { id: 'l-filter-servlet', from: 'filter', to: 'servlet', style: 'call' },
  ],
  steps: [
    {
      id: 'problem',
      visible: ['athlete', 'controller', 'monolith'],
      highlight: ['monolith'],
      packets: [{ link: 'l-athlete-controller', label: 'Leo · 18:00' }],
      code: { file: `${MAIN}/before/MonolithicCheckIn.java`, region: 'monolith', highlight: [2, 5, 9, 12] },
    },
    {
      id: 'smell',
      visible: ['athlete', 'controller', 'monolith'],
      highlight: ['monolith'],
      packets: [],
      code: { file: `${MAIN}/before/MonolithicCheckIn.java`, region: 'monolith', highlight: [8] },
    },
    {
      id: 'gof',
      visible: ['athlete', 'controller', 'gMember', 'gWaiver', 'gCapacity'],
      highlight: ['gMember', 'gWaiver', 'gCapacity'],
      packets: [
        { link: 'l-controller-gmember', label: 'Leo' },
        { link: 'l-gmember-gwaiver', label: 'Leo' },
        { link: 'l-gmember-gwaiver', label: 'denied', reverse: true },
      ],
      code: { file: `${MAIN}/before/AccessHandler.java`, region: 'gof-handler', highlight: [7, 9, 11] },
    },
    {
      id: 'spring-chain',
      visible: SPRING,
      highlight: ['context', 'access'],
      packets: [],
      code: { file: `${MAIN}/AccessChain.java`, region: 'chain', highlight: [6, 7, 9, 10] },
    },
    {
      id: 'request',
      visible: SPRING,
      highlight: ['membership', 'waiver', 'capacity'],
      packets: [
        { link: 'l-athlete-controller', label: 'Ana · 18:00' },
        { link: 'l-controller-access', label: 'decide()' },
        { link: 'l-access-audit', label: 'proceed()' },
        { link: 'l-audit-membership', label: 'proceed()' },
        { link: 'l-membership-waiver', label: 'proceed()' },
        { link: 'l-waiver-capacity', label: 'proceed()' },
      ],
      code: { file: `${MAIN}/MembershipRule.java`, region: 'rule', highlight: [2, 13, 15] },
    },
    {
      id: 'denied',
      visible: SPRING,
      highlight: ['waiver'],
      packets: [
        { link: 'l-athlete-controller', label: 'Leo · 18:00' },
        { link: 'l-audit-membership', label: 'proceed()' },
        { link: 'l-membership-waiver', label: 'proceed()' },
        { link: 'l-membership-waiver', label: 'waiver not signed', reverse: true },
      ],
      code: { file: `${TEST}/AccessControlTest.java`, region: 'denied', highlight: [1, 3, 4] },
    },
    {
      id: 'order',
      visible: SPRING,
      highlight: ['capacity'],
      packets: [],
      code: { file: `${MAIN}/CapacityRule.java`, region: 'capacity', highlight: [6, 9] },
    },
    {
      id: 'audit',
      visible: SPRING,
      highlight: ['audit'],
      packets: [
        { link: 'l-access-audit', label: 'proceed()' },
        { link: 'l-access-audit', label: 'granted', reverse: true },
      ],
      code: { file: `${MAIN}/AuditRule.java`, region: 'audit', highlight: [3, 4, 6] },
    },
    {
      id: 'spring-does-it',
      visible: ['context', 'athlete', 'filter', 'servlet'],
      highlight: ['filter'],
      packets: [
        { link: 'l-athlete-filter', label: 'GET /api/wods' },
        { link: 'l-filter-servlet', label: 'doFilter()' },
      ],
      code: { file: `${TEST}/SpringDoesItTooTest.java`, region: 'servlet-chain', highlight: [6, 9] },
    },
    {
      id: 'recap',
      visible: SPRING,
      highlight: [],
      packets: [],
      code: { file: `${MAIN}/MembershipRule.java`, region: 'rule', highlight: [13, 15] },
    },
  ],
};

export default scene;
