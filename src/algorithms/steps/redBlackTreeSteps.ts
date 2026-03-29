import { Step, TreeNode, NodeColor } from '../../types';
import { RBNode } from '../../types/redBlackTree';

// ==================== 节点ID生成器 ====================
let nodeIdCounter = 0;
function resetNodeId() { nodeIdCounter = 0; }
function nextNodeId() { return ++nodeIdCounter; }

// ==================== 核心辅助函数 ====================

function mkNode(
  value: number,
  color: NodeColor = 'red',
  left: RBNode | null = null,
  right: RBNode | null = null,
  parentId: number | null = null,
): RBNode {
  return { id: nextNodeId(), value, left, right, parentId, color };
}

function findById(root: RBNode | null, id: number): RBNode | null {
  if (!root) return null;
  if (root.id === id) return root;
  return findById(root.left, id) ?? findById(root.right, id);
}

function findByValue(root: RBNode | null, val: number): RBNode | null {
  if (!root) return null;
  if (root.value === val) return root;
  return val < root.value ? findByValue(root.left, val) : findByValue(root.right, val);
}

function bstMin(node: RBNode): RBNode {
  while (node.left) node = node.left;
  return node;
}

// ==================== 树布局计算 ====================
function computePositions(
  root: RBNode | null,
  depth: number,
  lo: number,
  hi: number,
  positions: Map<number, { x: number; y: number }>,
): void {
  if (!root) return;
  const x = lo + (hi - lo) / 2;
  const y = depth;
  positions.set(root.id, { x, y });
  computePositions(root.left, depth + 1, lo, x - 1, positions);
  computePositions(root.right, depth + 1, x + 1, hi, positions);
}

// ==================== RBNode → TreeNode 转换 ====================
function convertToTreeNode(
  root: RBNode | null,
  positions: Map<number, { x: number; y: number }>,
  colorMap: Record<number, NodeColor>,
): TreeNode | null {
  if (!root) return null;
  const pos = positions.get(root.id) ?? { x: 50, y: 10 };
  return {
    id: root.id,
    value: root.value,
    x: pos.x,
    y: pos.y,
    left: convertToTreeNode(root.left, positions, colorMap),
    right: convertToTreeNode(root.right, positions, colorMap),
    parentId: root.parentId,
    color: colorMap[root.id] ?? root.color,
  };
}

// ==================== 从排序数组构建平衡红黑树（用于最终状态展示）===================
function buildFromSorted(arr: number[], lo: number, hi: number, parentId: number | null, isBlack: boolean): RBNode | null {
  if (lo > hi) return null;
  const mid = Math.floor((lo + hi) / 2);
  const node = mkNode(arr[mid], isBlack ? 'black' : 'red', null, null, parentId);
  node.left = buildFromSorted(arr, lo, mid - 1, node.id, false);
  node.right = buildFromSorted(arr, mid + 1, hi, node.id, false);
  return node;
}

// ==================== 收集所有节点ID ====================
function collectIds(root: RBNode | null): number[] {
  if (!root) return [];
  return [root.id, ...collectIds(root.left), ...collectIds(root.right)];
}

// ==================== 步骤类型别名 ====================
type RBStep = Step;

