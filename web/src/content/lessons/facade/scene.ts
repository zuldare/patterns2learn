import type { Category, Entity, Scene } from '../../../engine/types';

export const category: Category = 'structural';

const MAIN = 'structural/facade/src/main/java/com/patterns2learn/box/facade';
const TEST = 'structural/facade/src/test/java/com/patterns2learn/box/facade';

/** Platform height: everything inside the Spring context stands on it. */
const FLOOR = 0.25;
const BLOCK = { w: 1, d: 1, h: 0.6 };

/** Block centred on (cx, cy), standing on the context platform. */
const at = (cx: number, cy: number, size = BLOCK) => ({
  pos: { x: cx - size.w / 2, y: cy - size.d / 2, z: FLOOR },
  size,
});

/*
 * Layout notes. Positions come from screen coordinates (sx = x − y, sy = (x + y) / 2):
 * - Clients on the left (front desk app at sx −7, kiosk below it), the facade in the middle (sx −1),
 *   and the six subsystems in a column on the right (sx 6, sy 3.5 → 16.5, every 2.6 so labels clear the block above).
 * - FrontDeskController (before) takes the facade's spot: it talks to the subsystems itself.
 * - spring-does-it reuses the facade spot for ApplicationContext and four subsystem spots
 *   for what it fronts.
 */
const entities: Entity[] = [
  { id: 'desk', kind: 'actor', label: 'Front desk', pos: { x: 3.4, y: 16.0 }, size: { w: 1.2, d: 1.2, h: 0.5 }, tone: 'neutral' },
  { id: 'visitor', kind: 'actor', label: 'Visitor', pos: { x: 6.4, y: 19.0 }, size: { w: 1.2, d: 1.2, h: 0.5 }, tone: 'neutral' },
  { id: 'context', kind: 'container', label: 'Spring context', pos: { x: 0, y: 0 }, size: { w: 20.2, d: 15.7, h: FLOOR }, tone: 'neutral' },
  { id: 'frontDesk', kind: 'block', label: 'FrontDeskController', ...at(9.5, 10.5), tone: 'danger', icon: 'warning' },
  { id: 'members', kind: 'block', label: 'MemberController', ...at(5.0, 12.0), tone: 'neutral', icon: 'arrow-in' },
  { id: 'kiosk', kind: 'block', label: 'KioskController', ...at(8.0, 15.0), tone: 'neutral', icon: 'arrow-in' },
  { id: 'facade', kind: 'block', label: 'OnboardingFacade', ...at(9.5, 10.5), tone: 'accent', icon: 'board' },
  { id: 'registry', kind: 'block', label: 'MemberRegistry', ...at(6.5, 0.5), tone: 'neutral', icon: 'db' },
  { id: 'cards', kind: 'block', label: 'AccessCards', ...at(9.1, 3.1), tone: 'neutral', icon: 'key' },
  { id: 'billing', kind: 'block', label: 'Billing', ...at(11.7, 5.7), tone: 'neutral', icon: 'tag' },
  { id: 'waivers', kind: 'block', label: 'Waivers', ...at(14.3, 8.3), tone: 'neutral', icon: 'file' },
  { id: 'intro', kind: 'block', label: 'IntroClasses', ...at(16.9, 10.9), tone: 'neutral', icon: 'calendar' },
  { id: 'mailer', kind: 'block', label: 'Mailer', ...at(19.5, 13.5), tone: 'neutral', icon: 'bell' },
  { id: 'appContext', kind: 'block', label: 'ApplicationContext', ...at(9.5, 10.5), tone: 'accent', icon: 'leaf' },
  { id: 'beanFactory', kind: 'block', label: 'BeanFactory', ...at(6.5, 0.5), tone: 'neutral', icon: 'gear' },
  { id: 'messageSource', kind: 'block', label: 'MessageSource', ...at(11.7, 5.7), tone: 'neutral', icon: 'file' },
  { id: 'multicaster', kind: 'block', label: 'ApplicationEventMulticaster', ...at(14.3, 8.3), tone: 'neutral', icon: 'bell' },
  { id: 'resources', kind: 'block', label: 'ResourcePatternResolver', ...at(19.5, 13.5), tone: 'neutral', icon: 'db' },
];

const SUBSYSTEMS = ['registry', 'cards', 'billing', 'waivers', 'intro', 'mailer'];
const SPRING = ['context', 'desk', 'visitor', 'members', 'kiosk', 'facade', ...SUBSYSTEMS];

const fan = (from: string, prefix: string) =>
  SUBSYSTEMS.map((to) => ({ id: `${prefix}-${to}`, from, to, style: 'call' as const }));

