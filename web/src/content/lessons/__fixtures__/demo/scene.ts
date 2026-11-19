import type { Category, Scene } from '../../../../engine/types';

/** Fixture lesson used by the build smoke test (only loaded when P2L_FIXTURES=1). */
export const category: Category = 'behavioral';

const S = 'behavioral/strategy/src/main/java/com/patterns2learn/box/strategy';

const scene: Scene = {
  entities: [
    { id: 'ctx', kind: 'container', label: 'Spring context', pos: { x: 0, y: 0 }, size: { w: 7, d: 6, h: 0.25 }, tone: 'neutral' },
    { id: 'client', kind: 'actor', label: 'Client', pos: { x: -3.5, y: 4 }, size: { w: 1, d: 1, h: 0.5 }, tone: 'neutral' },
    { id: 'service', kind: 'block', label: 'PricingService', pos: { x: 1, y: 2, z: 0.25 }, size: { w: 1.5, d: 1.5, h: 1 }, tone: 'accent', icon: 'gear' },
    { id: 'strategy', kind: 'interface', label: 'PricingStrategy', pos: { x: 4.5, y: 0.5, z: 0.25 }, size: { w: 1.5, d: 1.5, h: 1 }, tone: 'neutral' },
    { id: 'tenpack', kind: 'block', label: 'TenPackPricing', pos: { x: 4.5, y: 4, z: 0.25 }, size: { w: 1.5, d: 1.5, h: 0.75 }, tone: 'warn', icon: 'ten' },
  ],
  links: [
    { id: 'l-call', from: 'client', to: 'service', style: 'call' },
    { id: 'l-inject', from: 'strategy', to: 'service', style: 'injects' },
    { id: 'l-impl', from: 'tenpack', to: 'strategy', style: 'implements' },
  ],
  steps: [
    { id: 'intro', visible: ['client'], highlight: [], packets: [] },
    {
      id: 'interface',
      visible: ['client', 'ctx', 'strategy'],
      highlight: ['strategy'],
      packets: [],
      code: { file: `${S}/PricingStrategy.java`, region: 'pricing-interface', highlight: [2] },
    },
    {
      id: 'service',
      visible: ['client', 'ctx', 'strategy', 'service'],
      highlight: ['service'],
      packets: [],
      code: { file: `${S}/PricingService.java`, region: 'service-map', highlight: [1, 3, 4, 5] },
    },
    {
      id: 'request',
      visible: ['client', 'ctx', 'strategy', 'service'],
      highlight: [],
      packets: [{ link: 'l-call', label: 'plan=ten-pack' }],
      code: { file: `${S}/PricingService.java`, region: 'service-map', highlight: [7, 8] },
    },
    {
      id: 'strategies',
      visible: ['client', 'ctx', 'strategy', 'service', 'tenpack'],
      highlight: ['tenpack'],
      packets: [],
      code: { file: `${S}/TenPackPricing.java`, region: 'ten-pack-strategy', highlight: [1, 2] },
    },
    {
      id: 'price',
      visible: ['client', 'ctx', 'strategy', 'service', 'tenpack'],
      highlight: ['tenpack'],
      packets: [{ link: 'l-call', label: '120.00 EUR', reverse: true }],
      code: { file: `${S}/TenPackPricing.java`, region: 'ten-pack-strategy', highlight: [5] },
    },
  ],
};

export default scene;
