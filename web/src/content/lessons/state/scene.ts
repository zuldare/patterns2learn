import type { Category, Entity, Scene } from '../../../engine/types';

export const category: Category = 'behavioral';

const MAIN = 'behavioral/state/src/main/java/com/patterns2learn/box/state';
const TEST = 'behavioral/state/src/test/java/com/patterns2learn/box/state';

/** Platform height: everything inside the Spring context stands on it. */
const FLOOR = 0.25;
const BLOCK = { w: 1, d: 1, h: 0.6 };

/** Block centred on (cx, cy), standing on the context platform. */
const at = (cx: number, cy: number, size = BLOCK) => ({
  pos: { x: cx - size.w / 2, y: cy - size.d / 2, z: FLOOR },
  size,
});

/*
 * Layout notes. Screen coordinates: sx = x − y (horizontal), sy = x + y (vertical); three rows 7 apart in sy.
 * - Middle row (sy 19), left to right: controller (sx −9) → MembershipService (sx −3.8) → Membership, the
 *   context (sx 1) → ACTIVE (sx 7.6); each gap leaves room for the packet that parks on that link.
 * - The four states form a small state diagram around ACTIVE: TRIAL up-left (sx 2.8, sy 14), FROZEN up-right
 *   (sx 12.1, sy 15) and EXPIRED down-right (sx 12.1, sy 23); links between them are the transitions.
 *   Opposite transitions (freeze/resume, expire/renew) share one drawn line, so their parked packets coincide.
 * - Bottom row (sy 26): repository below the service, database to its right.
 * - The athlete stands below-left of the controller (sx −12, sy 29), off the platform, so the long
 *   POST packet parks on the diagonal, clear of the controller and the repository's label.
 * - SwitchingMembership (before) takes Membership's spot. The platform hugs the blocks.
 */
const entities: Entity[] = [
  { id: 'athlete', kind: 'actor', label: 'Athlete', pos: { x: 7.9, y: 19.9 }, size: { w: 1.2, d: 1.2, h: 0.5 }, tone: 'neutral' },
  { id: 'context', kind: 'container', label: 'Spring context', pos: { x: 3.5, y: -0.05 }, size: { w: 15.55, d: 16.45, h: FLOOR }, tone: 'neutral' },
  { id: 'controller', kind: 'block', label: 'MembershipController', ...at(5, 14), tone: 'neutral', icon: 'arrow-in' },
  { id: 'service', kind: 'block', label: 'MembershipService', ...at(7.6, 11.4), tone: 'neutral', icon: 'gear' },
  { id: 'switching', kind: 'block', label: 'SwitchingMembership', ...at(10, 9), tone: 'danger', icon: 'warning' },
  { id: 'membership', kind: 'block', label: 'Membership', ...at(10, 9), tone: 'accent', icon: 'ticket' },
  { id: 'trial', kind: 'block', label: 'TRIAL', ...at(8.4, 5.6), tone: 'neutral', icon: 'tag' },
  { id: 'active', kind: 'block', label: 'ACTIVE', ...at(13.3, 5.7), tone: 'accent', icon: 'key' },
  { id: 'frozen', kind: 'block', label: 'FROZEN', ...at(13.55, 1.45), tone: 'neutral', icon: 'timer' },
  { id: 'expired', kind: 'block', label: 'EXPIRED', ...at(17.55, 5.45), tone: 'warn', icon: 'warning' },
  { id: 'repo', kind: 'block', label: 'MembershipRepository', ...at(11.1, 14.9), tone: 'neutral', icon: 'gear' },
  { id: 'db', kind: 'block', label: 'membership table', ...at(13.7, 12.3), tone: 'neutral', icon: 'db' },
];

const STATES = ['trial', 'active', 'frozen', 'expired'];
const SPRING = ['context', 'athlete', 'controller', 'service', 'membership', ...STATES, 'repo', 'db'];

