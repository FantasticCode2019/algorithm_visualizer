import { Step, TcpPhase, PacketDirection } from '../../types';

export interface TCPStepResult {
  steps: Step[];
}

// ==================== 辅助函数 ====================

/** 添加状态步骤 */
function pushState(
  steps: Step[],
  client: TcpPhase,
  server: TcpPhase,
  message: string,
  highlightLine = 0,
) {
  steps.push({ type: 'tcpState', data: { client, server, message }, highlightLine });
}

/** 添加数据包发送步骤（tcpSend），携带 seq/ack 信息 */
function pushPacket(
  steps: Step[],
  direction: PacketDirection,
  content: string,
  seq: number,
  ack: number,
  message: string,
  highlightLine = 0,
) {
  steps.push({
    type: 'tcpSend',
    data: { direction, content, seq, ack, message },
    highlightLine,
  });
}

/** 添加"传输中"动画占位步骤（tcpACK，不带 seq/ack，触发飞行动画收尾） */
function pushTransit(
  steps: Step[],
  message: string,
  highlightLine = 0,
): void {
  steps.push({ type: 'tcpACK', data: { message }, highlightLine });
}

// ==================== TCP 三次握手 ====================
// 标准流程（简化 seq 模型）：
//   ① Client → Server : SYN seq=1000
//   ② Server → Client : SYN+ACK seq=2000 ack=1001
//   ③ Client → Server : ACK seq=1001 ack=2001
//   → 双方 ESTABLISHED

export function tcpHandshakeSteps(): TCPStepResult {
  const steps: Step[] = [];

  // ── 初始状态 ──────────────────────────────────────
  pushState(steps, 'CLOSED', 'CLOSED',
    '初始状态：客户端和服务端均处于 CLOSED（关闭）状态，等待连接建立');

  // ── 第一次握手 ────────────────────────────────────
  pushState(steps, 'CLOSED', 'CLOSED',
    '第一次握手：客户端发送 SYN 同步报文段，请求建立连接');
  pushPacket(steps, 'c2s', 'SYN', 1000, 0,
    '客户端 → 服务端：SYN=1000（seq=1000, ack=0）');
  pushTransit(steps, 'SYN 报文段正在网络传输中...');

  pushState(steps, 'SYN_SENT', 'CLOSED',
    '客户端已发送 SYN，进入 SYN_SENT 状态，等待服务端 SYN+ACK');

  // ── 第二次握手 ────────────────────────────────────
  pushState(steps, 'SYN_SENT', 'CLOSED',
    '第二次握手：服务端收到 SYN，回复 SYN+ACK 确认');
  pushPacket(steps, 's2c', 'SYN+ACK', 2000, 1001,
    '服务端 → 客户端：SYN+ACK（seq=2000, ack=1001）');
  pushTransit(steps, 'SYN+ACK 报文段正在网络传输中...');

  pushState(steps, 'SYN_SENT', 'SYN_RECEIVED',
    '服务端已发送 SYN+ACK，进入 SYN_RECEIVED 状态');

  // ── 第三次握手 ────────────────────────────────────
  pushState(steps, 'SYN_SENT', 'SYN_RECEIVED',
    '第三次握手：客户端收到 SYN+ACK，发送 ACK 确认');
  pushPacket(steps, 'c2s', 'ACK', 1001, 2001,
    '客户端 → 服务端：ACK（seq=1001, ack=2001）');
  pushTransit(steps, 'ACK 报文段正在网络传输中...');

  pushState(steps, 'ESTABLISHED', 'SYN_RECEIVED',
    '客户端收到 SYN+ACK 并发送 ACK，进入 ESTABLISHED 状态');

  // ── 服务端收到 ACK ────────────────────────────────
  pushState(steps, 'ESTABLISHED', 'SYN_RECEIVED',
    '服务端收到客户端的 ACK，确认连接建立');
  pushState(steps, 'ESTABLISHED', 'ESTABLISHED',
    '✅ 三次握手完成！双方进入 ESTABLISHED（已建立连接）状态，可以开始传输数据');

  return { steps };
}

