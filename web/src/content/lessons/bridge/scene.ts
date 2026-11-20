import type { Category, Entity, Scene } from '../../../engine/types';

export const category: Category = 'structural';

const MAIN = 'structural/bridge/src/main/java/com/patterns2learn/box/bridge';
const TEST = 'structural/bridge/src/test/java/com/patterns2learn/box/bridge';

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
 * Layout notes. Positions come from screen coordinates (sx = x − y, sy = (x + y) / 2), shifted by +3.5:
 * - Left: controller (sx −11) → ReminderService (sx −6.5).
 * - Middle: the abstraction side, ClassReminder (up) and PaymentReminder (down) extending Reminder (sx 2);
 *   the bridge link joins Reminder to Channel (sx 8); the three channels in a column on the right (sx 13).
 * - Before: four one-per-combination classes in a 2×2 grid in the middle.
 * - spring-does-it (outside the context: the test builds both clients with new): RestClient in Reminder's spot, ClientHttpRequestFactory in Channel's, two factories on the right.
 */
const entities: Entity[] = [
  { id: 'coach', kind: 'actor', label: 'Front desk', pos: { x: 4.4, y: 19.5 }, size: { w: 1.2, d: 1.2, h: 0.5 }, tone: 'neutral' },
  { id: 'context', kind: 'container', label: 'Spring context', pos: { x: 0, y: 0 }, size: { w: 22.2, d: 18.6, h: FLOOR }, tone: 'neutral' },
  { id: 'controller', kind: 'block', label: 'ReminderController', ...at(6.0, 17.0), tone: 'neutral', icon: 'arrow-in' },
  { id: 'service', kind: 'block', label: 'ReminderService', ...at(8.25, 14.75), tone: 'neutral', icon: 'gear' },
  { id: 'b1', kind: 'block', label: 'EmailClassReminder', ...at(7.0, 8.0), tone: 'neutral', icon: 'file' },
  { id: 'b2', kind: 'block', label: 'SmsClassReminder', ...at(9.75, 5.25), tone: 'neutral', icon: 'file' },
  { id: 'b3', kind: 'block', label: 'EmailPaymentReminder', ...at(14.0, 15.0), tone: 'neutral', icon: 'file' },
  { id: 'b4', kind: 'block', label: 'SmsPaymentReminder', ...at(16.75, 12.25), tone: 'danger', icon: 'warning' },
  { id: 'classR', kind: 'block', label: 'ClassReminder', ...at(7.0, 9.0), tone: 'neutral', icon: 'calendar' },
  { id: 'payR', kind: 'block', label: 'PaymentReminder', ...at(14.0, 16.0), tone: 'neutral', icon: 'tag' },
  { id: 'reminder', kind: 'interface', label: 'Reminder', ...at(12.5, 10.5, IFACE), tone: 'accent' },
  { id: 'channel', kind: 'interface', label: 'Channel', ...at(15.5, 7.5, IFACE), tone: 'accent' },
  { id: 'email', kind: 'block', label: 'EmailChannel', ...at(14.5, 1.5), tone: 'neutral', icon: 'file' },
  { id: 'sms', kind: 'block', label: 'SmsChannel', ...at(18.0, 5.0), tone: 'neutral', icon: 'bell' },
  { id: 'push', kind: 'block', label: 'PushChannel', ...at(21.5, 8.5), tone: 'neutral', icon: 'bell' },
  { id: 'restClient', kind: 'block', label: 'RestClient', ...at(12.5, 10.5), tone: 'accent', icon: 'arrow-in' },
  { id: 'factory', kind: 'interface', label: 'ClientHttpRequestFactory', ...at(15.5, 7.5, IFACE), tone: 'accent' },
  { id: 'jdk', kind: 'block', label: 'JdkClientHttpRequestFactory', ...at(14.5, 1.5), tone: 'neutral', icon: 'plug' },
  { id: 'simple', kind: 'block', label: 'SimpleClientHttpRequestFactory', ...at(18.0, 5.0), tone: 'neutral', icon: 'plug' },
];

const ABSTRACTION = ['classR', 'payR', 'reminder'];
const IMPLEMENTATION = ['channel', 'email', 'sms', 'push'];
const SPRING = ['context', 'coach', 'controller', 'service', ...ABSTRACTION, ...IMPLEMENTATION];

