import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo, useRef } from 'react';
import { getAlgorithmById } from '../../constants/algorithms';
import { Step } from '../../types';
import { bubbleSortSteps } from '../../algorithms/steps/bubbleSortSteps';
import { quickSortSteps } from '../../algorithms/steps/quickSortSteps';
import { binarySearchSteps } from '../../algorithms/steps/binarySearchSteps';
import { insertionSortSteps } from '../../algorithms/steps/insertionSortSteps';
import { selectionSortSteps } from '../../algorithms/steps/selectionSortSteps';
import { linearSearchSteps } from '../../algorithms/steps/linearSearchSteps';
import { shellSortSteps } from '../../algorithms/steps/shellSortSteps';
import { mergeSortSteps } from '../../algorithms/steps/mergeSortSteps';
import { heapSortSteps } from '../../algorithms/steps/heapSortSteps';
import { radixSortSteps } from '../../algorithms/steps/radixSortSteps';
import {
  bstInsertSteps,
  bstSearchSteps,
  treeTraversalSteps,
} from '../../algorithms/steps/treeSteps';
import { avlInsertSteps as avlInsertStepsNew, avlSearchSteps, avlDeleteSteps } from '../../algorithms/steps/avlTreeSteps';
import { rbInsertSteps, rbSearchSteps, rbDeleteSteps } from '../../algorithms/steps/redBlackTreeSteps';
import { dfsPreorderSteps, bfsSteps, levelOrderSteps } from '../../algorithms/steps/traversalSteps';
import { dijkstraSteps, bellmanFordSteps, spfaSteps, floydWarshallSteps } from '../../algorithms/steps/shortestPathSteps';
import { primSteps, kruskalSteps } from '../../algorithms/steps/mstSteps';
import { tcpHandshakeSteps, tcpWaveSteps } from '../../algorithms/steps/tcpSteps';
import { usePlayer } from '../../hooks/usePlayer';
import ControlPanel from './ControlPanel';
import ArrayBars from './ArrayBars';
import TreeVisualizer from './TreeVisualizer';
import AVLTreeVisualizer from './AVLTreeVisualizer';
import RBTreeVisualizer from './RBTreeVisualizer';
import TraversalVisualizer from './TraversalVisualizer';
import ShortestPathVisualizer from './ShortestPathVisualizer';
import MSTVisualizer from './MSTVisualizer';
import TCPVisualizer from './TCPVisualizer';
import CodeViewer from './CodeViewer';
import StepExplanation from './StepExplanation';
import MetricsPanel from './MetricsPanel';

// 数组/排序/查找算法的步骤生成器
const STEP_GENERATORS: Record<string, (data: number[]) => { steps: Step[] }> = {
  bubbleSort: bubbleSortSteps,
  quickSort: quickSortSteps,
  insertionSort: insertionSortSteps,
  selectionSort: selectionSortSteps,
  binarySearch: binarySearchSteps,
  linearSearch: linearSearchSteps,
  shellSort: shellSortSteps,
  mergeSort: mergeSortSteps,
  heapSort: heapSortSteps,
  radixSort: radixSortSteps,
};

