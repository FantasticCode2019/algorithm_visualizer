import { useMemo } from 'react';
import { TreeNode, NodeColor } from '../../types';

export type NodeState = 'idle' | 'visiting' | 'found' | 'marked' | 'inserting' | 'comparing-left' | 'comparing-right' | 'rotating' | 'recoloring';

interface TreeVisualizerProps {
  root: TreeNode | null;
  activeNodeId: number | null;
  foundNodeId: number | null;
  markedNodeIds: number[];
  insertNodeId: number | null;
  comparedNodeId: number | null;
  comparedDirection: 'left' | 'right' | null;
  // 扩展：节点颜色（用于红黑树）
  nodeColors?: Record<number, NodeColor>;
  // 扩展：旋转中/变色中的节点
  rotatingNodeIds?: number[];
  recoloringNodeIds?: number[];
  // 扩展：平衡因子显示
  balanceFactors?: Record<number, number>;
  // 当前旋转方向
  rotateDirection?: 'LL' | 'RR' | 'LR' | 'RL' | null;
}

const NODE_RADIUS = 20;

const COLORS: Record<NodeState, string> = {
  idle:            '#3b82f6',
  visiting:        '#f59e0b',
  found:           '#22c55e',
  marked:          '#a855f7',
  inserting:       '#f97316',
  'comparing-left': '#ef4444',
  'comparing-right': '#ef4444',
  rotating:        '#eab308',   // 黄色 - 旋转中
  recoloring:      '#06b6d4',   // 青色 - 变色中
};

const RB_COLORS: Record<NodeColor, string> = {
  red:   '#ef4444',
  black: '#1e293b',
};

function getNodeState(
  nodeId: number,
  activeNodeId: number | null,
  foundNodeId: number | null,
  markedNodeIds: number[],
  insertNodeId: number | null,
  comparedNodeId: number | null,
  rotatingNodeIds: number[],
  recoloringNodeIds: number[],
): NodeState {
  if (foundNodeId === nodeId) return 'found';
  if (insertNodeId === nodeId) return 'inserting';
  if (rotatingNodeIds.includes(nodeId)) return 'rotating';
  if (recoloringNodeIds.includes(nodeId)) return 'recoloring';
  if (activeNodeId === nodeId) return 'visiting';
  if (comparedNodeId === nodeId) {
    const comparedDirection = null; // 方向由父组件决定
    return comparedDirection === 'left' ? 'comparing-left' : 'comparing-right';
  }
  if (markedNodeIds.includes(nodeId)) return 'marked';
  return 'idle';
}

function collectNodes(root: TreeNode | null): TreeNode[] {
  if (!root) return [];
  const result: TreeNode[] = [];
  const queue: TreeNode[] = [root];
  while (queue.length > 0) {
    const n = queue.shift()!;
    result.push(n);
    if (n.left) queue.push(n.left);
    if (n.right) queue.push(n.right);
  }
  return result;
}

function computeLayout(root: TreeNode | null, svgWidth: number): Map<number, { x: number; y: number }> {
  const positions = new Map<number, { x: number; y: number }>();
  if (!root) return positions;
  const LEVEL_HEIGHT = 65;
  const levels: TreeNode[][] = [];
  const queue: { node: TreeNode; depth: number }[] = [{ node: root, depth: 0 }];
  while (queue.length > 0) {
    const { node, depth } = queue.shift()!;
    if (!levels[depth]) levels[depth] = [];
    levels[depth].push(node);
    if (node.left) queue.push({ node: node.left, depth: depth + 1 });
    if (node.right) queue.push({ node: node.right, depth: depth + 1 });
  }
  levels.forEach((levelNodes, depth) => {
    const y = 30 + depth * LEVEL_HEIGHT;
    const totalWidth = (levelNodes.length - 1) * 65;
    const startX = (svgWidth - totalWidth) / 2;
    levelNodes.forEach((node, i) => {
      const x = startX + i * 65;
      positions.set(node.id, { x, y });
      node.x = x;
      node.y = y;
    });
  });
  return positions;
}

