import React, { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';

interface SimpleMarkdownProps {
  content: string;
}

// 1. Component for Syntax-highlighted style Code Blocks
const CodeBlock: React.FC<{ language: string; code: string }> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded-lg overflow-hidden border border-slate-700 bg-slate-950/50 shadow-sm group">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-slate-800">
        <div className="flex items-center gap-2">
           <Terminal className="w-3.5 h-3.5 text-slate-500" />
           <span className="text-xs font-mono text-slate-400 lowercase">{language || 'code'}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-sky-400 transition-colors opacity-0 group-hover:opacity-100"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
      <div className="p-4 overflow-x-auto custom-scrollbar">
        <pre className="text-sm font-mono leading-relaxed text-slate-200">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};

// 2. Component for Inline Text (Bold, Code, etc.)
const InlineText: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;

  // Split by bold (**...**) and inline code (`...`)
  // Regex explanation: Capture (**text**) OR (`text`)
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);

  return (
    <span>
      {parts.map((part, index) => {
        // Handle Bold
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
          return <strong key={index} className="font-bold text-sky-200">{part.slice(2, -2)}</strong>;
        }
        // Handle Inline Code
        if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
          return (
            <code key={index} className="bg-slate-800/80 text-sky-300 px-1.5 py-0.5 rounded text-[0.9em] font-mono mx-0.5 border border-slate-700/50 align-middle">
              {part.slice(1, -1)}
            </code>
          );
        }
        // Handle Plain Text
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
};

// 3. Main Parser Component
export const SimpleMarkdown: React.FC<SimpleMarkdownProps> = ({ content }) => {
  // Regex to split content into: [Text, CodeBlock, Text, CodeBlock...]
  // Captures the full code block including fences
  const blocks = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="text-slate-300 leading-7 space-y-2">
      {blocks.map((block, blockIndex) => {
        // A. Handle Code Blocks
        if (block.startsWith('```')) {
          const lines = block.split('\n');
          // Extract language (e.g., ```python -> python)
          const language = lines[0].replace(/^```/, '').trim();
          // Extract code (remove first and last lines)
          const code = lines.slice(1, -1).join('\n');
          return <CodeBlock key={blockIndex} language={language} code={code} />;
        }

        // B. Handle Regular Markdown Text
        // We split by newlines to handle headers, lists, etc.
        const lines = block.split('\n');
        
        return (
          <div key={blockIndex}>
            {lines.map((line, lineIndex) => {
              const trimmed = line.trim();
              if (!trimmed) return null; // Skip empty lines mostly

              // Headers
              if (line.startsWith('### ')) {
                return <h3 key={lineIndex} className="text-lg font-bold text-sky-100 mt-6 mb-2"><InlineText text={line.replace('### ', '')} /></h3>;
              }
              if (line.startsWith('## ')) {
                 return <h2 key={lineIndex} className="text-xl font-bold text-white mt-8 mb-4 border-b border-slate-700 pb-2"><InlineText text={line.replace('## ', '')} /></h2>;
              }
              if (line.startsWith('# ')) {
                 return <h1 key={lineIndex} className="text-2xl font-extrabold text-white mt-8 mb-4"><InlineText text={line.replace('# ', '')} /></h1>;
              }

              // Lists (Unordered)
              if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                return (
                  <div key={lineIndex} className="flex items-start ml-2 mb-1">
                    <span className="mr-3 text-sky-500 mt-1.5 text-[0.6rem]">●</span>
                    <span><InlineText text={trimmed.replace(/^[-*]\s/, '')} /></span>
                  </div>
                );
              }
              
               // Lists (Ordered)
              if (trimmed.match(/^\d+\.\s/)) {
                return (
                  <div key={lineIndex} className="flex items-start ml-2 mb-1">
                     <span className="mr-2 text-emerald-500 font-mono text-sm font-bold min-w-[1.2rem]">{trimmed.match(/^\d+\./)?.[0]}</span>
                    <span><InlineText text={trimmed.replace(/^\d+\.\s/, '')} /></span>
                  </div>
                );
              }

              // Blockquotes
              if (line.startsWith('> ')) {
                 return (
                    <div key={lineIndex} className="border-l-4 border-sky-600 pl-4 py-1 my-4 bg-slate-800/30 italic text-slate-400">
                        <InlineText text={line.replace(/^>\s/, '')} />
                    </div>
                 );
              }

              // Standard Paragraph
              return (
                <p key={lineIndex} className="mb-2">
                  <InlineText text={line} />
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};