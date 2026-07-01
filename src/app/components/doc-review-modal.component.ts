import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-doc-review-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs text-xs">
      <div class="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col">
        <!-- Header -->
        <div class="p-4 border-b border-slate-150 flex justify-between items-center bg-slate-50 rounded-t-xl">
          <div class="flex items-center gap-2">
            <!-- Sparkles Icon -->
            <svg class="w-5 h-5 text-indigo-600 fill-indigo-100" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z"/>
            </svg>
            <div>
              <h3 class="font-extrabold text-slate-900 text-sm">Vista Previa de la Documentación Procesada</h3>
              <p class="text-[10px] text-slate-500">Selecciona qué campos deseas importar y fusionar con tu proyecto actual.</p>
            </div>
          </div>
          <button 
            (click)="close.emit()"
            class="p-1 rounded-lg text-slate-400 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <!-- X Icon -->
            <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>

        <!-- Action Controls -->
        <div class="px-5 py-2.5 bg-slate-100/50 border-b border-slate-200 flex justify-between items-center">
          <span class="text-[10px] text-slate-500 font-medium">
            Se detectaron {{fieldList.length}} secciones redactadas
          </span>
          <div class="flex gap-2">
            <button 
              type="button" 
              (click)="toggleAll(true)"
              class="px-2 py-1 text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 rounded cursor-pointer"
            >
              Seleccionar Todo
            </button>
            <button 
              type="button" 
              (click)="toggleAll(false)"
              class="px-2 py-1 text-[10px] font-bold text-slate-500 hover:bg-slate-100 rounded cursor-pointer"
            >
              Deseleccionar Todo
            </button>
          </div>
        </div>

        <!-- Content list -->
        <div class="flex-1 overflow-y-auto p-5 space-y-4">
          <div 
            *ngFor="let f of fieldList" 
            class="border rounded-lg p-3.5 transition-all"
            [class.border-indigo-150]="selectedFields[f.key]"
            [class.bg-indigo-50]="selectedFields[f.key]"
            [class.border-slate-150]="!selectedFields[f.key]"
            [class.bg-slate-50]="!selectedFields[f.key]"
            [class.opacity-70]="!selectedFields[f.key]"
          >
            <div class="flex items-start gap-2.5">
              <input
                type="checkbox"
                [checked]="selectedFields[f.key]"
                (change)="toggleField(f.key)"
                class="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <div class="flex-1 space-y-1">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-slate-800">{{f.label}}</span>
                  <span class="text-[9px] font-bold font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase">
                    {{f.category}}
                  </span>
                </div>

                <!-- Previews based on field types -->
                <div class="text-[11px] text-slate-600 leading-relaxed mt-1 bg-white p-2 border rounded border-slate-100">
                  <ng-container *ngIf="f.isReqs; else regularView">
                    <div *ngIf="!f.value || f.value.length === 0" class="text-slate-400 italic text-[11px]">No se encontraron.</div>
                    <div *ngIf="f.value && f.value.length > 0" class="space-y-1.5 mt-1 border-l border-slate-100 pl-3">
                      <div *ngFor="let r of f.value" class="text-[11px] leading-relaxed">
                        <span class="font-mono font-bold bg-slate-50 text-slate-700 px-1 rounded mr-1.5">{{r.code}}</span>
                        <span class="text-slate-600">{{r.desc}}</span>
                        <span class="ml-1.5 text-[9px] font-bold text-indigo-500 font-mono bg-indigo-50 px-1 rounded">
                          {{f.isFunc ? r.priority : r.category}}
                        </span>
                      </div>
                    </div>
                  </ng-container>
                  <ng-template #regularView>
                    <ng-container *ngIf="f.isList; else plainText">
                      <ul class="list-disc list-inside space-y-0.5 pl-1.5 text-slate-600">
                        <li *ngFor="let li of f.value">{{li}}</li>
                      </ul>
                    </ng-container>
                    <ng-template #plainText>
                      <p class="whitespace-pre-wrap">{{f.value}}</p>
                    </ng-template>
                  </ng-template>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-4 border-t border-slate-150 flex justify-end gap-2 bg-slate-50 rounded-b-xl">
          <button
            (click)="close.emit()"
            class="px-3.5 py-2 font-bold text-slate-600 hover:bg-slate-150 rounded-lg transition-all cursor-pointer"
          >
            Descartar
          </button>
          <button
            (click)="apply.emit(selectedFields)"
            class="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-5 py-2 rounded-lg transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <!-- Check Icon -->
            <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 6 9 17l-5-5"/>
            </svg>
            Integrar Campos Seleccionados
          </button>
        </div>
      </div>
    </div>
  `
})
export class DocReviewModalComponent implements OnInit {
  @Input() data: any = {};
  @Output() close = new EventEmitter<void>();
  @Output() apply = new EventEmitter<Record<string, boolean>>();

  selectedFields: Record<string, boolean> = {};
  fieldList: any[] = [];

  ngOnInit() {
    // Populate selectedFields
    const initial: Record<string, boolean> = {};
    Object.keys(this.data).forEach(key => {
      initial[key] = true;
    });
    this.selectedFields = initial;

    // Build field list
    this.fieldList = [
      { key: 'name', label: 'Nombre del Software', category: 'General', value: this.data.name },
      { key: 'organization', label: 'Organización / Empresa', category: 'General', value: this.data.organization },
      { key: 'description', label: 'Descripción del Sistema', category: 'General', value: this.data.description },
      
      { key: 'problemContext', label: 'Contexto del Problema', category: 'Capítulo 1: Descripción', value: this.data.problemContext },
      { key: 'orgDescription', label: 'Descripción de la Organización', category: 'Capítulo 1: Descripción', value: this.data.orgDescription },
      { key: 'identifiedNeed', label: 'Necesidad Identificada', category: 'Capítulo 1: Descripción', value: this.data.identifiedNeed },
      { key: 'currentSituation', label: 'Situación Actual', category: 'Capítulo 1: Descripción', value: this.data.currentSituation },
      { key: 'mainProblem', label: 'Problema Principal', category: 'Capítulo 1: Descripción', value: this.data.mainProblem },
      { key: 'generalObjective', label: 'Objetivo General', category: 'Capítulo 1: Descripción', value: this.data.generalObjective },
      { 
        key: 'specificObjectives', 
        label: 'Objetivos Específicos', 
        category: 'Capítulo 1: Descripción', 
        value: this.data.specificObjectives,
        isList: true 
      },
      { 
        key: 'functionalRequirements', 
        label: 'Requerimientos Funcionales', 
        category: 'Capítulo 1: Descripción', 
        value: this.data.functionalRequirements,
        isReqs: true,
        isFunc: true
      },
      { 
        key: 'nonFunctionalRequirements', 
        label: 'Requerimientos No Funcionales', 
        category: 'Capítulo 1: Descripción', 
        value: this.data.nonFunctionalRequirements,
        isReqs: true,
        isFunc: false
      },
      { key: 'scopeLimitations', label: 'Alcance y Limitaciones', category: 'Capítulo 1: Descripción', value: this.data.scopeLimitations },
      
      { key: 'architectureType', label: 'Tipo de Arquitectura', category: 'Capítulo 2: Arquitectura', value: this.data.architectureType },
      { key: 'architectureDescription', label: 'Descripción de la Arquitectura', category: 'Capítulo 2: Arquitectura', value: this.data.architectureDescription },
      { key: 'languagesUsed', label: 'Lenguajes de Programación', category: 'Capítulo 2: Arquitectura', value: this.data.languagesUsed },
      { key: 'frameworksUsed', label: 'Frameworks / Librerías', category: 'Capítulo 2: Arquitectura', value: this.data.frameworksUsed },
      { key: 'databasesUsed', label: 'Bases de Datos', category: 'Capítulo 2: Arquitectura', value: this.data.databasesUsed },
      
      { key: 'conclusions', label: 'Conclusiones', category: 'Capítulo 6: Cierre', value: this.data.conclusions },
      { key: 'recommendations', label: 'Recomendaciones', category: 'Capítulo 6: Cierre', value: this.data.recommendations },
      { key: 'futureImprovements', label: 'Mejoras Futuras', category: 'Capítulo 6: Cierre', value: this.data.futureImprovements },
    ].filter(f => f.value !== undefined && f.value !== null && (Array.isArray(f.value) ? f.value.length > 0 : String(f.value).trim() !== ''));
  }

  toggleField(key: string) {
    this.selectedFields[key] = !this.selectedFields[key];
  }

  toggleAll(val: boolean) {
    const updated: Record<string, boolean> = {};
    this.fieldList.forEach(f => {
      updated[f.key] = val;
    });
    this.selectedFields = updated;
  }
}
