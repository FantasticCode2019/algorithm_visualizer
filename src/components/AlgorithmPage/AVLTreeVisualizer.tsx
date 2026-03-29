import { useMemo } from 'react';
import { TreeNode } from '../../types';

interface AVLTreeVisualizerProps {
  root: TreeNode | null;
  activeNodeId: number | null;
  foundNodeId: number | null;
  markedNodeIds: number[];
  insertNodeId: number | null;
  comparedNodeId: number | null;
  comparedDirection: 'left' | 'right' | null;
  nodeColors?: Record<number, unknown>;
  rotatingNodeIds: number[];
  recoloringNodeIds?: number[];
  balanceFactors?: Record<number, number>;
  rotateDirection: 'LL' | 'RR' | 'LR' | 'RL' | null;
  // AVL 特有：节点高度
  nodeHeights?: Record<number, number>;
  // AVL 特有：失衡节点
  imbalancedNodeId?: number | null;
}

const NODE_RADIUS = 22;

// AVL 节点背景色
const AVL_BG = '#1e3a5f';

const ROTATE_HINT: Record<string, string> = {
  LL: '右旋（Left-Left）',
  RR: '左旋（Right-Right）',
  LR: '左旋 + 右旋（Left-Right）',
  RL: '右旋 + 左旋（Right-Left）',
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
    const total = (levelNodes.length - 1) * 72;
    const startX = (svgWidth - total) / 2;
    levelNodes.forEach((node, i) => {
      const x = startX + i * 72;
      positions.set(node.id, { x, y });
      node.x = x;
      node.y = y;
    });
  });
  return positions;
}