// ==================== TCP 四次挥手 ====================
// 标准流程：
//   ① Client → Server : FIN seq=1001
//   ② Server → Client : ACK ack=1002
//   ③ Server → Client : FIN seq=2001
//   ④ Client → Server : ACK ack=2002
//   客户端等待 2MSL → 双方 CLOSED

export function tcpWaveSteps(): TCPStepResult {
  const steps: Step[] = [];

  // ── 初始状态 ──────────────────────────────────────
  pushState(steps, 'ESTABLISHED', 'ESTABLISHED',
    '初始状态：双方处于 ESTABLISHED（已建立连接）状态，正常传输数据');

  // ── 第一次挥手 ────────────────────────────────────
  pushState(steps, 'ESTABLISHED', 'ESTABLISHED',
    '第一次挥手：客户端主动关闭连接，发送 FIN 报文段');
  pushPacket(steps, 'c2s', 'FIN', 1001, 0,
    '客户端 → 服务端：FIN（seq=1001）');
  pushTransit(steps, 'FIN 报文段正在网络传输中...');

  pushState(steps, 'FIN_WAIT_1', 'ESTABLISHED',
    '客户端已发送 FIN，进入 FIN_WAIT_1 状态，等待服务端 ACK');

  // ── 第二次挥手 ────────────────────────────────────
  pushState(steps, 'FIN_WAIT_1', 'ESTABLISHED',
    '第二次挥手：服务端收到 FIN，发送 ACK 确认');
  pushPacket(steps, 's2c', 'ACK', 0, 1002,
    '服务端 → 客户端：ACK（ack=1002）');
  pushTransit(steps, 'ACK 确认报文正在网络传输中...');

  pushState(steps, 'FIN_WAIT_1', 'ESTABLISHED',
    '服务端发送 ACK；客户端收到后进入 FIN_WAIT_2');
  pushState(steps, 'FIN_WAIT_2', 'CLOSE_WAIT',
    '客户端：等待服务端 FIN | 服务端：进入 CLOSE_WAIT，准备关闭');

  // ── 第三次挥手 ────────────────────────────────────
  pushState(steps, 'FIN_WAIT_2', 'CLOSE_WAIT',
    '第三次挥手：服务端准备好关闭，发送 FIN 报文段');
  pushPacket(steps, 's2c', 'FIN', 2001, 0,
    '服务端 → 客户端：FIN（seq=2001）');
  pushTransit(steps, 'FIN 报文段正在网络传输中...');

  pushState(steps, 'FIN_WAIT_2', 'LAST_ACK',
    '服务端已发送 FIN，进入 LAST_ACK 状态，等待客户端最终 ACK');

  // ── 第四次挥手 ────────────────────────────────────
  pushState(steps, 'FIN_WAIT_2', 'LAST_ACK',
    '第四次挥手：客户端收到 FIN，发送最终 ACK 确认');
  pushPacket(steps, 'c2s', 'ACK', 1002, 2002,
    '客户端 → 服务端：ACK（seq=1002, ack=2002）');
  pushTransit(steps, '最终 ACK 正在网络传输中...');

  pushState(steps, 'TIME_WAIT', 'LAST_ACK',
    '客户端发送最终 ACK 后进入 TIME_WAIT；服务端收到后立即关闭');

  // ── 服务端关闭 ────────────────────────────────────
  pushState(steps, 'TIME_WAIT', 'CLOSED',
    '服务端收到最终 ACK，进入 CLOSED 状态，连接关闭');

  // ── 2MSL 等待 ────────────────────────────────────
  pushState(steps, 'TIME_WAIT', 'CLOSED',
    '客户端进入 2MSL 等待（Maximum Segment Lifetime）...');
  pushState(steps, 'TIME_WAIT', 'CLOSED',
    '2MSL 等待期间：① 确保服务端收到最终 ACK ② 清除历史报文');
  pushState(steps, 'CLOSED', 'CLOSED',
    '✅ 四次挥手完成！2MSL 结束，双方回到 CLOSED 状态，连接彻底关闭');

  return { steps };
}
