import { useMemo } from 'react';
import { GraphNode, GraphEdge } from '../../types';

interface MSTVisualizerProps {
  graphNodes: GraphNode[];
  graphEdges: GraphEdge[];
  currentStepData: Record<string, any>;
  algoType: 'prim' | 'kruskal';
  totalSteps?: number;
  currentStepIndex?: number;
}

const SVG_W = 560;
const SVG_H = 380;
const NODE_R = 22;
const LABEL_FONT = 12;

// 节点颜色
const NODE_COLORS: Record<string, string> = {
  idle: '#475569',
  inMst: '#22c55e',
  processing: '#f59e0b',
};

// 边颜色
const EDGE_COLORS: Record<string, string> = {
  pending: '#475569',
  considering: '#f97316',
  inMst: '#22c55e',
  skipped: '#ef4444',
};

function getNodeRadius(label: string): number {
  return label.length <= 1 ? NODE_R : NODE_R + (label.length - 1) * 3;
}

function getEdgeLabelPos(
  fx: number, fy: number, tx: number, ty: number
): { x: number; y: number } {
  const mx = (fx + tx) / 2;
  const my = (fy + ty) / 2;
  const dx = tx - fx, dy = ty - fy;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = -dy / len * 16;
  const ny = dx / len * 16;
  return { x: mx + nx, y: my + ny };
}

// 无向边不画箭头，用 marker 画圆点
function DotMarker({ id, color }: { id: string; color: string }) {
  return (
    <defs>
      <marker id={id} markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
        <circle cx="3" cy="3" r="2.5" fill={color} />
      </marker>
    </defs>
  );
}

