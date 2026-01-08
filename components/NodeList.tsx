import React, { useState } from 'react';
import { LearningNode, NodeStatus } from '../types';
import { CheckCircle2, Circle, Lock, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

interface NodeListProps {
  nodes: LearningNode[];
  activeNodeIndex: number;
}

export const NodeList: React.FC<NodeListProps> = ({ nodes, activeNodeIndex }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div 
      className={`
        flex-shrink-0 bg-neutral-50 border-r border-neutral-200 flex flex-col h-full transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-20' : 'w-80'}
        hidden md:flex
      `}
    >
      <div className={`h-14 flex items-center border-b border-neutral-200 ${isCollapsed ? 'justify-center' : 'justify-between px-6'}`}>
        {!isCollapsed && (
          <div className="overflow-hidden whitespace-nowrap">
            <h2 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
              <span className="w-1 h-5 bg-neutral-900 rounded-full"></span>
              学习路径
            </h2>
          </div>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-neutral-400 hover:text-neutral-900 transition-colors p-1"
          title={isCollapsed ? "展开侧边栏" : "收起侧边栏"}
        >
          {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {nodes.map((node, index) => {
          const isActive = index === activeNodeIndex;
          const isCompleted = node.status === NodeStatus.COMPLETED;
          const isLocked = index > activeNodeIndex;

          return (
            <div 
              key={node.id}
              className={`
                relative rounded-xl border transition-all duration-300 group
                ${isCollapsed ? 'p-3 flex justify-center' : 'p-4'}
                ${isActive 
                  ? 'bg-white border-neutral-300 shadow-sm' 
                  : 'bg-neutral-50 border-neutral-200 hover:border-neutral-300'
                }
                ${isLocked ? 'opacity-50' : 'opacity-100'}
              `}
              title={isCollapsed ? node.title : undefined}
            >
              <div className={`flex items-start ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                <div className="mt-1 relative flex items-center justify-center">
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : isActive ? (
                    <div className="relative flex items-center justify-center w-5 h-5">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-neutral-400 opacity-20 animate-[pulse_2s_ease-in-out_infinite]"></span>
                      <span className="absolute inline-flex h-2.5 w-2.5 rounded-full bg-neutral-900"></span>
                    </div>
                  ) : isLocked ? (
                    <Lock className="w-5 h-5 text-neutral-300" />
                  ) : (
                    <Circle className="w-5 h-5 text-neutral-400" />
                  )}
                </div>
                
                {!isCollapsed && (
                  <div className="min-w-0 flex-1">
                    <h3 className={`text-sm font-medium truncate ${isActive ? 'text-neutral-900' : 'text-neutral-700'}`}>
                      {node.title}
                    </h3>
                    <p className="text-xs text-neutral-500 mt-1 leading-relaxed line-clamp-2">
                      {node.description}
                    </p>
                    
                    {isActive && node.status === NodeStatus.SUMMARIZING && (
                      <div className="mt-2 text-xs text-neutral-500 flex items-center gap-1 animate-pulse">
                        总结中...
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Connector Line */}
              {index < nodes.length - 1 && (
                <div className={`
                  absolute bg-neutral-200 -z-10
                  ${isCollapsed 
                    ? 'left-1/2 -translate-x-1/2 bottom-[-12px] w-0.5 h-3' 
                    : 'left-[29px] bottom-[-14px] w-0.5 h-4'
                  }
                `}></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
