import { Step, GraphNode, GraphEdge } from '../../types';

// ==================== 类型别名 ====================
type MStep = Step;

// ==================== 预设 MST 图数据 ====================
export const DEFAULT_MST_NODES: GraphNode[] = [
  { id: 0, label: 'A', x: 300, y: 30 },
  { id: 1, label: 'B', x: 100, y: 130 },
  { id: 2, label: 'C', x: 500, y: 130 },
  { id: 3, label: 'D', x: 60, y: 250 },
  { id: 4, label: 'E', x: 260, y: 250 },
  { id: 5, label: 'F', x: 460, y: 250 },
  { id: 6, label: 'G', x: 300, y: 330 },
];

// 无向带权边（Prim / Kruskal 共用）
export const DEFAULT_MST_EDGES: GraphEdge[] = [
  { from: 0, to: 1, weight: 4 },
  { from: 0, to: 2, weight: 3 },
  { from: 0, to: 4, weight: 7 },
  { from: 1, to: 2, weight: 6 },
  { from: 1, to: 3, weight: 2 },
  { from: 1, to: 4, weight: 5 },
  { from: 2, to: 4, weight: 8 },
  { from: 2, to: 5, weight: 9 },
  { from: 3, to: 4, weight: 3 },
  { from: 4, to: 5, weight: 4 },
  { from: 4, to: 6, weight: 5 },
  { from: 5, to: 6, weight: 2 },
];

// ==================== 并查集（Union-Find）====================
function find(parent: number[], x: number): number {
  if (parent[x] !== x) parent[x] = find(parent, parent[x]);
  return parent[x];
}
function connected(parent: number[], x: number, y: number): boolean {
  return find(parent, x) === find(parent, y);
}

// ==================== 共享结果类型 ====================
export interface MstResult {
  steps: MStep[];
  graphNodes: GraphNode[];
  graphEdges: GraphEdge[];
}

// ==================== Prim 算法 ====================
export function primSteps(
  nodes: GraphNode[] = DEFAULT_MST_NODES,
  edges: GraphEdge[] = DEFAULT_MST_EDGES,
  start = 0
): MstResult {
  const steps: MStep[] = [];
  const nodeLabel = (id: number) => nodes.find(n => n.id === id)?.label ?? '?';

  const n = nodes.length;
  const inMst = new Set<number>();
  const key: Record<number, number> = {};
  const parent: Record<number, number | null> = {};

  for (const node of nodes) {
    key[node.id] = Infinity;
    parent[node.id] = null;
  }
  key[start] = 0;

  steps.push({
    type: 'mstInit',
    data: {
      type: 'prim', start,
      inMst: [],
      key: { ...key },
      parent: { ...parent },
      mstEdges: [],
      totalWeight: 0,
      message: `【Prim 算法】从节点 ${nodeLabel(start)} 开始，贪心扩展最小生成树`,
    },
  });

  for (let i = 0; i < n; i++) {
    // 找未加入 MST 中 key 最小的节点
    let minKey = Infinity;
    let u = -1;
    for (const node of nodes) {
      if (!inMst.has(node.id) && key[node.id] < minKey) {
        minKey = key[node.id];
        u = node.id;
      }
    }
    if (u < 0) break;
    inMst.add(u);

    steps.push({
      type: 'mstNodeAdd',
      data: {
        nodeId: u, inMst: [...inMst],
        key: { ...key },
        parent: { ...parent },
        mstEdges: [],
        totalWeight: 0,
        message: i === 0
          ? `选择起点 ${nodeLabel(u)}，key[${nodeLabel(u)}] = 0`
          : `选择节点 ${nodeLabel(u)}，key = ${key[u]}`,
      },
    });

    // 考察所有与 u 相邻的边
    for (const edge of edges) {
      const isAdj = (edge.from === u || edge.to === u) && !inMst.has(edge.from === u ? edge.to : edge.from);
      if (!isAdj) continue;
      const v = edge.from === u ? edge.to : edge.from;

      steps.push({
        type: 'mstEdgeConsider',
        data: {
          from: u, to: v, weight: edge.weight,
          inMst: [...inMst],
          key: { ...key },
          parent: { ...parent },
          mstEdges: [],
          totalWeight: 0,
          message: `考察边 ${nodeLabel(u)}-${nodeLabel(v)}，权值 = ${edge.weight}`,
        },
      });

      if (!inMst.has(v) && edge.weight < key[v]) {
        key[v] = edge.weight;
        parent[v] = u;
        steps.push({
          type: 'mstEdgeAdd',
          data: {
            from: u, to: v, weight: edge.weight,
            inMst: [...inMst],
            key: { ...key },
            parent: { ...parent },
            mstEdges: [],
            totalWeight: 0,
            message: `更新 key[${nodeLabel(v)}] = ${edge.weight}，parent[${nodeLabel(v)}] = ${nodeLabel(u)}`,
          },
        });
      } else {
        steps.push({
          type: 'mstEdgeSkip',
          data: {
            from: u, to: v, weight: edge.weight,
            inMst: [...inMst],
            key: { ...key },
            parent: { ...parent },
            mstEdges: [],
            totalWeight: 0,
            reason: `key[${nodeLabel(v)}] = ${key[v]} ≤ ${edge.weight}，无需更新`,
            message: `key[${nodeLabel(v)}] = ${key[v]} ≤ ${edge.weight}，跳过`,
          },
        });
      }
    }
  }

  // 构建 MST 边列表
  const mstEdgesList: Array<{ from: number; to: number; weight: number }> = [];
  let totalWeight = 0;
  for (const node of nodes) {
    if (parent[node.id] !== null) {
      mstEdgesList.push({ from: parent[node.id]!, to: node.id, weight: key[node.id] });
      totalWeight += key[node.id];
    }
  }

  steps.push({
    type: 'message',
    data: {
      text: `✅ Prim 算法完成！MST 边：${mstEdgesList.map(e => `${nodeLabel(e.from)}-${nodeLabel(e.to)}(${e.weight})`).join('，')}，总权值 = ${totalWeight}`,
    },
  });

  // 补一个收尾步骤，显示完整 MST
  steps.push({
    type: 'mstInit',
    data: {
      type: 'prim', start,
      inMst: [...inMst],
      key: { ...key },
      parent: { ...parent },
      mstEdges: mstEdgesList,
      totalWeight,
      message: `MST 构建完成！总权值 = ${totalWeight}`,
    },
  });

  return { steps, graphNodes: nodes, graphEdges: edges };
}

