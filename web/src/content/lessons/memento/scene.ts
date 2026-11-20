import type { Category, Entity, Scene } from '../../../engine/types';

export const category: Category = 'behavioral';

const MAIN = 'behavioral/memento/src/main/java/com/patterns2learn/box/memento';
const TEST = 'behavioral/memento/src/test/java/com/patterns2learn/box/memento';

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
 * - Left to right: controller (sx −10) → DraftService (sx −5.5) → the draft (originator, up) and the
 *   history (caretaker, down) at sx −1; two snapshots to the right of the history (sx 4.5).
 * - Before: ExposedDraftEditor in the service's spot, ExposedDraft in the draft's spot.
 * - spring-does-it: the transaction in the service's spot, the table in the draft's, the savepoint as a snapshot.
 * - The coach stands below-left of the controller (sx −14, sy 15.5), off the platform's front edge, so the long
 *   "POST /api/draft/undo" packet parks on the diagonal, clear of both; the platform hugs the blocks
 *   (x 4.5 → 19.75, y 6.5 → 17.5) and its label sits between the coach and DraftHistory.
 */
const entities: Entity[] = [
  { id: 'coach', kind: 'actor', label: 'Coach', pos: { x: 7.9, y: 21.9 }, size: { w: 1.2, d: 1.2, h: 0.5 }, tone: 'neutral' },
  { id: 'context', kind: 'container', label: 'Spring context', pos: { x: 4.5, y: 6.5 }, size: { w: 15.25, d: 11, h: FLOOR }, tone: 'neutral' },
  { id: 'controller', kind: 'block', label: 'DraftController', ...at(6.0, 16.0), tone: 'neutral', icon: 'arrow-in' },
  { id: 'editor', kind: 'block', label: 'ExposedDraftEditor', ...at(8.25, 13.75), tone: 'danger', icon: 'warning' },
  { id: 'exposed', kind: 'block', label: 'ExposedDraft (getters + setters)', ...at(7.0, 8.0), tone: 'danger', icon: 'board' },
  { id: 'service', kind: 'block', label: 'DraftService', ...at(8.25, 13.75), tone: 'neutral', icon: 'gear' },
  { id: 'draft', kind: 'block', label: 'WhiteboardDraft', ...at(7.0, 8.0), tone: 'accent', icon: 'board' },
  { id: 'history', kind: 'block', label: 'DraftHistory', ...at(14.0, 15.0), tone: 'neutral', icon: 'file' },
  { id: 'snap1', kind: 'block', label: 'Snapshot', ...at(15.25, 10.75), tone: 'accent', icon: 'file' },
  { id: 'snap2', kind: 'block', label: 'Snapshot', ...at(18.25, 13.75), tone: 'accent', icon: 'file' },
  { id: 'tx', kind: 'block', label: 'TransactionStatus', ...at(8.25, 13.75), tone: 'accent', icon: 'shield' },
  { id: 'table', kind: 'block', label: 'pr table', ...at(7.0, 8.0), tone: 'neutral', icon: 'db' },
  { id: 'savepoint', kind: 'block', label: 'savepoint (Object)', ...at(15.25, 10.75), tone: 'accent', icon: 'file' },
];

const SPRING = ['context', 'coach', 'controller', 'service', 'draft', 'history', 'snap1', 'snap2'];

