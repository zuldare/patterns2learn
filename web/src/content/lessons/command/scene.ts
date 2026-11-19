import type { Category, Entity, Scene } from '../../../engine/types';

export const category: Category = 'behavioral';

const MAIN = 'behavioral/command/src/main/java/com/patterns2learn/box/command';
const TEST = 'behavioral/command/src/test/java/com/patterns2learn/box/command';

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
 * Layout notes. Positions come from screen coordinates (sx = x − y, sy = (x + y) / 2), shifted
 * by +1.5 on both axes so nothing leaves the platform:
 * - Left to right: controller (sx −9) → FrontDesk, the invoker (sx −4) → Command (sx 1) →
 *   Book/Cancel/Move in a column (sx 6) → ClassRoster, the receiver (sx 11).
 * - The undo history sits below the invoker. FrontDeskService (before) takes the invoker's spot.
 * - spring-does-it: TaskExecutor in the invoker's spot, the Runnable in the Command spot.
 */
const entities: Entity[] = [
  { id: 'desk', kind: 'actor', label: 'Front desk', pos: { x: 2.4, y: 15.4 }, size: { w: 1.2, d: 1.2, h: 0.5 }, tone: 'neutral' },
  { id: 'context', kind: 'container', label: 'Spring context', pos: { x: 0, y: 0 }, size: { w: 15.2, d: 14.6, h: FLOOR }, tone: 'neutral' },
  { id: 'controller', kind: 'block', label: 'DeskController', ...at(3.5, 12.5), tone: 'neutral', icon: 'arrow-in' },
  { id: 'service', kind: 'block', label: 'FrontDeskService', ...at(6.0, 10.0), tone: 'danger', icon: 'warning' },
  { id: 'invoker', kind: 'block', label: 'FrontDesk', ...at(6.0, 10.0), tone: 'accent', icon: 'board' },
  { id: 'history', kind: 'block', label: 'undo history', ...at(10.0, 14.0), tone: 'neutral', icon: 'file' },
  { id: 'command', kind: 'interface', label: 'Command', ...at(8.5, 7.5, IFACE), tone: 'neutral' },
  { id: 'book', kind: 'block', label: 'BookCommand', ...at(7.5, 1.5), tone: 'neutral', icon: 'plus' },
  { id: 'cancel', kind: 'block', label: 'CancelCommand', ...at(11.0, 5.0), tone: 'neutral', icon: 'ticket' },
  { id: 'move', kind: 'block', label: 'MoveCommand', ...at(14.5, 8.5), tone: 'neutral', icon: 'arrow-in' },
  { id: 'roster', kind: 'block', label: 'ClassRoster', ...at(13.5, 2.5), tone: 'neutral', icon: 'calendar' },
  { id: 'executor', kind: 'block', label: 'TaskExecutor', ...at(6.0, 10.0), tone: 'accent', icon: 'timer' },
  { id: 'runnable', kind: 'block', label: 'Runnable reminder', ...at(8.5, 7.5), tone: 'neutral', icon: 'bell' },
];

const COMMANDS = ['command', 'book', 'cancel', 'move'];
const SPRING = ['context', 'desk', 'controller', 'invoker', 'history', ...COMMANDS, 'roster'];