// 树算法的步骤生成器（返回 steps + root）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TREE_STEP_GENERATORS: Record<string, (data: number[]) => { steps: Step[]; root: any }> = {
  bstInsert: bstInsertSteps,
  bstSearch: (data) => bstSearchSteps(data),
  inorder: (data) => treeTraversalSteps(data, 'inorder'),
  preorder: (data) => treeTraversalSteps(data, 'preorder'),
  postorder: (data) => treeTraversalSteps(data, 'postorder'),
  avlInsert: avlInsertStepsNew,
  avlSearch: (data) => avlSearchSteps(data, Math.random() < 0.7
    ? data[Math.floor(Math.random() * data.length)]
    : data[data.length - 1] + Math.floor(Math.random() * 20) + 5),
  avlDelete: (data) => {
    const sorted = [...data].sort((a, b) => a - b);
    const del = sorted[Math.floor(Math.random() * sorted.length)];
    return avlDeleteSteps(data, del);
  },
  rbInsert: (data) => rbInsertSteps(data),
  rbSearch: (data) => {
    // 随机选一个存在的值作为查询目标（70%存在，30%不存在）
    const sorted = [...data].sort((a, b) => a - b);
    const target = Math.random() < 0.7
      ? sorted[Math.floor(Math.random() * sorted.length)]
      : sorted[sorted.length - 1] + Math.floor(Math.random() * 20) + 5;
    return rbSearchSteps(data, target);
  },
  rbDelete: (data) => {
    // 随机选一个存在的值作为删除目标
    const sorted = [...data].sort((a, b) => a - b);
    const target = sorted[Math.floor(Math.random() * sorted.length)];
    return rbDeleteSteps(data, target);
  },
  // 遍历算法（DFS/BFS/层序）
  dfs: (data) => dfsPreorderSteps(data),
  bfs: (data) => bfsSteps(data),
  levelorder: (data) => levelOrderSteps(data),
};

// 红黑树专属算法ID
const RB_ALGO_IDS = new Set(['rbInsert', 'rbSearch', 'rbDelete']);
// AVL 树专属算法ID
const AVL_ALGO_IDS = new Set(['avlInsert', 'avlSearch', 'avlDelete']);
// 遍历算法专属ID
const TRAVERSAL_ALGO_IDS = new Set(['dfs', 'bfs', 'levelorder']);
const TREE_ALGO_IDS = new Set([
  'bstInsert', 'bstSearch', 'inorder', 'preorder', 'postorder',
  'avlInsert', 'avlSearch', 'avlDelete',
  'rbInsert', 'rbSearch', 'rbDelete',
  'dfs', 'bfs', 'levelorder',
]);
const NETWORK_ALGO_IDS = new Set(['tcpHandshake', 'tcpWave']);
const SP_ALGO_IDS = new Set(['dijkstra', 'bellman-ford', 'spfa', 'floyd']);
const MST_ALGO_IDS = new Set(['prim', 'kruskal']);
const NETWORK_STEP_GENERATORS: Record<string, () => { steps: Step[] }> = {
  tcpHandshake: tcpHandshakeSteps,
  tcpWave: tcpWaveSteps,
};
// 最短路径步骤生成器
const SP_STEP_GENERATORS: Record<string, () => { steps: Step[]; graphNodes: any[]; graphEdges: any[]; source: number }> = {
  dijkstra: dijkstraSteps,
  'bellman-ford': bellmanFordSteps,
  spfa: spfaSteps,
  floyd: floydWarshallSteps,
};

// MST 步骤生成器
const MST_STEP_GENERATORS: Record<string, () => { steps: Step[]; graphNodes: any[]; graphEdges: any[] }> = {
  prim: primSteps,
  kruskal: kruskalSteps,
};

// 随机生成不重复数据
function generateRandomData(count = 7): number[] {
  const data: number[] = [];
  const used = new Set<number>();
  while (data.length < count) {
    const v = Math.floor(Math.random() * 90) + 10;
    if (!used.has(v)) { used.add(v); data.push(v); }
  }
  return data;
}