export default function MSTVisualizer({
  graphNodes, graphEdges,
  currentStepData,
  algoType,
  totalSteps = 0, currentStepIndex = 0,
}: MSTVisualizerProps) {

  // 计算节点状态
  const nodeStatus = useMemo((): Record<number, string> => {
    const status: Record<number, string> = {};
    for (const n of graphNodes) status[n.id] = 'idle';

    if (!currentStepData) return status;

    const inMst: number[] = currentStepData.inMst ?? [];
    const nodeId: number | undefined = currentStepData.nodeId;

    for (const n of graphNodes) {
      if (inMst.includes(n.id)) {
        status[n.id] = 'inMst';
      } else if (nodeId !== undefined && n.id === nodeId) {
        status[n.id] = 'processing';
      } else {
        status[n.id] = 'idle';
      }
    }
    return status;
  }, [graphNodes, currentStepData]);

  // 计算边状态
  const edgeStatus = useMemo((): Record<string, string> => {
    const status: Record<string, string> = {};
    for (const e of graphEdges) {
      const key = `${Math.min(e.from, e.to)}-${Math.max(e.from, e.to)}`;
      status[key] = 'pending';
    }

    if (!currentStepData) return status;

    const mstEdges: Array<{ from: number; to: number }> = currentStepData.mstEdges ?? [];
    const from = currentStepData.from;
    const to = currentStepData.to;
    const reason = currentStepData.reason;

    // 已加入 MST 的边
    for (const e of mstEdges) {
      const key = `${Math.min(e.from, e.to)}-${Math.max(e.from, e.to)}`;
      status[key] = 'inMst';
    }

    // 当前正在考察的边
    if (from !== undefined && to !== undefined) {
      const key = `${Math.min(from, to)}-${Math.max(from, to)}`;
      if (reason !== undefined) {
        status[key] = 'skipped';
      } else {
        status[key] = 'considering';
      }
    }

    return status;
  }, [graphEdges, currentStepData]);

  const nodeLabel = (id: number) =>
    graphNodes.find(n => n.id === id)?.label ?? String(id);

  const totalWeight: number = currentStepData?.totalWeight ?? 0;

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-4 flex-1 overflow-hidden flex flex-col gap-3">
      <style>{`
        @keyframes pulse-orange {
          0%, 100% { filter: drop-shadow(0 0 4px #f97316); }
          50%       { filter: drop-shadow(0 0 12px #f97316); }
        }
        @keyframes pulse-green {
          0%, 100% { filter: drop-shadow(0 0 4px #22c55e); }
          50%       { filter: drop-shadow(0 0 10px #22c55e); }
        }
        .edge-considering { animation: pulse-orange 0.6s ease-in-out infinite; }
        .edge-in-mst { animation: pulse-green 0.8s ease-in-out infinite; }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .slide-up { animation: slide-up 0.3s ease-out; }
      `}</style>

      {/* 顶部状态栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            {algoType === 'prim' ? 'Prim 算法' : 'Kruskal 算法'}
          </span>
          {currentStepData?.message && (
            <span className="text-xs text-slate-300">{currentStepData.message}</span>
          )}
        </div>
        <div className="text-xs text-slate-500">
          {currentStepIndex + 1} / {totalSteps}
          {totalWeight > 0 && (
            <span className="ml-3 text-emerald-400 font-bold">
              总权值: {totalWeight}
            </span>
          )}
        </div>
      </div>

      {/* 主内容区：图 SVG + 侧边面板 */}
      <div className="flex gap-4 flex-1 min-h-0">

        {/* 左：图 SVG */}
        <div className="flex-1 min-w-0 overflow-x-auto">
          <svg width={SVG_W} height={SVG_H} className="block mx-auto" style={{ maxWidth: '100%' }}>
            <DotMarker id="dot-pending" color="#475569" />
            <DotMarker id="dot-considering" color="#f97316" />
            <DotMarker id="dot-inmst" color="#22c55e" />
            <DotMarker id="dot-skipped" color="#ef4444" />
            <DotMarker id="dot-normal" color="#94a3b8" />

            {/* 边 */}
            {graphEdges.map((edge, idx) => {
              const fromNode = graphNodes.find(n => n.id === edge.from);
              const toNode = graphNodes.find(n => n.id === edge.to);
              if (!fromNode || !toNode) return null;
              const key = `${Math.min(edge.from, edge.to)}-${Math.max(edge.from, edge.to)}`;
              const es = edgeStatus[key] ?? 'pending';
              const color = EDGE_COLORS[es] ?? '#475569';
              const isAnim = es === 'considering';
              const marker = `url(#dot-${es === 'pending' ? 'normal' : es})`;

              const { x: mx, y: my } = getEdgeLabelPos(fromNode.x, fromNode.y, toNode.x, toNode.y);

              return (
                <g key={`edge-${idx}`} className={isAnim ? 'edge-considering' : es === 'inMst' ? 'edge-in-mst' : ''}>
                  <line
                    x1={fromNode.x} y1={fromNode.y}
                    x2={toNode.x} y2={toNode.y}
                    stroke={color} strokeWidth={es === 'inMst' || es === 'considering' ? 2.5 : 1.5}
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
              const bg = NODE_COLORS[s] ?? '#475569';
              const r = getNodeRadius(node.label);
              const isInMst = s === 'inMst';
              const isProcessing = s === 'processing';

              return (
                <g key={`node-${node.id}`}>
                  {/* 高亮光环 */}
                  {isProcessing && (
                    <circle cx={node.x} cy={node.y} r={r + 10}
                      fill="#f59e0b" opacity={0.15} className="animate-pulse" />
                  )}
                  {isInMst && (
                    <circle cx={node.x} cy={node.y} r={r + 6}
                      fill="none" stroke="#22c55e" strokeWidth={2} opacity={0.5} />
                  )}
                  {/* 节点本体 */}
                  <circle cx={node.x} cy={node.y} r={r}
                    fill={bg}
                    stroke={isInMst ? '#4ade80' : isProcessing ? '#fbbf24' : '#fff'}
                    strokeWidth={isInMst || isProcessing ? 2 : 1.5}
                    className="transition-all duration-300"
                  />
                  {/* 节点标签 */}
                  <text x={node.x} y={node.y - 2} textAnchor="middle" dominantBaseline="central"
                    fill="white" fontSize={LABEL_FONT} fontWeight="bold">
                    {node.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* 右：数据面板 */}
        <div className="w-40 shrink-0 flex flex-col gap-2 text-xs overflow-y-auto">

          {/* MST 节点 */}
          {currentStepData?.inMst && currentStepData.inMst.length > 0 && (
            <div className="bg-slate-800/50 rounded-lg p-2 border border-slate-700">
              <div className="text-slate-400 font-semibold mb-1.5">🌲 MST 节点</div>
              <div className="flex flex-wrap gap-1">
                {(currentStepData.inMst as number[]).map(id => (
                  <span key={id} className="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                    {nodeLabel(id)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* MST 边 */}
          {currentStepData?.mstEdges && (currentStepData.mstEdges as Array<{ from: number; to: number; weight: number }>).length > 0 && (
            <div className="bg-slate-800/50 rounded-lg p-2 border border-slate-700">
              <div className="text-slate-400 font-semibold mb-1.5">🔗 MST 边</div>
              {(currentStepData.mstEdges as Array<{ from: number; to: number; weight: number }>).map((e, i) => (
                <div key={i} className="flex justify-between items-center px-1.5 py-0.5 rounded text-emerald-300">
                  <span>{nodeLabel(e.from)}-{nodeLabel(e.to)}</span>
                  <span className="font-mono font-bold">{e.weight}</span>
                </div>
              ))}
              <div className="mt-1 pt-1 border-t border-slate-600 flex justify-between text-emerald-400 font-bold">
                <span>总计</span>
                <span className="font-mono">{currentStepData.totalWeight ?? 0}</span>
              </div>
            </div>
          )}

          {/* key[] 数组（Prim） */}
          {algoType === 'prim' && currentStepData?.key && (
            <div className="bg-slate-800/50 rounded-lg p-2 border border-slate-700">
              <div className="text-slate-400 font-semibold mb-1.5">📊 key[]</div>
              {graphNodes.map(n => {
                const k = currentStepData.key[n.id];
                const display = k === Infinity ? '∞' : k;
                const inMst = currentStepData.inMst?.includes(n.id);
                return (
                  <div key={n.id} className={`flex justify-between items-center px-1.5 py-0.5 rounded slide-up ${
                    inMst ? 'bg-emerald-500/15 text-emerald-300' : 'text-slate-300'
                  }`}>
                    <span className="font-bold">{n.label}</span>
                    <span className={`font-mono font-bold ${inMst ? 'text-emerald-400' : ''}`}>{display}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* parent[] 数组 */}
          {currentStepData?.parent && (
            <div className="bg-slate-800/50 rounded-lg p-2 border border-slate-700">
              <div className="text-slate-400 font-semibold mb-1.5">👨‍👩‍👧 parent[]</div>
              {graphNodes.map(n => {
                const p = currentStepData.parent[n.id];
                const display = p === null || p === undefined ? '-' : nodeLabel(Number(p));
                return (
                  <div key={n.id} className="flex justify-between items-center px-1.5 py-0.5 rounded text-slate-300">
                    <span className="font-bold">{n.label}</span>
                    <span className="font-mono font-bold">{display}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* rank[]（Kruskal） */}
          {currentStepData?.rank && (
            <div className="bg-slate-800/50 rounded-lg p-2 border border-slate-700">
              <div className="text-slate-400 font-semibold mb-1.5">⚖️ rank[]</div>
              {graphNodes.map(n => (
                <div key={n.id} className="flex justify-between items-center px-1.5 py-0.5 rounded text-slate-300">
                  <span className="font-bold">{n.label}</span>
                  <span className="font-mono font-bold">{currentStepData.rank[n.id] ?? 0}</span>
                </div>
              ))}
            </div>
          )}

          {/* sortedEdges（Kruskal） */}
          {currentStepData?.sortedEdges && Array.isArray(currentStepData.sortedEdges) && currentStepData.sortedEdges.length > 0 && (
            <div className="bg-slate-800/50 rounded-lg p-2 border border-slate-700">
              <div className="text-slate-400 font-semibold mb-1.5">📋 已排序边</div>
              {currentStepData.sortedEdges.map((e: { from: number; to: number; weight: number }, i: number) => (
                <div key={i} className="flex justify-between items-center px-1.5 py-0.5 rounded text-slate-300">
                  <span>{nodeLabel(e.from)}-{nodeLabel(e.to)}</span>
                  <span className="font-mono font-bold">{e.weight}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 图例 */}
      <div className="flex flex-wrap justify-center gap-3 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-slate-600 border border-slate-400" /> 未加入 MST
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border border-emerald-400" /> 已加入 MST
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-amber-500 border border-amber-400" /> 正在考察
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-slate-500 border border-slate-400" /> 待考察
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-red-500 border border-red-400" /> 成环跳过
        </span>
      </div>
    </div>
  );
}
