import type { Snippet } from '../lib/snippets';

export type Locale = 'es' | 'en';
export type Category = 'creational' | 'structural' | 'behavioral' | 'spring';
export type Level = 'beginner' | 'intermediate' | 'advanced';
export type EntityKind = 'actor' | 'block' | 'interface' | 'container';
export type LinkStyle = 'call' | 'implements' | 'injects';
export type Tone = 'neutral' | 'accent' | 'warn' | 'danger';

export type IsoPoint = { x: number; y: number; z?: number };
export type IsoSize = { w: number; d: number; h: number };

export type Entity = {
  id: string;
  kind: EntityKind;
  label: string;
  pos: IsoPoint;
  size: IsoSize;
  tone: Tone;
};

export type Link = { id: string; from: string; to: string; style: LinkStyle };

export type Packet = { link: string; label: string; reverse?: boolean };

export type SnippetRef = { file: string; region: string; highlight: number[] };

export type SceneStep = {
  id: string;
  visible: string[];
  highlight: string[];
  packets: Packet[];
  code?: SnippetRef;
};

export type Scene = { entities: Entity[]; links: Link[]; steps: SceneStep[] };

export type StepText = { id: string; title: string; html: string; describe: string };

export type QuizQuestion = { q: string; options: string[]; answer: number; explain: string };

export type Recap = {
  intent: string;
  participants: string[];
  pros: string[];
  cons: string[];
  related: string[];
};

export type LessonText = {
  title: string;
  summary: string;
  minutes: number;
  level: Level;
  steps: StepText[];
  recap: Recap;
  quiz: QuizQuestion[];
};

export type Lesson = {
  slug: string;
  category: Category;
  scene: Scene;
  texts: Record<Locale, LessonText>;
  /** Loaded code snippets keyed `${file}#${region}`. */
  snippets: Map<string, Snippet>;
};

export type ResolvedStep = SceneStep & { text: StepText; snippet?: Snippet };
