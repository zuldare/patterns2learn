import type { Category, Entity, Scene } from '../../../engine/types';

export const category: Category = 'creational';

const MAIN = 'creational/builder/src/main/java/com/patterns2learn/box/builder';
const TEST = 'creational/builder/src/test/java/com/patterns2learn/box/builder';

/** Platform height: everything inside the Spring context stands on it. */
const FLOOR = 0.25;
const BLOCK = { w: 1, d: 1, h: 0.6 };

/** Block centred on (cx, cy), standing on the context platform. */
const at = (cx: number, cy: number, size = BLOCK) => ({
  pos: { x: cx - size.w / 2, y: cy - size.d / 2, z: FLOOR },
  size,
});

/*
 * Layout notes:
 * - A line that runs left to right on screen (+x, -y): controller → ScheduleService → ClassSession.Builder → ClassSession.
 * - The two "before" shapes (telescoping constructor, setters) take ScheduleService's spot.
 * - SessionTemplates (the director) sits above the builder on screen (-x, -y) and feeds it.
 * - RestClient.Builder and RestClient only appear in spring-does-it, in the builder and product spots.
 */
const entities: Entity[] = [
  { id: 'coach', kind: 'actor', label: 'Coach', pos: { x: 0.6, y: 11.2 }, size: { w: 1.2, d: 1.2, h: 0.5 }, tone: 'neutral' },
  { id: 'context', kind: 'container', label: 'Spring context', pos: { x: 0, y: 0 }, size: { w: 11.4, d: 10.0, h: FLOOR }, tone: 'neutral' },
  { id: 'controller', kind: 'block', label: 'SessionController', ...at(1.6, 8.6), tone: 'neutral', icon: 'arrow-in' },
  { id: 'telescoping', kind: 'block', label: 'TelescopingSession', ...at(4.4, 6.4), tone: 'danger', icon: 'warning' },
  { id: 'mutable', kind: 'block', label: 'MutableSession', ...at(4.4, 6.4), tone: 'danger', icon: 'warning' },
  { id: 'service', kind: 'block', label: 'ScheduleService', ...at(4.4, 6.4), tone: 'neutral', icon: 'gear' },
  { id: 'builder', kind: 'block', label: 'ClassSession.Builder', ...at(7.2, 4.2), tone: 'neutral', icon: 'plus' },
  { id: 'session', kind: 'block', label: 'ClassSession', ...at(10.2, 2.0), tone: 'accent', icon: 'calendar' },
  { id: 'templates', kind: 'block', label: 'SessionTemplates', ...at(3.0, 0.6), tone: 'neutral', icon: 'board' },
  { id: 'restBuilder', kind: 'block', label: 'RestClient.Builder', ...at(7.2, 4.2), tone: 'accent', icon: 'plus' },
  { id: 'restClient', kind: 'block', label: 'RestClient', ...at(10.2, 2.0), tone: 'accent', icon: 'arrow-in' },
];

const SPRING = ['context', 'coach', 'controller', 'service', 'templates', 'builder', 'session'];

const scene: Scene = {
  entities,
  links: [
    { id: 'l-coach-controller', from: 'coach', to: 'controller', style: 'call' },
    { id: 'l-controller-telescoping', from: 'controller', to: 'telescoping', style: 'call' },
    { id: 'l-controller-mutable', from: 'controller', to: 'mutable', style: 'call' },
    { id: 'l-controller-service', from: 'controller', to: 'service', style: 'call' },
    { id: 'l-service-builder', from: 'service', to: 'builder', style: 'call' },
    { id: 'l-builder-session', from: 'builder', to: 'session', style: 'call' },
    { id: 'l-templates-builder', from: 'templates', to: 'builder', style: 'call' },
    { id: 'l-restbuilder-restclient', from: 'restBuilder', to: 'restClient', style: 'call' },
  ],
  steps: [
    {
      id: 'problem',
      visible: ['coach', 'controller', 'telescoping'],
      highlight: ['telescoping'],
      packets: [{ link: 'l-controller-telescoping', label: '…, "Ana", true, false' }],
      code: { file: `${MAIN}/before/TelescopingSession.java`, region: 'telescoping', highlight: [14] },
    },
    {
      id: 'smell',
      visible: ['coach', 'controller', 'mutable'],
      highlight: ['mutable'],
      packets: [{ link: 'l-controller-mutable', label: 'setName() · setCoach() · …' }],
      code: { file: `${MAIN}/before/MutableSession.java`, region: 'setters', highlight: [2, 7, 11] },
    },
    {
      id: 'builder',
      visible: ['builder', 'session'],
      highlight: ['builder'],
      packets: [{ link: 'l-builder-session', label: 'build()' }],
      code: { file: `${MAIN}/ClassSession.java`, region: 'builder', highlight: [2, 9, 10, 26, 27] },
    },
    {
      id: 'fluent',
      visible: ['builder', 'session'],
      highlight: ['builder', 'session'],
      packets: [{ link: 'l-builder-session', label: 'build()' }],
      code: { file: `${TEST}/ClassSessionTest.java`, region: 'usage', highlight: [1, 2, 3, 4] },
    },
    {
      id: 'validate',
      visible: ['builder', 'session'],
      highlight: ['session'],
      packets: [{ link: 'l-builder-session', label: 'capacity 0 → ✗' }],
      code: { file: `${MAIN}/ClassSession.java`, region: 'validate', highlight: [6, 9, 16] },
    },
    {
      id: 'director',
      visible: ['templates', 'builder', 'session'],
      highlight: ['templates'],
      packets: [
        { link: 'l-templates-builder', label: '"beginner"' },
        { link: 'l-builder-session', label: 'build()' },
      ],
      code: { file: `${MAIN}/SessionTemplates.java`, region: 'director', highlight: [4, 5, 6, 7] },
    },
    {
      id: 'request',
      visible: SPRING,
      highlight: ['service', 'builder'],
      packets: [
        { link: 'l-coach-controller', label: "Hyrox prep · 18:00" },
        { link: 'l-controller-service', label: 'schedule()' },
        { link: 'l-service-builder', label: 'coach · beginnerFriendly' },
        { link: 'l-builder-session', label: 'build()' },
      ],
      code: { file: `${MAIN}/ScheduleService.java`, region: 'schedule', highlight: [2, 3, 4, 8] },
    },
    {
      id: 'spring-does-it',
      visible: ['context', 'restBuilder', 'restClient'],
      highlight: ['restBuilder'],
      packets: [{ link: 'l-restbuilder-restclient', label: 'build()' }],
      code: { file: `${TEST}/SpringDoesItTooTest.java`, region: 'rest-client', highlight: [1, 2, 3, 4] },
    },
    {
      id: 'recap',
      visible: SPRING,
      highlight: [],
      packets: [],
      code: { file: `${MAIN}/ClassSession.java`, region: 'builder', highlight: [2, 26, 27] },
    },
  ],
};

export default scene;
