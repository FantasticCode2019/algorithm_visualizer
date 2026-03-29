import { useMemo } from 'react';
import { TreeNode, NodeColor } from '../../types';

interface RBTreeVisualizerProps {
  root: TreeNode | null;
  activeNodeId: number | null;
  foundNodeId: number | null;
  markedNodeIds: number[];
  insertNodeId: number | null;
  comparedNodeId: number | null;
  comparedDirection: 'left' | 'right' | null;
  nodeColors: Record<number, NodeColor>;
  rotatingNodeIds: number[];
  recoloringNodeIds: number[];
  balanceFactors?: Record<number, number>;
  rotateDirection: 'LL' | 'RR' | 'LR' | 'RL' | null;
  // 额外：黑高信息
  blackHeights?: Record<number, number>;
  // 额外：DB(Double Black)修复节点
  dbNodeId?: number | null;
}

const NODE_RADIUS = 22;

const RB_BG: Record<NodeColor, string> = {
  red:   '#dc2626',
  black: '#1e293b',
};

const NODE_STROKE: Record<NodeColor, string> = {
  red:   '#fca5a5',
  black: '#475569',
};

// 旋转提示文字
const ROTATE_HINT: Record<string, string> = {
  LL: '右旋（LL 型）',
  RR: '左旋（RR 型）',
  LR: '右旋+左旋（LR 型）',
  RL: '左旋+右旋（RL 型）',
};

