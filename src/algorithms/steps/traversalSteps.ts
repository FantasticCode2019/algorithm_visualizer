import { Step, TreeNode } from '../../types';

// ==================== 节点ID生成器 ====================
let nodeIdCounter = 0;
function resetNodeId() { nodeIdCounter = 0; }
function nextNodeId() { return ++nodeIdCounter; }

// ==================== BST 节点 ====================
interface BSTNode {
  id: number;
  value: number;
  left: BSTNode | null;
  right: BSTNode | null;
}

function mkNode(value: number): BSTNode {
  return { id: nextNodeId(), value, left: null, right: null };
}

// ==================== 从数组构建 BST ====================
function buildBST(values: number[]): BSTNode | null {
  resetNodeId();
  if (values.length === 0) return null;
  let root: BSTNode | null = null;
  for (const v of values) {
    if (!root) { root = mkNode(v); continue; }
    let cur = root;
    while (true) {
      if (v < cur.value) {
        if (!cur.left) { cur.left = mkNode(v); break; }
        cur = cur.left;
      } else {
        if (!cur.right) { cur.right = mkNode(v); break; }
        cur = cur.right;
      }
    }
  }
  return root;
}

// ==================== 布局计算 ====================
function computeLayout(
  root: BSTNode | null,
  depth: number, lo: number, hi: number,
  positions: Map<number, { x: number; y: number }>
): void {
  if (!root) return;
  const x = lo + (hi - lo) / 2;
  positions.set(root.id, { x, y: depth });
  computeLayout(root.left, depth + 1, lo, x - 1, positions);
  computeLayout(root.right, depth + 1, x + 1, hi, positions);
}

// ==================== BSTNode → TreeNode ====================
function toTreeNode(
  root: BSTNode | null,
  positions: Map<number, { x: number; y: number }>
): TreeNode | null {
  if (!root) return null;
  const pos = positions.get(root.id) ?? { x: 50, y: 10 };
  return {
    id: root.id, value: root.value,
    x: pos.x, y: pos.y,
    left: toTreeNode(root.left, positions),
    right: toTreeNode(root.right, positions),
    parentId: null,
  };
}

type TStep = Step;

// ==================== 记录节点访问 ====================
function visitNode(
  steps: TStep[],
  node: BSTNode,
  order: number,
  algo: string
): void {
  steps.push({
    type: 'visitNode',
    data: { nodeId: node.id, value: node.value, message: `访问节点 ${node.value}（第 ${order} 个）` },
  });
  steps.push({
    type: 'traversalMark',
    data: { nodeId: node.id, value: node.value, order, message: `${algo}第 ${order} 个：${node.value}` },
  });
}

// ==================== DFS 遍历（preorder / inorder / postorder）====================
// 使用显式栈 + 节点阶段状态模拟递归
type StackFrame = { node: BSTNode; stage: 0 | 1 | 2 }; // 0=enter 1=left-done 2=right-done
type TraversalMode = 'preorder' | 'inorder' | 'postorder';

function generateDFSSteps(root: BSTNode | null, mode: TraversalMode): TStep[] {
  const steps: TStep[] = [];
  const order: number[] = [];
  const labels: Record<TraversalMode, { name: string; hint: string }> = {
    preorder: { name: '前序', hint: '根 → 左 → 右' },
    inorder:  { name: '中序', hint: '左 → 根 → 右' },
    postorder: { name: '后序', hint: '左 → 右 → 根' },
  };
  const { name, hint } = labels[mode];

  steps.push({ type: 'message', data: { text: `【${name}遍历】顺序：${hint}` } });
  if (!root) {
    steps.push({ type: 'message', data: { text: '树为空，遍历结束' } });
    return steps;
  }

  const stack: StackFrame[] = [{ node: root, stage: 0 }];
  steps.push({ type: 'pushStack', data: { value: root.value, stack: [root.value], message: `Push ${root.value}` } });

  while (stack.length > 0) {
    const top = stack[stack.length - 1];

    // stage 0: 进入节点
    if (top.stage === 0) {
      top.stage = 1;
      // 前序：在进入时立即输出
      if (mode === 'preorder') {
        order.push(top.node.value);
        visitNode(steps, top.node, order.length, name);
      }
      // 压入左子树
      if (top.node.left) {
        const left = top.node.left;
        stack.push({ node: left, stage: 0 });
        steps.push({ type: 'pushStack', data: { value: left.value, stack: stack.map(f => f.node.value), message: `Push ${left.value}` } });
      }
    }
    // stage 1: 左子树已处理（或没有左子树）
    else if (top.stage === 1) {
      top.stage = 2;
      // 中序：在左子树处理完后输出
      if (mode === 'inorder') {
        order.push(top.node.value);
        visitNode(steps, top.node, order.length, name);
      }
      // 压入右子树
      if (top.node.right) {
        const right = top.node.right;
        stack.push({ node: right, stage: 0 });
        steps.push({ type: 'pushStack', data: { value: right.value, stack: stack.map(f => f.node.value), message: `Push ${right.value}` } });
      }
    }
    // stage 2: 右子树已处理（或没有右子树），出栈
    else {
      // 后序：出栈时输出
      if (mode === 'postorder') {
        order.push(top.node.value);
        visitNode(steps, top.node, order.length, name);
      }
      const popped = stack.pop()!;
      steps.push({ type: 'popStack', data: { value: popped.node.value, stack: stack.map(f => f.node.value), message: `Pop ${popped.node.value}` } });
    }
  }

  steps.push({ type: 'message', data: { text: `${name}遍历完成！顺序：${order.join(' → ')}` } });
  return steps;
}

