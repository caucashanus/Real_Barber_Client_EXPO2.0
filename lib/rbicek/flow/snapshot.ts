import type { FlowDefinition, FlowNode, FlowOption } from '@/lib/rbicek/port/types/chat';

import flowSnapshotJson from './flow-snapshot.json';

export interface FlowSnapshotConstants {
  conversationTtlMs: number;
  maxResponseOptions: number;
  liveOperatorEnabled: boolean;
}

interface FlowSnapshotFile {
  version: string;
  generatedAt: string;
  startNodeId: string;
  followUpNodeId: string;
  constants: FlowSnapshotConstants;
  followUpOptions: FlowOption[];
  nodes: FlowNode[];
}

const snapshot = flowSnapshotJson as FlowSnapshotFile;

function buildNodesMap(nodes: FlowNode[]): Record<string, FlowNode> {
  const map: Record<string, FlowNode> = {};
  for (const node of nodes) {
    map[node.id] = node;
  }
  return map;
}

export const flowSnapshotMeta = {
  version: snapshot.version,
  generatedAt: snapshot.generatedAt,
} as const;

export function getFlowSnapshotConstants(): FlowSnapshotConstants {
  return snapshot.constants;
}

export const flowDefinition: FlowDefinition = {
  startNodeId: snapshot.startNodeId,
  followUpNodeId: snapshot.followUpNodeId,
  followUpOptions: snapshot.followUpOptions,
  nodes: buildNodesMap(snapshot.nodes),
};
