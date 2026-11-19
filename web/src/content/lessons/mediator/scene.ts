import type { Category, Entity, Scene } from '../../../engine/types';

export const category: Category = 'behavioral';

const MAIN = 'behavioral/mediator/src/main/java/com/patterns2learn/box/mediator';
const TEST = 'behavioral/mediator/src/test/java/com/patterns2learn/box/mediator';

/** Platform height: everything inside the Spring context stands on it. */
const FLOOR = 0.25;
const BLOCK = { w: 1, d: 1, h: 0.6 };

/** Block centred on (cx, cy), standing on the context platform. */
const at = (cx: number, cy: number, size = BLOCK) => ({
  pos: { x: cx - size.w / 2, y: cy - size.d / 2, z: FLOOR },
  size,
});

/*
 * Layout notes. Positions come from screen coordinates (sx = x − y, sy = (x + y) / 2), shifted by +3:
 * - Senders on the left (WodTimer up, FinishLine down, sx −5.5), ClassFloor in the middle (sx −0.5),
 *   receivers on the right (Music up, Screen down, sx 4.5). The coach's tablet controller further left.
 * - The wired "before" devices take the timer and finish line spots and link to each other directly.
 * - spring-does-it reuses the spots: DispatcherServlet in the middle, its parts around it.
 */
const entities: Entity[] = [
  { id: 'coach', kind: 'actor', label: 'Coach', pos: { x: 3.9, y: 18.0 }, size: { w: 1.2, d: 1.2, h: 0.5 }, tone: 'neutral' },
  { id: 'context', kind: 'container', label: 'Spring context', pos: { x: 0, y: 0 }, size: { w: 16.6, d: 17.0, h: FLOOR }, tone: 'neutral' },
  { id: 'controller', kind: 'block', label: 'FloorController', ...at(5.5, 15.5), tone: 'neutral', icon: 'arrow-in' },
  { id: 'wiredTimer', kind: 'block', label: 'WiredTimer', ...at(4.75, 10.25), tone: 'danger', icon: 'warning' },
  { id: 'wiredFinish', kind: 'block', label: 'WiredFinishLine', ...at(10.75, 16.25), tone: 'danger', icon: 'warning' },
  { id: 'timer', kind: 'block', label: 'WodTimer', ...at(4.75, 10.25), tone: 'neutral', icon: 'timer' },
  { id: 'finish', kind: 'block', label: 'FinishLine', ...at(10.75, 16.25), tone: 'neutral', icon: 'medal' },
  { id: 'floor', kind: 'block', label: 'ClassFloor', ...at(10.25, 10.75), tone: 'accent', icon: 'board' },
  { id: 'music', kind: 'block', label: 'Music', ...at(9.75, 5.25), tone: 'neutral', icon: 'bell' },
  { id: 'screen', kind: 'block', label: 'Screen', ...at(15.75, 11.25), tone: 'neutral', icon: 'board' },
  { id: 'dispatcher', kind: 'block', label: 'DispatcherServlet', ...at(10.25, 10.75), tone: 'accent', icon: 'arrow-in' },
  { id: 'mapping', kind: 'block', label: 'HandlerMapping', ...at(4.75, 10.25), tone: 'neutral', icon: 'key' },
  { id: 'adapter', kind: 'block', label: 'HandlerAdapter', ...at(10.75, 16.25), tone: 'neutral', icon: 'plug' },
  { id: 'resolver', kind: 'block', label: 'HandlerExceptionResolver', ...at(9.75, 5.25), tone: 'neutral', icon: 'warning' },
  { id: 'handler', kind: 'block', label: 'FloorController.finish()', ...at(15.75, 11.25), tone: 'neutral', icon: 'gear' },
];

const DEVICES = ['timer', 'finish', 'floor', 'music', 'screen'];
const SPRING = ['context', 'coach', 'controller', ...DEVICES];

