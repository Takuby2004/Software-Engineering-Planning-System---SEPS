import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { fetchWithAuth } from '../../lib/api.ts';

@Component({
  selector: 'app-ai-suggest-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh]">
        <!-- Header -->
        <div class="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <!-- Sparkles Icon -->
            <svg class="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z"/>
              <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5.5Z"/>
              <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1Z"/>
            </svg>
            <h3 class="font-semibold text-sm">Asistente IA - {{sectionName}}</h3>
          </div>
          <button (click)="close.emit()" class="p-1 hover:bg-slate-800 rounded-full transition-colors cursor-pointer text-slate-400 hover:text-white">
            <!-- X Icon -->
            <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="p-6 overflow-y-auto space-y-4 flex-1">
          <div>
            <label class="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Instrucciones para la IA (Opcional)
            </label>
            <textarea
              class="w-full border border-slate-200 rounded-lg p-3 text-[11px] focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-sans"
              rows="3"
              placeholder="Ej: Hazlo más formal y técnico, añade más detalles sobre la arquitectura, redacta 3 objetivos basados en la taxonomía de Bloom..."
              [(ngModel)]="prompt"
            ></textarea>
          </div>

          <div class="flex justify-end">
            <button
              (click)="handleGenerate()"
              [disabled]="loading"
              class="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <ng-container *ngIf="loading; else readyBtn">
                <!-- Spinner -->
                <svg class="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                Generando sugerencias...
              </ng-container>
              <ng-template #readyBtn>
                <svg class="w-4 h-4 text-amber-300 fill-amber-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z"/>
                </svg>
                Consultar a Gemini
              </ng-template>
            </button>
          </div>

          <div *ngIf="error" class="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-medium">
            {{error}}
          </div>

          <div *ngIf="suggestion" class="mt-4 space-y-3">
            <label class="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Propuesta de Gemini (Sugerencia)
            </label>
            <div class="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-sans whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
              {{suggestion}}
            </div>

            <div class="flex gap-3 justify-end pt-2">
              <button
                (click)="apply.emit(suggestion)"
                class="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                <!-- Check Icon -->
                <svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 6 9 17l-5-5"/>
                </svg>
                Reemplazar / Usar Texto
              </button>
              <button
                (click)="append()"
                class="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                <!-- ArrowRight Icon -->
                <svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                </svg>
                Agregar al final
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AiSuggestModalComponent {
  @Input() projectId!: number;
  @Input() sectionName!: string;
  @Input() currentText: string = '';

  @Output() apply = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();

  prompt: string = '';
  loading: boolean = false;
  suggestion: string = '';
  error: string = '';

  async handleGenerate() {
    this.loading = true;
    this.error = '';
    try {
      const res = await fetchWithAuth(`/api/projects/${this.projectId}/ai-suggest`, {
        method: 'POST',
        body: JSON.stringify({
          section: this.sectionName,
          currentText: this.currentText,
          prompt: this.prompt,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo obtener la sugerencia de la IA.');
      }
      this.suggestion = data.suggestion;
    } catch (err: any) {
      console.error(err);
      this.error = err.message || 'Error de conexión con el servidor.';
    } finally {
      this.loading = false;
    }
  }

  append() {
    const combined = (this.currentText ? this.currentText + '\n\n' : '') + this.suggestion;
    this.apply.emit(combined);
  }
}
