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
 * Layout notes. Positions come from screen coordinates (u = x − y across, v = x + y down):
 * - The request zigzags down the left so its long packets park on diagonals instead of
 *   widening the scene: the front desk stands up-left, off the platform's back-left side
 *   (u −10, v 7) → controller on the middle row (u −9, v 16) → FrontDesk, the invoker, on
 *   the bottom row (u −5, v 24) → up to Command on the middle row (u 0, v 16).
 * - Middle row, left to right: Command (u 0) → Book/Cancel/Move in a column (u 5: v 9, 16,
 *   23) → ClassRoster, the receiver (u 10).
 * - The undo history sits right of the invoker on the bottom row (u 2, v 25), under
 *   Command and clear of MoveCommand's label. FrontDeskService (before) takes the invoker's spot.
 * - The context label lands below-left of the invoker, clear of the request.
 * - spring-does-it: TaskExecutor in the history's spot, the Runnable in the Command spot; the
 *   Runnable runs a desk command down-left, the executor's run() comes up from the right.
 */
const entities: Entity[] = [
  { id: 'desk', kind: 'actor', label: 'Front desk', pos: { x: -2.1, y: 7.9 }, size: { w: 1.2, d: 1.2, h: 0.5 }, tone: 'neutral' },
  { id: 'context', kind: 'container', label: 'Spring context', pos: { x: 2, y: 0.5 }, size: { w: 13.5, d: 15.5, h: FLOOR }, tone: 'neutral' },
  { id: 'controller', kind: 'block', label: 'DeskController', ...at(3.5, 12.5), tone: 'neutral', icon: 'arrow-in' },
  { id: 'service', kind: 'block', label: 'FrontDeskService', ...at(9.5, 14.5), tone: 'danger', icon: 'warning' },
  { id: 'invoker', kind: 'block', label: 'FrontDesk', ...at(9.5, 14.5), tone: 'accent', icon: 'board' },
  { id: 'history', kind: 'block', label: 'undo history', ...at(13.5, 11.5), tone: 'neutral', icon: 'file' },
  { id: 'command', kind: 'interface', label: 'Command', ...at(8, 8, IFACE), tone: 'neutral' },
  { id: 'book', kind: 'block', label: 'BookCommand', ...at(7, 2), tone: 'neutral', icon: 'plus' },
  { id: 'cancel', kind: 'block', label: 'CancelCommand', ...at(10.5, 5.5), tone: 'neutral', icon: 'ticket' },
  { id: 'move', kind: 'block', label: 'MoveCommand', ...at(14, 9), tone: 'neutral', icon: 'arrow-in' },
  { id: 'roster', kind: 'block', label: 'ClassRoster', ...at(13, 3), tone: 'neutral', icon: 'calendar' },
  { id: 'executor', kind: 'block', label: 'TaskExecutor', ...at(13.5, 11.5), tone: 'accent', icon: 'timer' },
  { id: 'runnable', kind: 'block', label: 'Runnable lateBooking', ...at(8, 8), tone: 'neutral', icon: 'bell' },
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
    { id: 'l-runnable-invoker', from: 'runnable', to: 'invoker', style: 'call' },
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
      packets: [{ link: 'l-cancel-roster', label: 'spot: 2nd' }],
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
      code: { file: `${MAIN}/FrontDesk.java`, region: 'invoker', highlight: [2, 3, 11, 12, 13] },
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
      code: { file: `${TEST}/web/DeskApiTest.java`, region: 'request', highlight: [1, 2, 3, 4, 7] },
    },
    {
      id: 'spring-does-it',
      visible: ['context', 'executor', 'runnable', 'invoker', 'roster'],
      highlight: ['executor', 'runnable'],
      packets: [
        { link: 'l-executor-runnable', label: 'run()' },
        { link: 'l-runnable-invoker', label: 'desk.run(book Eva)' },
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