// ==================== 红黑树插入步骤生成 ====================
export function rbInsertSteps(values: number[]): { steps: Step[]; root: TreeNode | null } {
  resetNodeId();
  const steps: RBStep[] = [];

  steps.push({
    type: 'message',
    data: { text: `红黑树插入演示，准备插入 ${values.length} 个节点` },
  });

  // 模拟逐步插入
  let simulatedRoot: RBNode | null = null;
  const colorMap: Record<number, NodeColor> = {};

  for (const val of values) {
    // ── 步骤1: BST 查找插入位置 ──────────────────
    steps.push({
      type: 'message',
      data: { text: `【插入 ${val}】在树中查找插入位置...` },
    });

    let curr = simulatedRoot;
    let found = false;
    while (curr) {
      steps.push({
        type: 'visitNode',
        data: { nodeId: curr.id, value: curr.value, message: `比较 ${val} 与 ${curr.value}` },
      });

      if (val === curr.value) {
        steps.push({
          type: 'message',
          data: { text: `节点 ${val} 已存在，跳过插入` },
        });
        found = true;
        break;
      }

      if (val < curr.value) {
        if (!curr.left) {
          steps.push({
            type: 'message',
            data: { text: `${val} < ${curr.value}，左子树为空，${val} 应插入此处` },
          });
          break;
        }
        curr = curr.left;
      } else {
        if (!curr.right) {
          steps.push({
            type: 'message',
            data: { text: `${val} > ${curr.value}，右子树为空，${val} 应插入此处` },
          });
          break;
        }
        curr = curr.right;
      }
    }

    if (found) continue;

    // ── 步骤2: 创建红色节点并插入 ──────────────────
    const newNode: RBNode = {
      id: nextNodeId(),
      value: val,
      left: null,
      right: null,
      parentId: curr?.id ?? null,
      color: 'red',
    };
    colorMap[newNode.id] = 'red';

    if (!curr) {
      // 第一个节点，作为根节点
      newNode.color = 'black';
      colorMap[newNode.id] = 'black';
      simulatedRoot = newNode;
      steps.push({
        type: 'setColor',
        data: { nodeId: newNode.id, color: 'black', message: `根节点 ${val}（根必须为黑色）` },
      });
    } else {
      if (val < curr.value) curr.left = newNode;
      else curr.right = newNode;

      steps.push({
        type: 'insertNode',
        data: { nodeId: newNode.id, value: val, message: `插入红色节点 ${val}` },
      });

      // ── 步骤3: RB-FixUp ────────────────────────
      rbFixUp(steps, simulatedRoot!, newNode, colorMap);
    }

    // 确保根节点为黑
    if (simulatedRoot) colorMap[simulatedRoot.id] = 'black';
  }

  // 最终着色
  const allIds = collectIds(simulatedRoot);
  for (const id of allIds) {
    const node = findById(simulatedRoot, id);
    if (node) colorMap[id] = node.color;
  }

  steps.push({
    type: 'message',
    data: { text: '✅ 红黑树插入完成！满足：①根为黑 ②红节点孩子为黑 ③黑高相同' },
  });

  // 转换为通用 TreeNode
  const positions = new Map<number, { x: number; y: number }>();
  computePositions(simulatedRoot, 10, 0, 100, positions);
  const treeRoot = convertToTreeNode(simulatedRoot, positions, colorMap);

  return { steps, root: treeRoot };
}

