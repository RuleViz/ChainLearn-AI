import React, { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';
import { DiagramBlock } from './DiagramBlock';
import katex from 'katex';

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
    return <span className="text-red-400">{formula}</span>;
  }
};

// 3. Component for Inline Text (Bold, Code, Math, etc.)
const InlineText: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;

  // Match: **bold**, `code`, $math$ (but not $$)
  const parts = text.split(/(\*\*.*?\*\*|`.*?`|\$(?!\$).*?\$(?!\$))/g);

  return (
    <span>
      {parts.map((part: string, index: number) => {
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
          return <strong key={index} className="font-bold text-sky-200">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
          return (
            <code key={index} className="bg-slate-800/80 text-sky-300 px-1.5 py-0.5 rounded text-[0.9em] font-mono mx-0.5 border border-slate-700/50 align-middle">
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

// 4. Table Component
const Table: React.FC<{ rows: string[][] }> = ({ rows }) => {
  if (rows.length < 2) return null;

  const headers = rows[0];
  const dataRows = rows.slice(2);

  return (
    <div className="my-4 overflow-x-auto">
      <table className="w-full border-collapse border border-slate-700">
        <thead>
          <tr className="bg-slate-800/50">
            {headers.map((header: string, idx: number) => (
              <th
                key={idx}
                className="border border-slate-700 px-4 py-2 text-left text-sky-200 font-semibold"
              >
                <InlineText text={header.trim()} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataRows.map((row: string[], rowIdx: number) => (
            <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-slate-950/30' : 'bg-slate-900/20'}>
              {row.map((cell: string, cellIdx: number) => (
                <td
                  key={cellIdx}
                  className="border border-slate-700 px-4 py-2 text-slate-300"
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

// 5. Helper function to render a single line
const renderLine = (line: string, lineIndex: number): React.ReactNode => {
  const trimmed = line.trim();
  if (!trimmed) return null;

  if (line.startsWith('##### ')) {
    return <h5 key={lineIndex} className="text-sm font-bold text-slate-200 mt-4 mb-1"><InlineText text={line.replace('##### ', '')} /></h5>;
  }
  if (line.startsWith('#### ')) {
    return <h4 key={lineIndex} className="text-base font-bold text-sky-50 mt-5 mb-2"><InlineText text={line.replace('#### ', '')} /></h4>;
  }
  if (line.startsWith('### ')) {
    return <h3 key={lineIndex} className="text-lg font-bold text-sky-100 mt-6 mb-2"><InlineText text={line.replace('### ', '')} /></h3>;
  }
  if (line.startsWith('## ')) {
    return <h2 key={lineIndex} className="text-xl font-bold text-white mt-8 mb-4 border-b border-slate-700 pb-2"><InlineText text={line.replace('## ', '')} /></h2>;
  }
  if (line.startsWith('# ')) {
    return <h1 key={lineIndex} className="text-2xl font-extrabold text-white mt-8 mb-4"><InlineText text={line.replace('# ', '')} /></h1>;
  }

  if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
    return (
      <div key={lineIndex} className="flex items-start ml-2 mb-1">
        <span className="mr-3 text-sky-500 mt-1.5 text-[0.6rem]">●</span>
        <span><InlineText text={trimmed.replace(/^[-*]\s/, '')} /></span>
      </div>
    );
  }

  if (trimmed.match(/^\d+\.\s/)) {
    return (
      <div key={lineIndex} className="flex items-start ml-2 mb-1">
        <span className="mr-2 text-emerald-500 font-mono text-sm font-bold min-w-[1.2rem]">{trimmed.match(/^\d+\./)?.[0]}</span>
        <span><InlineText text={trimmed.replace(/^\d+\.\s/, '')} /></span>
      </div>
    );
  }

  if (line.startsWith('> ')) {
    return (
      <div key={lineIndex} className="border-l-4 border-sky-600 pl-4 py-1 my-4 bg-slate-800/30 italic text-slate-400">
        <InlineText text={line.replace(/^>\s/, '')} />
      </div>
    );
  }

  return (
    <p key={lineIndex} className="mb-2">
      <InlineText text={line} />
    </p>
  );
};

// 6. Main Parser Component
export const SimpleMarkdown: React.FC<SimpleMarkdownProps> = ({ content }) => {
  // First split by block math $$...$$, then by code blocks
  const mathAndCodeBlocks = content.split(/(\$\$[\s\S]*?\$\$|```[\s\S]*?```)/g);

  return (
    <div className="text-slate-300 leading-7 space-y-2">
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
          
          // Check if it's a diagram (mermaid or our custom format)
          if (language === 'mermaid' || language === 'diagram') {
            return <DiagramBlock key={blockIndex} code={code} />;
          }
          
          return <CodeBlock key={blockIndex} language={language} code={code} />;
        }

        const lines = block.split('\n');

        // Check for tables
        let tableStartIdx = -1;
        let tableEndIdx = -1;
        for (let i = 0; i < lines.length - 1; i++) {
          const currentLine = lines[i].trim();
          const nextLine = lines[i + 1].trim();
          if (
            currentLine.includes('|') &&
            nextLine.includes('|') &&
            nextLine.replace(/[|\s-]/g, '').length === 0
          ) {
            tableStartIdx = i;
            for (let j = i + 2; j < lines.length; j++) {
              if (!lines[j].trim().includes('|')) {
                tableEndIdx = j;
                break;
              }
              tableEndIdx = j + 1;
            }
            break;
          }
        }

        if (tableStartIdx !== -1 && tableEndIdx !== -1) {
          const tableLines = lines.slice(tableStartIdx, tableEndIdx);
          const tableRows = tableLines.map((line: string) =>
            line
              .split('|')
              .map((cell: string) => cell.trim())
              .filter((cell: string) => cell.length > 0)
          );

          const beforeTable = lines.slice(0, tableStartIdx);
          const afterTable = lines.slice(tableEndIdx);

          return (
            <div key={blockIndex}>
              {beforeTable.map((line: string, idx: number) => {
                const trimmed = line.trim();
                if (!trimmed) return null;
                return renderLine(line, idx);
              })}
              <Table rows={tableRows} />
              {afterTable.map((line: string, idx: number) => {
                const trimmed = line.trim();
                if (!trimmed) return null;
                return renderLine(line, idx + tableEndIdx);
              })}
            </div>
          );
        }

        return (
          <div key={blockIndex}>
            {lines.map((line: string, lineIndex: number) => {
              const trimmed = line.trim();
              if (!trimmed) return null;
              return renderLine(line, lineIndex);
            })}
          </div>
        );
      })}
    </div>
  );
};
