import { useEffect, useRef, useState } from 'react';
import { PacketDirection, TcpPhase } from '../../types';

// ========== 类型定义 ==========

interface Packet {
  id: number;
  direction: PacketDirection;
  content: string;   // SYN / SYN+ACK / ACK / FIN
  seq?: number;      // 序列号
  ack?: number;      // 确认号
  ackPacket?: boolean;
}

/** 记录已渲染的数据包（含在传输线上的位置） */
interface RenderedPacket extends Packet {
  /** 包在 Y 轴上的偏移（用于纵向堆叠，每多一个包向下移一格） */
  stackOffset: number;
  /** 是否正在飞（true = 有飞行动画，false = 已到达静止） */
  flying: boolean;
  /** 包沿线的百分比进度（0=起点, 1=终点），flying=false 时为 0 或 1 */
  progress: number;
}

interface Props {
  clientState: TcpPhase;
  serverState: TcpPhase;
  packets: Packet[];
  currentPacketId: number | null;
}

// ========== 常量 ==========

const STATE_COLORS: Record<TcpPhase, string> = {
  CLOSED:       '#64748b',
  SYN_SENT:     '#f59e0b',
  SYN_RECEIVED: '#8b5cf6',
  ESTABLISHED:  '#22c55e',
  FIN_WAIT_1:   '#ef4444',
  FIN_WAIT_2:   '#f97316',
  CLOSE_WAIT:   '#a855f7',
  CLOSING:      '#ec4899',
  LAST_ACK:     '#f43f5e',
  TIME_WAIT:    '#06b6d4',
};

const STATE_LABELS: Record<TcpPhase, string> = {
  CLOSED:       'CLOSED',
  SYN_SENT:     'SYN_SENT',
  SYN_RECEIVED: 'SYN_RECEIVED',
  ESTABLISHED:  'ESTABLISHED',
  FIN_WAIT_1:   'FIN_WAIT_1',
  FIN_WAIT_2:   'FIN_WAIT_2',
  CLOSE_WAIT:   'CLOSE_WAIT',
  CLOSING:      'CLOSING',
  LAST_ACK:     'LAST_ACK',
  TIME_WAIT:    'TIME_WAIT',
};

const PACKET_COLORS: Record<string, string> = {
  SYN:     '#3b82f6',  // 蓝色
  'SYN+ACK': '#8b5cf6', // 紫色
  ACK:     '#22c55e',  // 绿色
  FIN:     '#ef4444',  // 红色
};

function getPacketColor(content: string): string {
  return PACKET_COLORS[content] ?? '#94a3b8';
}

// ========== 组件 ==========

