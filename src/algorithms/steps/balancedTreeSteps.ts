import { Step, TreeNode, NodeColor } from '../../types';

// ==================== 节点ID生成器 ====================
let nodeIdCounter = 0;
function resetNodeId() { nodeIdCounter = 0; }
function nextNodeId() { return ++nodeIdCounter; }

// ==================== AVL 树节点 ====================
interface AVLNode {
  id: number;
  value: number;
  left: AVLNode | null;
  right: AVLNode | null;
  parentId: number | null;
  height: number;
}

function mkAVL(value: number, left: AVLNode | null, right: AVLNode | null, parentId: number | null): AVLNode {
  return { id: nextNodeId(), value, left, right, parentId, height: 1 };
}

function avlHeight(n: AVLNode | null): number { return n ? n.height : 0; }

function avlBalance(n: AVLNode | null): number {
  if (!n) return 0;
  return avlHeight(n.left) - avlHeight(n.right);
}

function updateHeight(n: AVLNode) {
  n.height = 1 + Math.max(avlHeight(n.left), avlHeight(n.right));
}

// 右旋（LL / RR旋转基础）
function avlRightRotate(y: AVLNode): AVLNode {
  const x = y.left!;
  const t2 = x.right;
  x.right = y;
  y.left = t2;
  updateHeight(y);
  updateHeight(x);
  return x;
}

// 左旋
function avlLeftRotate(x: AVLNode): AVLNode {
  const y = x.right!;
  const t2 = y.left;
  y.left = x;
  x.right = t2;
  updateHeight(x);
  updateHeight(y);
  return y;
}

// 递归插入，返回新根
function avlInsertNode(root: AVLNode | null, value: number): AVLNode {
  if (!root) return mkAVL(value, null, null, null);

  if (value < root.value) {
    root.left = avlInsertNode(root.left, value);
  } else if (value > root.value) {
    root.right = avlInsertNode(root.right, value);
  } else {
    return root; // 重复值不插入
  }

  updateHeight(root);
  const bf = avlBalance(root);

  // LL: 左子树的左侧过重
  if (bf > 1 && value < (root.left!.value)) return avlRightRotate(root);
  // RR: 右子树的右侧过重
  if (bf < -1 && value > (root.right!.value)) return avlLeftRotate(root);
  // LR: 左子树的右侧过重
  if (bf > 1 && value > (root.left!.value)) {
    root.left = avlLeftRotate(root.left!);
    return avlRightRotate(root);
  }
  // RL: 右子树的左侧过重
  if (bf < -1 && value < (root.right!.value)) {
    root.right = avlRightRotate(root.right!);
    return avlLeftRotate(root);
  }
  return root;
}

// ==================== 红黑树节点 ====================
interface RBNode {
  id: number;
  value: number;
  left: RBNode | null;
  right: RBNode | null;
  parentId: number | null;
  color: NodeColor;
}

// ==================== 树布局计算 ====================
function assignPositions(
  root: AVLNode | RBNode | null,
  depth: number, lo: number, hi: number,
  positions: Map<number, { x: number; y: number }>
) {
  if (!root) return;
  const x = lo + (hi - lo) / 2;
  const y = depth;
  positions.set(root.id, { x, y });
  assignPositions((root as AVLNode).left ?? (root as RBNode).left, depth + 1, lo, x - 1, positions);
  assignPositions((root as AVLNode).right ?? (root as RBNode).right, depth + 1, x + 1, hi, positions);
}

// ==================== AVL 树步骤生成 ====================

export function avlInsertSteps(values: number[]): { steps: Step[]; root: AVLNode | null } {
  resetNodeId();
  const steps: Step[] = [];
  const finalRoot = buildFinalAVL(values);
  const positions = new Map<number, { x: number; y: number }>();
  assignPositions(finalRoot, 10, 0, 100, positions);

  steps.push({
    type: 'message',
    data: { text: `AVL 树插入演示，共 ${values.length} 个节点` },
    highlightLine: 0,
  });

  // 模拟逐步插入
  let simulatedRoot: AVLNode | null = null;
  const inserted = new Set<number>();

  for (const val of values) {
    // 查找插入位置
    let curr = simulatedRoot;
    while (curr) {
      steps.push({
        type: 'compareNode',
        data: {
          nodeId: curr.id, value: curr.value,
          direction: val < curr.value ? 'left' : 'right',
          cmp: val < curr.value ? '<' : '>',
          message: `${val} ${val < curr.value ? '<' : '>='} ${curr.value}，向${val < curr.value ? '左' : '右'}子树`,
        },
        highlightLine: 3,
      });
      // 显示平衡因子
      const bf = avlBalance(curr);
      steps.push({
        type: 'showBalance',
        data: { nodeId: curr.id, bf, message: `节点 ${curr.value} 平衡因子 = ${bf}` },
        highlightLine: 0,
      });
      if (val < curr.value) {
        if (!curr.left) break;
        curr = curr.left;
      } else {
        if (!curr.right) break;
        curr = curr.right;
      }
    }

    // 执行插入
    simulatedRoot = avlInsertNode(simulatedRoot, val);
    inserted.add(val);

    const newNode = findAVLNode(simulatedRoot, val)!;

    // 检查是否发生旋转
    const bf = avlBalance(simulatedRoot);
    if (bf > 1 || bf < -1) {
      // 找出失衡节点
      const imbalanced = findImbalanceNode(simulatedRoot, val)!;
      const dir = getRotationType(imbalanced, val);
      steps.push({
        type: 'rotate',
        data: { direction: dir, pivot: imbalanced.value, message: `失衡！执行 ${dir} 旋转修复平衡` },
        highlightLine: 5,
      });
    } else {
      steps.push({
        type: 'insertNode',
        data: { nodeId: newNode.id, value: val, message: `插入节点 ${val}，树仍平衡` },
        highlightLine: 1,
      });
    }
  }

  steps.push({
    type: 'message',
    data: { text: `AVL 树构建完成！高度 = ${finalRoot ? avlHeight(finalRoot) : 0}` },
    highlightLine: 0,
  });

  // 转换为通用 TreeNode（用于可视化）
  const treeRoot = convertAVLToTree(finalRoot, positions);

  return { steps, root: treeRoot as any };
}

