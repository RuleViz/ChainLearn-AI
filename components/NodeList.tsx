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
        flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col h-full transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-20' : 'w-80'}
        hidden md:flex
      `}
    >
      <div className={`h-16 flex items-center border-b border-slate-800 ${isCollapsed ? 'justify-center' : 'justify-between px-6'}`}>
        {!isCollapsed && (
          <div className="overflow-hidden whitespace-nowrap">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2 h-6 bg-gradient-to-b from-sky-400 to-indigo-500 rounded-full"></span>
              Learning Path
            </h2>
          </div>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-slate-500 hover:text-white transition-colors p-1"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
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
                  ? 'bg-slate-800 border-sky-500/30 shadow-[0_0_20px_rgba(14,165,233,0.15)]' 
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                }
                ${isLocked ? 'opacity-50' : 'opacity-100'}
              `}
              title={isCollapsed ? node.title : undefined}
            >
              <div className={`flex items-start ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                <div className="mt-1 relative flex items-center justify-center">
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : isActive ? (
                    <div className="relative flex items-center justify-center w-5 h-5">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-20 animate-[pulse_2s_ease-in-out_infinite]"></span>
                      <span className="absolute inline-flex h-2.5 w-2.5 rounded-full bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.8)]"></span>
                    </div>
                  ) : isLocked ? (
                    <Lock className="w-5 h-5 text-slate-600" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                
                {!isCollapsed && (
                  <div className="min-w-0 flex-1">
                    <h3 className={`text-sm font-semibold truncate ${isActive ? 'text-sky-300' : 'text-slate-200'}`}>
                      {node.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                      {node.description}
                    </p>
                    
                    {isActive && node.status === NodeStatus.SUMMARIZING && (
                      <div className="mt-2 text-xs text-indigo-400 flex items-center gap-1 animate-pulse">
                        Summarizing...
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Connector Line */}
              {index < nodes.length - 1 && (
                <div className={`
                  absolute bg-slate-800 -z-10
                  ${isCollapsed 
                    ? 'left-1/2 -translate-x-1/2 bottom-[-16px] w-0.5 h-4' 
                    : 'left-[29px] bottom-[-20px] w-0.5 h-5'
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