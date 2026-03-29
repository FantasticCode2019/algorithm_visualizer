import { Step, TreeNode } from '../../types';

// ==================== 树构建与辅助函数 ====================

let nodeIdCounter = 0;

function resetNodeId() { nodeIdCounter = 0; }
function nextNodeId() { return ++nodeIdCounter; }

function createTreeNode(value: number, x: number, y: number, parentId: number | null): TreeNode {
  return {
    id: nextNodeId(),
    value,
    x,
    y,
    left: null,
    right: null,
    parentId,
  };
}

// 从一维数组建立平衡BST（层序插入），返回树根节点，同时计算节点位置
function buildBalancedBST(arr: number[]): TreeNode | null {
  resetNodeId();
  if (arr.length === 0) return null;
  const values = [...arr].sort((a, b) => a - b);
  return buildFromSorted(values, 0, values.length - 1, 50, 10, null);
}

function buildFromSorted(
  arr: number[], lo: number, hi: number,
  xCenter: number, depth: number, parentId: number | null
): TreeNode | null {
  if (lo > hi) return null;
  const mid = Math.floor((lo + hi) / 2);
  const node = createTreeNode(arr[mid], xCenter, depth, parentId);

  const childXSpread = Math.max(10, 50 / Math.pow(2, depth / 10));
  node.left = buildFromSorted(arr, lo, mid - 1, xCenter - childXSpread, depth + 12, node.id);
  node.right = buildFromSorted(arr, mid + 1, hi, xCenter + childXSpread, depth + 12, node.id);
  return node;
}

// 计算树中所有节点位置（用于 SVG 布局）
function assignPositions(node: TreeNode | null, depth: number, lo: number, hi: number, nodes: Map<number, { node: TreeNode; x: number; y: number }>, svgWidth: number) {
  if (!node) return;
  const x = lo + (hi - lo) / 2;
  const y = depth;
  nodes.set(node.id, { node, x, y });
  // 更新节点坐标
  node.x = x;
  node.y = y;
  assignPositions(node.left, depth + 1, lo, x - 1, nodes, svgWidth);
  assignPositions(node.right, depth + 1, x + 1, hi, nodes, svgWidth);
}

// ==================== BST 插入步骤生成 ====================

export interface BSTInsertResult {
  steps: Step[];
  root: TreeNode | null;
  searchTarget: number;
}

export function bstInsertSteps(values: number[]): BSTInsertResult {
  resetNodeId();
  const steps: Step[] = [];

  // 构建初始树
  const finalRoot = buildBalancedBST(values);

  // 计算最终树中所有节点的位置
  const nodePositions = new Map<number, { node: TreeNode; x: number; y: number }>();
  assignPositions(finalRoot, 10, 0, 100, nodePositions, 100);

  // 生成逐步插入步骤
  // 模拟从空树开始，每次插入一个值
  const insertOrder = [...values];
  // 使用BST插入逻辑
  let simulatedRoot: TreeNode | null = null;
  const nodeMap = new Map<number, TreeNode>();

  steps.push({
    type: 'message',
    data: { text: `准备向 BST 中插入 ${insertOrder.length} 个节点: [${insertOrder.join(', ')}]` },
    highlightLine: 0,
  });

  for (const val of insertOrder) {
    if (simulatedRoot === null) {
      // 插入第一个节点作为根
      simulatedRoot = createTreeNode(val, 50, 10, null);
      nodeMap.set(val, simulatedRoot);
      // 从最终树中获取该节点的位置
      const finalNode = findNodeByValue(finalRoot, val);
      if (finalNode) {
        simulatedRoot.x = finalNode.x;
        simulatedRoot.y = finalNode.y;
      }
      steps.push({
        type: 'insertNode',
        data: { nodeId: simulatedRoot.id, value: val, message: `插入根节点 ${val}` },
        highlightLine: 1,
      });
    } else {
      // 模拟BST插入路径
      let curr = simulatedRoot;
      let direction: 'left' | 'right' = val < curr.value ? 'left' : 'right';
      const path: TreeNode[] = [];

      while (true) {
        path.push(curr);
        steps.push({
          type: 'compareNode',
          data: {
            nodeId: curr.id, value: curr.value,
            direction, cmp: val < curr.value ? '<' : '>',
            message: `${val} ${val < curr.value ? '<' : '>='} ${curr.value}，向${direction === 'left' ? '左' : '右'}子树`,
          },
          highlightLine: 3,
        });

        const next = val < curr.value ? curr.left : curr.right;
        if (next === null) {
          // 插入新节点
          const newNode = createTreeNode(val, curr.x + (direction === 'left' ? -10 : 10), curr.y + 12, curr.id);
          nodeMap.set(val, newNode);
          // 从最终树获取位置
          const finalNode = findNodeByValue(finalRoot, val);
          if (finalNode) { newNode.x = finalNode.x; newNode.y = finalNode.y; }

          if (direction === 'left') {
            curr.left = newNode;
          } else {
            curr.right = newNode;
          }
          steps.push({
            type: 'insertNode',
            data: { nodeId: newNode.id, value: val, message: `插入节点 ${val} 作为 ${curr.value} 的${direction === 'left' ? '左' : '右'}子节点` },
            highlightLine: 4,
          });
          break;
        }
        curr = next;
        direction = val < curr.value ? 'left' : 'right';
      }
    }
  }

  steps.push({
    type: 'message',
    data: { text: 'BST 构建完成！' },
    highlightLine: 0,
  });

  return { steps, root: finalRoot, searchTarget: values[Math.floor(values.length / 2)] };
}

