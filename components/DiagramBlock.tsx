import React from 'react';

interface DiagramBlockProps {
  code: string;
}

interface FlowNode {
  id: string;
  text: string;
  type: 'rect' | 'diamond' | 'circle' | 'rounded';
}

interface FlowEdge {
  from: string;
  to: string;
  label?: string;
}

// 解析简单的图表语法
const parseFlowchart = (code: string): { nodes: FlowNode[]; edges: FlowEdge[] } => {
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];
  const nodeMap = new Map<string, FlowNode>();

  const lines = code.split('\n').filter(line => line.trim());

  for (const line of lines) {
    const trimmed = line.trim();
    
    // 跳过图表类型声明
    if (trimmed.startsWith('graph') || trimmed.startsWith('flowchart')) continue;

    // 解析边: A --> B 或 A -->|label| B
    const edgeMatch = trimmed.match(/^(\w+)\s*-->\s*(?:\|([^|]*)\|)?\s*(\w+)(?:\[([^\]]*)\])?/);
    if (edgeMatch) {
      const [, fromId, label, toId, toText] = edgeMatch;
      
      // 确保节点存在
      if (!nodeMap.has(fromId)) {
        const node: FlowNode = { id: fromId, text: fromId, type: 'rect' };
        nodes.push(node);
        nodeMap.set(fromId, node);
      }
      
      if (!nodeMap.has(toId)) {
        const node: FlowNode = { id: toId, text: toText || toId, type: 'rect' };
        nodes.push(node);
        nodeMap.set(toId, node);
      } else if (toText) {
        nodeMap.get(toId)!.text = toText;
      }

      edges.push({ from: fromId, to: toId, label });
      continue;
    }

    // 解析单独的节点定义: A[Text] 或 A{Text} 或 A((Text))
    const nodeMatch = trimmed.match(/^(\w+)(?:\[([^\]]*)\]|\{([^}]*)\}|\(\(([^)]*)\)\))?$/);
    if (nodeMatch) {
      const [, id, rectText, diamondText, circleText] = nodeMatch;
      if (!nodeMap.has(id)) {
        let type: FlowNode['type'] = 'rect';
        let text = id;
        
        if (rectText) { text = rectText; type = 'rect'; }
        else if (diamondText) { text = diamondText; type = 'diamond'; }
        else if (circleText) { text = circleText; type = 'circle'; }
        
        const node: FlowNode = { id, text, type };
        nodes.push(node);
        nodeMap.set(id, node);
      }
    }
  }

  return { nodes, edges };
};

// 解析列表/树形结构
const parseTree = (code: string): { items: { level: number; text: string }[] } => {
  const items: { level: number; text: string }[] = [];
  const lines = code.split('\n').filter(line => line.trim());

  for (const line of lines) {
    // 跳过类型声明
    if (line.trim().startsWith('mindmap') || line.trim().startsWith('tree')) continue;
    
    const indent = line.search(/\S/);
    const text = line.trim();
    if (text) {
      items.push({ level: Math.floor(indent / 2), text });
    }
  }

  return { items };
};