const scene: Scene = {
  entities,
  links: [
    { id: 'l-athlete-controller', from: 'athlete', to: 'controller', style: 'call' },
    { id: 'l-controller-switching', from: 'controller', to: 'switching', style: 'call' },
    { id: 'l-controller-service', from: 'controller', to: 'service', style: 'call' },
    { id: 'l-service-membership', from: 'service', to: 'membership', style: 'call' },
    { id: 'l-service-repo', from: 'service', to: 'repo', style: 'call' },
    { id: 'l-repo-db', from: 'repo', to: 'db', style: 'call' },
    { id: 'l-membership-active', from: 'membership', to: 'active', style: 'call' },
    { id: 't-trial-active', from: 'trial', to: 'active', style: 'call' },
    { id: 't-active-frozen', from: 'active', to: 'frozen', style: 'call' },
    { id: 't-frozen-active', from: 'frozen', to: 'active', style: 'call' },
    { id: 't-active-expired', from: 'active', to: 'expired', style: 'call' },
    { id: 't-frozen-expired', from: 'frozen', to: 'expired', style: 'call' },
    { id: 't-expired-active', from: 'expired', to: 'active', style: 'call' },
  ],
  steps: [
    {
      id: 'problem',
      visible: ['athlete', 'controller', 'switching'],
      highlight: ['switching'],
      packets: [
        { link: 'l-athlete-controller', label: 'check-in' },
        { link: 'l-controller-switching', label: 'switch (status)' },
      ],
      code: { file: `${MAIN}/before/SwitchingMembership.java`, region: 'switching', highlight: [2, 11, 12, 19, 20] },
    },
    {
      id: 'smell',
      visible: ['athlete', 'controller', 'switching'],
      highlight: ['switching'],
      packets: [],
      code: { file: `${MAIN}/before/SwitchingMembership.java`, region: 'switching', highlight: [6, 14, 22] },
    },
    {
      id: 'states',
      visible: STATES,
      highlight: STATES,
      packets: [
        { link: 't-trial-active', label: 'renew()' },
        { link: 't-active-frozen', label: 'freeze()' },
        { link: 't-frozen-active', label: 'resume()' },
        { link: 't-active-expired', label: 'expire()' },
        { link: 't-expired-active', label: 'renew()' },
      ],
      code: { file: `${MAIN}/MembershipState.java`, region: 'states', highlight: [3, 9, 12, 16, 18, 24, 25, 31] },
    },
    {
      id: 'context',
      visible: ['membership', ...STATES],
      highlight: ['membership'],
      packets: [{ link: 'l-membership-active', label: 'state.freeze(this)' }],
      code: { file: `${MAIN}/Membership.java`, region: 'context', highlight: [1, 2, 3, 4, 5] },
    },
    {
      id: 'defaults',
      visible: ['membership', ...STATES],
      highlight: ['trial', 'expired'],
      packets: [],
      code: { file: `${MAIN}/MembershipState.java`, region: 'defaults', highlight: [1, 2, 6, 8, 11] },
    },
    {
      id: 'walkthrough',
      visible: ['membership', ...STATES],
      highlight: ['active', 'frozen'],
      packets: [
        { link: 't-active-frozen', label: 'freeze()' },
        { link: 't-frozen-active', label: 'resume()' },
      ],
      code: { file: `${TEST}/MembershipTest.java`, region: 'freeze', highlight: [3, 4, 5, 6] },
    },
    {
      id: 'request',
      visible: SPRING,
      highlight: ['membership', 'frozen'],
      packets: [
        { link: 'l-athlete-controller', label: 'POST /api/memberships/1/freeze' },
        { link: 'l-controller-service', label: 'apply()' },
        { link: 'l-service-repo', label: 'find()' },
        { link: 'l-service-membership', label: 'freeze()' },
        { link: 't-active-frozen', label: 'FROZEN' },
      ],
      code: { file: `${TEST}/web/MembershipApiTest.java`, region: 'request', highlight: [1, 3, 4, 5, 6] },
    },
    {
      id: 'persist',
      visible: ['context', 'service', 'membership', ...STATES, 'repo', 'db'],
      highlight: ['repo', 'db'],
      packets: [{ link: 'l-repo-db', label: '"FROZEN"' }],
      code: { file: `${MAIN}/MembershipRepository.java`, region: 'persist', highlight: [5, 13, 14, 17] },
    },
    {
      id: 'recap',
      visible: SPRING,
      highlight: [],
      packets: [],
      code: { file: `${MAIN}/Membership.java`, region: 'context', highlight: [1, 2, 3, 4, 5] },
    },
  ],
};

export default scene;