// ==================== 红黑树步骤生成 ====================

export function rbInsertSteps(values: number[]): { steps: Step[]; root: RBNode | null } {
  resetNodeId();
  const steps: Step[] = [];
  const finalRoot = buildFinalRB(values);
  const positions = new Map<number, { x: number; y: number }>();
  assignPositions(finalRoot, 10, 0, 100, positions);

  steps.push({
    type: 'message',
    data: { text: `红黑树插入演示，共 ${values.length} 个节点` },
    highlightLine: 0,
  });

  // 模拟逐步插入
  let simulatedRoot: RBNode | null = null;
  const colorMap: Record<number, NodeColor> = {};

  for (const val of values) {
    // BST 查找插入位置
    let curr = simulatedRoot;
    while (curr) {
      steps.push({
        type: 'compareNode',
        data: {
          nodeId: curr.id, value: curr.value,
          direction: val < curr.value ? 'left' : 'right',
          cmp: val < curr.value ? '<' : '>',
          message: `${val} ${val < curr.value ? '<' : '>='} ${curr.value}`,
        },
        highlightLine: 2,
      });
      if (val < curr.value) {
        if (!curr.left) break;
        curr = curr.left;
      } else {
        if (!curr.right) break;
        curr = curr.right;
      }
    }

    // 插入红色节点
    const newNode: RBNode = { id: nextNodeId(), value: val, left: null, right: null, parentId: curr?.id ?? null, color: 'red' };
    colorMap[newNode.id] = 'red';
    steps.push({
      type: 'setColor',
      data: { nodeId: newNode.id, color: 'red', message: `插入红色节点 ${val}` },
      highlightLine: 1,
    });

    if (!curr) {
      // 插入根节点 → 设为黑
      newNode.color = 'black';
      colorMap[newNode.id] = 'black';
      simulatedRoot = newNode;
      steps.push({
        type: 'setColor',
        data: { nodeId: newNode.id, color: 'black', message: `根节点设为黑色` },
        highlightLine: 1,
      });
    } else {
      // 插入为叶子
      if (val < curr.value) curr.left = newNode;
      else curr.right = newNode;

      // RB-Tree fix-up
      let fixNode: RBNode | null = newNode;
      while (fixNode && fixNode !== simulatedRoot && fixNode.parentId !== null) {
        const parent: RBNode = findRBNode(simulatedRoot, fixNode.parentId!)!;
        const grand: RBNode | null = parent.parentId ? findRBNode(simulatedRoot, parent.parentId) : null;
        const parentColor = colorMap[parent.id] ?? parent.color;

        if (parentColor === 'black') break; // 无需修复

        // 叔节点
        const uncle: RBNode | null = grand
          ? (grand.left?.id === parent.id ? grand.right : grand.left)
          : null;
        const uncleColor = uncle ? (colorMap[uncle.id] ?? uncle.color) : 'black';

        if (uncleColor === 'red') {
          // 情况1: 叔节点为红 → 重新着色
          const recolorIds: number[] = [parent.id];
          if (uncle) recolorIds.push(uncle.id);
          if (grand) recolorIds.push(grand.id);
          colorMap[parent.id] = 'black';
          if (uncle) colorMap[uncle.id] = 'black';
          if (grand && grand.id !== (simulatedRoot?.id ?? -1)) colorMap[grand.id] = 'red';
          steps.push({
            type: 'recolor',
            data: { nodeIds: recolorIds, message: `叔节点为红，重着色 ${recolorIds.join(',')}` },
            highlightLine: 4,
          });
          fixNode = grand;
        } else {
          // 情况2/3: 叔节点为黑 → 旋转
          const dir = val < parent.value ? 'left' : 'right';
          const rotType = (dir === 'left' && parent === (grand?.left ?? null)) ? 'LL'
            : (dir === 'right' && parent === (grand?.right ?? null)) ? 'RR'
            : (dir === 'left' && parent === (grand?.right ?? null)) ? 'RL'
            : 'LR';

          // 先着色父节点为黑，祖父为红
          colorMap[parent.id] = 'black';
          if (grand) colorMap[grand.id] = 'red';
          steps.push({
            type: 'recolor',
            data: { nodeIds: [parent.id, ...(grand ? [grand.id] : [])], message: `旋转前重着色` },
            highlightLine: 4,
          });

          steps.push({
            type: 'rotate',
            data: { direction: rotType, pivot: grand?.value ?? 0, message: `执行 ${rotType} 旋转` },
            highlightLine: 5,
          });
          break; // 旋转后修复完成
        }
      }

      // 最终确保根为黑
      if (simulatedRoot) colorMap[simulatedRoot.id] = 'black';
    }
  }

  // 更新所有节点颜色
  updateAllRBColors(simulatedRoot, colorMap);

  steps.push({
    type: 'message',
    data: { text: '红黑树构建完成！所有红节点的孩子都是黑色，根节点为黑。' },
    highlightLine: 0,
  });

  const treeRoot = convertRBToTree(simulatedRoot, positions, colorMap);
  return { steps, root: treeRoot as any };
}