const scene: Scene = {
  entities,
  links: [
    { id: 'l-coach-controller', from: 'coach', to: 'controller', style: 'call' },
    { id: 'l-controller-service', from: 'controller', to: 'service', style: 'call' },
    { id: 'l-service-classr', from: 'service', to: 'classR', style: 'call' },
    { id: 'l-class-reminder', from: 'classR', to: 'reminder', style: 'implements' },
    { id: 'l-pay-reminder', from: 'payR', to: 'reminder', style: 'implements' },
    { id: 'l-bridge', from: 'reminder', to: 'channel', style: 'call' },
    { id: 'l-email-channel', from: 'email', to: 'channel', style: 'implements' },
    { id: 'l-sms-channel', from: 'sms', to: 'channel', style: 'implements' },
    { id: 'l-push-channel', from: 'push', to: 'channel', style: 'implements' },
    { id: 'l-rest-factory', from: 'restClient', to: 'factory', style: 'call' },
    { id: 'l-jdk-factory', from: 'jdk', to: 'factory', style: 'implements' },
    { id: 'l-simple-factory', from: 'simple', to: 'factory', style: 'implements' },
  ],
  steps: [
    {
      id: 'problem',
      visible: ['b1', 'b2', 'b3', 'b4'],
      highlight: ['b1', 'b2', 'b3', 'b4'],
      packets: [],
      code: { file: `${MAIN}/before/SmsPaymentReminder.java`, region: 'combinations', highlight: [1, 3] },
    },
    {
      id: 'smell',
      visible: ['b1', 'b2', 'b3', 'b4'],
      highlight: ['b4'],
      packets: [],
      code: { file: `${MAIN}/before/SmsPaymentReminder.java`, region: 'combinations', highlight: [2, 3] },
    },
    {
      id: 'abstraction',
      visible: [...ABSTRACTION, 'channel'],
      highlight: ['reminder'],
      packets: [{ link: 'l-bridge', label: 'channel.deliver(…)' }],
      code: { file: `${MAIN}/Reminder.java`, region: 'abstraction', highlight: [3, 10, 11, 14, 15] },
    },
    {
      id: 'implementor',
      visible: [...ABSTRACTION, ...IMPLEMENTATION],
      highlight: ['channel'],
      packets: [],
      code: { file: `${MAIN}/channels/Channel.java`, region: 'implementor', highlight: [3, 4] },
    },
    {
      id: 'refined',
      visible: [...ABSTRACTION, ...IMPLEMENTATION],
      highlight: ['classR', 'payR'],
      packets: [],
      code: { file: `${MAIN}/ClassReminder.java`, region: 'refined', highlight: [1, 4] },
    },
    {
      id: 'channel-rules',
      visible: [...ABSTRACTION, ...IMPLEMENTATION],
      highlight: ['sms'],
      packets: [],
      code: { file: `${MAIN}/channels/SmsChannel.java`, region: 'sms', highlight: [3, 4] },
    },
    {
      id: 'combine',
      visible: [...ABSTRACTION, ...IMPLEMENTATION],
      highlight: ['classR', 'payR', 'sms'],
      packets: [{ link: 'l-bridge', label: 'class / payment → sms' }],
      code: { file: `${TEST}/BridgeTest.java`, region: 'combine', highlight: [1, 2, 4, 5] },
    },
    {
      id: 'request',
      visible: SPRING,
      highlight: ['service', 'sms'],
      packets: [
        { link: 'l-coach-controller', label: 'POST /api/reminders' },
        { link: 'l-controller-service', label: 'remind("leo", "class", null)' },
        { link: 'l-service-classr', label: 'new ClassReminder(sms)' },
        { link: 'l-bridge', label: 'deliver()' },
      ],
      code: { file: `${TEST}/web/ReminderApiTest.java`, region: 'request', highlight: [1, 2, 4, 5] },
    },
    {
      id: 'spring-does-it',
      visible: ['restClient', 'factory', 'jdk', 'simple'],
      highlight: ['restClient', 'factory'],
      packets: [{ link: 'l-rest-factory', label: 'createRequest()' }],
      code: { file: `${TEST}/SpringDoesItTooTest.java`, region: 'transports', highlight: [2, 5, 8, 9] },
    },
    {
      id: 'recap',
      visible: SPRING,
      highlight: [],
      packets: [],
      code: { file: `${MAIN}/Reminder.java`, region: 'abstraction', highlight: [3, 11] },
    },
  ],
};

export default scene;