// ==================== Kruskal 算法 ====================
export function kruskalSteps(
  nodes: GraphNode[] = DEFAULT_MST_NODES,
  edges: GraphEdge[] = DEFAULT_MST_EDGES
): MstResult {
  const steps: MStep[] = [];
  const nodeLabel = (id: number) => nodes.find(n => n.id === id)?.label ?? '?';

  // 按权值升序排序
  const sorted = [...edges].sort((a, b) => a.weight - b.weight);

  steps.push({
    type: 'mstInit',
    data: {
      type: 'kruskal',
      inMst: [],
      parent: Object.fromEntries(nodes.map(n => [n.id, n.id])),
      rank: Object.fromEntries(nodes.map(n => [n.id, 0])),
      mstEdges: [],
      totalWeight: 0,
      sortedEdges: sorted.map(e => ({ from: e.from, to: e.to, weight: e.weight })),
      message: `【Kruskal 算法】将所有边按权值升序排列，共 ${edges.length} 条边`,
    },
  });

  const parent: number[] = nodes.map(n => n.id);
  const rank: number[] = nodes.map(() => 0);
  const mstEdges: Array<{ from: number; to: number; weight: number }> = [];
  let totalWeight = 0;

  for (const edge of sorted) {
    const { from: u, to: v, weight: w } = edge;

    steps.push({
      type: 'mstEdgeConsider',
      data: {
        from: u, to: v, weight: w,
        inMst: [...mstEdges],
        parent: Object.fromEntries(nodes.map(n => [n.id, find(parent, n.id)])),
        rank: Object.fromEntries(nodes.map(n => [n.id, rank[n.id]])),
        mstEdges: [...mstEdges],
        totalWeight,
        message: `考察边 ${nodeLabel(u)}-${nodeLabel(v)}，权值 = ${w}`,
      },
    });

    if (!connected(parent, u, v)) {
      // 不成环，加入 MST
      mstEdges.push({ from: u, to: v, weight: w });
      totalWeight += w;
      // union(u, v)
      const pu = find(parent, u), pv = find(parent, v);
      if (rank[pu] < rank[pv]) { parent[pu] = pv; }
      else if (rank[pu] > rank[pv]) { parent[pv] = pu; }
      else { parent[pv] = pu; rank[pu]++; }

      steps.push({
        type: 'mstEdgeAdd',
        data: {
          from: u, to: v, weight: w,
          inMst: [...mstEdges],
          parent: Object.fromEntries(nodes.map(n => [n.id, find(parent, n.id)])),
          rank: Object.fromEntries(nodes.map(n => [n.id, rank[n.id]])),
          mstEdges: [...mstEdges],
          totalWeight,
          message: `${nodeLabel(u)} 和 ${nodeLabel(v)} 不连通，加入 MST！`,
        },
      });
    } else {
      // 成环，跳过
      steps.push({
        type: 'mstEdgeSkip',
        data: {
          from: u, to: v, weight: w,
          inMst: [...mstEdges],
          parent: Object.fromEntries(nodes.map(n => [n.id, find(parent, n.id)])),
          rank: Object.fromEntries(nodes.map(n => [n.id, rank[n.id]])),
          mstEdges: [...mstEdges],
          totalWeight,
          reason: `${nodeLabel(u)} 和 ${nodeLabel(v)} 已连通，加入会形成环`,
          message: `⚠️ ${nodeLabel(u)}-${nodeLabel(v)} 会成环，跳过`,
        },
      });
    }

    if (mstEdges.length === nodes.length - 1) {
      steps.push({
        type: 'message',
        data: { text: `已选 ${nodes.length - 1} 条边，MST 已满，提前结束` },
      });
      break;
    }
  }

  steps.push({
    type: 'message',
    data: {
      text: `✅ Kruskal 算法完成！MST 边：${mstEdges.map(e => `${nodeLabel(e.from)}-${nodeLabel(e.to)}(${e.weight})`).join('，')}，总权值 = ${totalWeight}`,
    },
  });

  return { steps, graphNodes: nodes, graphEdges: edges };
}
