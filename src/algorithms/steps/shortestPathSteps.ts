import { Step, GraphNode, GraphEdge } from '../../types';

// ==================== 类型别名 ====================
type SStep = Step;

// ==================== 预设图数据 ====================
// 标准带权有向图（A=0, B=1, C=2, D=3, E=4）
export const DEFAULT_SP_NODES: GraphNode[] = [
  { id: 0, label: 'A', x: 300, y: 40 },
  { id: 1, label: 'B', x: 120, y: 140 },
  { id: 2, label: 'C', x: 300, y: 140 },
  { id: 3, label: 'D', x: 480, y: 140 },
  { id: 4, label: 'E', x: 200, y: 260 },
  { id: 5, label: 'F', x: 400, y: 260 },
];

// 含负权边的图（用于 BF / SPFA）
export const DEFAULT_SP_EDGES: GraphEdge[] = [
  { from: 0, to: 1, weight: 4 },
  { from: 0, to: 2, weight: 2 },
  { from: 1, to: 2, weight: -1 },
  { from: 1, to: 3, weight: 5 },
  { from: 1, to: 4, weight: 1 },
  { from: 2, to: 3, weight: 8 },
  { from: 2, to: 4, weight: 10 },
  { from: 3, to: 5, weight: 2 },
  { from: 4, to: 3, weight: -4 },
  { from: 4, to: 5, weight: 3 },
  { from: 4, to: 2, weight: 1 },
];

// 无负权边（用于 Floyd）
export const DEFAULT_FLOYD_NODES: GraphNode[] = [
  { id: 0, label: 'A', x: 100, y: 80 },
  { id: 1, label: 'B', x: 280, y: 40 },
  { id: 2, label: 'C', x: 460, y: 80 },
  { id: 3, label: 'D', x: 460, y: 200 },
  { id: 4, label: 'E', x: 280, y: 260 },
  { id: 5, label: 'F', x: 100, y: 200 },
];

export const DEFAULT_FLOYD_EDGES: GraphEdge[] = [
  { from: 0, to: 1, weight: 6 },
  { from: 0, to: 5, weight: 1 },
  { from: 1, to: 2, weight: 5 },
  { from: 1, to: 3, weight: 2 },
  { from: 2, to: 3, weight: 3 },
  { from: 5, to: 4, weight: 4 },
  { from: 4, to: 3, weight: 1 },
  { from: 4, to: 2, weight: 2 },
];

// 无向图的邻接表
function buildAdj(nodes: GraphNode[], edges: GraphEdge[], directed = false): Map<number, Array<{ to: number; weight: number }>> {
  const adj = new Map<number, Array<{ to: number; weight: number }>>();
  for (const n of nodes) adj.set(n.id, []);
  for (const e of edges) {
    adj.get(e.from)!.push({ to: e.to, weight: e.weight });
    if (!directed) {
      adj.get(e.to)!.push({ to: e.from, weight: e.weight });
    }
  }
  return adj;
}

// ==================== 共享数据结构 ====================
interface SpResult {
  steps: SStep[];
  graphNodes: GraphNode[];
  graphEdges: GraphEdge[];
  source: number;
}

