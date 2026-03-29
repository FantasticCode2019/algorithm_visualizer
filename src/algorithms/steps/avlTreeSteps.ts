import { Step, TreeNode } from '../../types';

// ==================== 节点ID生成器 ====================
let nodeIdCounter = 0;
function resetNodeId() { nodeIdCounter = 0; }
function nextNodeId() { return ++nodeIdCounter; }

// ==================== AVL 节点 ====================
interface AVLNode {
  id: number;
  value: number;
  left: AVLNode | null;
  right: AVLNode | null;
  parentId: number | null;
  height: number;
}

function mkAVL(value: number, left: AVLNode | null = null, right: AVLNode | null = null, parentId: number | null = null): AVLNode {
  return { id: nextNodeId(), value, left, right, parentId, height: 1 };
}

// ==================== 高度管理 ====================
function avlHeight(n: AVLNode | null): number { return n ? n.height : 0; }
function updateHeight(n: AVLNode) { n.height = 1 + Math.max(avlHeight(n.left), avlHeight(n.right)); }
function avlBalance(n: AVLNode | null): number {
  if (!n) return 0;
  return avlHeight(n.left) - avlHeight(n.right);
}

// ==================== AVL 旋转 ====================
function avlRightRotate(y: AVLNode): AVLNode {
  const x = y.left!;
  const t2 = x.right;
  x.right = y;
  y.left = t2;
  updateHeight(y);
  updateHeight(x);
  return x;
}

function avlLeftRotate(x: AVLNode): AVLNode {
  const y = x.right!;
  const t2 = y.left;
  y.left = x;
  x.right = t2;
  updateHeight(x);
  updateHeight(y);
  return y;
}

// ==================== 布局计算 ====================
function computePositions(
  root: AVLNode | null,
  depth: number, lo: number, hi: number,
  positions: Map<number, { x: number; y: number }>
): void {
  if (!root) return;
  const x = lo + (hi - lo) / 2;
  positions.set(root.id, { x, y: depth });
  computePositions(root.left, depth + 1, lo, x - 1, positions);
  computePositions(root.right, depth + 1, x + 1, hi, positions);
}

// ==================== 标准 AVL 插入（实际修改树） ====================
function avlInsertNode(root: AVLNode | null, value: number): AVLNode {
  if (!root) return mkAVL(value);
  if (value < root.value) {
    root.left = avlInsertNode(root.left, value);
  } else if (value > root.value) {
    root.right = avlInsertNode(root.right, value);
  } else {
    return root;
  }
  updateHeight(root);
  const bf = avlBalance(root);
  if (bf > 1 && value < root.left!.value) return avlRightRotate(root);
  if (bf < -1 && value > root.right!.value) return avlLeftRotate(root);
  if (bf > 1 && value > root.left!.value) {
    root.left = avlLeftRotate(root.left!);
    return avlRightRotate(root);
  }
  if (bf < -1 && value < root.right!.value) {
    root.right = avlRightRotate(root.right!);
    return avlLeftRotate(root);
  }
  return root;
}

// ==================== 从数组构建最终 AVL 树 ====================
function buildFinalAVL(values: number[]): AVLNode | null {
  resetNodeId();
  let root: AVLNode | null = null;
  for (const v of values) root = avlInsertNode(root, v);
  return root;
}

// ==================== 收集节点高度 ====================
function collectHeights(root: AVLNode | null): Record<number, number> {
  const result: Record<number, number> = {};
  function walk(n: AVLNode | null) {
    if (!n) return;
    result[n.id] = n.height;
    walk(n.left);
    walk(n.right);
  }
  walk(root);
  return result;
}

// ==================== 转换 AVLNode → TreeNode ====================
function convertToTreeNode(
  root: AVLNode | null,
  positions: Map<number, { x: number; y: number }>,
): TreeNode | null {
  if (!root) return null;
  const pos = positions.get(root.id) ?? { x: 50, y: 10 };
  return {
    id: root.id,
    value: root.value,
    x: pos.x,
    y: pos.y,
    left: convertToTreeNode(root.left, positions),
    right: convertToTreeNode(root.right, positions),
    parentId: root.parentId,
  };
}

// ==================== BST 最小节点 ====================
function bstMin(node: AVLNode): AVLNode {
  while (node.left) node = node.left;
  return node;
}

// ==================== 通用步骤类型别名 ====================
type AStep = Step;