export default function TCPVisualizer({
  clientState, serverState, packets, currentPacketId,
}: Props) {
  // 所有已渲染的数据包（永久保留，不删除）
  const [renderedPackets, setRenderedPackets] = useState<RenderedPacket[]>([]);

  // 飞行进度（0 → 1）由 CSS animation 控制，这里只记录该包已加入
  const prevPacketId = useRef<number | null>(null);

  // 追踪每个方向的包数量（用于纵向堆叠）
  const c2sCount = useRef(0);
  const s2cCount = useRef(0);

  // 当 currentPacketId 从 null → 非null：新包开始飞（加入渲染列表）
  // 当 currentPacketId 从 非null → null：当前包飞到了（标记为已到达）
  useEffect(() => {
    // 新包开始飞
    if (prevPacketId.current === null && currentPacketId !== null) {
      const latest = packets.find(p => p.id === currentPacketId);
      if (!latest) return;

      // 统计该方向的包序号（用于纵向堆叠）
      if (latest.direction === 'c2s') {
        c2sCount.current++;
      } else {
        s2cCount.current++;
      }

      const offset = latest.direction === 'c2s' ? c2sCount.current : s2cCount.current;

      setRenderedPackets(prev => [
        ...prev,
        { ...latest, stackOffset: offset, flying: true, progress: 0 },
      ]);
    }

    // 当前包飞到了
    if (prevPacketId.current !== null && currentPacketId === null) {
      // 将上一个包标记为"已到达"（停止飞行动画）
      setRenderedPackets(prev =>
        prev.map(p =>
          p.id === prevPacketId.current
            ? { ...p, flying: false }
            : p,
        ),
      );
    }

    prevPacketId.current = currentPacketId;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPacketId, packets.length]);

  // 全部清空（重置）
  useEffect(() => {
    if (packets.length === 0) {
      setRenderedPackets([]);
      c2sCount.current = 0;
      s2cCount.current = 0;
      prevPacketId.current = null;
    }
  }, [packets.length]);

  // ========== 布局参数 ==========
  const SVG_W = 700;
  const BOX_W = 180;
  const CLIENT_X = 20;
  const SERVER_X = SVG_W - BOX_W - 20;
  const MID_X   = SVG_W / 2;

  // 传输线起点终点
  const LINE_START = CLIENT_X + BOX_W + 10; // 210
  const LINE_END   = SERVER_X - 10;       // 490

  // 每行轨道高度
  const LANE_H = 62;
  // 动态 SVG 高度 = 顶部固定区 + 每行轨道
  const HEADER_H = 10;
  const SVG_H = HEADER_H + Math.max(renderedPackets.length, 1) * LANE_H;
  // TIME_WAIT 额外空间
  const TIME_WAIT_EXTRA = clientState === 'TIME_WAIT' || serverState === 'TIME_WAIT' ? 80 : 0;
  const SVG_H_TOTAL = SVG_H + TIME_WAIT_EXTRA;

  /**
   * 计算第 i 个数据包所在行的 Y 中心坐标
   */
  function getLaneY(index: number): number {
    return HEADER_H + index * LANE_H + LANE_H / 2;
  }

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-4 flex-1 overflow-hidden">
      {/* ===== CSS 动画 ===== */}
      <style>{`
        @keyframes fly-c2s {
          from { opacity: 0; transform: translateX(0px); }
          5%  { opacity: 1; }
          to   { opacity: 1; transform: translateX(280px); }
        }
        @keyframes fly-s2c {
          from { opacity: 0; transform: translateX(0px); }
          5%  { opacity: 1; }
          to   { opacity: 1; transform: translateX(-280px); }
        }
        @keyframes arrive-pop {
          0%   { opacity: 0.6; transform: scale(0.8); }
          60%  { transform: scale(1.1); }
          100% { opacity: 1;   transform: scale(1); }
        }
        @keyframes pulse-glow {
          0%, 100% { filter: drop-shadow(0 0 3px currentColor); }
          50%       { filter: drop-shadow(0 0 10px currentColor); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.35; }
        }
        @keyframes msl-ring {
          from { stroke-dashoffset: 0; }
          to   { stroke-dashoffset: -62.8; }
        }
        @keyframes pulse-ring {
          0%   { r: 12; opacity: 0.9; }
          100% { r: 22; opacity: 0; }
        }
        .fly-c2s { animation: fly-c2s 0.55s ease-in-out forwards; }
        .fly-s2c  { animation: fly-s2c 0.55s ease-in-out forwards; }
        .arrive-pop { animation: arrive-pop 0.35s ease-out forwards; }
        .pulse-glow { animation: pulse-glow 0.9s ease-in-out infinite; }
        .blink       { animation: blink 1.2s ease-in-out infinite; }
        .msl-ring    { animation: msl-ring 2s linear infinite; }
        .pulse-ring  { animation: pulse-ring 0.8s ease-out infinite; }
      `}</style>

      <svg
        width={SVG_W}
        height={SVG_H_TOTAL}
        className="mx-auto"
        style={{ maxWidth: '100%' }}
      >
        {/* ===== SVG 滤镜（发光）===== */}
        <defs>
          <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ===== 每行数据包轨道 ===== */}
        {renderedPackets.map((pkt, idx) => {
          const isC2S = pkt.direction === 'c2s';
          const color = getPacketColor(pkt.content);
          const lineY = getLaneY(idx);

          // 包当前位置（飞行用动画起点，已到达用终点）
          let px: number;
          if (pkt.flying) {
            px = isC2S ? LINE_START : LINE_END;
          } else {
            px = isC2S ? LINE_END : LINE_START;
          }

          // 每行轨道背景
          const laneTop = HEADER_H + idx * LANE_H;

          return (
            <g key={pkt.id}>
              {/* 行背景（交替深浅） */}
              <rect
                x={0} y={laneTop}
                width={SVG_W} height={LANE_H}
                fill={idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.01)'}
              />

              {/* 迷你客户端图标（每行） */}
              <circle cx={CLIENT_X + BOX_W - 5} cy={lineY} r={9}
                fill="rgba(255,255,255,0.08)" />
              <text x={CLIENT_X + BOX_W - 5} y={lineY}
                textAnchor="middle" dominantBaseline="central" fontSize={11}>👤</text>
              <text x={CLIENT_X + BOX_W + 14} y={lineY - 5}
                textAnchor="start" fontSize={8} fill="rgba(255,255,255,0.4)">客户端</text>

              {/* 迷你服务端图标（每行） */}
              <circle cx={SERVER_X + 5} cy={lineY} r={9}
                fill="rgba(255,255,255,0.08)" />
              <text x={SERVER_X + 5} y={lineY}
                textAnchor="middle" dominantBaseline="central" fontSize={11}>🖥️</text>
              <text x={SERVER_X - 14} y={lineY - 5}
                textAnchor="end" fontSize={8} fill="rgba(255,255,255,0.4)">服务端</text>

              {/* 传输线（虚线） */}
              <line
                x1={CLIENT_X + BOX_W + 22} y1={lineY}
                x2={SERVER_X - 22} y2={lineY}
                stroke="rgba(255,255,255,0.12)" strokeWidth={1.5}
                strokeDasharray="5 4"
              />

              {/* 飞行轨迹（仅飞行中显示） */}
              {pkt.flying && (
                <line
                  x1={LINE_START} y1={lineY}
                  x2={LINE_END} y2={lineY}
                  stroke={color} strokeWidth={1.5}
                  strokeOpacity={0.25}
                  strokeDasharray="5 3"
                />
              )}

              {/* 数据包本体 */}
              <g
                className={pkt.flying
                  ? (isC2S ? 'fly-c2s' : 'fly-s2c')
                  : 'arrive-pop'}
                style={{ color }}
              >
                {/* 发光外圈（飞行中） */}
                {pkt.flying && (
                  <circle
                    cx={px} cy={lineY}
                    r={22}
                    fill={color}
                    opacity={0.15}
                    className="pulse-ring"
                  />
                )}
                {/* 圆角矩形主体 */}
                <rect
                  x={px - 38} y={lineY - 16}
                  width={76} height={32} rx={9}
                  fill={color}
                  stroke={pkt.flying ? 'white' : 'rgba(255,255,255,0.5)'}
                  strokeWidth={pkt.flying ? 2 : 1.5}
                  filter={pkt.flying ? 'url(#glow)' : undefined}
                  className={pkt.flying ? 'pulse-glow' : undefined}
                />
                {/* 内容标签 */}
                <text
                  x={px} y={lineY + 1}
                  textAnchor="middle" dominantBaseline="central"
                  fontSize={11} fontWeight="bold" fill="white">
                  {pkt.content}
                </text>
              </g>

              {/* seq / ack 标签（包上方） */}
              {pkt.seq !== undefined && pkt.seq > 0 && (
                <text
                  x={px} y={lineY - 20}
                  textAnchor="middle"
                  fontSize={8.5} fontWeight="bold" fill={color}>
                  {`seq=${pkt.seq}`}
                  {pkt.ack !== undefined && pkt.ack > 0 ? ` ack=${pkt.ack}` : ''}
                </text>
              )}
              {pkt.seq === undefined && pkt.ack !== undefined && pkt.ack > 0 && (
                <text
                  x={px} y={lineY - 20}
                  textAnchor="middle"
                  fontSize={8.5} fontWeight="bold" fill={color}>
                  {`ack=${pkt.ack}`}
                </text>
              )}

              {/* 方向箭头（包旁边） */}
              <text
                x={isC2S ? px + 42 : px - 42}
                y={lineY}
                textAnchor="middle" dominantBaseline="central"
                fontSize={16} fontWeight="bold" fill={color}
                opacity={pkt.flying ? 0.9 : 0.6}>
                {isC2S ? '→' : '←'}
              </text>

              {/* 飞行方向文字（飞行中） */}
              {pkt.flying && (
                <text
                  x={MID_X}
                  y={lineY - 26}
                  textAnchor="middle"
                  fontSize={9} fontWeight="bold" fill={color}
                  className="blink">
                  {isC2S ? '客户端 → 服务端' : '服务端 → 客户端'}
                </text>
              )}
            </g>
          );
        })}

        {/* ===== 顶部状态栏（固定标题行）===== */}
        {/* 客户端状态 */}
        <rect
          x={CLIENT_X} y={2}
          width={BOX_W} height={32} rx={10}
          fill={STATE_COLORS[clientState]}
          fillOpacity={0.15}
          stroke={STATE_COLORS[clientState]}
          strokeWidth={1.5}
        />
        <text x={CLIENT_X + 14} y={19}
          textAnchor="start" fontSize={12} fontWeight="bold"
          fill={STATE_COLORS[clientState]}>
          👤 客户端
        </text>
        <text x={CLIENT_X + BOX_W - 8} y={19}
          textAnchor="end" fontSize={9} fontWeight="bold"
          fill={STATE_COLORS[clientState]}>
          {STATE_LABELS[clientState]}
        </text>

        {/* 服务端状态 */}
        <rect
          x={SERVER_X} y={2}
          width={BOX_W} height={32} rx={10}
          fill={STATE_COLORS[serverState]}
          fillOpacity={0.15}
          stroke={STATE_COLORS[serverState]}
          strokeWidth={1.5}
        />
        <text x={SERVER_X + 14} y={19}
          textAnchor="start" fontSize={12} fontWeight="bold"
          fill={STATE_COLORS[serverState]}>
          🖥️ 服务端
        </text>
        <text x={SERVER_X + BOX_W - 8} y={19}
          textAnchor="end" fontSize={9} fontWeight="bold"
          fill={STATE_COLORS[serverState]}>
          {STATE_LABELS[serverState]}
        </text>

        {/* ===== TIME_WAIT 倒计时 ===== */}
        {clientState === 'TIME_WAIT' && (
          <g>
            <text x={MID_X} y={SVG_H_TOTAL - 30}
              textAnchor="middle" fontSize={10} fill="#06b6d4" className="blink">
              ⏳ 等待 2MSL（最大报文段生存时间）...
            </text>
            <circle
              cx={MID_X} cy={SVG_H_TOTAL - 12}
              r={10} fill="none" stroke="#06b6d4"
              strokeWidth={2} strokeDasharray="18 44"
              className="msl-ring"
            />
          </g>
        )}
      </svg>

      {/* ===== 图例 ===== */}
      <div className="flex justify-center mt-3 gap-5 flex-wrap text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-blue-500" />
          SYN 同步请求
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-purple-500" />
          SYN+ACK 同步确认
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-green-500" />
          ACK 确认应答
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-red-500" />
          FIN 结束报文
        </span>
      </div>
    </div>
  );
}