// ==================== 辅助函数 ====================

function buildFinalAVL(values: number[]): AVLNode | null {
  resetNodeId();
  let root: AVLNode | null = null;
  for (const v of values) root = avlInsertNode(root, v);
  return root;
}

function buildFinalRB(values: number[]): RBNode | null {
  resetNodeId();
  // 使用标准RB树插入（不生成步骤，仅构建最终树）
  const sorted = [...values].sort((a, b) => a - b);
  return buildRBFromSorted(sorted, 0, sorted.length - 1, null);
}

function buildRBFromSorted(arr: number[], lo: number, hi: number, parentId: number | null): RBNode | null {
  if (lo > hi) return null;
  const mid = Math.floor((lo + hi) / 2);
  const isBlack = parentId === null; // 根为黑
  const node: RBNode = { id: nextNodeId(), value: arr[mid], left: null, right: null, parentId, color: isBlack ? 'black' : 'red' };
  node.left = buildRBFromSorted(arr, lo, mid - 1, node.id);
  node.right = buildRBFromSorted(arr, mid + 1, hi, node.id);
  return node;
}

function findAVLNode(root: AVLNode | null, val: number): AVLNode | null {
  if (!root) return null;
  if (root.value === val) return root;
  return val < root.value ? findAVLNode(root.left, val) : findAVLNode(root.right, val);
}

function findRBNode(root: RBNode | null, id: number): RBNode | null {
  if (!root) return null;
  if (root.id === id) return root;
  return findRBNode(root.left, id) ?? findRBNode(root.right, id);
}

function findImbalanceNode(root: AVLNode | null, val: number): AVLNode | null {
  if (!root) return null;
  const bf = avlBalance(root);
  if (Math.abs(bf) > 1) return root;
  return val < root.value
    ? findImbalanceNode(root.left, val)
    : findImbalanceNode(root.right, val);
}

function getRotationType(node: AVLNode, val: number): 'LL' | 'RR' | 'LR' | 'RL' {
  const bf = avlBalance(node);
  if (bf > 1 && val < node.left!.value) return 'LL';
  if (bf < -1 && val > node.right!.value) return 'RR';
  if (bf > 1 && val > node.left!.value) return 'LR';
  return 'RL';
}

function updateAllRBColors(root: RBNode | null, colorMap: Record<number, NodeColor>) {
  if (!root) return;
  colorMap[root.id] = root.color;
  updateAllRBColors(root.left, colorMap);
  updateAllRBColors(root.right, colorMap);
}

// 将 AVLNode 转换为通用 TreeNode
function convertAVLToTree(root: AVLNode | null, positions: Map<number, { x: number; y: number }>): TreeNode | null {
  if (!root) return null;
  const pos = positions.get(root.id) ?? { x: 50, y: 10 };
  return {
    id: root.id,
    value: root.value,
    x: pos.x,
    y: pos.y,
    left: convertAVLToTree(root.left, positions),
    right: convertAVLToTree(root.right, positions),
    parentId: root.parentId,
  };
}

// 将 RBNode 转换为通用 TreeNode（含颜色）
function convertRBToTree(root: RBNode | null, positions: Map<number, { x: number; y: number }>, colorMap: Record<number, NodeColor>): TreeNode | null {
  if (!root) return null;
  const pos = positions.get(root.id) ?? { x: 50, y: 10 };
  return {
    id: root.id,
    value: root.value,
    x: pos.x,
    y: pos.y,
    left: convertRBToTree(root.left, positions, colorMap),
    right: convertRBToTree(root.right, positions, colorMap),
    parentId: root.parentId,
    color: colorMap[root.id] ?? root.color,
  };
}

export type { AVLNode, RBNode };