const scene: Scene = {
  entities,
  links: [
    { id: 'l-coach-controller', from: 'coach', to: 'controller', style: 'call' },
    { id: 'l-controller-editor', from: 'controller', to: 'editor', style: 'call' },
    { id: 'l-editor-exposed', from: 'editor', to: 'exposed', style: 'call' },
    { id: 'l-controller-service', from: 'controller', to: 'service', style: 'call' },
    { id: 'l-service-draft', from: 'service', to: 'draft', style: 'call' },
    { id: 'l-service-history', from: 'service', to: 'history', style: 'call' },
    { id: 'l-draft-snap', from: 'draft', to: 'snap1', style: 'call' },
    { id: 'l-snap-draft', from: 'snap1', to: 'draft', style: 'call' },
    { id: 'l-history-snap1', from: 'history', to: 'snap1', style: 'call' },
    { id: 'l-history-snap2', from: 'history', to: 'snap2', style: 'call' },
    { id: 'l-tx-table', from: 'tx', to: 'table', style: 'call' },
    { id: 'l-tx-savepoint', from: 'tx', to: 'savepoint', style: 'call' },
  ],
  steps: [
    {
      id: 'problem',
      visible: ['controller', 'editor', 'exposed'],
      highlight: ['editor', 'exposed'],
      packets: [{ link: 'l-editor-exposed', label: 'getTitle() · getMovements()' }],
      code: { file: `${MAIN}/before/ExposedDraftEditor.java`, region: 'exposed', highlight: [2, 3] },
    },
    {
      id: 'smell',
      visible: ['controller', 'editor', 'exposed'],
      highlight: ['editor'],
      packets: [{ link: 'l-editor-exposed', label: 'time cap?' }],
      code: { file: `${MAIN}/before/ExposedDraftEditor.java`, region: 'exposed', highlight: [6, 10, 11] },
    },
    {
      id: 'memento',
      visible: ['draft', 'snap1'],
      highlight: ['draft', 'snap1'],
      packets: [{ link: 'l-draft-snap', label: 'snapshot()' }],
      code: { file: `${MAIN}/WhiteboardDraft.java`, region: 'memento', highlight: [2, 3, 4, 5, 7, 9, 14, 15, 18] },
    },
    {
      id: 'caretaker',
      visible: ['draft', 'history', 'snap1', 'snap2'],
      highlight: ['history'],
      packets: [
        { link: 'l-history-snap1', label: 'push()' },
        { link: 'l-history-snap1', label: 'pop()' },
      ],
      code: { file: `${MAIN}/DraftHistory.java`, region: 'caretaker', highlight: [2, 3, 7, 8] },
    },
    {
      id: 'service',
      visible: ['service', 'draft', 'history', 'snap1', 'snap2'],
      highlight: ['service'],
      packets: [
        { link: 'l-service-draft', label: 'snapshot() · edit()' },
        { link: 'l-service-history', label: 'save()' },
      ],
      code: { file: `${MAIN}/DraftService.java`, region: 'service', highlight: [1, 2, 3, 4, 15] },
    },
    {
      id: 'undo',
      visible: ['service', 'draft', 'history', 'snap1', 'snap2'],
      highlight: ['draft', 'snap1'],
      packets: [{ link: 'l-snap-draft', label: 'restore()' }],
      code: { file: `${TEST}/WhiteboardDraftTest.java`, region: 'undo', highlight: [4, 5, 6, 9] },
    },
    {
      id: 'request',
      visible: SPRING,
      highlight: ['service', 'history'],
      packets: [
        { link: 'l-coach-controller', label: 'POST /api/draft/undo' },
        { link: 'l-controller-service', label: 'undo()' },
        { link: 'l-service-history', label: 'undo()' },
        { link: 'l-service-draft', label: 'restore()' },
      ],
      code: { file: `${TEST}/web/DraftApiTest.java`, region: 'request', highlight: [1, 2, 4, 5] },
    },
    {
      id: 'spring-does-it',
      visible: ['context', 'tx', 'table', 'savepoint'],
      highlight: ['tx', 'savepoint'],
      packets: [
        { link: 'l-tx-savepoint', label: 'createSavepoint()' },
        { link: 'l-tx-table', label: 'rollbackToSavepoint()' },
      ],
      code: { file: `${TEST}/SpringDoesItTooTest.java`, region: 'savepoint', highlight: [1, 2, 3, 4] },
    },
    {
      id: 'recap',
      visible: SPRING,
      highlight: [],
      packets: [],
      code: { file: `${MAIN}/WhiteboardDraft.java`, region: 'memento', highlight: [2, 14, 18] },
    },
  ],
};

export default scene;
