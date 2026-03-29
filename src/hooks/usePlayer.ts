import { useState, useCallback, useRef } from 'react';
import { Step, AlgorithmInfo, TreeNode, NodeColor, TcpPhase, PacketDirection, GraphNode, GraphEdge } from '../types';
import { playerEngine } from '../engine/PlayerEngine';

interface UsePlayerReturn {
  steps: Step[];
  currentStepIndex: number;
  currentStep: Step | null;
  isPlaying: boolean;
  comparisonCount: number;
  swapCount: number;
  currentRange: [number, number] | null;
  sortedIndices: number[];
  currentData: number[];
  compareIndices: number[];
  swapIndices: number[];
  pointers: Record<string, number>;
  discardedRanges: [number, number][];
  highlightedLine: number | null;
  message: string;
  // 树/BST 状态
  treeRoot: TreeNode | null;
  treeActiveNodeId: number | null;
  treeFoundNodeId: number | null;
  treeMarkedNodeIds: number[];
  treeInsertNodeId: number | null;
  treeComparedNodeId: number | null;
  treeComparedDirection: 'left' | 'right' | null;
  treeVisitOrder: number[];
  // AVL / 红黑树扩展状态
  nodeColors: Record<number, NodeColor>;
  rotatingNodeIds: number[];
  recoloringNodeIds: number[];
  balanceFactors: Record<number, number>;
  rotateDirection: 'LL' | 'RR' | 'LR' | 'RL' | null;
  // AVL 树专用
  nodeHeights: Record<number, number>;
  imbalancedNodeId: number | null;
  // 红黑树专用
  dbNodeId: number | null;
  blackHeights: Record<number, number>;
  // 遍历算法状态
  traversalMarkedNodeIds: Record<number, number>;
  visitedNodeIds: number[];
  stackValues: number[];
  queueValues: number[];
  auxOpType: 'none' | 'push' | 'pop' | 'enqueue' | 'dequeue';
  auxOpValue: number;
  auxOpNew: number[];
  algoType: 'preorder' | 'inorder' | 'postorder' | 'bfs' | 'levelorder';
  traversalOrder: number[];
  currentLevel: number | undefined;
  // 最短路径算法状态
  spGraphNodes: Array<{ id: number; label: string; x: number; y: number }>;
  spGraphEdges: Array<{ from: number; to: number; weight: number }>;
  spSource: number;
  spAlgoType: 'dijkstra' | 'bellman-ford' | 'spfa' | 'floyd';
  // MST 算法状态
  mstGraphNodes: Array<{ id: number; label: string; x: number; y: number }>;
  mstGraphEdges: Array<{ from: number; to: number; weight: number }>;
  mstType: 'prim' | 'kruskal';
  // TCP/网络状态
  tcpClientState: TcpPhase;
  tcpServerState: TcpPhase;
  tcpPackets: Array<{
    id: number;
    direction: PacketDirection;
    content: string;
    seq?: number;
    ack?: number;
    ackPacket?: boolean;
  }>;
  tcpCurrentPacketId: number | null;
  play: () => void;
  pause: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  reset: (steps: Step[], initialData: number[]) => void;
  loadAlgorithm: (algo: AlgorithmInfo, data: number[], steps: Step[], treeRoot?: TreeNode | null, traversalType?: 'preorder' | 'inorder' | 'postorder' | 'bfs' | 'levelorder', spGraphNodes?: GraphNode[], spGraphEdges?: GraphEdge[], spSource?: number, spAlgoType?: 'dijkstra' | 'bellman-ford' | 'spfa' | 'floyd', mstGraphNodes?: GraphNode[], mstGraphEdges?: GraphEdge[], mstType?: 'prim' | 'kruskal') => void;
}