// ==================== BST 搜索步骤生成 ====================

export function bstSearchSteps(values: number[], searchTarget?: number): BSTInsertResult {
  resetNodeId();
  const steps: Step[] = [];
  const root = buildBalancedBST(values);
  const nodePositions = new Map<number, { node: TreeNode; x: number; y: number }>();
  assignPositions(root, 10, 0, 100, nodePositions, 100);

  // 自动选择搜索目标：优先找一个存在的值，若没有则随机生成
  let target = searchTarget;
  if (target === undefined) {
    const exists = Math.random() > 0.3;
    if (exists && values.length > 0) {
      target = values[Math.floor(Math.random() * values.length)];
    } else {
      const min = Math.min(...values);
      const max = Math.max(...values);
      target = min - Math.floor(Math.random() * (max - min + 1)) - 5;
    }
  }

  steps.push({
    type: 'message',
    data: { text: `在 BST 中查找 ${target}` },
    highlightLine: 0,
  });

  let curr: TreeNode | null = root;
  while (curr !== null) {
    steps.push({
      type: 'movePointerNode',
      data: { nodeId: curr.id, value: curr.value, message: `访问节点 ${curr.value}` },
      highlightLine: 1,
    });

    if (curr.value === target) {
      steps.push({
        type: 'nodeFound',
        data: { nodeId: curr.id, value: curr.value, message: `找到了目标 ${target}！` },
        highlightLine: 2,
      });
      break;
    } else if (target < curr.value) {
      steps.push({
        type: 'compareNode',
        data: { nodeId: curr.id, value: curr.value, direction: 'left', cmp: '<', message: `${target} < ${curr.value}，向左子树` },
        highlightLine: 3,
      });
      curr = curr.left;
    } else {
      steps.push({
        type: 'compareNode',
        data: { nodeId: curr.id, value: curr.value, direction: 'right', cmp: '>', message: `${target} > ${curr.value}，向右子树` },
        highlightLine: 4,
      });
      curr = curr.right;
    }
  }

  if (curr === null) {
    steps.push({
      type: 'message',
      data: { text: `未找到 ${target}，树中无此节点` },
      highlightLine: 5,
    });
  }

  return { steps, root, searchTarget: target };
}

// ==================== 树遍历步骤生成 ====================

export type TraversalType = 'inorder' | 'preorder' | 'postorder';

export function treeTraversalSteps(values: number[], type: TraversalType): BSTInsertResult {
  resetNodeId();
  const steps: Step[] = [];
  const root = buildBalancedBST(values);
  const nodePositions = new Map<number, { node: TreeNode; x: number; y: number }>();
  assignPositions(root, 10, 0, 100, nodePositions, 100);

  const names: Record<TraversalType, string> = {
    inorder: '中序遍历',
    preorder: '前序遍历',
    postorder: '后序遍历',
  };

  steps.push({
    type: 'message',
    data: { text: `${names[type]} (${type === 'inorder' ? '左-根-右' : type === 'preorder' ? '根-左-右' : '左-右-根'})` },
    highlightLine: 0,
  });

  const visitOrder: number[] = [];

  const visit = (node: TreeNode | null) => {
    if (!node) return;
    if (type === 'preorder') {
      steps.push({ type: 'visitNode', data: { nodeId: node.id, value: node.value, message: `访问 ${node.value}` }, highlightLine: 1 });
      visitOrder.push(node.value);
    }
    visit(node.left);
    if (type === 'inorder') {
      steps.push({ type: 'visitNode', data: { nodeId: node.id, value: node.value, message: `访问 ${node.value}` }, highlightLine: 1 });
      visitOrder.push(node.value);
    }
    visit(node.right);
    if (type === 'postorder') {
      steps.push({ type: 'visitNode', data: { nodeId: node.id, value: node.value, message: `访问 ${node.value}` }, highlightLine: 1 });
      visitOrder.push(node.value);
    }
  };

  visit(root);

  steps.push({
    type: 'message',
    data: { text: `遍历完成！访问顺序: [${visitOrder.join(' → ')}]` },
    highlightLine: 0,
  });

  return { steps, root, searchTarget: 0 };
}

// 辅助：按值查找节点（从树中）
function findNodeByValue(node: TreeNode | null, value: number): TreeNode | null {
  if (!node) return null;
  if (node.value === value) return node;
  if (value < node.value) return findNodeByValue(node.left, value);
  return findNodeByValue(node.right, value);
}

// 收集树的节点列表（按层序）
export function collectTreeNodes(root: TreeNode | null): TreeNode[] {
  if (!root) return [];
  const result: TreeNode[] = [];
  const queue: TreeNode[] = [root];
  while (queue.length > 0) {
    const node = queue.shift()!;
    result.push(node);
    if (node.left) queue.push(node.left);
    if (node.right) queue.push(node.right);
  }
  return result;
}