function collectNodes(root: TreeNode | null): TreeNode[] {
  if (!root) return [];
  const result: TreeNode[] = [];
  const queue: TreeNode[] = [root];
  while (queue.length) {
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
  const LEVEL_H = 70;
  const levels: TreeNode[][] = [];
  const queue: { node: TreeNode; depth: number }[] = [{ node: root, depth: 0 }];
  while (queue.length) {
    const { node, depth } = queue.shift()!;
    if (!levels[depth]) levels[depth] = [];
    levels[depth].push(node);
    if (node.left) queue.push({ node: node.left, depth: depth + 1 });
    if (node.right) queue.push({ node: node.right, depth: depth + 1 });
  }
  levels.forEach((levelNodes, depth) => {
    const y = 30 + depth * LEVEL_H;
    const total = (levelNodes.length - 1) * 70;
    const startX = (svgWidth - total) / 2;
    levelNodes.forEach((node, i) => {
      const x = startX + i * 70;
      positions.set(node.id, { x, y });
      node.x = x;
      node.y = y;
    });
  });
  return positions;
}

export default function RBTreeVisualizer({
  root, activeNodeId, foundNodeId, markedNodeIds,
  insertNodeId, comparedNodeId, comparedDirection,
  nodeColors, rotatingNodeIds = [], recoloringNodeIds = [],
  rotateDirection, blackHeights,
  dbNodeId,
}: RBTreeVisualizerProps) {

  const nodes = useMemo(() => collectNodes(root), [root]);
  const positions = useMemo(() => {
    if (!root) return new Map();
    return computeLayout(root, 640);
  }, [root]);

  const svgWidth = 640;
  const svgHeight = nodes.length > 0 ? Math.max(...nodes.map(n => n.y ?? 0)) + 90 : 200;

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
          0%   { opacity: 0.9; stroke-width: 2.5; }
          50%  { opacity: 0.3; stroke-width: 4; }
          100% { opacity: 0.9; stroke-width: 2.5; }
        }
        @keyframes db-pulse {
          0%, 100% { filter: drop-shadow(0 0 4px #a855f7); }
          50%       { filter: drop-shadow(0 0 12px #a855f7); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes node-enter {
          0%   { opacity: 0; transform: scale(0.5); }
          70%  { transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }
        .rb-rotate-ring {
          transform-origin: center;
          animation: spin-slow 1.2s linear infinite;
        }
        .rb-dash-anim {
          animation: dash-rotate 0.8s linear infinite;
        }
        .rb-pulse-anim {
          animation: pulse-ring 0.9s ease-out infinite;
        }
        .rb-recolor-anim {
          animation: recolor-ring 0.6s ease-in-out infinite;
        }
        .rb-db-anim {
          animation: db-pulse 1s ease-in-out infinite;
        }
        .rb-node-enter {
          animation: node-enter 0.4s ease-out forwards;
        }
      `}</style>

      {/* 旋转方向提示条 */}
      {rotateDirection && (
        <div className="flex justify-center mb-3">
          <span className="inline-flex items-center gap-2 text-sm font-bold px-4 py-1.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/40">
            🔄 {ROTATE_HINT[rotateDirection] ?? rotateDirection} 旋转
          </span>
        </div>
      )}

      {nodes.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
          暂无树数据，请点击播放演示
        </div>
      ) : (
        <svg width={svgWidth} height={svgHeight} className="mx-auto" style={{ maxWidth: '100%' }}>
          {/* 边 */}
          {edges.map((e, i) => (
            <line key={i} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
              stroke="#334155" strokeWidth={1.8} />
          ))}

          {nodes.map(node => {
            const pos = positions.get(node.id);
            if (!pos) return null;
            const color: NodeColor = nodeColors[node.id] ?? node.color ?? 'black';
            const isRed = color === 'red';
            const bg = RB_BG[color];

            const isFound   = foundNodeId === node.id;
            const isActive  = activeNodeId === node.id;
            const isInsert  = insertNodeId === node.id;
            const isRotating = rotatingNodeIds.includes(node.id);
            const isRecoloring = recoloringNodeIds.includes(node.id);
            const isDB = dbNodeId === node.id;
            const isCompared = comparedNodeId === node.id;
            const isMarked = markedNodeIds.includes(node.id);

            const isHighlight = isFound || isActive || isInsert || isCompared || isDB;

            return (
              <g key={node.id}>
                {/* 高亮光晕 */}
                {isHighlight && !isRotating && (
                  <circle cx={pos.x} cy={pos.y} r={NODE_RADIUS + 8}
                    fill={isFound ? '#22c55e' : isDB ? '#a855f7' : isActive ? '#f59e0b' : '#3b82f6'}
                    opacity={0.2} />
                )}

                {/* 旋转外圈 */}
                {isRotating && (
                  <g className="rb-rotate-ring">
                    <circle cx={pos.x} cy={pos.y} r={NODE_RADIUS + 10}
                      fill="none" stroke="#facc15" strokeWidth={3}
                      strokeDasharray="7 3" className="rb-dash-anim" />
                    <circle cx={pos.x} cy={pos.y} r={NODE_RADIUS + 16}
                      fill="none" stroke="#facc15" strokeWidth={1.5}
                      strokeDasharray="4 5" className="rb-dash-anim"
                      style={{ animationDirection: 'reverse', animationDuration: '0.6s' }} />
                  </g>
                )}

                {/* 变色动画外圈 */}
                {isRecoloring && (
                  <circle cx={pos.x} cy={pos.y} r={NODE_RADIUS + 8}
                    fill="none" stroke="#22d3ee" strokeWidth={3}
                    className="rb-recolor-anim" />
                )}

                {/* DB(Double Black)特效 */}
                {isDB && (
                  <circle cx={pos.x} cy={pos.y} r={NODE_RADIUS + 12}
                    fill="none" stroke="#a855f7" strokeWidth={3}
                    className="rb-db-anim" />
                )}

                {/* 找到节点外圈动画 */}
                {isFound && (
                  <circle cx={pos.x} cy={pos.y} r={NODE_RADIUS + 6}
                    fill="#22c55e" opacity={0.2}
                    className="rb-pulse-anim" />
                )}

                {/* 节点本体 */}
                <circle
                  cx={pos.x} cy={pos.y} r={NODE_RADIUS}
                  fill={bg}
                  stroke={isHighlight ? '#ffffff' : NODE_STROKE[color]}
                  strokeWidth={isHighlight ? 2.5 : 2}
                  className={isRotating ? 'drop-shadow-[0_0_8px_#facc15]' : isDB ? 'drop-shadow-[0_0_8px_#a855f7]' : ''}
                />

                {/* 节点值 */}
                <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central"
                  fill="white" fontSize={13} fontWeight="bold"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                  {node.value}
                </text>

                {/* 红黑颜色标签 */}
                <text
                  x={pos.x}
                  y={pos.y + NODE_RADIUS + 10}
                  textAnchor="middle"
                  fill={isRed ? '#f87171' : '#94a3b8'}
                  fontSize={10}
                  fontWeight="bold">
                  {isRed ? '红' : '黑'}
                </text>

                {/* 黑高标签 */}
                {blackHeights && blackHeights[node.id] !== undefined && (
                  <text
                    x={pos.x + NODE_RADIUS + 5}
                    y={pos.y - NODE_RADIUS - 3}
                    textAnchor="start"
                    fill="#fbbf24"
                    fontSize={9}
                    fontWeight="bold">
                    BH:{blackHeights[node.id]}
                  </text>
                )}

                {/* 比较方向 */}
                {isCompared && comparedDirection && (
                  <text
                    x={pos.x + (comparedDirection === 'left' ? -NODE_RADIUS - 6 : NODE_RADIUS + 6)}
                    y={pos.y}
                    textAnchor="middle" dominantBaseline="central"
                    fill="#f59e0b" fontSize={12} fontWeight="bold">
                    {comparedDirection === 'left' ? '←' : '→'}
                  </text>
                )}

                {/* 已访问标记点 */}
                {isMarked && !isFound && (
                  <circle cx={pos.x + NODE_RADIUS - 3} cy={pos.y - NODE_RADIUS + 3}
                    r={4} fill="#a855f7" />
                )}
              </g>
            );
          })}
        </svg>
      )}

      {/* 图例 */}
      <div className="flex flex-wrap justify-center mt-3 gap-x-6 gap-y-1 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-red-600 border-2 border-red-300" />
          红色节点
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-slate-800 border-2 border-slate-500" />
          黑色节点
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-green-500/30 border border-green-400" />
          找到节点
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-yellow-500/30 border border-yellow-400" />
          旋转中
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-cyan-500/30 border border-cyan-400" />
          变色中
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-purple-500/30 border border-purple-400" />
          DB修复中
        </span>
      </div>

      {/* 红黑树五项性质说明 */}
      <div className="mt-2 text-center text-xs text-slate-500">
        红黑树性质：①根为黑 ②红节点孩子为黑 ③每条路径黑高相同 ④叶子(NIL)为黑 ⑤最长路径≤2×最短
      </div>
    </div>
  );
}
