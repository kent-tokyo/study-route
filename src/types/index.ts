export type LocalizedStrings = { ja?: string; en?: string; zh?: string };

export interface GraphNode {
  id: string;
  number?: string;
  label: string;
  labels?: LocalizedStrings;
  area: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  position: { x: number; y: number };
  description: string;
  descriptions?: LocalizedStrings;
  prerequisites: string[];
}

/** @deprecated Use GraphNode instead */
export type MathNode = GraphNode;

export interface GraphEdge {
  source: string;
  target: string;
}

/** @deprecated Use GraphEdge instead */
export type MathEdge = GraphEdge;

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export type NodeStatus = 'locked' | 'available' | 'in_progress' | 'completed';

export interface NodeProgress {
  nodeId: string;
  status: NodeStatus;
  startedAt: Date | null;
  completedAt: Date | null;
  notes: string | null;
}

export interface Term {
  term: string;
  reading: string;
  en: string;
  definition: string;
}

export interface QuizChoice {
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  question: string;
  choices: QuizChoice[];
  explanation: string;
}

export type AreaId = string;

export interface AreaMeta {
  id: AreaId;
  label: string;
  labels?: LocalizedStrings;
  position: { x: number; y: number };
  color: string;
  description: string;
  descriptions?: LocalizedStrings;
}