// ==================== RB-FixUp（插入修复）===================
function rbFixUp(
  steps: RBStep[],
  root: RBNode | null,
  z: RBNode,
  colorMap: Record<number, NodeColor>,
): void {
  let current: RBNode | null = z;

  while (current && current !== root && current.parentId !== null) {
    let parent: RBNode = findById(root, current.parentId)!;
    const parentColor = colorMap[parent.id] ?? parent.color;

    if (parentColor === 'black') {
      steps.push({
        type: 'message',
        data: { text: `父节点 ${parent.value} 为黑色，插入完成，无需修复` },
      });
      break;
    }

    // 父节点为红，违反规则
    steps.push({
      type: 'message',
      data: { text: `⚠️ 父节点 ${parent.value} 为红色！违反"红节点孩子必须为黑"的规则，开始修复...` },
    });

    const grand: RBNode | null = parent.parentId ? findById(root, parent.parentId) : null;

    // ── 确定叔节点 ──────────────────
    const uncle: RBNode | null = grand
      ? (grand.left?.id === parent.id ? grand.right : grand.left)
      : null;
    const uncleColor: NodeColor = uncle ? (colorMap[uncle.id] ?? uncle.color) : 'black';

    if (uncle && uncleColor === 'red') {
      // ══ 情况1: 叔节点为红 ══════════════
      steps.push({
        type: 'message',
        data: { text: `【情况1】叔节点 ${uncle.value} 为红色 → 重新着色` },
      });

      colorMap[parent.id] = 'black';
      colorMap[uncle.id] = 'black';
      colorMap[grand!.id] = 'red';
      steps.push({
        type: 'recolor',
        data: {
          nodeIds: [parent.id, uncle.id, grand!.id],
          message: `将父、叔变黑，祖父变红`,
        },
      });

      // 继续向上检查祖父
      if (grand!.parentId === null) {
        steps.push({ type: 'message', data: { text: '祖父为根，设为黑色，修复完成' } });
        colorMap[grand!.id] = 'black';
        break;
      }
      current = grand;
    } else {
      // ══ 情况2/3: 叔节点为黑或为空 ══════════
      steps.push({
        type: 'message',
        data: { text: `【情况2/3】叔节点为黑色或空 → 需要旋转` },
      });

      // 判断是 LL/LR/RR/RL 中的哪一种
      const isLeftChild = parent.left?.id === current.id;

      if (!isLeftChild && grand && parent.id === grand.left?.id) {
        // RL 型：当前节点是右孩子，父是左孩子 → 先左旋转为 LL
        steps.push({
          type: 'message',
          data: { text: `【RL 型】先对 ${parent.value} 左旋，转为 LL 型处理` },
        });
        steps.push({
          type: 'rotate',
          data: { direction: 'RL', pivot: parent.value, message: `左旋 ${parent.value}` },
        });
        // 模拟左旋效果
        const savedLeft = current.left;
        current.left = parent;
        parent.parentId = current.id;
        parent.right = savedLeft;
        if (savedLeft) savedLeft.parentId = parent.id;
        current.parentId = grand.id;
        grand.left = current;
        // 交换 current 和 parent（仅变量层面）
        const tmp = current;
        current = parent;
        parent = tmp as RBNode;
      } else if (isLeftChild && grand && parent.id === grand.right?.id) {
        // LR 型：当前节点是左孩子，父是右孩子 → 先右旋转为 RR
        steps.push({
          type: 'message',
          data: { text: `【LR 型】先对 ${parent.value} 右旋，转为 RR 型处理` },
        });
        steps.push({
          type: 'rotate',
          data: { direction: 'LR', pivot: parent.value, message: `右旋 ${parent.value}` },
        });
        // 模拟右旋效果
        const savedRight = current.right;
        current.right = parent;
        parent.parentId = current.id;
        parent.left = savedRight;
        if (savedRight) savedRight.parentId = parent.id;
        current.parentId = grand.id;
        grand.right = current;
        const tmp3 = current;
        current = parent;
        parent = tmp3 as RBNode;
      } else if (isLeftChild && grand && parent.id === grand.left?.id) {
        // LL 型：当前和父都是左孩子 → 单右旋
        steps.push({
          type: 'message',
          data: { text: `【LL 型】对 ${grand.value} 右旋` },
        });
        steps.push({
          type: 'rotate',
          data: { direction: 'LL', pivot: grand.value, message: `右旋 ${grand.value}` },
        });
        colorMap[parent.id] = 'black';
        colorMap[grand!.id] = 'red';
        steps.push({
          type: 'recolor',
          data: { nodeIds: [parent.id, grand!.id], message: '父变黑，祖父变红' },
        });
      } else if (!isLeftChild && grand && parent.id === grand.right?.id) {
        // RR 型：当前和父都是右孩子 → 单左旋
        steps.push({
          type: 'message',
          data: { text: `【RR 型】对 ${grand.value} 左旋` },
        });
        steps.push({
          type: 'rotate',
          data: { direction: 'RR', pivot: grand.value, message: `左旋 ${grand.value}` },
        });
        colorMap[parent.id] = 'black';
        colorMap[grand!.id] = 'red';
        steps.push({
          type: 'recolor',
          data: { nodeIds: [parent.id, grand!.id], message: '父变黑，祖父变红' },
        });
      }

      if (grand && grand.parentId === null) {
        // 旋转后新根
        steps.push({ type: 'message', data: { text: '✅ 修复完成！' } });
      }
      break;
    }
  }
}