const scene: Scene = {
  entities,
  links: [
    { id: 'l-desk-frontdesk', from: 'desk', to: 'frontDesk', style: 'call' },
    { id: 'l-desk-members', from: 'desk', to: 'members', style: 'call' },
    { id: 'l-visitor-kiosk', from: 'visitor', to: 'kiosk', style: 'call' },
    { id: 'l-members-facade', from: 'members', to: 'facade', style: 'call' },
    { id: 'l-kiosk-facade', from: 'kiosk', to: 'facade', style: 'call' },
    ...fan('frontDesk', 'l-fd'),
    ...fan('facade', 'l-f'),
    { id: 'l-ctx-beans', from: 'appContext', to: 'beanFactory', style: 'call' },
    { id: 'l-ctx-messages', from: 'appContext', to: 'messageSource', style: 'call' },
    { id: 'l-ctx-events', from: 'appContext', to: 'multicaster', style: 'call' },
    { id: 'l-ctx-resources', from: 'appContext', to: 'resources', style: 'call' },
  ],
  steps: [
    {
      id: 'problem',
      visible: ['desk', 'frontDesk', ...SUBSYSTEMS],
      highlight: ['frontDesk'],
      packets: [
        { link: 'l-desk-frontdesk', label: 'Ana · unlimited' },
        { link: 'l-fd-registry', label: 'register()' },
        { link: 'l-fd-billing', label: 'subscribe()' },
        { link: 'l-fd-mailer', label: 'welcome()' },
      ],
      code: { file: `${MAIN}/before/FrontDeskController.java`, region: 'front-desk', highlight: [2, 3, 4, 5, 6, 7] },
    },
    {
      id: 'smell',
      visible: ['desk', 'frontDesk', ...SUBSYSTEMS],
      highlight: ['registry', 'cards', 'billing'],
      packets: [{ link: 'l-fd-billing', label: 'tok_declined ✗' }],
      code: { file: `${MAIN}/before/FrontDeskController.java`, region: 'front-desk', highlight: [2, 3, 4] },
    },
    {
      id: 'facade',
      visible: ['facade', ...SUBSYSTEMS],
      highlight: ['facade'],
      packets: [],
      code: { file: `${MAIN}/OnboardingFacade.java`, region: 'join', highlight: [1, 3, 7, 8, 14, 15, 16] },
    },
    {
      id: 'undo',
      visible: ['facade', ...SUBSYSTEMS],
      highlight: ['facade', 'billing'],
      packets: [
        { link: 'l-f-billing', label: 'payment declined' },
        { link: 'l-f-cards', label: 'revoke()' },
        { link: 'l-f-registry', label: 'remove()' },
      ],
      code: { file: `${MAIN}/OnboardingFacade.java`, region: 'join', highlight: [2, 7, 8, 9, 10, 11, 12] },
    },
    {
      id: 'clients',
      visible: SPRING,
      highlight: ['members', 'kiosk'],
      packets: [
        { link: 'l-members-facade', label: 'join()' },
        { link: 'l-kiosk-facade', label: 'join()' },
      ],
      code: { file: `${MAIN}/web/MemberController.java`, region: 'clients', highlight: [3, 4] },
    },
    {
      id: 'request',
      visible: SPRING,
      highlight: ['facade'],
      packets: [
        { link: 'l-desk-members', label: 'POST /api/members' },
        { link: 'l-members-facade', label: 'join()' },
        { link: 'l-f-registry', label: 'register()' },
        { link: 'l-f-cards', label: 'issue()' },
        { link: 'l-f-billing', label: '89.00 €' },
        { link: 'l-f-mailer', label: 'welcome()' },
      ],
      code: { file: `${TEST}/OnboardingFacadeTest.java`, region: 'join-test', highlight: [1, 3, 4, 5] },
    },
    {
      id: 'spring-does-it',
      visible: ['context', 'appContext', 'beanFactory', 'messageSource', 'multicaster', 'resources'],
      highlight: ['appContext'],
      packets: [
        { link: 'l-ctx-beans', label: 'getBean()' },
        { link: 'l-ctx-messages', label: 'getMessage()' },
        { link: 'l-ctx-events', label: 'publishEvent()' },
        { link: 'l-ctx-resources', label: 'getResources()' },
      ],
      code: { file: `${TEST}/SpringDoesItTooTest.java`, region: 'context', highlight: [1, 2, 3, 4] },
    },
    {
      id: 'recap',
      visible: SPRING,
      highlight: [],
      packets: [],
      code: { file: `${MAIN}/OnboardingFacade.java`, region: 'join', highlight: [1] },
    },
  ],
};

export default scene;
