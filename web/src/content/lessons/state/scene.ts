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
 * Layout notes. Positions come from screen coordinates (sx = x − y, sy = (x + y) / 2), shifted by +2.5:
 * - Left to right: controller (sx −13) → MembershipService (sx −7) → Membership, the context (sx −2.5).
 * - The four states form a small state diagram on the right: TRIAL (sx 2, up), ACTIVE (sx 6.5),
 *   FROZEN (sx 11, up) and EXPIRED (sx 11, down); links between them are the transitions.
 * - Repository and database below the service. SwitchingMembership (before) takes Membership's spot.
 */
const entities: Entity[] = [
  { id: 'athlete', kind: 'actor', label: 'Athlete', pos: { x: 1.65, y: 19.3 }, size: { w: 1.2, d: 1.2, h: 0.5 }, tone: 'neutral' },
  { id: 'context', kind: 'container', label: 'Spring context', pos: { x: 0, y: 0 }, size: { w: 18.6, d: 17.6, h: FLOOR }, tone: 'neutral' },
  { id: 'controller', kind: 'block', label: 'MembershipController', ...at(3.0, 16.0), tone: 'neutral', icon: 'arrow-in' },
  { id: 'service', kind: 'block', label: 'MembershipService', ...at(6.0, 13.0), tone: 'neutral', icon: 'gear' },
  { id: 'switching', kind: 'block', label: 'SwitchingMembership', ...at(8.25, 10.75), tone: 'danger', icon: 'warning' },
  { id: 'membership', kind: 'block', label: 'Membership', ...at(8.25, 10.75), tone: 'accent', icon: 'ticket' },
  { id: 'trial', kind: 'block', label: 'TRIAL', ...at(7.5, 5.5), tone: 'neutral', icon: 'tag' },
  { id: 'active', kind: 'block', label: 'ACTIVE', ...at(12.75, 6.25), tone: 'accent', icon: 'key' },
  { id: 'frozen', kind: 'block', label: 'FROZEN', ...at(13.0, 2.0), tone: 'neutral', icon: 'timer' },
  { id: 'expired', kind: 'block', label: 'EXPIRED', ...at(18.0, 7.0), tone: 'warn', icon: 'warning' },
  { id: 'repo', kind: 'block', label: 'MembershipRepository', ...at(10.0, 17.0), tone: 'neutral', icon: 'gear' },
  { id: 'db', kind: 'block', label: 'membership table', ...at(13.75, 16.25), tone: 'neutral', icon: 'db' },
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
      code: { file: `${MAIN}/before/SwitchingMembership.java`, region: 'switching', highlight: [6, 13, 14, 21, 22] },
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
      ],
      code: { file: `${MAIN}/MembershipState.java`, region: 'states', highlight: [9, 13, 15, 21, 28] },
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
      code: { file: `${MAIN}/MembershipState.java`, region: 'defaults', highlight: [1, 2, 7, 10] },
    },
    {
      id: 'walkthrough',
      visible: ['membership', ...STATES],
      highlight: ['active', 'frozen'],
      packets: [
        { link: 't-active-frozen', label: 'freeze()' },
        { link: 't-frozen-active', label: 'resume()' },
      ],
      code: { file: `${TEST}/MembershipTest.java`, region: 'freeze', highlight: [3, 4, 5] },
    },
    {
      id: 'request',
      visible: SPRING,
      highlight: ['membership', 'frozen'],
      packets: [
        { link: 'l-athlete-controller', label: 'POST /api/memberships/1/freeze' },
        { link: 'l-controller-service', label: 'apply()' },
        { link: 'l-service-membership', label: 'freeze()' },
        { link: 't-active-frozen', label: 'FROZEN' },
        { link: 'l-service-repo', label: 'save()' },
      ],
      code: { file: `${TEST}/web/MembershipApiTest.java`, region: 'request', highlight: [1, 3, 4, 5, 6] },
    },
    {
      id: 'persist',
      visible: ['context', 'service', 'membership', ...STATES, 'repo', 'db'],
      highlight: ['repo', 'db'],
      packets: [{ link: 'l-repo-db', label: '"FROZEN"' }],
      code: { file: `${MAIN}/MembershipRepository.java`, region: 'persist', highlight: [5, 12] },
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