export default function AVLTreeVisualizer({
  root, activeNodeId, foundNodeId, markedNodeIds,
  insertNodeId, comparedNodeId, comparedDirection,
  rotatingNodeIds = [], balanceFactors = {},
  rotateDirection, nodeHeights = {},
  imbalancedNodeId,
}: AVLTreeVisualizerProps) {

  const nodes = useMemo(() => collectNodes(root), [root]);
  const positions = useMemo(() => {
    if (!root) return new Map();
    return computeLayout(root, 640);
  }, [root]);

  const svgWidth = 640;
  const svgHeight = nodes.length > 0 ? Math.max(...nodes.map(n => n.y ?? 0)) + 100 : 200;

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
        @keyframes imbalance-pulse {
          0%, 100% { filter: drop-shadow(0 0 4px #ef4444); }
          50%       { filter: drop-shadow(0 0 14px #ef4444); }
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
        @keyframes found-glow {
          0%, 100% { filter: drop-shadow(0 0 4px #22c55e); }
          50%       { filter: drop-shadow(0 0 12px #22c55e); }
        }
        .avl-rotate-ring {
          transform-origin: center;
          animation: spin-slow 1.2s linear infinite;
        }
        .avl-dash-anim {
          animation: dash-rotate 0.8s linear infinite;
        }
        .avl-pulse-anim {
          animation: pulse-ring 0.9s ease-out infinite;
        }
        .avl-imbalance-anim {
          animation: imbalance-pulse 0.8s ease-in-out infinite;
        }
        .avl-node-enter {
          animation: node-enter 0.4s ease-out forwards;
        }
        .avl-found-anim {
          animation: found-glow 1s ease-in-out infinite;
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

            const isFound     = foundNodeId === node.id;
            const isActive    = activeNodeId === node.id;
            const isInsert    = insertNodeId === node.id;
            const isRotating  = rotatingNodeIds.includes(node.id);
            const isCompared  = comparedNodeId === node.id;
            const isMarked   = markedNodeIds.includes(node.id);
            const isImbalance = imbalancedNodeId === node.id;

            const bf = balanceFactors[node.id];
            const h  = nodeHeights[node.id];

            const isHighlight = isFound || isActive || isInsert || isCompared || isImbalance;

            return (
              <g key={node.id}>
                {/* 失衡红色警告光晕 */}
                {isImbalance && (
                  <circle cx={pos.x} cy={pos.y} r={NODE_RADIUS + 14}
                    fill="#ef4444" opacity={0.15}
                    className="avl-imbalance-anim" />
                )}

                {/* 高亮光晕 */}
                {isHighlight && !isRotating && !isImbalance && (
                  <circle cx={pos.x} cy={pos.y} r={NODE_RADIUS + 8}
                    fill={isFound ? '#22c55e' : isActive ? '#f59e0b' : '#3b82f6'}
                    opacity={0.2} />
                )}

                {/* 找到节点外圈动画 */}
                {isFound && (
                  <circle cx={pos.x} cy={pos.y} r={NODE_RADIUS + 6}
                    fill="#22c55e" opacity={0.2}
                    className="avl-pulse-anim" />
                )}

                {/* 旋转外圈 */}
                {isRotating && (
                  <g className="avl-rotate-ring">
                    <circle cx={pos.x} cy={pos.y} r={NODE_RADIUS + 10}
                      fill="none" stroke="#facc15" strokeWidth={3}
                      strokeDasharray="7 3" className="avl-dash-anim" />
                    <circle cx={pos.x} cy={pos.y} r={NODE_RADIUS + 16}
                      fill="none" stroke="#facc15" strokeWidth={1.5}
                      strokeDasharray="4 5" className="avl-dash-anim"
                      style={{ animationDirection: 'reverse', animationDuration: '0.6s' }} />
                  </g>
                )}

                {/* 节点本体 */}
                <circle
                  cx={pos.x} cy={pos.y} r={NODE_RADIUS}
                  fill={isImbalance ? '#7f1d1d' : isFound ? '#166534' : AVL_BG}
                  stroke={
                    isRotating  ? '#facc15' :
                    isImbalance ? '#ef4444' :
                    isFound     ? '#22c55e' :
                    isActive    ? '#f59e0b' :
                    '#3b82f6'
                  }
                  strokeWidth={isHighlight ? 2.5 : 2}
                  className={
                    isRotating  ? 'drop-shadow-[0_0_8px_#facc15]' :
                    isImbalance ? 'drop-shadow-[0_0_6px_#ef4444]' :
                    isFound     ? 'avl-found-anim' : ''
                  }
                />

                {/* 旋转中内层光效 */}
                {isRotating && (
                  <circle cx={pos.x} cy={pos.y} r={NODE_RADIUS + 4}
                    fill="#facc15" opacity={0.1}
                    className="avl-pulse-anim" />
                )}

                {/* 节点值 */}
                <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central"
                  fill="white" fontSize={13} fontWeight="bold"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                  {node.value}
                </text>

                {/* BF 平衡因子标签 */}
                {bf !== undefined && (
                  <text
                    x={pos.x - NODE_RADIUS - 5}
                    y={pos.y - NODE_RADIUS - 2}
                    textAnchor="end"
                    fill={Math.abs(bf) > 1 ? '#ef4444' : '#22d3ee'}
                    fontSize={9}
                    fontWeight="bold"
                    className={Math.abs(bf) > 1 ? 'animate-pulse' : ''}>
                    BF:{bf > 0 ? '+' : ''}{bf}
                  </text>
                )}

                {/* 高度 h 标签 */}
                {h !== undefined && (
                  <text
                    x={pos.x + NODE_RADIUS + 5}
                    y={pos.y - NODE_RADIUS - 2}
                    textAnchor="start"
                    fill="#94a3b8"
                    fontSize={9}
                    fontWeight="bold">
                    h={h}
                  </text>
                )}

                {/* 比较方向箭头 */}
                {isCompared && comparedDirection && (
                  <text
                    x={pos.x + (comparedDirection === 'left' ? -NODE_RADIUS - 6 : NODE_RADIUS + 6)}
                    y={pos.y}
                    textAnchor="middle" dominantBaseline="central"
                    fill="#f59e0b" fontSize={12} fontWeight="bold">
                    {comparedDirection === 'left' ? '←' : '→'}
                  </text>
                )}

                {/* 失衡警告标签 */}
                {isImbalance && (
                  <text
                    x={pos.x}
                    y={pos.y + NODE_RADIUS + 10}
                    textAnchor="middle"
                    fill="#ef4444"
                    fontSize={9}
                    fontWeight="bold"
                    className="animate-pulse">
                    ⚠️失衡
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
          <span className="w-4 h-4 rounded-full bg-[#1e3a5f] border-2 border-blue-500" />
          普通节点
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-green-600 border border-green-400" />
          找到节点
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-amber-500/30 border border-amber-400" />
          访问中
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-yellow-500/30 border border-yellow-400" />
          旋转中
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-red-600/30 border border-red-400" />
          失衡预警
        </span>
        <span className="flex items-center gap-1.5 text-cyan-400">
          <span className="font-mono text-[9px]">BF</span> 平衡因子
        </span>
        <span className="flex items-center gap-1.5 text-slate-500">
          <span className="font-mono text-[9px]">h</span> 节点高度
        </span>
      </div>

      {/* AVL 树性质说明 */}
      <div className="mt-2 text-center text-xs text-slate-500">
        AVL 树性质：任意节点左右子树高度差（平衡因子）绝对值 ≤ 1，查找效率 O(log n)
      </div>
    </div>
  );
}