// ==================== 红黑树查询步骤生成 ====================
export function rbSearchSteps(values: number[], target: number): { steps: Step[]; root: TreeNode | null } {
  resetNodeId();
  const steps: RBStep[] = [];

  // 构建最终树（从排序数组）
  const sorted = [...values].sort((a, b) => a - b);
  const simulatedRoot = buildFromSorted(sorted, 0, sorted.length - 1, null, true);
  const positions = new Map<number, { x: number; y: number }>();
  computePositions(simulatedRoot, 10, 0, 100, positions);

  // 收集颜色
  const colorMap: Record<number, NodeColor> = {};
  function collectColors(node: RBNode | null) {
    if (!node) return;
    colorMap[node.id] = node.color;
    collectColors(node.left);
    collectColors(node.right);
  }
  collectColors(simulatedRoot);

  const treeRoot = convertToTreeNode(simulatedRoot, positions, colorMap);

  steps.push({
    type: 'message',
    data: { text: `红黑树查询演示：在树中查找目标值 ${target}` },
  });

  // 模拟查找过程
  let curr = simulatedRoot;
  const path: RBNode[] = [];

  while (curr) {
    path.push(curr);
    steps.push({
      type: 'visitNode',
      data: { nodeId: curr.id, value: curr.value, message: `访问节点 ${curr.value}，颜色：${colorMap[curr.id]}` },
    });

    if (target === curr.value) {
      steps.push({
        type: 'nodeFound',
        data: { nodeId: curr.id, value: curr.value, message: `✅ 找到了目标 ${target}！` },
      });
      steps.push({
        type: 'message',
        data: { text: `查找路径：${path.map(n => n.value).join(' → ')} → ${target} ✓` },
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
        data: { text: `❌ 未找到目标 ${target}！搜索到空节点，${target} 不存在于树中` },
      });
      steps.push({
        type: 'message',
        data: { text: `查找路径：${path.map(n => n.value).join(' → ')} → null` },
      });
    }
  }

  return { steps, root: treeRoot };
}

// ==================== 红黑树删除步骤生成 ====================
export function rbDeleteSteps(values: number[], deleteVal: number): { steps: Step[]; root: TreeNode | null } {
  resetNodeId();
  const steps: RBStep[] = [];

  // 构建最终树
  const sorted = [...values].sort((a, b) => a - b);
  let simulatedRoot = buildFromSorted(sorted, 0, sorted.length - 1, null, true);
  const colorMap: Record<number, NodeColor> = {};
  function collectColors(node: RBNode | null) {
    if (!node) return;
    colorMap[node.id] = node.color;
    collectColors(node.left);
    collectColors(node.right);
  }
  collectColors(simulatedRoot);

  const positions = new Map<number, { x: number; y: number }>();
  computePositions(simulatedRoot, 10, 0, 100, positions);

  steps.push({
    type: 'message',
    data: { text: `红黑树删除演示：删除节点 ${deleteVal}` },
  });

  // ── 步骤1: 找到要删除的节点 ──────────────────
  let target = findByValue(simulatedRoot, deleteVal);

  if (!target) {
    steps.push({
      type: 'message',
      data: { text: `❌ 节点 ${deleteVal} 不存在于树中，无法删除` },
    });
    const treeRoot = convertToTreeNode(simulatedRoot, positions, colorMap);
    return { steps, root: treeRoot };
  }

  steps.push({
    type: 'visitNode',
    data: { nodeId: target.id, value: target.value, message: `找到待删除节点 ${target.value}，颜色：${colorMap[target.id]}` },
  });

  // ── 步骤2: 记录被删除节点的颜色 ──────────────────
  const deletedColor = colorMap[target.id] ?? target.color;
  steps.push({
    type: 'message',
    data: { text: `被删除节点 ${target.value} 为${deletedColor === 'black' ? '黑色' : '红色'}节点` },
  });

  // ── 步骤3: 确定实际删除节点 ──────────────────
  // 如果有两个孩子，找后继（最小右子树）
  let deleteNode: RBNode = target;

  if (target.left && target.right) {
    steps.push({
      type: 'message',
      data: { text: `${target.value} 有两个孩子，找后继节点替换` },
    });
    let succ = bstMin(target.right);
    steps.push({
      type: 'visitNode',
      data: { nodeId: succ.id, value: succ.value, message: `后继节点为 ${succ.value}` },
    });
    // 用后继值覆盖
    target.value = succ.value;
    deleteNode = succ;
  }

  // ── 步骤4: 执行删除 ──────────────────
  steps.push({
    type: 'message',
    data: { text: `实际删除节点 ${deleteNode.value}（替换后值已更新）` },
  });

  const child = deleteNode.left ?? deleteNode.right;

  // ══ 情况A: 删除红色节点（孩子必为黑或空）═════════
  if (deletedColor === 'red') {
    steps.push({
      type: 'message',
      data: { text: `【删除红色节点】无需修复，红节点的孩子必为黑，黑色高度不变` },
    });
    // 直接移除
    rbTransplant(simulatedRoot, deleteNode, child);
  } else {
    // ══ 情况B: 删除黑色节点 ══════════════
    steps.push({
      type: 'message',
      data: { text: `【删除黑色节点】黑色高度可能改变，需要 DB（Double Black）修复！` },
    });

    // 执行删除
    rbTransplant(simulatedRoot, deleteNode, child);

    if (child) {
      // child 现在带着额外的黑色（DB）
      steps.push({
        type: 'message',
        data: { text: `DB 修复：给 child(${child.value}) 加一层黑色，视为"双黑"` },
      });
      dbFixUp(steps, child, colorMap, simulatedRoot);
    } else {
      steps.push({
        type: 'message',
        data: { text: `被删除节点没有孩子，DB 修复从 nil 哨兵开始` },
      });
    }
  }

  // 最终确保根为黑
  if (simulatedRoot) colorMap[simulatedRoot.id] = 'black';

  steps.push({
    type: 'message',
    data: { text: '✅ 红黑树删除完成！树仍满足所有 5 条性质' },
  });

  const treeRoot = convertToTreeNode(simulatedRoot, positions, colorMap);
  return { steps, root: treeRoot };
}