// ==================== Dijkstra 算法 ====================
export function dijkstraSteps(
  nodes: GraphNode[] = DEFAULT_SP_NODES,
  edges: GraphEdge[] = DEFAULT_SP_EDGES,
  source = 0
): SpResult {
  const steps: SStep[] = [];

  const adj = buildAdj(nodes, edges, true);
  const INF = Infinity;
  const dist: Record<number, number> = {};
  const prev: Record<number, number | null> = {};
  const settled = new Set<number>();
  const PQ: Array<{ id: number; dist: number }> = [];

  const srcLabel = nodes.find(n => n.id === source)?.label ?? '?';
  steps.push({ type: 'spInit', data: {
    source, type: 'dijkstra',
    distances: Object.fromEntries(nodes.map(n => [n.id, n.id === source ? 0 : INF])),
    predecessors: Object.fromEntries(nodes.map(n => [n.id, null])),
    settled: [], queue: [source], message: `【Dijkstra】源点=${srcLabel}，dist[${srcLabel}]=0`
  }});

  // 初始化优先队列
  dist[source] = 0;
  PQ.push({ id: source, dist: 0 });
  PQ.sort((a, b) => a.dist - b.dist);

  steps.push({ type: 'spEnqueue', data: {
    queue: PQ.map(p => `${nodes.find(n => n.id === p.id)?.label}(${p.dist})`),
    value: source, nodeId: source,
    distances: { ...dist },
    predecessors: { ...prev },
    settled: [],
    message: `优先队列 PQ = [${PQ.map(p => `${nodes.find(n=>n.id===p.id)?.label}(${p.dist})`).join(', ')}]`
  }});

  while (PQ.length > 0) {
    // 取出最小距离节点
    PQ.sort((a, b) => a.dist - b.dist);
    const { id: u, dist: du } = PQ.shift()!;

    if (settled.has(u)) continue;
    settled.add(u);

    const uLabel = nodes.find(n => n.id === u)?.label ?? '?';
    steps.push({ type: 'spSettled', data: {
      nodeId: u, settled: [...settled],
      distances: { ...dist },
      predecessors: { ...prev },
      queue: PQ.map(p => `${nodes.find(n => n.id === p.id)?.label}(${p.dist})`),
      message: `确定节点 ${uLabel}，dist[${uLabel}] = ${du === INF ? '∞' : du}`,
    }});

    // 检查邻接边
    const neighbors = adj.get(u) ?? [];
    for (const { to: v, weight: w } of neighbors) {
      if (settled.has(v)) continue;
      const dv = dist[v] ?? INF;
      if (du + w < dv) {
        dist[v] = du + w;
        prev[v] = u;
        PQ.push({ id: v, dist: dist[v] });
        PQ.sort((a, b) => a.dist - b.dist);

        const vLabel = nodes.find(n => n.id === v)?.label ?? '?';
        const wuLabel = nodes.find(n => n.id === u)?.label ?? '?';
        steps.push({ type: 'spRelax', data: {
          from: u, to: v, weight: w,
          oldDist: dv === INF ? null : dv,
          newDist: dist[v],
          edgeId: `${u}-${v}`,
          distances: { ...dist },
          predecessors: { ...prev },
          settled: [...settled],
          queue: PQ.map(p => `${nodes.find(n => n.id === p.id)?.label}(${p.dist})`),
          message: `松弛边 ${wuLabel}→${vLabel}：dist[${vLabel}] = ${dv === INF ? '∞' : dv} → ${dist[v]}`,
        }});
      }
    }
  }

  const distEntries = nodes.map(n => `${n.label}=${dist[n.id] === INF ? '∞' : dist[n.id]}`).join(', ');
  steps.push({ type: 'message', data: { text: `✅ Dijkstra 完成！最短距离：${distEntries}` } });

  return { steps, graphNodes: nodes, graphEdges: edges, source };
}

// ==================== Bellman-Ford 算法 ====================
export function bellmanFordSteps(
  nodes: GraphNode[] = DEFAULT_SP_NODES,
  edges: GraphEdge[] = DEFAULT_SP_EDGES,
  source = 0
): SpResult {
  const steps: SStep[] = [];

  const INF = Infinity;
  const dist: Record<number, number> = {};
  const prev: Record<number, number | null> = {};
  const settled: number[] = [];

  const srcLabel = nodes.find(n => n.id === source)?.label ?? '?';
  steps.push({ type: 'spInit', data: {
    source, type: 'bellman-ford',
    distances: Object.fromEntries(nodes.map(n => [n.id, n.id === source ? 0 : INF])),
    predecessors: Object.fromEntries(nodes.map(n => [n.id, null])),
    settled: [], round: 0,
    message: `【Bellman-Ford】源点=${srcLabel}，共 ${nodes.length} 个节点，执行 ${nodes.length} 轮`
  }});

  for (const n of nodes) dist[n.id] = n.id === source ? 0 : INF;

  for (let round = 1; round <= nodes.length; round++) {
    const changed: Array<{ from: number; to: number; w: number }> = [];
    let anyChanged = false;

    steps.push({ type: 'spInit', data: {
      source, type: 'bellman-ford', round,
      distances: { ...dist },
      predecessors: { ...prev },
      settled: [...settled],
      message: `━━ 第 ${round}/${nodes.length} 轮松弛 ━━`,
    }});

    for (const edge of edges) {
      const { from: u, to: v, weight: w } = edge;
      if (dist[u] !== INF && dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w;
        prev[v] = u;
        anyChanged = true;
        changed.push({ from: u, to: v, w });

        const uL = nodes.find(n => n.id === u)?.label ?? '?';
        const vL = nodes.find(n => n.id === v)?.label ?? '?';
        steps.push({ type: 'spRelax', data: {
          from: u, to: v, weight: w,
          edgeId: `${u}-${v}`,
          oldDist: dist[v] - w,
          newDist: dist[v],
          distances: { ...dist },
          predecessors: { ...prev },
          settled: [...settled],
          round,
          message: `轮${round} 松弛 ${uL}→${vL}：dist[${vL}] = ${dist[v] - w} → ${dist[v]}`,
        }});
      }
    }

    if (!anyChanged) {
      steps.push({ type: 'message', data: { text: `第 ${round} 轮无变化，提前收敛！` } });
      break;
    }

    // 第 n 轮检测负环
    if (round === nodes.length) {
      steps.push({ type: 'spNegativeCycle', data: {
        distances: { ...dist },
        predecessors: { ...prev },
        settled: [...settled],
        message: `⚠️ 第 ${round} 轮仍有更新，存在负环！部分最短距离不可靠`,
      }});
    }
  }

  const distEntries = nodes.map(n => `${n.label}=${dist[n.id] === INF ? '∞' : dist[n.id]}`).join(', ');
  steps.push({ type: 'message', data: { text: `✅ Bellman-Ford 完成！${distEntries}` } });

  return { steps, graphNodes: nodes, graphEdges: edges, source };
}