export default function AlgorithmPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const algo = id ? getAlgorithmById(id) : undefined;
  const player = usePlayer();
  const playerRef = useRef(player);
  playerRef.current = player;
  const [inputValue, setInputValue] = useState('');
  const [initialData, setInitialData] = useState<number[]>([50, 30, 70, 20, 40, 60, 80]);

  const isTreeAlgo = algo ? TREE_ALGO_IDS.has(algo.id) : false;
  const isNetworkAlgo = algo ? NETWORK_ALGO_IDS.has(algo.id) : false;
  const isRBAlgo = algo ? RB_ALGO_IDS.has(algo.id) : false;
  const isAVLAlgo = algo ? AVL_ALGO_IDS.has(algo.id) : false;
  const isTraversalAlgo = algo ? TRAVERSAL_ALGO_IDS.has(algo.id) : false;
  const isSpAlgo = algo ? SP_ALGO_IDS.has(algo.id) : false;
  const isMstAlgo = algo ? MST_ALGO_IDS.has(algo.id) : false;

  // 数组/排序/查找算法
  const arraySteps = useMemo((): Step[] => {
    if (!algo || isTreeAlgo || isNetworkAlgo || isSpAlgo) return [];
    const generator = STEP_GENERATORS[algo.id];
    if (!generator) return [];
    return generator(initialData).steps;
  }, [algo?.id, initialData, isTreeAlgo, isNetworkAlgo, isSpAlgo]);

  // 树算法
  const treeResult = useMemo(() => {
    if (!algo || !isTreeAlgo) return { steps: [], root: null };
    const generator = TREE_STEP_GENERATORS[algo.id];
    if (!generator) return { steps: [], root: null };
    return generator(initialData);
  }, [algo?.id, initialData, isTreeAlgo]);

  // 网络算法（无参数）
  const networkResult = useMemo((): Step[] => {
    if (!algo || !isNetworkAlgo) return [];
    const generator = NETWORK_STEP_GENERATORS[algo.id];
    if (!generator) return [];
    return generator().steps;
  }, [algo?.id, isNetworkAlgo]);

  // 最短路径算法
  const spResult = useMemo(() => {
    if (!algo || !isSpAlgo) return { steps: [], graphNodes: [], graphEdges: [], source: -1 };
    const generator = SP_STEP_GENERATORS[algo.id];
    if (!generator) return { steps: [], graphNodes: [], graphEdges: [], source: -1 };
    return generator();
  }, [algo?.id, isSpAlgo]);

  // MST 算法
  const mstResult = useMemo(() => {
    if (!algo || !isMstAlgo) return { steps: [], graphNodes: [], graphEdges: [] };
    const generator = MST_STEP_GENERATORS[algo.id];
    if (!generator) return { steps: [], graphNodes: [], graphEdges: [] };
    return generator();
  }, [algo?.id, isMstAlgo]);

  const steps = isTreeAlgo ? treeResult.steps : isSpAlgo ? spResult.steps : isMstAlgo ? mstResult.steps : (isNetworkAlgo ? networkResult : arraySteps);

  // 遍历算法类型（用于 TraversalVisualizer）
  const traversalType = useMemo((): 'preorder' | 'inorder' | 'postorder' | 'bfs' | 'levelorder' => {
    if (!algo) return 'preorder';
    if (algo.id === 'bfs') return 'bfs';
    if (algo.id === 'levelorder') return 'levelorder';
    return 'preorder';
  }, [algo?.id]);

  // 最短路径算法类型
  const spAlgoType = useMemo((): 'dijkstra' | 'bellman-ford' | 'spfa' | 'floyd' => {
    if (!algo) return 'dijkstra';
    if (algo.id === 'bellman-ford') return 'bellman-ford';
    if (algo.id === 'spfa') return 'spfa';
    if (algo.id === 'floyd') return 'floyd';
    return 'dijkstra';
  }, [algo?.id]);

  // MST 算法类型
  const mstAlgoType = useMemo((): 'prim' | 'kruskal' => {
    if (!algo) return 'prim';
    if (algo.id === 'kruskal') return 'kruskal';
    return 'prim';
  }, [algo?.id]);

  useEffect(() => {
    if (!algo) { navigate('/'); return; }
    if (steps.length > 0) {
      const root = isTreeAlgo ? treeResult.root : undefined;
      playerRef.current.loadAlgorithm(
        algo, initialData, steps, root ?? null,
        isTraversalAlgo ? traversalType : undefined,
        isSpAlgo ? spResult.graphNodes : undefined,
        isSpAlgo ? spResult.graphEdges : undefined,
        isSpAlgo ? spResult.source : undefined,
        isSpAlgo ? spAlgoType : undefined,
        isMstAlgo ? mstResult.graphNodes : undefined,
        isMstAlgo ? mstResult.graphEdges : undefined,
        isMstAlgo ? mstAlgoType : undefined,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [algo, initialData, steps, navigate, traversalType, spAlgoType, mstAlgoType]);

  if (!algo) return null;

  const handleStart = () => {
    const data = inputValue.split(/[,，\s]+/).map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    if (data.length < 1 || data.length > 15) return;
    setInitialData(data);
  };

  const handleRandom = () => {
    const count = isTreeAlgo ? 7 : 10;
    const data = generateRandomData(count);
    setInitialData(data);
    setInputValue(data.join(', '));
  };

  const handleReset = () => {
    if (steps.length > 0) {
      const root = isTreeAlgo ? treeResult.root : undefined;
      player.loadAlgorithm(algo, initialData, steps, root ?? null,
        isTraversalAlgo ? traversalType : undefined,
        isSpAlgo ? spResult.graphNodes : undefined,
        isSpAlgo ? spResult.graphEdges : undefined,
        isSpAlgo ? spResult.source : undefined,
        isSpAlgo ? spAlgoType : undefined,
        isMstAlgo ? mstResult.graphNodes : undefined,
        isMstAlgo ? mstResult.graphEdges : undefined,
        isMstAlgo ? mstAlgoType : undefined);
    }
  };

  return (
    <div className="min-h-screen bg-surface-dark text-white flex flex-col">
      {/* ===== 顶部导航 ===== */}
      <header className="bg-surface-card border-b border-surface-border px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="text-slate-400 hover:text-white transition-colors"
        >
          ← 返回首页
        </button>
        <div className="text-center">
          <h1 className="text-xl font-bold">{algo.name}</h1>
          <p className="text-sm text-slate-400">{algo.description}</p>
        </div>
        <div className="w-20" />
      </header>

      {/* ===== 主内容区 ===== */}
      <main className="flex-1 grid grid-cols-12 gap-4 p-4">
        {/* 左侧控制面板 */}
        <aside className="col-span-3 flex flex-col gap-4">
          <ControlPanel
            algo={algo}
            inputValue={inputValue}
            onInputChange={setInputValue}
            onStart={handleStart}
            onRandom={handleRandom}
            onReset={handleReset}
            isPlaying={player.isPlaying}
            currentStepIndex={player.currentStepIndex}
            totalSteps={player.steps.length}
            onPlay={player.play}
            onPause={player.pause}
            onStepForward={player.stepForward}
            onStepBackward={player.stepBackward}
          />

          {/* 统计指标（非网络算法显示） */}
          {!isNetworkAlgo && (
            <MetricsPanel
              comparisonCount={player.comparisonCount}
              swapCount={player.swapCount}
              currentRange={player.currentRange}
            />
          )}

          {/* TCP 连接状态（仅网络算法显示） */}
          {isNetworkAlgo && (
            <div className="bg-surface-card border border-surface-border rounded-xl p-4">
              <h2 className="text-sm font-semibold text-slate-300 mb-3">连接状态</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">👤 客户端</span>
                  <span className="text-primary font-medium">{player.tcpClientState}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">🖥️ 服务端</span>
                  <span className="text-primary font-medium">{player.tcpServerState}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">数据包</span>
                  <span className="text-primary">{player.tcpPackets.length} 个</span>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* 中间可视化区 */}
        <section className="col-span-6 flex flex-col gap-4">
          {isRBAlgo ? (
            <RBTreeVisualizer
              root={player.treeRoot}
              activeNodeId={player.treeActiveNodeId}
              foundNodeId={player.treeFoundNodeId}
              markedNodeIds={player.treeMarkedNodeIds}
              insertNodeId={player.treeInsertNodeId}
              comparedNodeId={player.treeComparedNodeId}
              comparedDirection={player.treeComparedDirection}
              nodeColors={player.nodeColors}
              rotatingNodeIds={player.rotatingNodeIds}
              recoloringNodeIds={player.recoloringNodeIds}
              balanceFactors={player.balanceFactors}
              rotateDirection={player.rotateDirection}
              blackHeights={player.blackHeights}
              dbNodeId={player.dbNodeId}
            />
          ) : isAVLAlgo ? (
            <AVLTreeVisualizer
              root={player.treeRoot}
              activeNodeId={player.treeActiveNodeId}
              foundNodeId={player.treeFoundNodeId}
              markedNodeIds={player.treeMarkedNodeIds}
              insertNodeId={player.treeInsertNodeId}
              comparedNodeId={player.treeComparedNodeId}
              comparedDirection={player.treeComparedDirection}
              rotatingNodeIds={player.rotatingNodeIds}
              recoloringNodeIds={player.recoloringNodeIds}
              balanceFactors={player.balanceFactors}
              rotateDirection={player.rotateDirection}
              nodeHeights={player.nodeHeights}
              imbalancedNodeId={player.imbalancedNodeId}
            />
          ) : isTraversalAlgo ? (
            <TraversalVisualizer
              root={player.treeRoot}
              activeNodeId={player.treeActiveNodeId}
              traversalMarkedNodeIds={player.traversalMarkedNodeIds}
              visitedNodeIds={player.visitedNodeIds}
              stackValues={player.stackValues}
              queueValues={player.queueValues}
              auxOpType={player.auxOpType}
              auxOpValue={player.auxOpValue}
              auxOpNew={player.auxOpNew}
              algoType={player.algoType}
              traversalOrder={player.traversalOrder}
              currentLevel={player.currentLevel}
            />
          ) : isSpAlgo ? (
            <ShortestPathVisualizer
              graphNodes={player.spGraphNodes}
              graphEdges={player.spGraphEdges}
              source={player.spSource}
              algoType={player.spAlgoType}
              currentStepType={player.currentStep?.type ?? ''}
              currentStepData={player.currentStep?.data ?? {}}
              totalSteps={player.steps.length}
              currentStepIndex={player.currentStepIndex}
            />
          ) : isMstAlgo ? (
            <MSTVisualizer
              graphNodes={player.mstGraphNodes}
              graphEdges={player.mstGraphEdges}
              algoType={player.mstType}
              currentStepData={player.currentStep?.data ?? {}}
              totalSteps={player.steps.length}
              currentStepIndex={player.currentStepIndex}
            />
          ) : isTreeAlgo ? (
            <TreeVisualizer
              root={player.treeRoot}
              activeNodeId={player.treeActiveNodeId}
              foundNodeId={player.treeFoundNodeId}
              markedNodeIds={player.treeMarkedNodeIds}
              insertNodeId={player.treeInsertNodeId}
              comparedNodeId={player.treeComparedNodeId}
              comparedDirection={player.treeComparedDirection}
              nodeColors={player.nodeColors}
              rotatingNodeIds={player.rotatingNodeIds}
              recoloringNodeIds={player.recoloringNodeIds}
              balanceFactors={player.balanceFactors}
              rotateDirection={player.rotateDirection}
            />
          ) : isNetworkAlgo ? (
            <TCPVisualizer
              clientState={player.tcpClientState}
              serverState={player.tcpServerState}
              packets={player.tcpPackets}
              currentPacketId={player.tcpCurrentPacketId}
            />
          ) : (
            <ArrayBars
              data={player.currentData.length > 0 ? player.currentData : initialData}
              compareIndices={player.compareIndices}
              swapIndices={player.swapIndices}
              sortedIndices={player.sortedIndices}
              pointers={player.pointers}
              currentRange={player.currentRange}
              discardedRanges={player.discardedRanges}
            />
          )}
          <StepExplanation message={player.message} currentStepIndex={player.currentStepIndex} totalSteps={player.steps.length} />
        </section>

        {/* 右侧伪代码（非网络算法显示） */}
        <aside className="col-span-3">
          {!isNetworkAlgo && algo.code && (
            <CodeViewer code={algo.code} highlightedLine={player.highlightedLine} />
          )}
        </aside>
      </main>
    </div>
  );
}
