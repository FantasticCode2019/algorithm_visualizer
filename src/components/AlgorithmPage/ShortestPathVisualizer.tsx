import { useMemo } from 'react';
import { GraphNode, GraphEdge, SpNodeStatus } from '../../types';

interface ShortestPathVisualizerProps {
  // 图数据
  graphNodes: GraphNode[];
  graphEdges: GraphEdge[];
  source: number;
  // 当前步骤数据
  currentStepType: string;
  currentStepData: Record<string, any>;
  // 算法类型
  algoType: 'dijkstra' | 'bellman-ford' | 'spfa' | 'floyd';
  // 总步骤数（用于进度）
  totalSteps?: number;
  currentStepIndex?: number;
}

// 节点颜色
const NODE_COLORS: Record<SpNodeStatus, string> = {
  idle:           '#475569',
  processing:     '#f59e0b',
  inQueue:        '#a855f7',
  settled:        '#3b82f6',
  unreachable:    '#ef4444',
  negativeCycle:  '#dc2626',
};

// SVG 布局尺寸
const SVG_W = 560;
const SVG_H = 320;
const NODE_R = 22;
const LABEL_FONT = 12;

// 节点半径（根据 label 长度调整）
function getNodeRadius(label: string): number {
  return label.length <= 1 ? NODE_R : NODE_R + (label.length - 1) * 3;
}

// 获取边上的文字位置（中点偏移）
function getEdgeLabelPos(
  fx: number, fy: number, tx: number, ty: number
): { x: number; y: number; angle: number } {
  const mx = (fx + tx) / 2;
  const my = (fy + ty) / 2;
  // 法向量偏移
  const dx = tx - fx, dy = ty - fy;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = -dy / len * 14;
  const ny = dx / len * 14;
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  return { x: mx + nx, y: my + ny, angle };
}

// 箭头marker SVG
function ArrowMarker({ id, color }: { id: string; color: string }) {
  return (
    <defs>
      <marker id={id} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
        <path d="M0,0 L0,6 L8,3 z" fill={color} />
      </marker>
    </defs>
  );
}