// ==================== 在树中查找第一个失衡节点（整树遍历）====================
function findImbalanceNode(root: AVLNode | null): AVLNode | null {
  if (!root) return null;
  if (Math.abs(avlBalance(root)) > 1) return root;
  const leftResult = findImbalanceNode(root.left);
  if (leftResult) return leftResult;
  return findImbalanceNode(root.right);
}

// ==================== 查找旋转方向 ====================
function getRotationType(node: AVLNode, val: number): 'LL' | 'RR' | 'LR' | 'RL' {
  const bf = avlBalance(node);
  if (bf > 1 && val < node.left!.value) return 'LL';
  if (bf < -1 && val > node.right!.value) return 'RR';
  if (bf > 1 && val > node.left!.value) return 'LR';
  return 'RL';
}

// ==================== AVL 插入步骤生成 ====================
export function avlInsertSteps(values: number[]): { steps: Step[]; root: TreeNode | null } {
  resetNodeId();
  const steps: AStep[] = [];

  steps.push({
    type: 'message',
    data: { text: `AVL 树插入演示，准备插入 ${values.length} 个节点` },
  });

  let simulatedRoot: AVLNode | null = null;

  for (const val of values) {
    // ── 步骤1: 记录插入前的树结构 ───────────────
    const preInsertIds = new Set<number>();
    function collectPreIds(n: AVLNode | null) {
      if (!n) return;
      preInsertIds.add(n.id);
      collectPreIds(n.left);
      collectPreIds(n.right);
    }
    collectPreIds(simulatedRoot);

    // ── 步骤2: BST 查找插入路径（动画）───────────
    steps.push({
      type: 'message',
      data: { text: `【插入 ${val}】查找插入位置...` },
    });

    let curr = simulatedRoot;
    while (curr) {
      const bf = avlBalance(curr);
      steps.push({
        type: 'compareNode',
        data: {
          nodeId: curr.id, value: curr.value,
          direction: val < curr.value ? 'left' : 'right',
          cmp: val < curr.value ? '<' : '>=',
          message: `${val} ${val < curr.value ? '<' : '>='} ${curr.value}，向${val < curr.value ? '左' : '右'}子树`,
        },
      });
      steps.push({
        type: 'showBalance',
        data: { nodeId: curr.id, bf, message: `节点 ${curr.value} 平衡因子 BF = ${bf} ${Math.abs(bf) > 1 ? '⚠️ 失衡！' : '✓ 平衡'}` },
      });

      if (val === curr.value) {
        steps.push({ type: 'message', data: { text: `节点 ${val} 已存在，跳过` } });
        break;
      }
      if (val < curr.value) {
        if (!curr.left) {
          steps.push({ type: 'message', data: { text: `${val} < ${curr.value}，左子树为空，准备插入` } });
          break;
        }
        curr = curr.left;
      } else {
        if (!curr.right) {
          steps.push({ type: 'message', data: { text: `${val} > ${curr.value}，右子树为空，准备插入` } });
          break;
        }
        curr = curr.right;
      }
    }

    // ── 步骤3: 实际执行插入（标准AVL算法）────────
    simulatedRoot = avlInsertNode(simulatedRoot, val);

    // 找出所有"新"节点（不在插入前树中的节点）
    const postInsertIds = new Set<number>();
    function collectPostIds(n: AVLNode | null) {
      if (!n) return;
      postInsertIds.add(n.id);
      collectPostIds(n.left);
      collectPostIds(n.right);
    }
    collectPostIds(simulatedRoot);
    const newIds = [...postInsertIds].filter(id => !preInsertIds.has(id));

    for (const nid of newIds) {
      steps.push({
        type: 'insertNode',
        data: { nodeId: nid, value: val, message: `✅ 插入节点 ${val}` },
      });
    }

    // ── 步骤4: 遍历整树检查失衡节点 ─────────────
    const imbalanced = findImbalanceNode(simulatedRoot);
    if (imbalanced) {
      const bf = avlBalance(imbalanced);
      const dir = getRotationType(imbalanced, val);

      steps.push({
        type: 'message',
        data: { text: `⚠️ 失衡！节点 ${imbalanced.value} 的 BF = ${bf}，执行 ${dir} 旋转修复` },
      });
      steps.push({
        type: 'avlImbalance',
        data: {
          nodeId: imbalanced.id,
          balanceFactor: bf,
          message: `失衡节点 ${imbalanced.value}，平衡因子 ${bf}`,
        },
      });

      // 应用旋转到 simulatedRoot（实际修改树）
      const { pivot: _pivot, newRoot } = applyRotation(simulatedRoot, imbalanced, dir);
      if (newRoot !== simulatedRoot) {
        simulatedRoot = newRoot;
      }

      // 生成旋转动画步骤
      const rotationSteps = generateRotationSteps(_pivot, dir, imbalanced.value);
      steps.push(...rotationSteps);
    } else {
      steps.push({
        type: 'message',
        data: { text: `✅ 插入后树仍平衡` },
      });
    }

    // ── 步骤5: 更新所有节点高度 ──────────────────
    const heights = collectHeights(simulatedRoot);
    for (const [nid, h] of Object.entries(heights)) {
      steps.push({
        type: 'avlShowHeight',
        data: { nodeId: Number(nid), height: h, message: `节点高度 = ${h}` },
      });
    }
  }

  steps.push({
    type: 'message',
    data: { text: `✅ AVL 树构建完成！共 ${values.length} 个节点，树高 ${simulatedRoot ? simulatedRoot.height : 0}` },
  });

  // 转换并返回
  const positions = new Map<number, { x: number; y: number }>();
  computePositions(simulatedRoot, 10, 0, 100, positions);
  const treeRoot = convertToTreeNode(simulatedRoot, positions);

  return { steps, root: treeRoot };
}