// ==================== SPFA 算法 ====================
export function spfaSteps(
  nodes: GraphNode[] = DEFAULT_SP_NODES,
  edges: GraphEdge[] = DEFAULT_SP_EDGES,
  source = 0
): SpResult {
  const steps: SStep[] = [];

  const adj = buildAdj(nodes, edges, true);
  const INF = Infinity;
  const dist: Record<number, number> = {};
  const prev: Record<number, number | null> = {};
  const inQueue: Record<number, boolean> = {};
  const inCount: Record<number, number> = {};
  const settled: number[] = [];
  const queue: number[] = [];

  const srcLabel = nodes.find(n => n.id === source)?.label ?? '?';
  for (const n of nodes) { dist[n.id] = INF; inQueue[n.id] = false; inCount[n.id] = 0; }
  dist[source] = 0;
  queue.push(source);
  inQueue[source] = true;
  inCount[source] = 1;

  steps.push({ type: 'spInit', data: {
    source, type: 'spfa',
    distances: { ...dist },
    predecessors: { ...prev },
    inQueue: { ...inQueue },
    inCount: { ...inCount },
    settled: [],
    queue: [...queue],
    message: `【SPFA】源点=${srcLabel}，队列初始化 [${srcLabel}]`
  }});

  while (queue.length > 0) {
    const u = queue.shift()!;
    inQueue[u] = false;
    const uLabel = nodes.find(n => n.id === u)?.label ?? '?';

    steps.push({ type: 'spDequeue', data: {
      nodeId: u, queue: [...queue],
      distances: { ...dist },
      predecessors: { ...prev },
      inQueue: { ...inQueue },
      inCount: { ...inCount },
      settled: [...settled],
      message: `Dequeue ${uLabel}，剩余队列 [${queue.map(q => nodes.find(n => n.id === q)?.label).join(', ')}]`
    }});

    // 若入队超过 n 次，有负环
    if (inCount[u] > nodes.length) {
      steps.push({ type: 'spNegativeCycle', data: {
        nodeId: u, inCount: { ...inCount },
        distances: { ...dist },
        predecessors: { ...prev },
        settled: [...settled],
        queue: [...queue],
        message: `⚠️ 节点 ${uLabel} 入队次数 > ${nodes.length}，检测到负环！`,
      }});
      break;
    }

    // 对所有邻接边松弛
    const neighbors = adj.get(u) ?? [];
    for (const { to: v, weight: w } of neighbors) {
      const dv = dist[v] ?? INF;
      if (dist[u] + w < dv) {
        dist[v] = dist[u] + w;
        prev[v] = u;
        const vLabel = nodes.find(n => n.id === v)?.label ?? '?';
        steps.push({ type: 'spRelax', data: {
          from: u, to: v, weight: w,
          edgeId: `${u}-${v}`,
          oldDist: dv === INF ? null : dv,
          newDist: dist[v],
          distances: { ...dist },
          predecessors: { ...prev },
          inQueue: { ...inQueue },
          inCount: { ...inCount },
          settled: [...settled],
          queue: [...queue],
          message: `松弛 ${uLabel}→${vLabel}：dist[${vLabel}] = ${dv === INF ? '∞' : dv} → ${dist[v]}`,
        }});
        if (!inQueue[v]) {
          queue.push(v);
          inQueue[v] = true;
          inCount[v]++;
          steps.push({ type: 'spEnqueue', data: {
            nodeId: v, queue: [...queue],
            inQueue: { ...inQueue },
            inCount: { ...inCount },
            distances: { ...dist },
            predecessors: { ...prev },
            settled: [...settled],
            message: `Enqueue ${vLabel}，队列 [${queue.map(q => nodes.find(n => n.id === q)?.label).join(', ')}]`,
          }});
        }
      }
    }

    // 没有邻居需要更新时，标记为已确定
    const needsMore = neighbors.some(({ to: v }) => dist[u] + (adj.get(v)?.find(e => e.to === v)?.weight ?? 0) < dist[v]);
    if (!needsMore && !settled.includes(u)) {
      settled.push(u);
      steps.push({ type: 'spSettled', data: {
        nodeId: u, settled: [...settled],
        distances: { ...dist },
        predecessors: { ...prev },
        inQueue: { ...inQueue },
        inCount: { ...inCount },
        queue: [...queue],
        message: `节点 ${uLabel} 无需进一步松弛，标记为已确定`,
      }});
    }
  }

  const distEntries = nodes.map(n => `${n.label}=${dist[n.id] === INF ? '∞' : dist[n.id]}`).join(', ');
  steps.push({ type: 'message', data: { text: `✅ SPFA 完成！${distEntries}` } });

  return { steps, graphNodes: nodes, graphEdges: edges, source };
}