export default function ShortestPathVisualizer({
  graphNodes, graphEdges, source,
  currentStepType, currentStepData,
  algoType,
  totalSteps = 0, currentStepIndex = 0,
}: ShortestPathVisualizerProps) {

  // 计算节点状态
  const nodeStatus = useMemo((): Record<number, SpNodeStatus> => {
    const status: Record<number, SpNodeStatus> = {};
    for (const n of graphNodes) status[n.id] = 'idle';

    if (!currentStepData) return status;

    const dists: Record<number, number> = currentStepData.distances ?? {};
    const settled: number[] = currentStepData.settled ?? [];
    const inQueue: Record<number, boolean> = currentStepData.inQueue ?? {};
    const isNegCycle = currentStepType === 'spNegativeCycle';

    for (const n of graphNodes) {
      if (isNegCycle) { status[n.id] = 'negativeCycle'; continue; }
      if (settled.includes(n.id)) { status[n.id] = 'settled'; continue; }
      if (inQueue[n.id]) { status[n.id] = 'inQueue'; continue; }
      if (dists[n.id] === Infinity) { status[n.id] = 'unreachable'; continue; }
      status[n.id] = 'idle';
    }
    return status;
  }, [graphNodes, currentStepData, currentStepType]);

  // 当前松弛的边
  const relaxEdge = currentStepType === 'spRelax' ? currentStepData : null;

  // Floyd 距离矩阵
  const floydMatrix: number[][] | null =
    currentStepData?.distances && Array.isArray(currentStepData.distances[0])
      ? currentStepData.distances
      : null;

  // Floyd 当前 k/i/j
  const floydIdx = currentStepType.startsWith('spFloyd')
    ? { k: currentStepData.k, i: currentStepData.i, j: currentStepData.j }
    : { k: -1, i: -1, j: -1 };

  const isFloyd = algoType === 'floyd';
  const INF = Infinity;

  const nodeLabel = (id: number) =>
    graphNodes.find(n => n.id === id)?.label ?? String(id);

  const distStr = (v: number) => v === INF ? '∞' : String(v);

  const { status } = { status: nodeStatus };

  // 距离数组面板
  const dists: Record<number, number> = currentStepData?.distances ?? {};
  const queue: (string | number)[] = currentStepData?.queue ?? [];
  const inCount: Record<number, number> = currentStepData?.inCount ?? {};
  const round: number = currentStepData?.round ?? 0;
  const settled: number[] = currentStepData?.settled ?? [];

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-4 flex-1 overflow-hidden flex flex-col gap-3">
      <style>{`
        @keyframes pulse-orange {
          0%, 100% { filter: drop-shadow(0 0 4px #f97316); }
          50%       { filter: drop-shadow(0 0 12px #f97316); }
        }
        @keyframes negative-pulse {
          0%, 100% { filter: drop-shadow(0 0 4px #dc2626); }
          50%       { filter: drop-shadow(0 0 14px #dc2626); }
        }
        .relax-edge { animation: pulse-orange 0.6s ease-in-out infinite; }
        .negative-cycle { animation: negative-pulse 0.8s ease-in-out infinite; }
        @keyframes cell-flash {
          0%, 100% { background: rgba(251,191,36,0.2); }
          50%       { background: rgba(251,191,36,0.5); }
        }
        .floyd-cell-flash { animation: cell-flash 0.5s ease-in-out infinite; }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .slide-up { animation: slide-up 0.3s ease-out; }
      `}</style>

      {/* 顶部状态栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {round > 0 && !isFloyd && (
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              轮次 {round}/{graphNodes.length}
            </span>
          )}
          {isFloyd && floydIdx.k >= 0 && (
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              k = {graphNodes[floydIdx.k]?.label ?? floydIdx.k}
              {floydIdx.i >= 0 && `, i = ${graphNodes[floydIdx.i]?.label ?? floydIdx.i}`}
              {floydIdx.j >= 0 && `, j = ${graphNodes[floydIdx.j]?.label ?? floydIdx.j}`}
            </span>
          )}
          {currentStepType === 'spNegativeCycle' && (
            <span className="px-3 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/40 negative-cycle">
              ⚠️ 检测到负环！
            </span>
          )}
        </div>
        <div className="text-xs text-slate-500">
          {currentStepIndex + 1} / {totalSteps}
        </div>
      </div>

      {/* 主内容区：图 SVG + 侧边面板 */}
      <div className="flex gap-4 flex-1 min-h-0">

        {/* 左：图 SVG */}
        <div className="flex-1 min-w-0 overflow-x-auto">
          <svg width={SVG_W} height={SVG_H} className="block mx-auto" style={{ maxWidth: '100%' }}>
            <ArrowMarker id="arrow-normal" color="#64748b" />
            <ArrowMarker id="arrow-relax" color="#f97316" />
            <ArrowMarker id="arrow-spt" color="#22c55e" />

            {/* 边 */}
            {graphEdges.map((edge, idx) => {
              const fromNode = graphNodes.find(n => n.id === edge.from);
              const toNode = graphNodes.find(n => n.id === edge.to);
              if (!fromNode || !toNode) return null;
              const isRelax = relaxEdge && relaxEdge.from === edge.from && relaxEdge.to === edge.to;
              const isSpt = currentStepData?.predecessors
                && (currentStepData.predecessors as Record<number, number | null>)[edge.to] === edge.from
                && status[edge.from] === 'settled';
              const color = isRelax ? '#f97316' : isSpt ? '#22c55e' : '#475569';
              const strokeW = isRelax || isSpt ? 2.5 : 1.5;
              const marker = isRelax ? 'url(#arrow-relax)' : isSpt ? 'url(#arrow-spt)' : 'url(#arrow-normal)';

              const { x: mx, y: my } = getEdgeLabelPos(fromNode.x, fromNode.y, toNode.x, toNode.y);

              return (
                <g key={`edge-${idx}`} className={isRelax ? 'relax-edge' : ''}>
                  <line
                    x1={fromNode.x} y1={fromNode.y}
                    x2={toNode.x} y2={toNode.y}
                    stroke={color} strokeWidth={strokeW}
                    markerEnd={marker}
                  />
                  {/* 权值标签 */}
                  <g transform={`translate(${mx},${my})`}>
                    <rect x={-12} y={-9} width={24} height={18} rx={3}
                      fill="#0f172a" stroke={color} strokeWidth={1} />
                    <text x={0} y={4} textAnchor="middle" fill={color}
                      fontSize={10} fontWeight="bold" fontFamily="monospace">
                      {edge.weight}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* 节点 */}
            {graphNodes.map(node => {
              const s = nodeStatus[node.id] ?? 'idle';
              const isSrc = node.id === source && !isFloyd;
              const isSettled = s === 'settled';
              const isNeg = s === 'negativeCycle';
              const r = getNodeRadius(node.label);
              const bg = NODE_COLORS[s];
              const d = dists[node.id] ?? INF;
              const distLabel = distStr(d);

              return (
                <g key={`node-${node.id}`} className={isNeg ? 'negative-cycle' : ''}>
                  {/* 访问中/队列中高亮 */}
                  {(s === 'processing' || s === 'inQueue') && (
                    <circle cx={node.x} cy={node.y} r={r + 10}
                      fill="#f59e0b" opacity={0.15} className="animate-pulse" />
                  )}
                  {/* 已确定蓝色外圈 */}
                  {isSettled && (
                    <circle cx={node.x} cy={node.y} r={r + 6}
                      fill="none" stroke="#3b82f6" strokeWidth={2} opacity={0.5} />
                  )}
                  {/* 源点标记 */}
                  {isSrc && (
                    <circle cx={node.x} cy={node.y} r={r + 3}
                      fill="none" stroke="#fbbf24" strokeWidth={1.5} strokeDasharray="3 2" />
                  )}
                  {/* 节点本体 */}
                  <circle cx={node.x} cy={node.y} r={r}
                    fill={bg}
                    stroke={isSrc ? '#fbbf24' : isNeg ? '#dc2626' : '#fff'}
                    strokeWidth={isSrc ? 2 : 1.5}
                    className="transition-all duration-300"
                  />
                  {/* 节点标签 */}
                  <text x={node.x} y={node.y - 2} textAnchor="middle" dominantBaseline="central"
                    fill="white" fontSize={LABEL_FONT} fontWeight="bold">
                    {node.label}
                  </text>
                  {/* 距离标签 */}
                  <text x={node.x} y={node.y + r + 14} textAnchor="middle"
                    fill={isSettled ? '#60a5fa' : d === INF ? '#ef4444' : '#e2e8f0'}
                    fontSize={9} fontWeight="bold" fontFamily="monospace">
                    {distLabel}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* 右：数据面板 */}
        <div className="w-36 shrink-0 flex flex-col gap-2 text-xs overflow-y-auto">
          {/* 距离数组 */}
          {!isFloyd && (
            <div className="bg-slate-800/50 rounded-lg p-2 border border-slate-700">
              <div className="text-slate-400 font-semibold mb-1.5">📊 距离 dist[]</div>
              {graphNodes.map(n => (
                <div key={n.id} className={`flex justify-between items-center px-1.5 py-0.5 rounded slide-up ${
                  status[n.id] === 'settled' ? 'bg-blue-500/15 text-blue-300' :
                  status[n.id] === 'inQueue' ? 'bg-purple-500/15 text-purple-300' :
                  status[n.id] === 'negativeCycle' ? 'bg-red-500/15 text-red-300' :
                  'text-slate-300'
                }`}>
                  <span className="font-bold">{n.label}</span>
                  <span className="font-mono font-bold">{distStr(dists[n.id] ?? INF)}</span>
                </div>
              ))}
            </div>
          )}

          {/* 队列/优先队列 */}
          {!isFloyd && queue.length > 0 && (
            <div className="bg-slate-800/50 rounded-lg p-2 border border-slate-700">
              <div className="text-slate-400 font-semibold mb-1.5">
                {algoType === 'spfa' ? '📋 队列 Queue' : '🎯 优先队列 PQ'}
              </div>
              <div className="flex flex-wrap gap-1">
                {queue.map((q, i) => (
                  <span key={i} className={`px-1.5 py-0.5 rounded text-xs font-mono font-bold ${
                    algoType === 'spfa'
                      ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300'
                      : 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                  }`}>
                    {String(q)}
                  </span>
                ))}
                {queue.length === 0 && <span className="text-slate-600 italic">empty</span>}
              </div>
            </div>
          )}

          {/* SPFA 入队次数 */}
          {algoType === 'spfa' && Object.keys(inCount).length > 0 && (
            <div className="bg-slate-800/50 rounded-lg p-2 border border-slate-700">
              <div className="text-slate-400 font-semibold mb-1.5">🔢 入队次数</div>
              {graphNodes.map(n => inCount[n.id] > 0 && (
                <div key={n.id} className={`flex justify-between px-1.5 py-0.5 rounded ${
                  inCount[n.id] > graphNodes.length ? 'text-red-300' : 'text-slate-300'
                }`}>
                  <span className="font-bold">{n.label}</span>
                  <span className={`font-mono font-bold ${inCount[n.id] > graphNodes.length ? 'text-red-400 animate-pulse' : ''}`}>
                    {inCount[n.id]}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* 已确定节点 */}
          {!isFloyd && settled.length > 0 && (
            <div className="bg-slate-800/50 rounded-lg p-2 border border-slate-700">
              <div className="text-slate-400 font-semibold mb-1.5">✅ 已确定</div>
              <div className="flex flex-wrap gap-1">
                {settled.map(id => (
                  <span key={id} className="px-1.5 py-0.5 rounded bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs font-bold">
                    {nodeLabel(id)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floyd 距离矩阵 */}
      {isFloyd && floydMatrix && (
        <div className="overflow-x-auto">
          <div className="text-xs text-slate-400 font-semibold mb-1.5">📐 距离矩阵（k={floydIdx.k >= 0 ? graphNodes[floydIdx.k]?.label : '-'}）</div>
          <table className="text-xs border-collapse">
            <thead>
              <tr>
                <th className="px-1.5 py-1 text-slate-500 font-normal border border-slate-700 bg-slate-800/30"> </th>
                {graphNodes.map(n => (
                  <th key={n.id} className="px-1.5 py-1 text-slate-400 font-normal border border-slate-700 bg-slate-800/30 min-w-[36px]">
                    {n.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {floydMatrix.map((row, i) => (
                <tr key={i}>
                  <td className={`px-1.5 py-1 text-slate-400 font-bold border border-slate-700 bg-slate-800/30 ${
                    floydIdx.i === i ? 'text-yellow-400 bg-yellow-500/10' : ''
                  }`}>
                    {graphNodes[i]?.label}
                  </td>
                  {row.map((v, j) => {
                    const isFlash = floydIdx.i === i && floydIdx.j === j;
                    const isKRow = floydIdx.k === i;
                    const isKCol = floydIdx.k === j;
                    return (
                      <td key={j} className={`px-1.5 py-1 text-center border border-slate-700 font-mono font-bold ${
                        isFlash ? 'bg-amber-500/25 text-amber-300 floyd-cell-flash' :
                        isKRow || isKCol ? 'bg-cyan-500/10 text-cyan-300' :
                        v === INF ? 'text-slate-600' :
                        'text-slate-200'
                      }`}>
                        {distStr(v)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 图例 */}
      <div className="flex flex-wrap justify-center gap-3 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-slate-600 border border-slate-400" /> 未处理
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-amber-500 border border-amber-400" /> 处理中
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-purple-500 border border-purple-400" /> 队列中
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-blue-500 border border-blue-400" /> 已确定
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-orange-500 border border-orange-400" /> 正在松弛
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-green-600 border border-green-400" /> 最短路径树
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-red-600 border border-red-400" /> 负环
        </span>
      </div>
    </div>
  );
}
