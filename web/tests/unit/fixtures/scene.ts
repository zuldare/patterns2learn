import type { Scene } from '../../../src/engine/types';

/** Shared 6-step test scene: step 3 and step 5 each carry one packet. */
export const indexWithPackets = 3;

export const scene: Scene = {
  entities: [
    { id: 'ctx', kind: 'container', label: 'Spring context', pos: { x: 0, y: 0 }, size: { w: 7, d: 6, h: 0.25 }, tone: 'neutral' },
    { id: 'client', kind: 'actor', label: 'Client', pos: { x: -3.5, y: 4 }, size: { w: 1, d: 1, h: 0.5 }, tone: 'neutral' },
    { id: 'service', kind: 'block', label: 'PricingService', pos: { x: 1, y: 2, z: 0.25 }, size: { w: 1.5, d: 1.5, h: 1 }, tone: 'accent' },
    { id: 'strategy', kind: 'interface', label: 'PricingStrategy', pos: { x: 4.5, y: 0.5, z: 0.25 }, size: { w: 1.5, d: 1.5, h: 1 }, tone: 'neutral' },
    { id: 'monthly', kind: 'block', label: 'MonthlyPricing', pos: { x: 4.5, y: 4, z: 0.25 }, size: { w: 1.5, d: 1.5, h: 0.75 }, tone: 'warn' },
  ],
  links: [
    { id: 'l-call', from: 'client', to: 'service', style: 'call' },
    { id: 'l-inject', from: 'strategy', to: 'service', style: 'injects' },
    { id: 'l-impl', from: 'monthly', to: 'strategy', style: 'implements' },
  ],
  steps: [
    { id: 'intro', visible: ['client'], highlight: [], packets: [] },
    { id: 'context', visible: ['client', 'ctx'], highlight: ['ctx'], packets: [] },
    { id: 'service', visible: ['client', 'ctx', 'service'], highlight: ['service'], packets: [] },
    {
      id: 'request',
      visible: ['client', 'ctx', 'service'],
      highlight: [],
      packets: [{ link: 'l-call', label: 'plan=monthly' }],
    },
    { id: 'strategies', visible: ['client', 'ctx', 'service', 'strategy', 'monthly'], highlight: ['strategy'], packets: [] },
    {
      id: 'price',
      visible: ['client', 'ctx', 'service', 'strategy', 'monthly'],
      highlight: ['monthly'],
      packets: [{ link: 'l-call', label: '29.00 EUR', reverse: true }],
    },
  ],
};
