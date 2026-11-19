import type { Category, Entity, Scene } from '../../../engine/types';

export const category: Category = 'behavioral';

const MAIN = 'behavioral/template-method/src/main/java/com/patterns2learn/box/templatemethod';
const TEST = 'behavioral/template-method/src/test/java/com/patterns2learn/box/templatemethod';

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
 * - Both senders stand off the front-left edge, left of the "Spring context" label.
 * - The copy-paste importers and the template subclasses share two spots
 *   (never visible together); the abstract ResultImporter sits to their right
 *   so both "extends" arrows point the same way, and it saves into the repository.
 * - JdbcTemplate only appears in spring-does-it, behind the repository.
 */
const entities: Entity[] = [
  { id: 'coach', kind: 'actor', label: 'Coach', pos: { x: 0.6, y: 10.9 }, size: { w: 1.2, d: 1.2, h: 0.5 }, tone: 'neutral' },
  { id: 'partner', kind: 'actor', label: 'Partner app', pos: { x: 3.4, y: 10.9 }, size: { w: 1.2, d: 1.2, h: 0.5 }, tone: 'neutral' },
  { id: 'context', kind: 'container', label: 'Spring context', pos: { x: 0, y: 0 }, size: { w: 12.4, d: 9.8, h: FLOOR }, tone: 'neutral' },
  { id: 'controller', kind: 'block', label: 'ResultImportController', ...at(2.5, 6.0), tone: 'neutral', icon: 'arrow-in' },
  { id: 'csvBefore', kind: 'block', label: 'CopyPasteCsvImporter', ...at(5.5, 4.0), tone: 'warn', icon: 'file' },
  { id: 'jsonBefore', kind: 'block', label: 'CopyPasteJsonImporter', ...at(6.5, 7.5), tone: 'warn', icon: 'file' },
  { id: 'csv', kind: 'block', label: 'CsvResultImporter', ...at(5.5, 4.0), tone: 'neutral', icon: 'file' },
  { id: 'json', kind: 'block', label: 'JsonResultImporter', ...at(6.5, 7.5), tone: 'neutral', icon: 'file' },
  { id: 'template', kind: 'interface', label: 'ResultImporter', ...at(9.0, 2.5, IFACE), tone: 'neutral' },
  { id: 'repo', kind: 'block', label: 'ResultRepository', ...at(11.0, 6.0), tone: 'neutral', icon: 'db' },
  { id: 'jdbc', kind: 'block', label: 'JdbcTemplate', ...at(11.0, 1.4), tone: 'accent', icon: 'gear' },
];

const SENDERS = ['coach', 'partner', 'controller'];
const BEFORE = [...SENDERS, 'csvBefore', 'jsonBefore', 'repo'];
const SPRING = ['context', ...SENDERS, 'csv', 'json', 'template', 'repo'];

const scene: Scene = {
  entities,
  links: [
    { id: 'l-coach-controller', from: 'coach', to: 'controller', style: 'call' },
    { id: 'l-partner-controller', from: 'partner', to: 'controller', style: 'call' },
    { id: 'l-controller-csvbefore', from: 'controller', to: 'csvBefore', style: 'call' },
    { id: 'l-controller-jsonbefore', from: 'controller', to: 'jsonBefore', style: 'call' },
    { id: 'l-csvbefore-repo', from: 'csvBefore', to: 'repo', style: 'call' },
    { id: 'l-jsonbefore-repo', from: 'jsonBefore', to: 'repo', style: 'call' },
    { id: 'l-controller-csv', from: 'controller', to: 'csv', style: 'call' },
    { id: 'l-controller-json', from: 'controller', to: 'json', style: 'call' },
    { id: 'l-csv-template', from: 'csv', to: 'template', style: 'implements' },
    { id: 'l-json-template', from: 'json', to: 'template', style: 'implements' },
    { id: 'l-template-repo', from: 'template', to: 'repo', style: 'call' },
    { id: 'l-repo-jdbc', from: 'repo', to: 'jdbc', style: 'call' },
  ],
  steps: [
    {
      id: 'problem',
      visible: BEFORE,
      highlight: ['csvBefore', 'jsonBefore'],
      packets: [{ link: 'l-coach-controller', label: 'results.csv' }],
      code: { file: `${MAIN}/before/CopyPasteCsvImporter.java`, region: 'csv-dup', highlight: [5, 7, 10] },
    },
    {
      id: 'smell',
      visible: BEFORE,
      highlight: ['jsonBefore'],
      packets: [
        { link: 'l-partner-controller', label: 'score: 0' },
        { link: 'l-controller-jsonbefore', label: 'score: 0' },
        { link: 'l-jsonbefore-repo', label: 'INSERT ✗' },
      ],
      code: { file: `${MAIN}/before/CopyPasteJsonImporter.java`, region: 'json-dup', highlight: [5, 6] },
    },
    {
      id: 'template',
      visible: [...SENDERS, 'template', 'repo'],
      highlight: ['template'],
      packets: [],
      code: { file: `${MAIN}/ResultImporter.java`, region: 'template', highlight: [1, 2, 3, 7, 12, 17] },
    },
    {
      id: 'steps',
      visible: [...SENDERS, 'csv', 'json', 'template', 'repo'],
      highlight: ['csv', 'json'],
      packets: [],
      code: { file: `${MAIN}/CsvResultImporter.java`, region: 'csv-parse', highlight: [4, 5, 6, 7] },
    },
    {
      id: 'spring-wiring',
      visible: SPRING,
      highlight: ['context', 'controller'],
      packets: [],
      code: { file: `${MAIN}/web/ResultImportController.java`, region: 'endpoints', highlight: [3, 8] },
    },
    {
      id: 'request',
      visible: SPRING,
      highlight: ['template'],
      packets: [
        { link: 'l-coach-controller', label: 'results.csv' },
        { link: 'l-controller-csv', label: 'importAll()' },
        { link: 'l-template-repo', label: 'save ×2' },
      ],
      code: { file: `${TEST}/ResultImporterTest.java`, region: 'import-report', highlight: [1, 4, 9, 10] },
    },
    {
      id: 'hook',
      visible: SPRING,
      highlight: ['json'],
      packets: [
        { link: 'l-partner-controller', label: 'JSON' },
        { link: 'l-controller-json', label: 'importAll()' },
      ],
      code: { file: `${MAIN}/JsonResultImporter.java`, region: 'hook', highlight: [2, 4] },
    },
    {
      id: 'spring-does-it',
      visible: ['context', 'repo', 'jdbc'],
      highlight: ['jdbc'],
      packets: [{ link: 'l-repo-jdbc', label: 'query(sql, rowMapper)' }],
      code: { file: `${MAIN}/ResultRepository.java`, region: 'row-mapper', highlight: [4, 6] },
    },
    {
      id: 'recap',
      visible: SPRING,
      highlight: [],
      packets: [],
      code: { file: `${MAIN}/ResultImporter.java`, region: 'template', highlight: [1, 21, 23] },
    },
  ],
};

export default scene;