// ==================== Floyd-Warshall 算法 ====================
export function floydWarshallSteps(
  nodes: GraphNode[] = DEFAULT_FLOYD_NODES,
  edges: GraphEdge[] = DEFAULT_FLOYD_EDGES
): SpResult {
  const steps: SStep[] = [];

  const n = nodes.length;
  // 初始化距离矩阵
  const dist: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 0 : Infinity))
  );
  const prev: (number | null)[][] = Array.from({ length: n }, () =>
    Array.from({ length: n }, () => null)
  );

  // 从边初始化
  for (const { from, to, weight } of edges) {
    dist[from][to] = weight;
    prev[from][to] = from;
  }

  const nodeLabel = (i: number) => nodes[i]?.label ?? String(i);
  const distStr = (v: number) => v === Infinity ? '∞' : String(v);

  steps.push({ type: 'spInit', data: {
    type: 'floyd',
    distances: dist.map(row => [...row]),
    predecessors: prev.map(row => [...row]),
    k: -1, i: -1, j: -1,
    message: `【Floyd-Warshall】初始化 ${n}×${n} 距离矩阵`
  }});

  for (let k = 0; k < n; k++) {
    steps.push({ type: 'spFloydCell', data: {
      k, i: -1, j: -1,
      distances: dist.map(row => [...row]),
      predecessors: prev.map(row => [...row]),
      kLabel: nodeLabel(k),
      message: `━━ 遍历 k=${nodeLabel(k)}（作为中间节点）━━`,
    }});

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === k || j === k || i === j) continue;

        steps.push({ type: 'spFloydCell', data: {
          k, i, j,
          distances: dist.map(row => [...row]),
          predecessors: prev.map(row => [...row]),
          kLabel: nodeLabel(k), iLabel: nodeLabel(i), jLabel: nodeLabel(j),
          message: `检查 ${nodeLabel(i)} → ${nodeLabel(j)}，经 ${nodeLabel(k)}: dist[${nodeLabel(i)}][${nodeLabel(j)}] = ${distStr(dist[i][j])} vs ${distStr(dist[i][k])} + ${distStr(dist[k][j])} = ${distStr(dist[i][k] === Infinity || dist[k][j] === Infinity ? Infinity : dist[i][k] + dist[k][j])}`,
        }});

        if (dist[i][k] !== Infinity && dist[k][j] !== Infinity && dist[i][k] + dist[k][j] < dist[i][j]) {
          const old = dist[i][j];
          dist[i][j] = dist[i][k] + dist[k][j];
          prev[i][j] = prev[k][j];
          steps.push({ type: 'spFloydUpdate', data: {
            k, i, j,
            oldDist: old === Infinity ? null : old,
            newDist: dist[i][j],
            distances: dist.map(row => [...row]),
            predecessors: prev.map(row => [...row]),
            kLabel: nodeLabel(k), iLabel: nodeLabel(i), jLabel: nodeLabel(j),
            message: `✅ 更新 dist[${nodeLabel(i)}][${nodeLabel(j)}]: ${distStr(old)} → ${dist[i][j]}`,
          }});
        }
      }
    }
  }

  // 输出结果
  let result = '✅ Floyd-Warshall 完成！最短距离矩阵：\n';
  for (let i = 0; i < n; i++) {
    result += `[${nodeLabel(i)}]: ${dist[i].map((v, j) => `${nodeLabel(j)}=${distStr(v)}`).join(', ')}\n`;
  }
  steps.push({ type: 'message', data: { text: result } });

  return { steps, graphNodes: nodes, graphEdges: edges, source: -1 };
}

// ==================== 数据导出（用于 AlgorithmPage）====================
// Dijkstra：复用带负权图（权重>0的边仍然足够演示）
export function dijkstraStepsDefault(): SpResult {
  const edges = DEFAULT_SP_EDGES.filter(e => e.weight > 0);
  return dijkstraSteps(DEFAULT_SP_NODES, edges, 0);
}
