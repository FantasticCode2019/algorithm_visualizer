import { NodeColor } from './index';

// ==================== 红黑树节点 ====================
export interface RBNode {
  id: number;
  value: number;
  left: RBNode | null;
  right: RBNode | null;
  parentId: number | null;
  color: NodeColor;
}

// ==================== 红黑树操作步骤类型 ====================

/** 步骤类型：旋转 */
export interface RBRotateStep {
  type: 'rbRotate';
  data: {
    direction: 'left' | 'right';
    pivotNodeId: number;
    pivotValue: number;
    childNodeId: number;
    childValue: number;
    message: string;
    highlightLine?: number;
  };
}

/** 步骤类型：变色 */
export interface RBRecolorStep {
  type: 'rbRecolor';
  data: {
    nodeIds: number[];
    newColors: NodeColor[];
    message: string;
    highlightLine?: number;
  };
}

/** 步骤类型：节点操作（访问/插入/删除） */
export interface RBNodeOpStep {
  type: 'rbNodeOp';
  data: {
    nodeId: number;
    value: number;
    operation: 'searching' | 'inserting' | 'deleting' | 'found' | 'deleted' | 'replacing';
    message: string;
    highlightLine?: number;
  };
}

/** 步骤类型：显示黑高 */
export interface RBBlackHeightStep {
  type: 'rbBlackHeight';
  data: {
    nodeId: number;
    blackHeight: number;
    message: string;
  };
}

/** 步骤类型：说明性消息 */
export interface RBMessageStep {
  type: 'rbMessage';
  data: {
    text: string;
    highlightLine?: number;
  };
}

/** 步骤类型：子树删除（特殊处理） */
export interface RBSubtreeDeleteStep {
  type: 'rbSubtreeDelete';
  data: {
    nodeId: number;
    message: string;
  };
}

export type RBTreeStep =
  | RBRotateStep
  | RBRecolorStep
  | RBNodeOpStep
  | RBBlackHeightStep
  | RBMessageStep
  | RBSubtreeDeleteStep;

// 导出辅助节点查找函数签名
export type RBNodeFinder = (root: RBNode | null, id: number) => RBNode | null;