// ==================== 对树应用旋转，返回新的根 ====================
function applyRotation(
  root: AVLNode,
  imbalanced: AVLNode,
  dir: 'LL' | 'RR' | 'LR' | 'RL'
): { pivot: AVLNode; newRoot: AVLNode } {
  if (dir === 'LL') {
    const newRoot = avlRightRotate(imbalanced);
    // 更新 root 引用
    if (root === imbalanced) return { pivot: imbalanced, newRoot };
    if (root.left === imbalanced) { root.left = newRoot; updateHeight(root); return { pivot: imbalanced, newRoot }; }
    if (root.right === imbalanced) { root.right = newRoot; updateHeight(root); return { pivot: imbalanced, newRoot }; }
    return { pivot: imbalanced, newRoot };
  }
  if (dir === 'RR') {
    const newRoot = avlLeftRotate(imbalanced);
    if (root === imbalanced) return { pivot: imbalanced, newRoot };
    if (root.left === imbalanced) { root.left = newRoot; updateHeight(root); return { pivot: imbalanced, newRoot }; }
    if (root.right === imbalanced) { root.right = newRoot; updateHeight(root); return { pivot: imbalanced, newRoot }; }
    return { pivot: imbalanced, newRoot };
  }
  if (dir === 'LR') {
    // LR: 先左旋失衡节点的左子树，再右旋失衡节点
    imbalanced.left = avlLeftRotate(imbalanced.left!);
    updateHeight(imbalanced);
    const newRoot = avlRightRotate(imbalanced);
    if (root === imbalanced) return { pivot: imbalanced, newRoot };
    if (root.left === imbalanced) { root.left = newRoot; updateHeight(root); return { pivot: imbalanced, newRoot }; }
    if (root.right === imbalanced) { root.right = newRoot; updateHeight(root); return { pivot: imbalanced, newRoot }; }
    return { pivot: imbalanced, newRoot };
  }
  // RL
  imbalanced.right = avlRightRotate(imbalanced.right!);
  updateHeight(imbalanced);
  const newRoot = avlLeftRotate(imbalanced);
  if (root === imbalanced) return { pivot: imbalanced, newRoot };
  if (root.left === imbalanced) { root.left = newRoot; updateHeight(root); return { pivot: imbalanced, newRoot }; }
  if (root.right === imbalanced) { root.right = newRoot; updateHeight(root); return { pivot: imbalanced, newRoot }; }
  return { pivot: imbalanced, newRoot };
}

