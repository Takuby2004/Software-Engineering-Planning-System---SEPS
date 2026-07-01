import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-markdown-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-1 text-xs text-left leading-relaxed prose prose-slate max-w-none">
      <div *ngIf="!content || content.trim() === ''">
        <p class="text-slate-400 italic text-[11px]">Sin contenido para mostrar. Escribe algo a la izquierda.</p>
      </div>
      <div *ngIf="content && content.trim() !== ''">
        <div *ngFor="let item of parsedElements" [ngSwitch]="item.type">
          <!-- H1 -->
          <h1 *ngSwitchCase="'h1'" class="text-sm font-extrabold text-slate-900 border-b border-slate-200 pb-1 mt-4 mb-2" [innerHTML]="item.html"></h1>
          
          <!-- H2 -->
          <h2 *ngSwitchCase="'h2'" class="text-xs font-bold text-slate-850 mt-3 mb-1" [innerHTML]="item.html"></h2>
          
          <!-- H3 -->
          <h3 *ngSwitchCase="'h3'" class="text-[11px] font-bold text-slate-800 mt-2.5 mb-1 uppercase tracking-wider" [innerHTML]="item.html"></h3>
          
          <!-- List -->
          <ul *ngSwitchCase="'ul'" class="list-disc pl-5 my-2 space-y-1 text-slate-700">
            <li *ngFor="let li of item.items" class="leading-relaxed" [innerHTML]="li"></li>
          </ul>
          
          <!-- Blockquote -->
          <blockquote *ngSwitchCase="'quote'" class="border-l-4 border-indigo-200 pl-3 py-1 my-2 bg-indigo-50/30 rounded-r text-slate-600 italic" [innerHTML]="item.html"></blockquote>
          
          <!-- Paragraph -->
          <p *ngSwitchCase="'p'" class="leading-relaxed mb-2 text-slate-700" [innerHTML]="item.html"></p>
        </div>
      </div>
    </div>
  `
})
export class MarkdownPreviewComponent implements OnChanges {
  @Input() content: string = '';
  parsedElements: any[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['content']) {
      this.parseMarkdown();
    }
  }

  parseMarkdown() {
    if (!this.content) {
      this.parsedElements = [];
      return;
    }
    const lines = this.content.split('\n');
    const elements: any[] = [];
    let currentListItems: string[] = [];

    const flushList = () => {
      if (currentListItems.length > 0) {
        elements.push({
          type: 'ul',
          items: [...currentListItems]
        });
        currentListItems = [];
      }
    };

    lines.forEach((line) => {
      const trimmed = line.trim();

      if (trimmed.startsWith('# ')) {
        flushList();
        elements.push({
          type: 'h1',
          html: this.parseInline(trimmed.substring(2))
        });
      } else if (trimmed.startsWith('## ')) {
        flushList();
        elements.push({
          type: 'h2',
          html: this.parseInline(trimmed.substring(3))
        });
      } else if (trimmed.startsWith('### ')) {
        flushList();
        elements.push({
          type: 'h3',
          html: this.parseInline(trimmed.substring(4))
        });
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        currentListItems.push(this.parseInline(trimmed.substring(2)));
      } else if (trimmed.startsWith('> ')) {
        flushList();
        elements.push({
          type: 'quote',
          html: this.parseInline(trimmed.substring(2))
        });
      } else if (trimmed === '') {
        flushList();
      } else {
        flushList();
        elements.push({
          type: 'p',
          html: this.parseInline(line)
        });
      }
    });

    flushList();
    this.parsedElements = elements;
  }

  parseInline(text: string): string {
    let html = '';
    let currentText = text;

    // Escape HTML characters
    currentText = currentText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

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
        html += currentText;
        break;
      }

      indices.sort((a, b) => a.index - b.index);
      const closest = indices[0];

      if (closest.index > 0) {
        html += currentText.substring(0, closest.index);
      }

      currentText = currentText.substring(closest.index);

      if (closest.type === 'bold') {
        const nextBold = currentText.indexOf('**', 2);
        if (nextBold !== -1) {
          const boldText = currentText.substring(2, nextBold);
          html += `<strong class="font-bold text-slate-900">${boldText}</strong>`;
          currentText = currentText.substring(nextBold + 2);
        } else {
          html += '**';
          currentText = currentText.substring(2);
        }
      } else if (closest.type === 'italic') {
        const nextItalic = currentText.indexOf('*', 1);
        if (nextItalic !== -1) {
          const italicText = currentText.substring(1, nextItalic);
          html += `<em class="italic text-slate-800">${italicText}</em>`;
          currentText = currentText.substring(nextItalic + 1);
        } else {
          html += '*';
          currentText = currentText.substring(1);
        }
      } else if (closest.type === 'code') {
        const nextCode = currentText.indexOf('`', 1);
        if (nextCode !== -1) {
          const codeText = currentText.substring(1, nextCode);
          html += `<code class="font-mono bg-slate-200 px-1 py-0.5 rounded text-indigo-600 font-semibold text-[10px]">${codeText}</code>`;
          currentText = currentText.substring(nextCode + 1);
        } else {
          html += '`';
          currentText = currentText.substring(1);
        }
      }
    }

    return html;
  }
}
