import React from 'react';

interface MarkdownPreviewProps {
  content: string;
}

export default function MarkdownPreview({ content }: MarkdownPreviewProps) {
  if (!content || content.trim() === '') {
    return <p className="text-slate-400 italic text-[11px]">Sin contenido para mostrar. Escribe algo a la izquierda.</p>;
  }

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let currentListItems: React.ReactNode[] = [];

  const parseInline = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let currentText = text;
    let keyIdx = 0;

    while (currentText.length > 0) {
      const boldIdx = currentText.indexOf('**');
      const italicIdx = currentText.indexOf('*');
      const codeIdx = currentText.indexOf('`');

      const indices = [
        { type: 'bold', index: boldIdx },
        { type: 'italic', index: italicIdx },
        { type: 'code', index: codeIdx },
      ].filter(item => item.index !== -1);

      if (indices.length === 0) {
        parts.push(<span key={`text-${keyIdx++}`}>{currentText}</span>);
        break;
      }

      indices.sort((a, b) => a.index - b.index);
      const closest = indices[0];

      if (closest.index > 0) {
        parts.push(<span key={`text-${keyIdx++}`}>{currentText.substring(0, closest.index)}</span>);
      }

      currentText = currentText.substring(closest.index);

      if (closest.type === 'bold') {
        const nextBold = currentText.indexOf('**', 2);
        if (nextBold !== -1) {
          const boldText = currentText.substring(2, nextBold);
          parts.push(<strong key={`bold-${keyIdx++}`} className="font-bold text-slate-900">{boldText}</strong>);
          currentText = currentText.substring(nextBold + 2);
        } else {
          parts.push(<span key={`text-${keyIdx++}`}>**</span>);
          currentText = currentText.substring(2);
        }
      } else if (closest.type === 'italic') {
        const nextItalic = currentText.indexOf('*', 1);
        if (nextItalic !== -1) {
          const italicText = currentText.substring(1, nextItalic);
          parts.push(<em key={`italic-${keyIdx++}`} className="italic text-slate-800">{italicText}</em>);
          currentText = currentText.substring(nextItalic + 1);
        } else {
          parts.push(<span key={`text-${keyIdx++}`}>*</span>);
          currentText = currentText.substring(1);
        }
      } else if (closest.type === 'code') {
        const nextCode = currentText.indexOf('`', 1);
        if (nextCode !== -1) {
          const codeText = currentText.substring(1, nextCode);
          parts.push(
            <code key={`code-${keyIdx++}`} className="font-mono bg-slate-250/80 px-1 py-0.5 rounded text-indigo-600 font-semibold text-[10px]">
              {codeText}
            </code>
          );
          currentText = currentText.substring(nextCode + 1);
        } else {
          parts.push(<span key={`text-${keyIdx++}`}>`</span>);
          currentText = currentText.substring(1);
        }
      }
    }

    return parts;
  };

  const flushList = (key: number) => {
    if (currentListItems.length > 0) {
      elements.push(
        <ul key={`list-${key}`} className="list-disc pl-5 my-2 space-y-1 text-slate-700">
          {currentListItems}
        </ul>
      );
      currentListItems = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('# ')) {
      flushList(index);
      elements.push(
        <h1 key={`h1-${index}`} className="text-sm font-extrabold text-slate-900 border-b border-slate-200 pb-1 mt-4 mb-2">
          {parseInline(trimmed.substring(2))}
        </h1>
      );
    } else if (trimmed.startsWith('## ')) {
      flushList(index);
      elements.push(
        <h2 key={`h2-${index}`} className="text-xs font-bold text-slate-850 mt-3 mb-1">
          {parseInline(trimmed.substring(3))}
        </h2>
      );
    } else if (trimmed.startsWith('### ')) {
      flushList(index);
      elements.push(
        <h3 key={`h3-${index}`} className="text-[11px] font-bold text-slate-800 mt-2.5 mb-1 uppercase tracking-wider">
          {parseInline(trimmed.substring(4))}
        </h3>
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      currentListItems.push(
        <li key={`li-${index}`} className="leading-relaxed">
          {parseInline(trimmed.substring(2))}
        </li>
      );
    } else if (trimmed.startsWith('> ')) {
      flushList(index);
      elements.push(
        <blockquote key={`quote-${index}`} className="border-l-4 border-indigo-200 pl-3 py-1 my-2 bg-indigo-50/30 rounded-r text-slate-600 italic">
          {parseInline(trimmed.substring(2))}
        </blockquote>
      );
    } else if (trimmed === '') {
      flushList(index);
    } else {
      flushList(index);
      elements.push(
        <p key={`p-${index}`} className="leading-relaxed mb-2 text-slate-700">
          {parseInline(line)}
        </p>
      );
    }
  });

  flushList(lines.length);

  return <div className="space-y-1 text-xs text-left leading-relaxed prose prose-slate max-w-none">{elements}</div>;
}