export function usePlayer(): UsePlayerReturn {
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const isPlayingRef = useRef(false);
  const [comparisonCount, setComparisonCount] = useState(0);
  const [swapCount, setSwapCount] = useState(0);
  const [currentRange, setCurrentRange] = useState<[number, number] | null>(null);
  const [sortedIndices, setSortedIndices] = useState<number[]>([]);
  const [currentData, setCurrentData] = useState<number[]>([]);
  const [compareIndices, setCompareIndices] = useState<number[]>([]);
  const [swapIndices, setSwapIndices] = useState<number[]>([]);
  const [pointers, setPointers] = useState<Record<string, number>>({});
  const [discardedRanges, setDiscardedRanges] = useState<[number, number][]>([]);
  const [highlightedLine, setHighlightedLine] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  // 树可视化状态
  const [treeRoot, setTreeRoot] = useState<TreeNode | null>(null);
  const [treeActiveNodeId, setTreeActiveNodeId] = useState<number | null>(null);
  const [treeFoundNodeId, setTreeFoundNodeId] = useState<number | null>(null);
  const [treeMarkedNodeIds, setTreeMarkedNodeIds] = useState<number[]>([]);
  const [treeInsertNodeId, setTreeInsertNodeId] = useState<number | null>(null);
  const [treeComparedNodeId, setTreeComparedNodeId] = useState<number | null>(null);
  const [treeComparedDirection, setTreeComparedDirection] = useState<'left' | 'right' | null>(null);
  const [treeVisitOrder, setTreeVisitOrder] = useState<number[]>([]);
  // AVL / 红黑树扩展
  const [nodeColors, setNodeColors] = useState<Record<number, NodeColor>>({});
  const [rotatingNodeIds, setRotatingNodeIds] = useState<number[]>([]);
  const [recoloringNodeIds, setRecoloringNodeIds] = useState<number[]>([]);
  const [balanceFactors, setBalanceFactors] = useState<Record<number, number>>({});
  const [rotateDirection, setRotateDirection] = useState<'LL' | 'RR' | 'LR' | 'RL' | null>(null);

  // AVL 树专用
  const [nodeHeights, setNodeHeights] = useState<Record<number, number>>({});
  const [imbalancedNodeId, setImbalancedNodeId] = useState<number | null>(null);

  // 红黑树扩展
  const [dbNodeId, setDbNodeId] = useState<number | null>(null);
  const [blackHeights, setBlackHeights] = useState<Record<number, number>>({});

  // 遍历算法状态
  const [traversalMarkedNodeIds, setTraversalMarkedNodeIds] = useState<Record<number, number>>({});
  const [visitedNodeIds, setVisitedNodeIds] = useState<number[]>([]);
  const [stackValues, setStackValues] = useState<number[]>([]);
  const [queueValues, setQueueValues] = useState<number[]>([]);
  const [auxOpType, setAuxOpType] = useState<'none' | 'push' | 'pop' | 'enqueue' | 'dequeue'>('none');
  const [auxOpValue, setAuxOpValue] = useState<number>(0);
  const [auxOpNew, setAuxOpNew] = useState<number[]>([]);
  const [algoType, setAlgoType] = useState<'preorder' | 'inorder' | 'postorder' | 'bfs' | 'levelorder'>('preorder');
  const [traversalOrder, setTraversalOrder] = useState<number[]>([]);
  const [currentLevel, setCurrentLevel] = useState<number | undefined>(undefined);

  // 最短路径算法状态
  const [spGraphNodes, setSpGraphNodes] = useState<Array<{ id: number; label: string; x: number; y: number }>>([]);
  const [spGraphEdges, setSpGraphEdges] = useState<Array<{ from: number; to: number; weight: number }>>([]);
  const [spSource, setSpSource] = useState<number>(-1);
  const [spAlgoType, setSpAlgoType] = useState<'dijkstra' | 'bellman-ford' | 'spfa' | 'floyd'>('dijkstra');

  // MST 算法状态
  const [mstGraphNodes, setMstGraphNodes] = useState<Array<{ id: number; label: string; x: number; y: number }>>([]);
  const [mstGraphEdges, setMstGraphEdges] = useState<Array<{ from: number; to: number; weight: number }>>([]);
  const [mstType, setMstType] = useState<'prim' | 'kruskal'>('prim');

  // TCP/网络状态
  const [tcpClientState, setTcpClientState] = useState<TcpPhase>('CLOSED');
  const [tcpServerState, setTcpServerState] = useState<TcpPhase>('CLOSED');
  const [tcpPackets, setTcpPackets] = useState<Array<{
    id: number;
    direction: PacketDirection;
    content: string;
    seq?: number;
    ack?: number;
    ackPacket?: boolean;
  }>>([]);
  const [tcpCurrentPacketId, setTcpCurrentPacketId] = useState<number | null>(null);

  const applyStep = useCallback((step: Step, _index: number, data: number[]) => {
    setCurrentStepIndex(_index);
    setCurrentData(data);
    setHighlightedLine(step.highlightLine ?? null);

    switch (step.type) {
      case 'compare':
        setCompareIndices([step.data.i, step.data.j]);
        setSwapIndices([]);
        setMessage(step.data.message || `比较 arr[${step.data.i}]=${step.data.valI ?? data[step.data.i]} 和 arr[${step.data.j}]=${step.data.valJ ?? data[step.data.j]}`);
        setComparisonCount(c => c + 1);
        break;
      case 'swap':
        setSwapIndices([step.data.i, step.data.j]);
        setCompareIndices([]);
        setSwapCount(c => c + 1);
        setMessage(step.data.message || `交换 arr[${step.data.i}] 和 arr[${step.data.j}]`);
        break;
      case 'markSorted':
        setSortedIndices(prev => [...new Set([...prev, step.data.index])]);
        setSwapIndices([]);
        setCompareIndices([]);
        break;
      case 'movePointer':
        setPointers(prev => ({ ...prev, [step.data.name]: step.data.index }));
        setMessage(step.data.message || `移动 ${step.data.name} → ${step.data.index}`);
        break;
      case 'setRange':
        setCurrentRange([step.data.left, step.data.right]);
        setMessage(step.data.message || `[${step.data.left}, ${step.data.right}]`);
        break;
      case 'markDiscarded':
        setDiscardedRanges(prev => [...prev, [step.data.left, step.data.right]]);
        setCompareIndices([]);
        setSwapIndices([]);
        break;
      case 'markFound':
        setPointers(prev => ({ ...prev, found: step.data.index }));
        setCompareIndices([]);
        setSwapIndices([]);
        setMessage(`找到了！位置 ${step.data.index}`);
        break;
      case 'setPivot':
        setPointers(prev => ({ ...prev, pivot: step.data.index }));
        setMessage(`基准值 ${step.data.value} 在位置 ${step.data.index}`);
        break;
      case 'message':
        setMessage(step.data.text || '');
        setCompareIndices([]);
        setSwapIndices([]);
        if (!step.data.text?.includes('完成') && !step.data.text?.includes('查找')) {
          setTreeActiveNodeId(null);
          setTreeComparedNodeId(null);
          setTreeComparedDirection(null);
        }
        if (step.data.text?.includes('完成') || step.data.text?.includes('平衡') || step.data.text?.includes('着色')) {
          setRotatingNodeIds([]);
          setRecoloringNodeIds([]);
          setRotateDirection(null);
        }
        break;
      case 'shift':
        setMessage(step.data.message || `后移 arr[${step.data.from}] → ${step.data.to}`);
        break;
      case 'insert':
        setMessage(step.data.message || `插入 ${step.data.value} → ${step.data.index}`);
        break;
      case 'setValue':
        setMessage(step.data.message || `设置 arr[${step.data.index}] = ${step.data.value}`);
        break;
      case 'radixDistribute':
        setMessage(step.data.message || `分配 ${step.data.value} 到桶 ${step.data.digit}`);
        break;
      case 'radixCollect':
        setMessage(step.data.message || `从桶 ${step.data.bucket} 取 ${step.data.value}`);
        break;
      // ==================== 树步骤处理 ====================
      case 'visitNode':
        setTreeActiveNodeId(step.data.nodeId);
        setTreeFoundNodeId(null);
        setTreeComparedNodeId(null);
        setTreeComparedDirection(null);
        setTreeInsertNodeId(null);
        setTreeMarkedNodeIds(prev => [...new Set([...prev, step.data.nodeId])]);
        setTreeVisitOrder(prev => [...prev, step.data.value]);
        setMessage(step.data.message || `访问节点 ${step.data.value}`);
        setComparisonCount(c => c + 1);
        break;
      case 'compareNode':
        setTreeComparedNodeId(step.data.nodeId);
        setTreeComparedDirection(step.data.direction);
        setTreeActiveNodeId(null);
        setTreeFoundNodeId(null);
        setTreeInsertNodeId(null);
        setMessage(step.data.message || `${step.data.value} ${step.data.cmp === '<' ? '<' : '>='} ${step.data.value}，向${step.data.direction === 'left' ? '左' : '右'}子树`);
        setComparisonCount(c => c + 1);
        break;
      case 'markNode':
        setTreeMarkedNodeIds(prev => [...new Set([...prev, step.data.nodeId])]);
        setTreeActiveNodeId(null);
        setTreeComparedNodeId(null);
        setTreeComparedDirection(null);
        setMessage(step.data.message || `标记节点 ${step.data.value}`);
        break;
      case 'nodeFound':
        setTreeFoundNodeId(step.data.nodeId);
        setTreeActiveNodeId(null);
        setTreeComparedNodeId(null);
        setTreeComparedDirection(null);
        setTreeInsertNodeId(null);
        setMessage(step.data.message || `找到目标 ${step.data.value}！`);
        break;
      case 'insertNode':
        setTreeInsertNodeId(step.data.nodeId);
        setTreeActiveNodeId(null);
        setTreeComparedNodeId(null);
        setTreeComparedDirection(null);
        setTreeMarkedNodeIds(prev => [...new Set([...prev, step.data.nodeId])]);
        setMessage(step.data.message || `插入节点 ${step.data.value}`);
        break;
      case 'movePointerNode':
        setTreeActiveNodeId(step.data.nodeId);
        setTreeComparedNodeId(null);
        setTreeComparedDirection(null);
        setTreeInsertNodeId(null);
        setMessage(step.data.message || `访问节点 ${step.data.value}`);
        break;
      // AVL / 红黑树步骤
      case 'rotate':
        setRotatingNodeIds([step.data.pivot]);
        setRotateDirection(step.data.direction);
        setMessage(step.data.message || `执行 ${step.data.direction} 旋转`);
        break;
      case 'recolor':
        setRecoloringNodeIds(step.data.nodeIds);
        setMessage(step.data.message || `重新着色: ${step.data.nodeIds.join(', ')}`);
        break;
      case 'setColor':
        setNodeColors(prev => ({ ...prev, [step.data.nodeId]: step.data.color }));
        setMessage(step.data.message || `节点 ${step.data.nodeId} 设为 ${step.data.color}`);
        break;
      case 'showBalance':
        setBalanceFactors(prev => ({ ...prev, [step.data.nodeId]: step.data.bf }));
        setMessage(step.data.message || `节点 ${step.data.nodeId} 平衡因子: ${step.data.bf}`);
        break;
      // 红黑树扩展步骤
      case 'rbRotate':
        setRotatingNodeIds(step.data.pivotNodeId ? [step.data.pivotNodeId] : []);
        setRotateDirection(step.data.direction as 'LL' | 'RR' | 'LR' | 'RL');
        setMessage(step.data.message || `执行 ${step.data.direction} 旋转`);
        break;
      case 'rbRecolor':
        setRecoloringNodeIds(step.data.nodeIds);
        step.data.nodeIds.forEach((id: number, i: number) => {
          if (step.data.newColors && step.data.newColors[i]) {
            setNodeColors(prev => ({ ...prev, [id]: step.data.newColors[i] }));
          }
        });
        setMessage(step.data.message || `重新着色: ${step.data.nodeIds.join(',')}`);
        break;
      case 'rbNodeOp':
        switch (step.data.operation) {
          case 'searching':
            setTreeActiveNodeId(step.data.nodeId);
            setTreeComparedNodeId(null);
            setMessage(step.data.message || `查找节点 ${step.data.value}`);
            break;
          case 'inserting':
            setTreeInsertNodeId(step.data.nodeId);
            setTreeActiveNodeId(null);
            setMessage(step.data.message || `插入节点 ${step.data.value}`);
            break;
          case 'deleting':
            setTreeActiveNodeId(step.data.nodeId);
            setMessage(step.data.message || `删除节点 ${step.data.value}`);
            break;
          case 'found':
            setTreeFoundNodeId(step.data.nodeId);
            setTreeActiveNodeId(null);
            setMessage(step.data.message || `找到节点 ${step.data.value}！`);
            break;
          case 'deleted':
            setTreeActiveNodeId(null);
            setMessage(step.data.message || `节点 ${step.data.value} 已删除`);
            break;
          case 'replacing':
            setTreeActiveNodeId(step.data.nodeId);
            setMessage(step.data.message || `用 ${step.data.value} 替换`);
            break;
        }
        break;
      case 'rbBlackHeight':
        setBlackHeights(prev => ({ ...prev, [step.data.nodeId]: step.data.blackHeight }));
        setMessage(step.data.message || `节点 ${step.data.nodeId} 黑高: ${step.data.blackHeight}`);
        break;
      case 'rbSubtreeDelete':
        setTreeActiveNodeId(step.data.nodeId);
        setMessage(step.data.message || `子树节点 ${step.data.nodeId} 删除`);
        break;
      // ==================== AVL 树步骤 ====================
      case 'avlShowHeight':
        setNodeHeights(prev => ({ ...prev, [step.data.nodeId]: step.data.height }));
        setMessage(step.data.message || `节点更新高度 = ${step.data.height}`);
        break;
      case 'avlImbalance':
        setImbalancedNodeId(step.data.nodeId);
        setRotateDirection(null);
        setMessage(step.data.message || `失衡节点 ${step.data.nodeId}，BF=${step.data.balanceFactor}`);
        break;
      case 'avlRotate':
        setRotatingNodeIds(step.data.pivotNodeId ? [step.data.pivotNodeId] : []);
        setRotateDirection(step.data.direction as 'LL' | 'RR' | 'LR' | 'RL');
        setImbalancedNodeId(null);
        setMessage(step.data.message || `执行 ${step.data.direction} 旋转`);
        break;
      case 'avlNodeOp':
        switch (step.data.operation) {
          case 'searching':
            setTreeActiveNodeId(step.data.nodeId);
            setMessage(step.data.message || `查找节点 ${step.data.value}`);
            break;
          case 'inserting':
            setTreeInsertNodeId(step.data.nodeId);
            setTreeActiveNodeId(null);
            setMessage(step.data.message || `插入节点 ${step.data.value}`);
            break;
          case 'deleting':
            setTreeActiveNodeId(step.data.nodeId);
            setMessage(step.data.message || `删除节点 ${step.data.value}`);
            break;
          case 'found':
            setTreeFoundNodeId(step.data.nodeId);
            setTreeActiveNodeId(null);
            setMessage(step.data.message || `找到节点 ${step.data.value}！`);
            break;
          case 'replacing':
            setTreeActiveNodeId(step.data.nodeId);
            setMessage(step.data.message || `用 ${step.data.value} 替换`);
            break;
        }
        break;
      case 'avlHeightUpdate':
        setNodeHeights(prev => ({ ...prev, [step.data.nodeId]: step.data.newHeight }));
        setMessage(step.data.message || `高度从 ${step.data.oldHeight} 更新为 ${step.data.newHeight}`);
        break;
      // ==================== 遍历算法步骤 ====================
      case 'pushStack':
        setStackValues(step.data.stack ?? []);
        setAuxOpType('push');
        setAuxOpValue(step.data.value ?? 0);
        setAuxOpNew(step.data.stack ?? []);
        setTreeActiveNodeId(step.data.nodeId ?? null);
        setMessage(step.data.message || `栈 Push ${step.data.value}`);
        break;
      case 'popStack':
        setStackValues(step.data.stack ?? []);
        setAuxOpType('pop');
        setAuxOpValue(step.data.value ?? 0);
        setAuxOpNew(step.data.stack ?? []);
        setMessage(step.data.message || `栈 Pop ${step.data.value}`);
        break;
      case 'enqueue':
        setQueueValues(step.data.queue ?? []);
        setAuxOpType('enqueue');
        setAuxOpValue(step.data.value ?? 0);
        setAuxOpNew(step.data.queue ?? []);
        setTreeActiveNodeId(step.data.nodeId ?? null);
        setMessage(step.data.message || `队列 Enqueue ${step.data.value}`);
        break;
      case 'dequeue':
        setQueueValues(step.data.queue ?? []);
        setAuxOpType('dequeue');
        setAuxOpValue(step.data.value ?? 0);
        setAuxOpNew(step.data.queue ?? []);
        setMessage(step.data.message || `队列 Dequeue ${step.data.value}`);
        break;
      case 'traversalMark':
        setTraversalMarkedNodeIds(prev => ({ ...prev, [step.data.nodeId]: step.data.order }));
        setVisitedNodeIds(prev => [...new Set([...prev, step.data.nodeId])]);
        setTraversalOrder(prev => [...prev, step.data.value]);
        setAuxOpType('none');
        setTreeActiveNodeId(null);
        setMessage(step.data.message || `${step.data.value}`);
        break;
      // ==================== TCP / 网络步骤 ====================
      case 'tcpState':
        setTcpClientState(step.data.client);
        setTcpServerState(step.data.server);
        // tcpState 表示包已到达，动画结束，清空飞行中的包引用
        setTcpCurrentPacketId(null);
        setMessage(step.data.message || '');
        break;
      case 'tcpSend':
        // 添加数据包，开始飞行动画（设置 currentPacketId 触发 useEffect）
        setTcpPackets(prev => [
          ...prev,
          {
            id: _index,
            direction: step.data.direction,
            content: step.data.content,
            seq: step.data.seq,
            ack: step.data.ack,
            ackPacket: step.data.content === 'ACK',
          },
        ]);
        setTcpCurrentPacketId(_index);
        setMessage(step.data.message || `发送 ${step.data.content}`);
        break;
      case 'tcpACK':
        // 传输中动画消息，不需要重新触发动画
        setMessage(step.data.message || `确认 ${step.data.content}`);
        break;
    }
  }, []);

  const play = useCallback(() => {
    setIsPlaying(true);
    isPlayingRef.current = true;
    playerEngine.play();
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    playerEngine.pause();
  }, []);

  const stepForward = useCallback(() => {
    playerEngine.stepForward();
  }, []);

  const stepBackward = useCallback(() => {
    playerEngine.stepBackward();
  }, []);

  const reset = useCallback((newSteps: Step[], data: number[], treeRootNode?: TreeNode | null) => {
    playerEngine.stop();
    setSteps(newSteps);
    setCurrentStepIndex(0);
    setIsPlaying(false);
    isPlayingRef.current = false;
    setComparisonCount(0);
    setSwapCount(0);
    setCurrentRange(null);
    setSortedIndices([]);
    setCompareIndices([]);
    setSwapIndices([]);
    setPointers({});
    setDiscardedRanges([]);
    setHighlightedLine(null);
    setMessage('点击播放开始演示');
    setCurrentData([...data]);

    // 重置树状态
    setTreeRoot(treeRootNode ?? null);
    setTreeActiveNodeId(null);
    setTreeFoundNodeId(null);
    setTreeMarkedNodeIds([]);
    setTreeInsertNodeId(null);
    setTreeComparedNodeId(null);
    setTreeComparedDirection(null);
    setTreeVisitOrder([]);
    setNodeColors({});
    setRotatingNodeIds([]);
    setRecoloringNodeIds([]);
    setBalanceFactors({});
    setRotateDirection(null);
    setNodeHeights({});
    setImbalancedNodeId(null);
    setDbNodeId(null);
    setBlackHeights({});

    // 重置遍历状态
    setTraversalMarkedNodeIds({});
    setVisitedNodeIds([]);
    setStackValues([]);
    setQueueValues([]);
    setAuxOpType('none');
    setAuxOpValue(0);
    setAuxOpNew([]);
    setAlgoType('preorder');
    setTraversalOrder([]);
    setCurrentLevel(undefined);

    // 重置最短路径状态
    setSpGraphNodes([]);
    setSpGraphEdges([]);
    setSpSource(-1);
    setSpAlgoType('dijkstra');

    // 重置 MST 状态
    setMstGraphNodes([]);
    setMstGraphEdges([]);
    setMstType('prim');

    // 重置 TCP 状态
    setTcpClientState('CLOSED');
    setTcpServerState('CLOSED');
    setTcpPackets([]);
    setTcpCurrentPacketId(null);

    if (newSteps.length > 0) {
      playerEngine.load(newSteps, applyStep, () => {
        setIsPlaying(false);
        isPlayingRef.current = false;
      }, data);
    }
  }, [applyStep]);

  const loadAlgorithm = useCallback((
    _algo: AlgorithmInfo,
    data: number[],
    newSteps: Step[],
    treeRootNode?: TreeNode | null,
    _traversalType?: 'preorder' | 'inorder' | 'postorder' | 'bfs' | 'levelorder',
    _spGraphNodes?: GraphNode[],
    _spGraphEdges?: GraphEdge[],
    _spSource?: number,
    _spAlgoType?: 'dijkstra' | 'bellman-ford' | 'spfa' | 'floyd',
    _mstGraphNodes?: GraphNode[],
    _mstGraphEdges?: GraphEdge[],
    _mstType?: 'prim' | 'kruskal',
  ) => {
    reset(newSteps, data, treeRootNode);
    if (_traversalType) setAlgoType(_traversalType);
    if (_spGraphNodes) setSpGraphNodes(_spGraphNodes as UsePlayerReturn['spGraphNodes']);
    if (_spGraphEdges) setSpGraphEdges(_spGraphEdges as UsePlayerReturn['spGraphEdges']);
    if (_spSource !== undefined) setSpSource(_spSource);
    if (_spAlgoType) setSpAlgoType(_spAlgoType);
    if (_mstGraphNodes) setMstGraphNodes(_mstGraphNodes as UsePlayerReturn['mstGraphNodes']);
    if (_mstGraphEdges) setMstGraphEdges(_mstGraphEdges as UsePlayerReturn['mstGraphEdges']);
    if (_mstType) setMstType(_mstType);
  }, [reset]);

  return {
    steps,
    currentStepIndex,
    currentStep: steps[currentStepIndex] ?? null,
    isPlaying,
    comparisonCount,
    swapCount,
    currentRange,
    sortedIndices,
    currentData,
    compareIndices,
    swapIndices,
    pointers,
    discardedRanges,
    highlightedLine,
    message,
    treeRoot,
    treeActiveNodeId,
    treeFoundNodeId,
    treeMarkedNodeIds,
    treeInsertNodeId,
    treeComparedNodeId,
    treeComparedDirection,
    treeVisitOrder,
    nodeColors,
    rotatingNodeIds,
    recoloringNodeIds,
    balanceFactors,
    rotateDirection,
    nodeHeights,
    imbalancedNodeId,
    dbNodeId,
    blackHeights,
    traversalMarkedNodeIds,
    visitedNodeIds,
    stackValues,
    queueValues,
    auxOpType,
    auxOpValue,
    auxOpNew,
    algoType,
    traversalOrder,
    currentLevel,
    spGraphNodes,
    spGraphEdges,
    spSource,
    spAlgoType,
    mstGraphNodes,
    mstGraphEdges,
    mstType,
    tcpClientState,
    tcpServerState,
    tcpPackets,
    tcpCurrentPacketId,
    play,
    pause,
    stepForward,
    stepBackward,
    reset,
    loadAlgorithm,
  };
}