const scene: Scene = {
  entities,
  links: [
    { id: 'l-desk-controller', from: 'desk', to: 'controller', style: 'call' },
    { id: 'l-controller-service', from: 'controller', to: 'service', style: 'call' },
    { id: 'l-service-roster', from: 'service', to: 'roster', style: 'call' },
    { id: 'l-controller-invoker', from: 'controller', to: 'invoker', style: 'call' },
    { id: 'l-invoker-history', from: 'invoker', to: 'history', style: 'call' },
    { id: 'l-invoker-command', from: 'invoker', to: 'command', style: 'call' },
    { id: 'l-book-command', from: 'book', to: 'command', style: 'implements' },
    { id: 'l-cancel-command', from: 'cancel', to: 'command', style: 'implements' },
    { id: 'l-move-command', from: 'move', to: 'command', style: 'implements' },
    { id: 'l-book-roster', from: 'book', to: 'roster', style: 'call' },
    { id: 'l-cancel-roster', from: 'cancel', to: 'roster', style: 'call' },
    { id: 'l-move-roster', from: 'move', to: 'roster', style: 'call' },
    { id: 'l-executor-runnable', from: 'executor', to: 'runnable', style: 'call' },
    { id: 'l-runnable-roster', from: 'runnable', to: 'roster', style: 'call' },
  ],
  steps: [
    {
      id: 'problem',
      visible: ['desk', 'controller', 'service', 'roster'],
      highlight: ['service'],
      packets: [
        { link: 'l-desk-controller', label: 'undo' },
        { link: 'l-controller-service', label: 'undoLast()' },
        { link: 'l-service-roster', label: 'cancel(Leo)' },
      ],
      code: { file: `${MAIN}/before/FrontDeskService.java`, region: 'undo-last', highlight: [2, 3, 4, 5] },
    },
    {
      id: 'smell',
      visible: ['desk', 'controller', 'service', 'roster'],
      highlight: ['service'],
      packets: [{ link: 'l-controller-service', label: 'undoLast() ✗' }],
      code: { file: `${MAIN}/before/FrontDeskService.java`, region: 'undo-last', highlight: [6, 8] },
    },
    {
      id: 'command',
      visible: COMMANDS,
      highlight: ['command'],
      packets: [],
      code: { file: `${MAIN}/Command.java`, region: 'command', highlight: [3, 4, 5] },
    },
    {
      id: 'concrete',
      visible: [...COMMANDS, 'roster'],
      highlight: ['book'],
      packets: [{ link: 'l-book-roster', label: 'book() / cancel()' }],
      code: { file: `${MAIN}/BookCommand.java`, region: 'book', highlight: [3, 8, 13] },
    },
    {
      id: 'memory',
      visible: [...COMMANDS, 'roster'],
      highlight: ['cancel'],
      packets: [{ link: 'l-cancel-roster', label: 'spot 2' }],
      code: { file: `${MAIN}/CancelCommand.java`, region: 'cancel', highlight: [3, 8] },
    },
    {
      id: 'invoker',
      visible: ['invoker', 'history', ...COMMANDS, 'roster'],
      highlight: ['invoker', 'history'],
      packets: [
        { link: 'l-invoker-command', label: 'execute()' },
        { link: 'l-invoker-history', label: 'push()' },
      ],
      code: { file: `${MAIN}/FrontDesk.java`, region: 'invoker', highlight: [2, 3, 10, 11] },
    },
    {
      id: 'client',
      visible: SPRING,
      highlight: ['controller'],
      packets: [{ link: 'l-controller-invoker', label: 'run(commands.book(…))' }],
      code: { file: `${MAIN}/web/DeskController.java`, region: 'client', highlight: [4, 9] },
    },
    {
      id: 'request',
      visible: SPRING,
      highlight: ['invoker', 'book'],
      packets: [
        { link: 'l-desk-controller', label: 'POST /api/desk/undo' },
        { link: 'l-controller-invoker', label: 'undo()' },
        { link: 'l-invoker-history', label: 'pop()' },
        { link: 'l-book-roster', label: 'cancel(Leo)' },
      ],
      code: { file: `${TEST}/web/DeskApiTest.java`, region: 'request', highlight: [1, 2, 4, 6] },
    },
    {
      id: 'spring-does-it',
      visible: ['context', 'executor', 'runnable', 'roster'],
      highlight: ['executor', 'runnable'],
      packets: [
        { link: 'l-executor-runnable', label: 'run()' },
        { link: 'l-runnable-roster', label: 'book(2, Eva)' },
      ],
      code: { file: `${TEST}/SpringDoesItTooTest.java`, region: 'executor', highlight: [1, 2, 6] },
    },
    {
      id: 'recap',
      visible: SPRING,
      highlight: [],
      packets: [],
      code: { file: `${MAIN}/Command.java`, region: 'command', highlight: [3, 4, 5] },
    },
  ],
};

export default scene;