// ==================== BFS 遍历（队列）====================
function generateBFSSteps(root: BSTNode | null): TStep[] {
  const steps: TStep[] = [];
  const order: number[] = [];
  const queue: BSTNode[] = [];

  steps.push({ type: 'message', data: { text: '【BFS 广度优先】使用队列，从根开始按层访问' } });
  if (!root) {
    steps.push({ type: 'message', data: { text: '树为空，遍历结束' } });
    return steps;
  }

  queue.push(root);
  steps.push({ type: 'enqueue', data: { value: root.value, queue: [root.value], message: `Enqueue ${root.value}` } });

  while (queue.length > 0) {
    const node = queue.shift()!;
    steps.push({ type: 'dequeue', data: { value: node.value, queue: queue.map(n => n.value), message: `Dequeue ${node.value}` } });

    order.push(node.value);
    visitNode(steps, node, order.length, 'BFS');

    if (node.left) {
      queue.push(node.left);
      steps.push({ type: 'enqueue', data: { value: node.left.value, queue: queue.map(n => n.value), message: `Enqueue ${node.left.value}` } });
    }
    if (node.right) {
      queue.push(node.right);
      steps.push({ type: 'enqueue', data: { value: node.right.value, queue: queue.map(n => n.value), message: `Enqueue ${node.right.value}` } });
    }
  }

  steps.push({ type: 'message', data: { text: `BFS 遍历完成！顺序：${order.join(' → ')}` } });
  return steps;
}

// ==================== 层序遍历（分组展示）====================
function generateLevelOrderSteps(root: BSTNode | null): TStep[] {
  const steps: TStep[] = [];
  const order: number[] = [];
  const levels: number[][] = [];

  steps.push({ type: 'message', data: { text: '【层序遍历】按层级输出，同层节点从左到右' } });
  if (!root) {
    steps.push({ type: 'message', data: { text: '树为空，遍历结束' } });
    return steps;
  }

  const queue: BSTNode[] = [root];
  steps.push({ type: 'enqueue', data: { value: root.value, queue: [root.value], message: `Enqueue ${root.value}` } });

  let level = 0;
  while (queue.length > 0) {
    const levelSize = queue.length;
    levels.push([]);
    steps.push({ type: 'message', data: { text: `━━ 第 ${level + 1} 层（共 ${levelSize} 个节点）━━` } });

    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift()!;
      steps.push({ type: 'dequeue', data: { value: node.value, queue: queue.map(n => n.value), message: `Dequeue ${node.value}` } });

      order.push(node.value);
      levels[level].push(node.value);
      visitNode(steps, node, order.length, '层序');

      if (node.left) {
        queue.push(node.left);
        steps.push({ type: 'enqueue', data: { value: node.left.value, queue: queue.map(n => n.value), message: `Enqueue ${node.left.value}` } });
      }
      if (node.right) {
        queue.push(node.right);
        steps.push({ type: 'enqueue', data: { value: node.right.value, queue: queue.map(n => n.value), message: `Enqueue ${node.right.value}` } });
      }
    }
    level++;
  }

  const levelStrs = levels.map((l, i) => `第${i + 1}层：[${l.join(', ')}]`);
  steps.push({ type: 'message', data: { text: `层序遍历完成！顺序：${order.join(' → ')}\n各层：${levelStrs.join(' | ')}` } });
  return steps;
}

// ==================== 构建带布局的最终树 ====================
function buildTreeRoot(values: number[]): TreeNode | null {
  const bstRoot = buildBST(values);
  if (!bstRoot) return null;
  const positions = new Map<number, { x: number; y: number }>();
  computeLayout(bstRoot, 10, 0, 100, positions);
  return toTreeNode(bstRoot, positions);
}

// ==================== 对外导出 ====================
export function dfsPreorderSteps(values: number[]): { steps: Step[]; root: TreeNode | null } {
  const treeRoot = buildTreeRoot(values);
  const bstRoot = buildBST(values);
  const steps = generateDFSSteps(bstRoot, 'preorder');
  return { steps, root: treeRoot };
}

export function dfsInorderSteps(values: number[]): { steps: Step[]; root: TreeNode | null } {
  const treeRoot = buildTreeRoot(values);
  const bstRoot = buildBST(values);
  const steps = generateDFSSteps(bstRoot, 'inorder');
  return { steps, root: treeRoot };
}

export function dfsPostorderSteps(values: number[]): { steps: Step[]; root: TreeNode | null } {
  const treeRoot = buildTreeRoot(values);
  const bstRoot = buildBST(values);
  const steps = generateDFSSteps(bstRoot, 'postorder');
  return { steps, root: treeRoot };
}

export function bfsSteps(values: number[]): { steps: Step[]; root: TreeNode | null } {
  const treeRoot = buildTreeRoot(values);
  const bstRoot = buildBST(values);
  const steps = generateBFSSteps(bstRoot);
  return { steps, root: treeRoot };
}

export function levelOrderSteps(values: number[]): { steps: Step[]; root: TreeNode | null } {
  const treeRoot = buildTreeRoot(values);
  const bstRoot = buildBST(values);
  const steps = generateLevelOrderSteps(bstRoot);
  return { steps, root: treeRoot };
}