export default function TreeVisualizer({
  root, activeNodeId, foundNodeId, markedNodeIds,
  insertNodeId, comparedNodeId, comparedDirection,
  nodeColors = {}, balanceFactors = {},
  rotatingNodeIds = [], recoloringNodeIds = [],
  rotateDirection,
}: TreeVisualizerProps) {
  const nodes = useMemo(() => collectNodes(root), [root]);
  const positions = useMemo(() => {
    if (!root) return new Map();
    return computeLayout(root, 560);
  }, [root]);

  const svgWidth = 560;
  const svgHeight = nodes.length > 0 ? Math.max(...nodes.map(n => n.y ?? 0)) + 80 : 200;

  const edges = useMemo(() => {
    const result: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (const node of nodes) {
      if (node.left && positions.has(node.left.id)) {
        const p1 = positions.get(node.id)!;
        const p2 = positions.get(node.left.id)!;
        result.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
      }
      if (node.right && positions.has(node.right.id)) {
        const p1 = positions.get(node.id)!;
        const p2 = positions.get(node.right.id)!;
        result.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
      }
    }
    return result;
  }, [nodes, positions]);

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-4 flex-1 overflow-hidden">
      <style>{`
        @keyframes dash-rotate {
          from { stroke-dashoffset: 0; }
          to   { stroke-dashoffset: 24; }
        }
        @keyframes pulse-ring {
          0%   { opacity: 1; r: 28; }
          100% { opacity: 0; r: 42; }
        }
        @keyframes recolor-ring {
          0%   { opacity: 0.9; stroke-width: 2; }
          50%  { opacity: 0.4; stroke-width: 3; }
          100% { opacity: 0.9; stroke-width: 2; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .rotate-ring {
          transform-origin: center;
          animation: spin-slow 1.2s linear infinite;
        }
        .dash-anim {
          animation: dash-rotate 0.8s linear infinite;
        }
        .pulse-anim {
          animation: pulse-ring 0.9s ease-out infinite;
        }
        .recolor-anim {
          animation: recolor-ring 0.6s ease-in-out infinite;
        }
      `}</style>

      {/* 旋转方向提示 */}
      {rotateDirection && (
        <div className="flex justify-center mb-2">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 animate-pulse">
            🔄 执行 {rotateDirection} 旋转
          </span>
        </div>
      )}

      {nodes.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
          暂无树数据
        </div>
      ) : (
        <svg width={svgWidth} height={svgHeight} className="mx-auto" style={{ maxWidth: '100%' }}>
          {edges.map((edge, i) => (
            <line
              key={i}
              x1={edge.x1} y1={edge.y1}
              x2={edge.x2} y2={edge.y2}
              stroke="#475569"
              strokeWidth={1.5}
            />
          ))}

          {nodes.map(node => {
            const pos = positions.get(node.id);
            if (!pos) return null;

            const isRB = Object.keys(nodeColors).length > 0 || node.color;
            const color = isRB ? (nodeColors[node.id] ?? node.color ?? 'black') : null;

            const state = getNodeState(
              node.id, activeNodeId, foundNodeId, markedNodeIds,
              insertNodeId, comparedNodeId,
              rotatingNodeIds, recoloringNodeIds,
            );

            const isHighlighted = state !== 'idle' && state !== 'marked';
            const bgColor = isRB
              ? RB_COLORS[color as NodeColor] ?? RB_COLORS.black
              : COLORS[state];

            return (
              <g key={node.id}>
                {/* 高亮外圈 */}
                {isHighlighted && (
                  <circle cx={pos.x} cy={pos.y} r={NODE_RADIUS + 5}
                    fill={bgColor} opacity={0.25} />
                )}
                {/* 旋转外圈动画：旋转虚线圆环 */}
                {rotatingNodeIds.includes(node.id) && (
                  <g className="rotate-ring">
                    <circle cx={pos.x} cy={pos.y} r={NODE_RADIUS + 8}
                      fill="none" stroke="#facc15" strokeWidth={2.5}
                      strokeDasharray="6 3" className="dash-anim" />
                    <circle cx={pos.x} cy={pos.y} r={NODE_RADIUS + 14}
                      fill="none" stroke="#facc15" strokeWidth={1.5}
                      strokeDasharray="3 5" className="dash-anim" style={{ animationDirection: 'reverse', animationDuration: '0.6s' }} />
                  </g>
                )}
                {/* 变色外圈动画 */}
                {recoloringNodeIds.includes(node.id) && (
                  <circle cx={pos.x} cy={pos.y} r={NODE_RADIUS + 6}
                    fill="none" stroke="#22d3ee" strokeWidth={2.5}
                    className="recolor-anim" />
                )}
                {/* 节点圆 */}
                <circle
                  cx={pos.x} cy={pos.y} r={NODE_RADIUS}
                  fill={bgColor}
                  stroke={isHighlighted ? '#fff' : (isRB ? '#fff' : '#1e293b')}
                  strokeWidth={isHighlighted ? 2 : (isRB ? 1.5 : 1)}
                  className={`transition-all duration-300 ${rotatingNodeIds.includes(node.id) ? 'drop-shadow-[0_0_6px_#facc15]' : ''}`}
                />
                {/* 节点内高亮闪烁 */}
                {rotatingNodeIds.includes(node.id) && (
                  <circle cx={pos.x} cy={pos.y} r={NODE_RADIUS + 4}
                    fill="#facc15" opacity={0.15} className="pulse-anim" />
                )}
                {/* 节点值 */}
                <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central"
                  fill="white" fontSize={13} fontWeight="bold"
                  className="select-none pointer-events-none">
                  {node.value}
                </text>
                {/* 红黑树颜色标签 */}
                {isRB && (
                  <text x={pos.x} y={pos.y + NODE_RADIUS + 10}
                    textAnchor="middle" fill={color === 'red' ? '#f87171' : '#94a3b8'}
                    fontSize={9} fontWeight="bold">
                    {color === 'red' ? 'R' : 'B'}
                  </text>
                )}
                {/* 平衡因子 */}
                {balanceFactors[node.id] !== undefined && (
                  <text
                    x={pos.x + NODE_RADIUS + 4} y={pos.y - NODE_RADIUS - 2}
                    textAnchor="start" fill="#f59e0b" fontSize={9} fontWeight="bold">
                    BF:{balanceFactors[node.id]}
                  </text>
                )}
                {/* 比较方向 */}
                {comparedNodeId === node.id && comparedDirection && (
                  <text
                    x={pos.x + (comparedDirection === 'left' ? -NODE_RADIUS - 5 : NODE_RADIUS + 5)}
                    y={pos.y} textAnchor="middle" dominantBaseline="central"
                    fill="#f59e0b" fontSize={11} fontWeight="bold">
                    {comparedDirection === 'left' ? 'L' : 'R'}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      )}

      {/* 图例 */}
      <div className="flex justify-center mt-3 gap-3 flex-wrap text-xs text-slate-400">
        {Object.keys(nodeColors).length > 0 ? (
          <>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 border border-white/30" /> 红</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-slate-800 border border-white/30" /> 黑</span>
          </>
        ) : (
          <>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded" /> 默认</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-amber-500 rounded" /> 访问中</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded" /> 比较中</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-purple-500 rounded" /> 已访问</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded" /> 找到</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-500 rounded" /> 旋转中</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-cyan-500 rounded" /> 变色中</span>
          </>
        )}
      </div>
    </div>
  );
}
