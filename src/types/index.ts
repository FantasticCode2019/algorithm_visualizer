// Step event types
export type StepType =
  | 'compare'
  | 'swap'
  | 'setValue'
  | 'markSorted'
  | 'setPivot'
  | 'movePointer'
  | 'highlightCode'
  | 'message'
  | 'setRange'
  | 'markFound'
  | 'markDiscarded'
  | 'insert'
  | 'shift'
  | 'setHeap'
  | 'heapify'
  | 'copy'
  | 'merge'
  | 'radixDistribute'
  | 'radixCollect'
  // BST / 遍历步骤
  | 'visitNode'
  | 'compareNode'
  | 'markNode'
  | 'nodeFound'
  | 'insertNode'
  | 'movePointerNode'
  // AVL / 红黑树
  | 'rotate'
  | 'recolor'
  | 'setColor'
  | 'showBalance'
  // 红黑树扩展步骤
  | 'rbRotate'
  | 'rbRecolor'
  | 'rbNodeOp'
  | 'rbBlackHeight'
  | 'rbSubtreeDelete'
  // AVL 树扩展步骤
  | 'avlShowHeight'
  | 'avlImbalance'
  | 'avlRotate'
  | 'avlNodeOp'
  | 'avlMessage'
  | 'avlHeightUpdate'
  // TCP 网络
  | 'tcpSend'
  | 'tcpReceive'
  | 'tcpState'
  | 'tcpACK'
  // 遍历算法步骤
  | 'pushStack'
  | 'popStack'
  | 'enqueue'
  | 'dequeue'
  | 'traversalMark'
  // 最短路径算法步骤
  | 'spRelax'
  | 'spEnqueue'
  | 'spDequeue'
  | 'spSettled'
  | 'spInit'
  | 'spNegativeCycle'
  | 'spFloydUpdate'
  | 'spFloydCell'
  // 最小生成树算法步骤
  | 'mstInit'
  | 'mstNodeAdd'
  | 'mstEdgeConsider'
  | 'mstEdgeAdd'
  | 'mstEdgeSkip'
  | 'mstUnion'
  | 'mstCycleCheck';

export interface Step {
  type: StepType;
  data: Record<string, any>;
  highlightLine?: number;
}

// ==================== 树相关类型 ====================

export type NodeColor = 'red' | 'black';

export interface TreeNode {
  id: number;
  value: number;
  x: number;
  y: number;
  left: TreeNode | null;
  right: TreeNode | null;
  parentId: number | null;
  color?: NodeColor;   // 红黑树节点颜色
}

// ==================== 算法元数据 ====================
export interface AlgorithmInfo {
  id: string;
  name: string;
  category: 'sort' | 'search' | 'tree' | 'network' | 'graph';
  complexity?: {
    best: string;
    average: string;
    worst: string;
  };
  stable?: boolean;
  description: string;
  code?: string[];
  tips?: string;
}

// ==================== 图结构类型 ====================

/** 图节点 */
export interface GraphNode {
  id: number;
  label: string;   // 显示标签，如 "A"、"B" 或数字
  x: number;       // SVG 布局 x
  y: number;       // SVG 布局 y
}

/** 图有向边 */
export interface GraphEdge {
  from: number;    // 起点节点 id
  to: number;      // 终点节点 id
  weight: number;   // 边权（支持负数）
}

/** 节点状态（最短路径） */
export type SpNodeStatus =
  | 'idle'           // 未处理
  | 'processing'     // 处理中/队列中
  | 'inQueue'        // 在队列中（SPFA）
  | 'settled'        // 已确定最短路径
  | 'unreachable'    // 不可达
  | 'negativeCycle';  // 负环中

/** MST 节点状态 */
export type MstNodeStatus =
  | 'idle'           // 未加入 MST
  | 'inMst'          // 已加入 MST
  | 'processing';    // 正在考察

/** MST 边状态 */
export type MstEdgeStatus =
  | 'pending'         // 待考察
  | 'considering'     // 正在考察
  | 'inMst'           // 已加入 MST
  | 'skipped';        // 成环跳过

// ==================== 网络/TCP 可视化类型 ====================

/** 发送方向 */
export type PacketDirection = 'c2s' | 's2c';

/** TCP 握手/挥手阶段 */
export type TcpPhase =
  | 'CLOSED'       // 初始状态
  | 'SYN_SENT'    // 客户端已发 SYN
  | 'SYN_RECEIVED' // 服务端收到 SYN，已发 SYN+ACK
  | 'ESTABLISHED'  // 连接建立
  | 'FIN_WAIT_1'   // 主动关闭，已发 FIN
  | 'FIN_WAIT_2'   // 收到 ACK，等待对方 FIN
  | 'CLOSE_WAIT'   // 被动关闭，等待本地 FIN
  | 'CLOSING'      // 双方同时关闭
  | 'LAST_ACK'     // 被动关闭方发了 FIN，等待最后 ACK
  | 'TIME_WAIT';   // 等待 2MSL 后关闭

// Player state
export interface PlayerState {
  steps: Step[];
  currentStepIndex: number;
  data: number[];
  isPlaying: boolean;
  speed: number;
  comparisonCount: number;
  swapCount: number;
  roundNumber: number;
  currentRange: [number, number] | null;
}
