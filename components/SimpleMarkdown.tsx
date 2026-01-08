import React, { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';
import { DiagramBlock } from './DiagramBlock';
import katex from 'katex';

interface SimpleMarkdownProps {
  content: string;
}

// 1. Component for Syntax-highlighted style Code Blocks - OpenAI 风格
const CodeBlock: React.FC<{ language: string; code: string }> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-neutral-200 bg-neutral-50 shadow-sm group">
      <div className="flex items-center justify-between px-4 py-2 bg-neutral-100 border-b border-neutral-200">
        <div className="flex items-center gap-2">
           <Terminal className="w-3.5 h-3.5 text-neutral-400" />
           <span className="text-xs font-mono text-neutral-500 lowercase">{language || 'code'}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-700 transition-colors opacity-0 group-hover:opacity-100"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? '已复制' : '复制'}</span>
        </button>
      </div>
      <div className="p-4 overflow-x-auto custom-scrollbar bg-neutral-900">
        <pre className="text-sm font-mono leading-relaxed text-neutral-100">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};

// 2. Math Formula Component
const MathBlock: React.FC<{ formula: string; displayMode: boolean }> = ({ formula, displayMode }) => {
  try {
    const html = katex.renderToString(formula, {
      displayMode,
      throwOnError: false,
      trust: true,
    });
    return (
      <span
        className={displayMode ? "block my-4 overflow-x-auto text-center" : "inline-block align-middle mx-0.5"}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  } catch (e) {
    return <span className="text-red-500">{formula}</span>;
  }
};


// 3. Component for Inline Text (Bold, Code, Math, etc.) - OpenAI 风格
const InlineText: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;

  // Split by bold, inline code, and inline math
  const parts = text.split(/(\*\*.*?\*\*|`.*?`|\$[^$]+\$)/g);

  return (
    <span>
      {parts.map((part: string, index: number) => {
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
          return <strong key={index} className="font-semibold text-neutral-900">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
          return (
            <code key={index} className="bg-neutral-100 text-neutral-800 px-1.5 py-0.5 rounded text-[0.9em] font-mono mx-0.5 border border-neutral-200 align-middle">
              {part.slice(1, -1)}
            </code>
          );
        }
        // Inline math: $...$
        if (part.startsWith('$') && part.endsWith('$') && part.length > 2 && !part.startsWith('$$')) {
          return <MathBlock key={index} formula={part.slice(1, -1)} displayMode={false} />;
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
};

// 4. Table Component - OpenAI 风格
const Table: React.FC<{ rows: string[][] }> = ({ rows }) => {
  if (rows.length < 2) return null;

  const headers = rows[0];
  // Skip separator row (index 1), data starts from index 2
  const dataRows = rows.slice(2);

  return (
    <div className="my-4 overflow-x-auto">
      <table className="w-full border-collapse border border-neutral-200 rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-neutral-50">
            {headers.map((header: string, idx: number) => (
              <th
                key={idx}
                className="border border-neutral-200 px-4 py-2 text-left text-neutral-900 font-semibold text-sm"
              >
                <InlineText text={header.trim()} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataRows.map((row: string[], rowIdx: number) => (
            <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}>
              {row.map((cell: string, cellIdx: number) => (
                <td
                  key={cellIdx}
                  className="border border-neutral-200 px-4 py-2 text-neutral-700 text-sm"
                >
                  <InlineText text={cell.trim()} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};


// 5. Helper function to render a single line - OpenAI 风格
const renderLine = (line: string, lineIndex: number): React.ReactNode => {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // Skip table separator lines
  if (/^[\s|:\-]+$/.test(trimmed) && trimmed.includes('|')) {
    return null;
  }

  if (line.startsWith('##### ')) {
    return <h5 key={lineIndex} className="text-sm font-semibold text-neutral-800 mt-4 mb-1"><InlineText text={line.replace('##### ', '')} /></h5>;
  }
  if (line.startsWith('#### ')) {
    return <h4 key={lineIndex} className="text-base font-semibold text-neutral-900 mt-5 mb-2"><InlineText text={line.replace('#### ', '')} /></h4>;
  }
  if (line.startsWith('### ')) {
    return <h3 key={lineIndex} className="text-lg font-semibold text-neutral-900 mt-6 mb-2"><InlineText text={line.replace('### ', '')} /></h3>;
  }
  if (line.startsWith('## ')) {
    return <h2 key={lineIndex} className="text-xl font-semibold text-neutral-900 mt-8 mb-4 border-b border-neutral-200 pb-2"><InlineText text={line.replace('## ', '')} /></h2>;
  }
  if (line.startsWith('# ')) {
    return <h1 key={lineIndex} className="text-2xl font-bold text-neutral-900 mt-8 mb-4"><InlineText text={line.replace('# ', '')} /></h1>;
  }

  if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
    return (
      <div key={lineIndex} className="flex items-start ml-2 mb-1">
        <span className="mr-3 text-neutral-400 mt-2 text-[0.5rem]">●</span>
        <span><InlineText text={trimmed.replace(/^[-*]\s/, '')} /></span>
      </div>
    );
  }

  if (trimmed.match(/^\d+\.\s/)) {
    return (
      <div key={lineIndex} className="flex items-start ml-2 mb-1">
        <span className="mr-2 text-neutral-500 font-mono text-sm font-medium min-w-[1.2rem]">{trimmed.match(/^\d+\./)?.[0]}</span>
        <span><InlineText text={trimmed.replace(/^\d+\.\s/, '')} /></span>
      </div>
    );
  }

  if (line.startsWith('> ')) {
    return (
      <div key={lineIndex} className="border-l-4 border-neutral-300 pl-4 py-1 my-4 bg-neutral-50 italic text-neutral-600 rounded-r">
        <InlineText text={line.replace(/^>\s/, '')} />
      </div>
    );
  }

  // Horizontal rule
  if (/^[-*_]{3,}$/.test(trimmed)) {
    return <hr key={lineIndex} className="my-4 border-neutral-200" />;
  }

  return (
    <p key={lineIndex} className="mb-2">
      <InlineText text={line} />
    </p>
  );
};


// 6. Helper function to parse table from lines
const parseTable = (lines: string[], startIdx: number): { rows: string[][]; endIdx: number } | null => {
  const rows: string[][] = [];
  let i = startIdx;

  while (i < lines.length) {
    const line = lines[i].trim();
    
    // Check if line contains table cells
    if (!line.includes('|')) break;
    
    // Parse cells from line
    const cells = line
      .split('|')
      .map(cell => cell.trim())
      .filter((cell, idx, arr) => {
        // Filter out empty cells from leading/trailing |
        if (idx === 0 && cell === '') return false;
        if (idx === arr.length - 1 && cell === '') return false;
        return true;
      });

    // Skip separator row but keep track of it
    if (/^[\s|:\-]+$/.test(line)) {
      rows.push(['__SEPARATOR__']);
    } else if (cells.length > 0) {
      rows.push(cells);
    }
    
    i++;
  }

  // Valid table needs at least header + separator + 1 data row
  if (rows.length >= 3 && rows[1][0] === '__SEPARATOR__') {
    // Remove separator marker
    rows.splice(1, 1);
    // Add back a placeholder for Table component
    rows.splice(1, 0, ['---']);
    return { rows, endIdx: i };
  }

  return null;
};

// 7. Main Parser Component
export const SimpleMarkdown: React.FC<SimpleMarkdownProps> = ({ content }) => {
  const mathAndCodeBlocks = content.split(/(\$\$[\s\S]*?\$\$|```[\s\S]*?```)/g);

  return (
    <div className="text-neutral-700 leading-7 space-y-2">
      {mathAndCodeBlocks.map((block: string, blockIndex: number) => {
        // Block math: $$...$$
        if (block.startsWith('$$') && block.endsWith('$$')) {
          const formula = block.slice(2, -2).trim();
          return <MathBlock key={blockIndex} formula={formula} displayMode={true} />;
        }
        
        if (block.startsWith('```')) {
          const lines = block.split('\n');
          const language = lines[0].replace(/^```/, '').trim();
          const code = lines.slice(1, -1).join('\n');
          
          if (language === 'mermaid' || language === 'diagram') {
            return <DiagramBlock key={blockIndex} code={code} />;
          }
          
          return <CodeBlock key={blockIndex} language={language} code={code} />;
        }

        // Process regular text with potential tables
        const lines = block.split('\n');
        const elements: React.ReactNode[] = [];
        let i = 0;

        while (i < lines.length) {
          const line = lines[i].trim();
          
          // Check if this could be start of a table
          if (line.includes('|') && i + 1 < lines.length) {
            const nextLine = lines[i + 1].trim();
            // Check if next line is separator (contains only |, -, :, spaces)
            if (nextLine.includes('|') && /^[\s|:\-]+$/.test(nextLine)) {
              const tableResult = parseTable(lines, i);
              if (tableResult) {
                elements.push(<Table key={`table-${i}`} rows={tableResult.rows} />);
                i = tableResult.endIdx;
                continue;
              }
            }
          }
          
          // Regular line
          if (line) {
            elements.push(renderLine(lines[i], i));
          }
          i++;
        }

        return <div key={blockIndex}>{elements}</div>;
      })}
    </div>
  );
};