// 流程图渲染组件
const FlowchartRenderer: React.FC<{ nodes: FlowNode[]; edges: FlowEdge[] }> = ({ nodes, edges }) => {
  if (nodes.length === 0) return null;

  const nodeWidth = 140;
  const nodeHeight = 50;
  const horizontalGap = 60;
  const verticalGap = 80;

  // 简单布局：按层级排列
  const levels = new Map<string, number>();
  const visited = new Set<string>();
  
  // BFS 计算层级
  const queue: string[] = [];
  if (nodes.length > 0) {
    queue.push(nodes[0].id);
    levels.set(nodes[0].id, 0);
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    const currentLevel = levels.get(current) || 0;
    
    for (const edge of edges) {
      if (edge.from === current && !visited.has(edge.to)) {
        levels.set(edge.to, currentLevel + 1);
        queue.push(edge.to);
      }
    }
  }

  // 为没有连接的节点分配层级
  nodes.forEach((node, idx) => {
    if (!levels.has(node.id)) {
      levels.set(node.id, idx);
    }
  });

  // 按层级分组
  const levelGroups = new Map<number, FlowNode[]>();
  nodes.forEach(node => {
    const level = levels.get(node.id) || 0;
    if (!levelGroups.has(level)) levelGroups.set(level, []);
    levelGroups.get(level)!.push(node);
  });

  // 计算位置
  const positions = new Map<string, { x: number; y: number }>();
  const maxNodesInLevel = Math.max(...Array.from(levelGroups.values()).map(g => g.length));
  const svgWidth = Math.max(400, maxNodesInLevel * (nodeWidth + horizontalGap));
  const svgHeight = (levelGroups.size) * (nodeHeight + verticalGap) + 40;

  levelGroups.forEach((nodesInLevel, level) => {
    const totalWidth = nodesInLevel.length * nodeWidth + (nodesInLevel.length - 1) * horizontalGap;
    const startX = (svgWidth - totalWidth) / 2;
    
    nodesInLevel.forEach((node, idx) => {
      positions.set(node.id, {
        x: startX + idx * (nodeWidth + horizontalGap) + nodeWidth / 2,
        y: 30 + level * (nodeHeight + verticalGap) + nodeHeight / 2
      });
    });
  });

  return (
    <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="max-w-full">
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
        </marker>
      </defs>

      {/* 渲染边 */}
      {edges.map((edge, idx) => {
        const from = positions.get(edge.from);
        const to = positions.get(edge.to);
        if (!from || !to) return null;

        const midY = (from.y + to.y) / 2;
        
        return (
          <g key={idx}>
            <path
              d={`M ${from.x} ${from.y + nodeHeight / 2} 
                  Q ${from.x} ${midY}, ${(from.x + to.x) / 2} ${midY}
                  Q ${to.x} ${midY}, ${to.x} ${to.y - nodeHeight / 2 - 5}`}
              fill="none"
              stroke="#64748b"
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
            />
            {edge.label && (
              <text
                x={(from.x + to.x) / 2}
                y={midY - 5}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="12"
              >
                {edge.label}
              </text>
            )}
          </g>
        );
      })}

      {/* 渲染节点 */}
      {nodes.map(node => {
        const pos = positions.get(node.id);
        if (!pos) return null;

        return (
          <g key={node.id}>
            {node.type === 'diamond' ? (
              <polygon
                points={`${pos.x},${pos.y - 30} ${pos.x + 50},${pos.y} ${pos.x},${pos.y + 30} ${pos.x - 50},${pos.y}`}
                fill="#1e293b"
                stroke="#0ea5e9"
                strokeWidth="2"
              />
            ) : node.type === 'circle' ? (
              <circle
                cx={pos.x}
                cy={pos.y}
                r={25}
                fill="#1e293b"
                stroke="#0ea5e9"
                strokeWidth="2"
              />
            ) : (
              <rect
                x={pos.x - nodeWidth / 2}
                y={pos.y - nodeHeight / 2}
                width={nodeWidth}
                height={nodeHeight}
                rx="8"
                fill="#1e293b"
                stroke="#0ea5e9"
                strokeWidth="2"
              />
            )}
            <text
              x={pos.x}
              y={pos.y + 5}
              textAnchor="middle"
              fill="#e2e8f0"
              fontSize="13"
              fontWeight="500"
            >
              {node.text.length > 15 ? node.text.slice(0, 15) + '...' : node.text}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// 树形结构渲染组件
const TreeRenderer: React.FC<{ items: { level: number; text: string }[] }> = ({ items }) => {
  if (items.length === 0) return null;

  const colors = ['#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b'];

  return (
    <div className="space-y-1 py-2">
      {items.map((item, idx) => (
        <div
          key={idx}
          className="flex items-center gap-2"
          style={{ paddingLeft: `${item.level * 24}px` }}
        >
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: colors[item.level % colors.length] }}
          />
          <span className="text-slate-200 text-sm">{item.text}</span>
        </div>
      ))}
    </div>
  );
};

// 序列图数据结构
interface SequenceMessage {
  from: string;
  to: string;
  message: string;
  type: 'solid' | 'dashed';
}

// 解析序列图
const parseSequence = (code: string): { participants: string[]; messages: SequenceMessage[] } => {
  const participants: string[] = [];
  const messages: SequenceMessage[] = [];
  const participantSet = new Set<string>();

  const lines = code.split('\n').filter(line => line.trim());

  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('sequenceDiagram')) continue;
    if (trimmed.startsWith('participant')) {
      const match = trimmed.match(/participant\s+(\w+)/);
      if (match && !participantSet.has(match[1])) {
        participants.push(match[1]);
        participantSet.add(match[1]);
      }
      continue;
    }

    // 解析消息: A->>B: message 或 A-->>B: message
    const msgMatch = trimmed.match(/(\w+)\s*(--?>>)\s*(\w+)\s*:\s*(.+)/);
    if (msgMatch) {
      const [, from, arrow, to, message] = msgMatch;
      
      if (!participantSet.has(from)) {
        participants.push(from);
        participantSet.add(from);
      }
      if (!participantSet.has(to)) {
        participants.push(to);
        participantSet.add(to);
      }

      messages.push({
        from,
        to,
        message,
        type: arrow.includes('--') ? 'dashed' : 'solid'
      });
    }
  }

  return { participants, messages };
};

// 序列图渲染组件
const SequenceRenderer: React.FC<{ participants: string[]; messages: SequenceMessage[] }> = ({ participants, messages }) => {
  if (participants.length === 0) return null;

  const participantWidth = 100;
  const participantGap = 120;
  const messageHeight = 50;
  const headerHeight = 60;
  
  const svgWidth = participants.length * (participantWidth + participantGap);
  const svgHeight = headerHeight + messages.length * messageHeight + 40;

  const getX = (name: string) => {
    const idx = participants.indexOf(name);
    return idx * (participantWidth + participantGap) + participantWidth / 2 + 20;
  };

  return (
    <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="max-w-full">
      <defs>
        <marker id="seq-arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#0ea5e9" />
        </marker>
      </defs>

      {/* 参与者 */}
      {participants.map((p, idx) => {
        const x = getX(p);
        return (
          <g key={p}>
            <rect
              x={x - participantWidth / 2}
              y={10}
              width={participantWidth}
              height={35}
              rx="4"
              fill="#1e293b"
              stroke="#0ea5e9"
              strokeWidth="2"
            />
            <text x={x} y={32} textAnchor="middle" fill="#e2e8f0" fontSize="13" fontWeight="500">
              {p}
            </text>
            {/* 生命线 */}
            <line
              x1={x}
              y1={45}
              x2={x}
              y2={svgHeight - 10}
              stroke="#334155"
              strokeWidth="2"
              strokeDasharray="4"
            />
          </g>
        );
      })}

      {/* 消息 */}
      {messages.map((msg, idx) => {
        const fromX = getX(msg.from);
        const toX = getX(msg.to);
        const y = headerHeight + idx * messageHeight + 20;
        const isReverse = fromX > toX;

        return (
          <g key={idx}>
            <line
              x1={fromX}
              y1={y}
              x2={toX + (isReverse ? 5 : -5)}
              y2={y}
              stroke="#0ea5e9"
              strokeWidth="2"
              strokeDasharray={msg.type === 'dashed' ? '5,5' : undefined}
              markerEnd="url(#seq-arrow)"
            />
            <text
              x={(fromX + toX) / 2}
              y={y - 8}
              textAnchor="middle"
              fill="#94a3b8"
              fontSize="12"
            >
              {msg.message}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// 主组件
export const DiagramBlock: React.FC<DiagramBlockProps> = ({ code }) => {
  const trimmedCode = code.trim();
  
  // 判断图表类型
  let content: React.ReactNode = null;
  let diagramType = 'Diagram';

  if (trimmedCode.startsWith('graph') || trimmedCode.startsWith('flowchart')) {
    const { nodes, edges } = parseFlowchart(trimmedCode);
    content = <FlowchartRenderer nodes={nodes} edges={edges} />;
    diagramType = 'Flowchart';
  } else if (trimmedCode.startsWith('sequenceDiagram')) {
    const { participants, messages } = parseSequence(trimmedCode);
    content = <SequenceRenderer participants={participants} messages={messages} />;
    diagramType = 'Sequence';
  } else if (trimmedCode.startsWith('mindmap') || trimmedCode.startsWith('tree')) {
    const { items } = parseTree(trimmedCode);
    content = <TreeRenderer items={items} />;
    diagramType = 'Tree';
  } else {
    // 尝试作为流程图解析
    const { nodes, edges } = parseFlowchart(trimmedCode);
    if (nodes.length > 0) {
      content = <FlowchartRenderer nodes={nodes} edges={edges} />;
      diagramType = 'Flowchart';
    }
  }

  if (!content) {
    // 无法解析，显示原始代码
    return (
      <div className="my-4 rounded-lg overflow-hidden border border-slate-700 bg-slate-900/50">
        <div className="px-4 py-2 bg-slate-900/80 border-b border-slate-800">
          <span className="text-xs font-mono text-slate-400">Diagram (Raw)</span>
        </div>
        <div className="p-4">
          <pre className="text-slate-300 text-sm whitespace-pre-wrap">{code}</pre>
        </div>
      </div>
    );
  }

  return (
    <div className="my-4 rounded-lg overflow-hidden border border-slate-700 bg-slate-900/50">
      <div className="px-4 py-2 bg-slate-900/80 border-b border-slate-800">
        <span className="text-xs font-mono text-slate-400">{diagramType}</span>
      </div>
      <div className="p-4 overflow-x-auto flex justify-center bg-slate-950/50">
        {content}
      </div>
    </div>
  );
};