const scene: Scene = {
  entities,
  links: [
    { id: 'l-coach-controller', from: 'coach', to: 'controller', style: 'call' },
    { id: 'w-timer-music', from: 'wiredTimer', to: 'music', style: 'call' },
    { id: 'w-timer-screen', from: 'wiredTimer', to: 'screen', style: 'call' },
    { id: 'w-timer-finish', from: 'wiredTimer', to: 'wiredFinish', style: 'call' },
    { id: 'w-finish-timer', from: 'wiredFinish', to: 'wiredTimer', style: 'call' },
    { id: 'w-finish-music', from: 'wiredFinish', to: 'music', style: 'call' },
    { id: 'w-finish-screen', from: 'wiredFinish', to: 'screen', style: 'call' },
    { id: 'l-controller-timer', from: 'controller', to: 'timer', style: 'call' },
    { id: 'l-controller-finish', from: 'controller', to: 'finish', style: 'call' },
    { id: 'l-timer-floor', from: 'timer', to: 'floor', style: 'call' },
    { id: 'l-finish-floor', from: 'finish', to: 'floor', style: 'call' },
    { id: 'l-floor-music', from: 'floor', to: 'music', style: 'call' },
    { id: 'l-floor-screen', from: 'floor', to: 'screen', style: 'call' },
    { id: 'd-mapping', from: 'dispatcher', to: 'mapping', style: 'call' },
    { id: 'd-adapter', from: 'dispatcher', to: 'adapter', style: 'call' },
    { id: 'd-handler', from: 'adapter', to: 'handler', style: 'call' },
    { id: 'd-resolver', from: 'dispatcher', to: 'resolver', style: 'call' },
  ],
  steps: [
    {
      id: 'problem',
      visible: ['wiredTimer', 'wiredFinish', 'music', 'screen'],
      highlight: ['wiredFinish'],
      packets: [
        { link: 'w-finish-timer', label: 'isRunning()?' },
        { link: 'w-finish-screen', label: 'showFinish()' },
        { link: 'w-finish-music', label: 'cue("bell")' },
      ],
      code: { file: `${MAIN}/before/WiredFinishLine.java`, region: 'wired', highlight: [2, 7, 8] },
    },
    {
      id: 'smell',
      visible: ['wiredTimer', 'wiredFinish', 'music', 'screen'],
      highlight: ['wiredTimer', 'wiredFinish'],
      packets: [{ link: 'w-timer-finish', label: 'results()' }],
      code: { file: `${MAIN}/before/WiredTimer.java`, region: 'wired-cap', highlight: [4] },
    },
    {
      id: 'mediator',
      visible: DEVICES,
      highlight: ['floor'],
      packets: [],
      code: { file: `${MAIN}/FloorMediator.java`, region: 'mediator', highlight: [3, 4, 5] },
    },
    {
      id: 'colleagues',
      visible: DEVICES,
      highlight: ['timer', 'finish'],
      packets: [
        { link: 'l-timer-floor', label: 'timerStarted()' },
        { link: 'l-finish-floor', label: 'athleteFinished()' },
      ],
      code: { file: `${MAIN}/devices/WodTimer.java`, region: 'colleague', highlight: [2, 6] },
    },
    {
      id: 'floor',
      visible: DEVICES,
      highlight: ['floor'],
      packets: [
        { link: 'l-floor-music', label: 'play / cue / stop' },
        { link: 'l-floor-screen', label: 'clock / finish / results' },
      ],
      code: { file: `${MAIN}/ClassFloor.java`, region: 'floor', highlight: [6, 7, 12, 14, 18, 19, 26, 27] },
    },
    {
      id: 'flow',
      visible: DEVICES,
      highlight: ['floor', 'screen'],
      packets: [
        { link: 'l-finish-floor', label: 'Ana 185 s' },
        { link: 'l-floor-screen', label: 'Ana 3:05' },
        { link: 'l-floor-music', label: 'cue bell' },
      ],
      code: { file: `${TEST}/ClassFloorTest.java`, region: 'flow', highlight: [1, 2, 4] },
    },
    {
      id: 'request',
      visible: SPRING,
      highlight: ['floor'],
      packets: [
        { link: 'l-coach-controller', label: 'POST /api/floor/finish' },
        { link: 'l-controller-finish', label: 'finish("Ana", 185)' },
        { link: 'l-finish-floor', label: 'athleteFinished()' },
        { link: 'l-floor-screen', label: 'Ana 3:05' },
      ],
      code: { file: `${TEST}/web/FloorApiTest.java`, region: 'request', highlight: [1, 2, 3, 5, 6] },
    },
    {
      id: 'spring-does-it',
      visible: ['context', 'dispatcher', 'mapping', 'adapter', 'resolver', 'handler'],
      highlight: ['dispatcher'],
      packets: [
        { link: 'd-mapping', label: 'which handler?' },
        { link: 'd-adapter', label: 'handle()' },
        { link: 'd-handler', label: 'finish()' },
        { link: 'd-resolver', label: '400' },
      ],
      code: { file: `${TEST}/SpringDoesItTooTest.java`, region: 'dispatcher', highlight: [3, 4, 5, 7] },
    },
    {
      id: 'recap',
      visible: SPRING,
      highlight: [],
      packets: [],
      code: { file: `${MAIN}/FloorMediator.java`, region: 'mediator', highlight: [3, 4, 5] },
    },
  ],
};

export default scene;