// ==================== 生成旋转动画步骤 ====================
function generateRotationSteps(pivot: AVLNode, dir: 'LL' | 'RR' | 'LR' | 'RL', val: number): AStep[] {
  const s: AStep[] = [];
  const rotateHints: Record<string, string> = {
    LL: '右旋（Left-Left）：新节点插在失衡节点左子树的左子树',
    RR: '左旋（Right-Right）：新节点插在失衡节点右子树的右子树',
    LR: '左右旋（Left-Right）：新节点插在失衡节点左子树的右子树',
    RL: '右左旋（Right-Left）：新节点插在失衡节点右子树的左子树',
  };

  s.push({ type: 'message', data: { text: `【${dir} 旋转原理】${rotateHints[dir]}` } });

  if (dir === 'LL') {
    s.push({ type: 'rotate', data: { direction: 'LL', pivot: pivot.id, message: `对 ${val} 执行右旋（LL）` } });
    s.push({ type: 'message', data: { text: `右旋完成：${val} 下沉，左子树上浮，树恢复平衡` } });
  } else if (dir === 'RR') {
    s.push({ type: 'rotate', data: { direction: 'RR', pivot: pivot.id, message: `对 ${val} 执行左旋（RR）` } });
    s.push({ type: 'message', data: { text: `左旋完成：${val} 下沉，右子树上浮，树恢复平衡` } });
  } else if (dir === 'LR') {
    s.push({ type: 'message', data: { text: `【LR 型】第一步：对 ${val} 的左子树执行左旋` } });
    s.push({ type: 'rotate', data: { direction: 'LR', pivot: pivot.id, message: `左旋 ${val} 的左子树` } });
    s.push({ type: 'message', data: { text: `【LR 型】第二步：对 ${val} 执行右旋` } });
    s.push({ type: 'rotate', data: { direction: 'LL', pivot: pivot.id, message: `右旋 ${val}` } });
    s.push({ type: 'message', data: { text: `LR 双旋完成，树恢复平衡` } });
  } else if (dir === 'RL') {
    s.push({ type: 'message', data: { text: `【RL 型】第一步：对 ${val} 的右子树执行右旋` } });
    s.push({ type: 'rotate', data: { direction: 'RL', pivot: pivot.id, message: `右旋 ${val} 的右子树` } });
    s.push({ type: 'message', data: { text: `【RL 型】第二步：对 ${val} 执行左旋` } });
    s.push({ type: 'rotate', data: { direction: 'RR', pivot: pivot.id, message: `左旋 ${val}` } });
    s.push({ type: 'message', data: { text: `RL 双旋完成，树恢复平衡` } });
  }

  return s;
}

// ==================== AVL 搜索步骤生成 ====================
export function avlSearchSteps(values: number[], target: number): { steps: Step[]; root: TreeNode | null } {
  resetNodeId();
  const steps: AStep[] = [];

  const simulatedRoot = buildFinalAVL(values);
  const positions = new Map<number, { x: number; y: number }>();
  computePositions(simulatedRoot, 10, 0, 100, positions);
  const treeRoot = convertToTreeNode(simulatedRoot, positions);

  steps.push({
    type: 'message',
    data: { text: `AVL 树查询演示：在树中查找目标值 ${target}` },
  });

  let curr = simulatedRoot;
  const path: AVLNode[] = [];

  while (curr) {
    path.push(curr);
    const bf = avlBalance(curr);
    steps.push({
      type: 'visitNode',
      data: { nodeId: curr.id, value: curr.value, message: `访问节点 ${curr.value}，BF=${bf}，高度=${curr.height}` },
    });
    steps.push({
      type: 'showBalance',
      data: { nodeId: curr.id, bf, message: `节点 ${curr.value} 平衡因子 = ${bf}` },
    });

    if (target === curr.value) {
      steps.push({
        type: 'nodeFound',
        data: { nodeId: curr.id, value: curr.value, message: `✅ 找到了目标 ${target}！` },
      });
      steps.push({
        type: 'message',
        data: { text: `查找路径：${path.map(n => n.value).join(' → ')} → 找到！` },
      });
      return { steps, root: treeRoot };
    }

    if (target < curr.value) {
      steps.push({
        type: 'message',
        data: { text: `${target} < ${curr.value}，向左侧子树继续查找` },
      });
      curr = curr.left;
    } else {
      steps.push({
        type: 'message',
        data: { text: `${target} > ${curr.value}，向右侧子树继续查找` },
      });
      curr = curr.right;
    }

    if (!curr) {
      steps.push({
        type: 'message',
        data: { text: `❌ 未找到目标 ${target}！搜索到空节点` },
      });
      steps.push({
        type: 'message',
        data: { text: `查找路径：${path.map(n => n.value).join(' → ')} → null` },
      });
    }
  }

  return { steps, root: treeRoot };
}

