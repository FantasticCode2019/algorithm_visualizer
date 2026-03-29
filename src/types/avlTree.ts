// ==================== AVL 树节点 ====================
export interface AVLNode {
  id: number;
  value: number;
  left: AVLNode | null;
  right: AVLNode | null;
  parentId: number | null;
  height: number;
}

// ==================== AVL 操作步骤类型 ====================

/** 步骤类型：显示高度 */
export interface AVLShowHeightStep {
  type: 'avlShowHeight';
  data: {
    nodeId: number;
    height: number;
    message: string;
    highlightLine?: number;
  };
}

/** 步骤类型：失衡预警 */
export interface AVLImbalanceStep {
  type: 'avlImbalance';
  data: {
    nodeId: number;
    balanceFactor: number;
    message: string;
    highlightLine?: number;
  };
}

/** 步骤类型：旋转（带 AVL 旋转类型） */
export interface AVLRotateStep {
  type: 'avlRotate';
  data: {
    direction: 'LL' | 'RR' | 'LR' | 'RL';
    pivotNodeId: number;
    pivotValue: number;
    childNodeId?: number;
    childValue?: number;
    message: string;
    highlightLine?: number;
  };
}

/** 步骤类型：节点操作 */
export interface AVLNodeOpStep {
  type: 'avlNodeOp';
  data: {
    nodeId: number;
    value: number;
    operation: 'searching' | 'inserting' | 'deleting' | 'found' | 'replacing';
    message: string;
    highlightLine?: number;
  };
}

/** 步骤类型：说明消息 */
export interface AVLMessageStep {
  type: 'avlMessage';
  data: {
    text: string;
    highlightLine?: number;
  };
}

/** 步骤类型：子树高度更新 */
export interface AVLHeightUpdateStep {
  type: 'avlHeightUpdate';
  data: {
    nodeId: number;
    oldHeight: number;
    newHeight: number;
    message: string;
  };
}

export type AVLTreeStep =
  | AVLShowHeightStep
  | AVLImbalanceStep
  | AVLRotateStep
  | AVLNodeOpStep
  | AVLMessageStep
  | AVLHeightUpdateStep;