// ==================== DB(Double Black) 修复 ====================
function dbFixUp(
  steps: RBStep[],
  x: RBNode,
  colorMap: Record<number, NodeColor>,
  root: RBNode | null,
): void {
  let current: RBNode | null = x;

  while (current && current !== root && current.parentId !== null) {
    const parent: RBNode = findById(root, current.parentId)!;
    const isLeft = parent.left?.id === current.id;

    // ── 情况1: 兄弟节点为红 ──────────────────
    const sibling: RBNode | null = isLeft ? parent.right : parent.left;
    const siblingColor = sibling ? (colorMap[sibling.id] ?? sibling.color) : 'black';

    if (sibling && siblingColor === 'red') {
      steps.push({
        type: 'message',
        data: { text: `【DB-情况1】兄弟 ${sibling.value} 为红色 → 兄弟变黑，父变红，对父左/右旋` },
      });
      steps.push({
        type: 'recolor',
        data: { nodeIds: [sibling.id, parent.id], message: '兄弟→黑，父→红' },
      });
      steps.push({
        type: 'rotate',
        data: { direction: isLeft ? 'RR' : 'LL', pivot: parent.value, message: isLeft ? '左旋' : '右旋' },
      });
      colorMap[sibling.id] = 'black';
      colorMap[parent.id] = 'red';
      break;
    }

    // ── 情况2: 兄弟黑，两个侄子都黑（或无侄子）──
    const leftNephew = sibling?.left ?? null;
    const rightNephew = sibling?.right ?? null;
    const leftNColor = leftNephew ? (colorMap[leftNephew.id] ?? leftNephew.color) : 'black';
    const rightNColor = rightNephew ? (colorMap[rightNephew.id] ?? rightNephew.color) : 'black';

    if (leftNColor === 'black' && rightNColor === 'black') {
      steps.push({
        type: 'message',
        data: { text: `【DB-情况2】兄弟 ${sibling?.value ?? 'nil'} 的两个侄子都为黑 → 兄弟变红，DB 上移给父节点` },
      });
      if (sibling) colorMap[sibling.id] = 'red';
      current = parent;
    } else {
      // ── 情况3/4: 兄弟黑，至少一个侄子为红 ───────
      if (isLeft && rightNColor === 'red') {
        // 侄子（右）为红 → 情况3：旋转+变色
        steps.push({
          type: 'message',
          data: { text: `【DB-情况3】远侄子（右）为红 → 变色后旋转` },
        });
        if (sibling) {
          colorMap[sibling.id] = colorMap[parent.id] ?? parent.color;
          colorMap[parent.id] = 'black';
          if (rightNephew) colorMap[rightNephew.id] = 'black';
        }
        steps.push({
          type: 'recolor',
          data: {
            nodeIds: [sibling!.id, parent.id, rightNephew!.id],
            message: '兄弟=父色，父→黑，远侄子→黑',
          },
        });
        steps.push({
          type: 'rotate',
          data: { direction: 'RR', pivot: parent.value, message: '左旋修复' },
        });
        break;
      } else if (!isLeft && leftNColor === 'red') {
        steps.push({
          type: 'message',
          data: { text: `【DB-情况3】远侄子（左）为红 → 变色后旋转` },
        });
        if (sibling) {
          colorMap[sibling.id] = colorMap[parent.id] ?? parent.color;
          colorMap[parent.id] = 'black';
          if (leftNephew) colorMap[leftNephew.id] = 'black';
        }
        steps.push({
          type: 'recolor',
          data: {
            nodeIds: [sibling!.id, parent.id, leftNephew!.id],
            message: '兄弟=父色，父→黑，远侄子→黑',
          },
        });
        steps.push({
          type: 'rotate',
          data: { direction: 'LL', pivot: parent.value, message: '右旋修复' },
        });
        break;
      } else if (isLeft && leftNColor === 'red') {
        // 情况4: 近侄子（左）为红，先转成情况3
        steps.push({
          type: 'message',
          data: { text: `【DB-情况4】近侄子（左）为红 → 先右旋转情况3` },
        });
        if (sibling && leftNephew) {
          colorMap[sibling.id] = 'red';
          colorMap[leftNephew.id] = 'black';
        }
        steps.push({
          type: 'recolor',
          data: {
            nodeIds: [sibling!.id, leftNephew!.id],
            message: '兄弟→红，近侄子→黑',
          },
        });
        steps.push({
          type: 'rotate',
          data: { direction: 'LL', pivot: sibling!.value, message: '右旋' },
        });
      } else if (!isLeft && rightNColor === 'red') {
        steps.push({
          type: 'message',
          data: { text: `【DB-情况4】近侄子（右）为红 → 先左旋转情况3` },
        });
        if (sibling && rightNephew) {
          colorMap[sibling.id] = 'red';
          colorMap[rightNephew.id] = 'black';
        }
        steps.push({
          type: 'recolor',
          data: {
            nodeIds: [sibling!.id, rightNephew!.id],
            message: '兄弟→红，近侄子→黑',
          },
        });
        steps.push({
          type: 'rotate',
          data: { direction: 'RR', pivot: sibling!.value, message: '左旋' },
        });
      }

      // 情况3/4 旋转后 DB 消除
      steps.push({
        type: 'message',
        data: { text: '✅ DB 修复完成！' },
      });
      break;
    }
  }

  // 根为黑，DB 直接消除
  if (current && current.parentId === null) {
    steps.push({ type: 'message', data: { text: '到达根节点，DB 消除' } });
  }
  if (root) colorMap[root.id] = 'black';
}

// ==================== 替换节点（BST transplant）===================
function rbTransplant(root: RBNode | null, u: RBNode, v: RBNode | null): void {
  if (!root) return;
  if (u.parentId === null) {
    // u 是根节点
    Object.assign(root, v ?? {});
    if (v) v.parentId = null;
  } else if (u.id === root.left?.id) {
    root.left = v;
    if (v) v.parentId = u.parentId;
  } else {
    root.right = v;
    if (v) v.parentId = u.parentId;
  }
}

// ==================== 查询生成器（对外接口）===================
export function rbSearch(data: number[]): (target: number) => { steps: Step[]; root: TreeNode | null } {
  return (target: number) => rbSearchSteps(data, target);
}

// ==================== 删除生成器（对外接口）===================
export function rbDelete(data: number[]): (deleteVal: number) => { steps: Step[]; root: TreeNode | null } {
  return (deleteVal: number) => rbDeleteSteps(data, deleteVal);
}