// ==================== AVL 删除步骤生成 ====================
export function avlDeleteSteps(values: number[], deleteVal: number): { steps: Step[]; root: TreeNode | null } {
  resetNodeId();
  const steps: AStep[] = [];

  let simulatedRoot = buildFinalAVL(values);
  const positions = new Map<number, { x: number; y: number }>();
  computePositions(simulatedRoot, 10, 0, 100, positions);

  steps.push({
    type: 'message',
    data: { text: `AVL 树删除演示：删除节点 ${deleteVal}` },
  });

  // 查找目标节点
  function findNode(root: AVLNode | null, v: number): AVLNode | null {
    if (!root) return null;
    if (v === root.value) return root;
    return v < root.value ? findNode(root.left, v) : findNode(root.right, v);
  }

  let target = findNode(simulatedRoot, deleteVal);

  if (!target) {
    steps.push({
      type: 'message',
      data: { text: `❌ 节点 ${deleteVal} 不存在于树中，无法删除` },
    });
    const treeRoot = convertToTreeNode(simulatedRoot, positions);
    return { steps, root: treeRoot };
  }

  steps.push({
    type: 'visitNode',
    data: { nodeId: target.id, value: target.value, message: `找到待删除节点 ${target.value}` },
  });

  // 确定实际删除的节点（若有两个孩子，用后继替换）
  let deleteNode: AVLNode = target;
  if (target.left && target.right) {
    steps.push({
      type: 'message',
      data: { text: `${target.value} 有两个孩子，找后继（最小右子树）替换` },
    });
    let succ = bstMin(target.right);
    steps.push({
      type: 'visitNode',
      data: { nodeId: succ.id, value: succ.value, message: `后继节点为 ${succ.value}` },
    });
    target.value = succ.value;
    deleteNode = succ;
  }

  steps.push({
    type: 'message',
    data: { text: `实际删除节点 ${deleteNode.value}` },
  });

  // 从树中移除 deleteNode（原地修改）
  simulatedRoot = avlDeleteNode(simulatedRoot, deleteNode);

  steps.push({
    type: 'message',
    data: { text: `已移除节点 ${deleteNode.value}` },
  });

  // 检查并修复失衡
  let current: AVLNode | null = simulatedRoot;
  while (current) {
    updateHeight(current);
    const bf = avlBalance(current);
    steps.push({
      type: 'showBalance',
      data: { nodeId: current.id, bf, message: `节点 ${current.value} 平衡因子 = ${bf}` },
    });
    if (Math.abs(bf) > 1) {
      const dir = getRotationType(current, deleteVal < current.value ? deleteVal : deleteVal + 1);
      steps.push({
        type: 'message',
        data: { text: `⚠️ 删除后失衡，执行 ${dir} 旋转修复` },
      });
      steps.push({
        type: 'avlImbalance',
        data: { nodeId: current.id, balanceFactor: bf, message: `失衡节点 ${current.value}` },
      });
      const { pivot: _pivot, newRoot } = applyRotation(simulatedRoot!, current, dir);
      simulatedRoot = newRoot;
      const rotationSteps = generateRotationSteps(_pivot, dir, current.value);
      steps.push(...rotationSteps);
    }
    current = deleteVal < (current.value) ? current.left : current.right;
  }

  // 更新高度
  const heights = collectHeights(simulatedRoot);
  for (const [nid, h] of Object.entries(heights)) {
    steps.push({
      type: 'avlShowHeight',
      data: { nodeId: Number(nid), height: h, message: `节点高度 = ${h}` },
    });
  }

  steps.push({
    type: 'message',
    data: { text: `✅ AVL 树删除完成！` },
  });

  const finalPositions = new Map<number, { x: number; y: number }>();
  if (simulatedRoot) computePositions(simulatedRoot, 10, 0, 100, finalPositions);
  const treeRoot = convertToTreeNode(simulatedRoot, finalPositions);
  return { steps, root: treeRoot };
}

// ==================== AVL 删除节点（原地修改，返回新根）====================
function avlDeleteNode(root: AVLNode | null, z: AVLNode): AVLNode | null {
  if (!root) return null;
  if (z.value < root.value) {
    root.left = avlDeleteNode(root.left, z);
  } else if (z.value > root.value) {
    root.right = avlDeleteNode(root.right, z);
  } else {
    // 找到要删除的节点
    if (!root.left) return root.right;
    if (!root.right) return root.left;
    // 有两个孩子，找后继
    let succ = bstMin(root.right);
    root.value = succ.value;
    root.right = avlDeleteNode(root.right, succ);
  }
  if (root) updateHeight(root);
  const bf = avlBalance(root);
  if (bf > 1) {
    const dir = root.left!.value > (z.value) ? 'LL' : 'LR';
    const { pivot: _pivot, newRoot } = applyRotation(root, root, dir);
    return newRoot;
  }
  if (bf < -1) {
    const dir = root.right!.value < (z.value) ? 'RR' : 'RL';
    const { pivot: _pivot, newRoot } = applyRotation(root, root, dir);
    return newRoot;
  }
  return root;
}
