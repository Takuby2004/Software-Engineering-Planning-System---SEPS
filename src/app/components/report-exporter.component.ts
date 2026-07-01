import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Project, ScrumIteration, ScrumTask, TestCase, FunctionalRequirement, NonFunctionalRequirement, DbTable } from '../../types.ts';
import { MarkdownPreviewComponent } from './markdown-preview.component';

@Component({
  selector: 'app-report-exporter',
  standalone: true,
  imports: [CommonModule, FormsModule, MarkdownPreviewComponent],
  template: `
    <div class="space-y-4 text-xs text-left">
      <!-- Exporter Controls Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3 print:hidden">
        <div>
          <h2 class="text-sm font-bold text-slate-850 flex items-center gap-1.5">
            <!-- File Text Icon -->
            <svg class="w-4 h-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
            </svg>
            Compilador de Informes & Diseñador de Formatos
          </h2>
          <p class="text-[11px] text-slate-400 font-sans">
            Ajusta y estiliza la estructura académica, tipografía y diseño antes de exportar el documento definitivo.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button
            (click)="showConfig = !showConfig"
            class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold text-[10px] transition-colors cursor-pointer shadow-3xs"
          >
            <!-- Settings Icon -->
            <svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            {{showConfig ? 'Ocultar Opciones' : 'Mostrar Diseñador'}}
          </button>

          <button
            (click)="handlePrint()"
            class="flex items-center gap-1.5 text-white font-bold text-[10px] px-3.5 py-1.5 rounded-lg transition-all shadow-sm cursor-pointer hover:brightness-110"
            [class]="getColors().bg"
          >
            <!-- Printer Icon -->
            <svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
            </svg>
            Imprimir / Exportar PDF
          </button>
        </div>
      </div>

      <!-- FORMATTING & CUSTOMIZATION TOOLBAR -->
      <div *ngIf="showConfig" class="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4 print:hidden text-left shadow-xs transition-all duration-300">
        <div class="flex items-center justify-between border-b border-slate-200 pb-2 select-none">
          <div class="flex items-center gap-1.5">
            <!-- Sliders Icon -->
            <svg class="w-4 h-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>
            </svg>
            <span class="font-extrabold text-slate-800 text-xs">Ajustes del Formato Documental</span>
          </div>
          <button
            (click)="resetSettings()"
            class="text-slate-400 hover:text-slate-600 font-bold text-[9px] flex items-center gap-0.5 cursor-pointer"
            title="Restaurar valores de fábrica"
          >
            <!-- Rotate CCW -->
            <svg class="w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
            </svg>
            Restaurar
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- Column 1: Templates presets -->
          <div class="space-y-2">
            <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 select-none font-sans">
              <!-- Layers Icon -->
              <svg class="w-3 h-3 text-indigo-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2"/><polygon points="2 17 12 22 22 17"/><polygon points="2 12 12 17 22 12"/>
              </svg>
              Estilo de Plantilla
            </label>
            <div class="space-y-1">
              <button
                *ngFor="let item of templateOptions"
                (click)="applyTemplatePreset(item.id)"
                class="w-full text-left p-2 rounded-lg border transition-all text-xs flex flex-col justify-between cursor-pointer"
                [class]="template === item.id ? (getColors().border + ' bg-white ring-1 ' + getColors().ring + ' font-bold') : 'border-slate-200 bg-white hover:bg-slate-100/50 text-slate-700'"
              >
                <span class="flex items-center justify-between w-full">
                  <span>{{item.label}}</span>
                  <span *ngIf="template === item.id" class="text-indigo-600 font-bold">✓</span>
                </span>
                <span class="text-[9px] text-slate-400 font-normal mt-0.5 font-sans">{{item.desc}}</span>
              </button>
            </div>
          </div>

          <!-- Column 2: Typography -->
          <div class="space-y-3">
            <div class="space-y-1.5">
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 select-none font-sans">
                <!-- Type Icon -->
                <svg class="w-3 h-3 text-indigo-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>
                </svg>
                Familia Tipográfica
              </label>
              <div class="grid grid-cols-2 gap-1">
                <button
                  *ngFor="let font of fontOptions"
                  (click)="fontFamily = font.id"
                  class="py-1 px-2 text-center rounded border text-[11px] transition-all font-semibold cursor-pointer"
                  [class]="fontFamily === font.id ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'"
                >
                  {{font.label}}
                </button>
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider select-none font-sans">Tamaño de Letra del Cuerpo</label>
              <div class="grid grid-cols-3 gap-1">
                <button
                  *ngFor="let sz of sizeOptions"
                  (click)="fontSize = sz.id"
                  class="py-1 text-center rounded border text-[10px] font-bold transition-all cursor-pointer"
                  [class]="fontSize === sz.id ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-600'"
                >
                  {{sz.label}}
                </button>
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider select-none font-sans">Alineación del Texto</label>
              <div class="grid grid-cols-2 gap-1">
                <button
                  *ngFor="let al of alignmentOptions"
                  (click)="alignment = al.id"
                  class="py-1 text-center rounded border text-[10px] font-bold transition-all cursor-pointer"
                  [class]="alignment === al.id ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-600'"
                >
                  {{al.label}}
                </button>
              </div>
            </div>
          </div>

          <!-- Column 3: Accents & Spacing -->
          <div class="space-y-3">
            <div class="space-y-1.5">
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 select-none font-sans">
                <!-- Palette Icon -->
                <svg class="w-3 h-3 text-indigo-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 14.7255 3.09032 17.1962 4.85857 19C5.01453 19.156 5.08862 19.3789 5.05151 19.5961C4.94524 20.218 4.88917 20.8554 4.88917 21.505C4.88917 21.7784 5.11077 22 5.38417 22H12Z"/>
                </svg>
                Color de Acento
              </label>
              <div class="grid grid-cols-5 gap-1">
                <button
                  *ngFor="let col of colorOptions"
                  (click)="accentColor = col.id"
                  class="h-6 rounded border transition-all relative flex items-center justify-center cursor-pointer"
                  [class]="col.color + ' ' + (accentColor === col.id ? 'ring-2 ring-offset-1 ring-slate-800 border-white' : 'border-slate-200')"
                >
                  <span *ngIf="accentColor === col.id" class="text-white drop-shadow font-bold text-[9px]">✓</span>
                </button>
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider select-none font-sans">Interlineado (Espaciado)</label>
              <div class="grid grid-cols-3 gap-1">
                <button
                  *ngFor="let line of lineSpacingOptions"
                  (click)="lineSpacing = line.id"
                  class="py-1 text-center rounded border text-[10px] font-bold transition-all cursor-pointer"
                  [class]="lineSpacing === line.id ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-600'"
                >
                  {{line.label}}
                </button>
              </div>
            </div>

            <div class="space-y-2 pt-1.5 select-none font-sans">
              <div class="flex items-center justify-between">
                <label class="text-[10px] font-bold text-slate-600 cursor-pointer" for="toggle-cover">
                  Mostrar Portada de Tesis
                </label>
                <input
                  type="checkbox"
                  id="toggle-cover"
                  [(ngModel)]="showCover"
                  class="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                />
              </div>

              <div class="flex items-center justify-between">
                <label class="text-[10px] font-bold text-slate-600 cursor-pointer" for="toggle-num">
                  Numeración de Capítulos (1.1, etc)
                </label>
                <input
                  type="checkbox"
                  id="toggle-num"
                  [(ngModel)]="numberedSections"
                  class="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <!-- Column 4: Personalization Cover Page -->
          <div class="space-y-2 bg-white border border-slate-200 p-3 rounded-lg text-left">
            <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 select-none font-sans">
              <!-- File Signature Icon -->
              <svg class="w-3 h-3 text-indigo-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34"/><polygon points="18 2 22 6 12 16 8 16 8 12 18 2"/>
              </svg>
              Datos de Carátula
            </label>
            
            <div class="space-y-1.5">
              <div>
                <span class="text-[9px] text-slate-400 font-bold uppercase select-none font-sans">Universidad / Institución</span>
                <input
                  type="text"
                  [(ngModel)]="universityName"
                  class="w-full text-[10px] border border-slate-200 rounded px-2 py-1 font-sans focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  placeholder="Universidad..."
                />
              </div>

              <div>
                <span class="text-[9px] text-slate-400 font-bold uppercase select-none font-sans">Facultad / Escuela</span>
                <input
                  type="text"
                  [(ngModel)]="facultyName"
                  class="w-full text-[10px] border border-slate-200 rounded px-2 py-1 font-sans focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  placeholder="Facultad..."
                />
              </div>

              <div>
                <span class="text-[9px] text-slate-400 font-bold uppercase select-none font-sans">Autor (Estudiante o Grupo)</span>
                <input
                  type="text"
                  [(ngModel)]="authorName"
                  class="w-full text-[10px] border border-slate-200 rounded px-2 py-1 font-sans focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  placeholder="Autor..."
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- DOCUMENT PREVIEW BLOCK -->
      <div 
        class="bg-white border border-slate-200 rounded-xl shadow-lg p-8 sm:p-14 max-w-4xl mx-auto text-slate-900 print:border-0 print:shadow-none print:p-0 text-left"
        [class]="getFontClass()"
        [style]="getFontInlineStyle()"
      >
        <!-- COVER PAGE -->
        <div *ngIf="showCover" class="min-h-[85vh] flex flex-col justify-between text-center border-b-4 border-slate-900 pb-16 pt-10">
          <div>
            <h4 class="font-sans font-bold text-base tracking-widest text-slate-600 uppercase mb-2 select-none">{{universityName}}</h4>
            <h5 class="font-sans font-semibold text-xs tracking-wider text-slate-500 uppercase select-none">{{facultyName}}</h5>
          </div>

          <div class="space-y-4 my-12 select-none">
            <div class="w-20 h-1 mx-auto" [class]="getColors().bg"></div>
            <h1 class="font-sans font-extrabold text-2xl sm:text-3xl tracking-tight text-slate-900 uppercase leading-snug">
              INFORME DE INGENIERÍA DE SOFTWARE
            </h1>
            <h2 class="font-sans font-bold text-lg sm:text-xl uppercase italic" [class]="getColors().text">
              Sistema: {{project.name || 'Sin nombre'}}
            </h2>
            <p class="font-sans text-xs text-slate-500">Desarrollado bajo la metodología ágil Scrum</p>
          </div>

          <div class="space-y-6 text-sm">
            <div>
              <p class="font-sans font-bold text-[10px] text-slate-500 uppercase tracking-widest select-none">Entorno / Organización</p>
              <p class="font-sans font-medium text-slate-800">{{project.organization || 'Mi Organización'}}</p>
            </div>
            <div>
              <p class="font-sans font-bold text-[10px] text-slate-500 uppercase tracking-widest select-none">Autor / Estudiante</p>
              <p class="font-sans font-medium text-slate-800">{{authorName}}</p>
            </div>
            <div>
              <p class="font-sans font-bold text-[10px] text-slate-500 uppercase tracking-widest select-none">Fecha de Emisión</p>
              <p class="font-sans font-medium text-slate-800">{{getEmisionDate()}}</p>
            </div>
          </div>
        </div>

        <!-- INDEX OF CONTENT -->
        <div class="space-y-6 page-break-after py-8">
          <h2 class="font-sans font-bold text-lg text-slate-900 uppercase border-b pb-2 select-none">Índice de Contenido</h2>
          <div class="font-sans text-xs space-y-3 text-slate-600">
            <div class="flex justify-between border-b border-dotted pb-1">
              <span class="font-bold">{{renderChapterTitle('1', 'Descripción del proyecto')}}</span>
              <span>Pág. 01</span>
            </div>
            <div class="flex justify-between border-b border-dotted pl-4 pb-1">
              <span>{{renderSubTitle('1.1', 'Introducción y Contexto')}}</span>
              <span>Pág. 01</span>
            </div>
            <div class="flex justify-between border-b border-dotted pl-4 pb-1">
              <span>{{renderSubTitle('1.2', 'Planteamiento del Problema')}}</span>
              <span>Pág. 01</span>
            </div>
            <div class="flex justify-between border-b border-dotted pl-4 pb-1">
              <span>{{renderSubTitle('1.3', 'Objetivos Generales y Específicos')}}</span>
              <span>Pág. 01</span>
            </div>
            <div class="flex justify-between border-b border-dotted pl-4 pb-1">
              <span>{{renderSubTitle('1.4', 'Alcance y Limitaciones')}}</span>
              <span>Pág. 02</span>
            </div>
            <div class="flex justify-between border-b border-dotted pl-4 pb-1">
              <span>{{renderSubTitle('1.5', 'Wiki y Notas Técnicas de Diseño')}}</span>
              <span>Pág. 02</span>
            </div>
            <div class="flex justify-between border-b border-dotted pl-4 pb-1">
              <span>{{renderSubTitle('1.6', 'Repositorios de Código Fuente Enlazados (GitHub)')}}</span>
              <span>Pág. 02</span>
            </div>
            <div class="flex justify-between border-b border-dotted pb-1">
              <span class="font-bold">{{renderChapterTitle('2', 'Marco Teórico y Tecnológico')}}</span>
              <span>Pág. 02</span>
            </div>
            <div class="flex justify-between border-b border-dotted pb-1">
              <span class="font-bold">{{renderChapterTitle('3', 'Análisis de Requerimientos')}}</span>
              <span>Pág. 03</span>
            </div>
            <div class="flex justify-between border-b border-dotted pb-1">
              <span class="font-bold">{{renderChapterTitle('4', 'Diseño del Sistema')}}</span>
              <span>Pág. 04</span>
            </div>
            <div class="flex justify-between border-b border-dotted pl-4 pb-1">
              <span>{{renderSubTitle('4.1', 'Arquitectura General del Sistema')}}</span>
              <span>Pág. 04</span>
            </div>
            <div class="flex justify-between border-b border-dotted pl-4 pb-1">
              <span>{{renderSubTitle('4.5', 'Diseño Físico de Base de Datos PostgreSQL')}}</span>
              <span>Pág. 05</span>
            </div>
            <div class="flex justify-between border-b border-dotted pb-1">
              <span class="font-bold">{{renderChapterTitle('5', 'Implementación y Pruebas')}}</span>
              <span>Pág. 06</span>
            </div>
            <div class="flex justify-between border-b border-dotted pb-1">
              <span class="font-bold">{{renderChapterTitle('6', 'Conclusiones y Recomendaciones')}}</span>
              <span>Pág. 07</span>
            </div>
          </div>
        </div>

        <!-- CAPITULO 1 -->
        <div class="space-y-6 pt-6">
          <h2 class="font-sans font-extrabold text-xl text-slate-900 border-b-2 pb-2 uppercase" [class]="getColors().border">
            {{renderChapterTitle('1', 'Descripción del proyecto')}}
          </h2>
          
          <div [class]="getLineSpacingClass()">
            <div>
              <h3 class="font-sans font-bold text-sm uppercase tracking-wide" [class]="getColors().text">
                {{renderSubTitle('1.1', 'Introducción')}}
              </h3>
              <p [class]="getBodyTextClass()">
                {{project.problemContext}}
              </p>
              <p [class]="getBodyTextClass()">
                {{project.orgDescription}}
              </p>
              <p [class]="getBodyTextClass()">
                {{project.identifiedNeed}}
              </p>
            </div>

            <div>
              <h3 class="font-sans font-bold text-sm uppercase tracking-wide" [class]="getColors().text">
                {{renderSubTitle('1.2', 'Problema')}}
              </h3>
              <p [class]="getBodyTextClass()">
                <strong>Situación Actual:</strong> {{project.currentSituation}}
              </p>
              <p [class]="getBodyTextClass()">
                <strong>Problema Principal Identificado:</strong> {{project.mainProblem}}
              </p>
            </div>

            <div>
              <h3 class="font-sans font-bold text-sm uppercase tracking-wide" [class]="getColors().text">
                {{renderSubTitle('1.3', 'Objetivos')}}
              </h3>
              <p [class]="getBodyTextClass()">
                <strong>Objetivo General:</strong> {{project.generalObjective}}
              </p>
              <div class="mt-2 pl-8">
                <strong>Objetivos Específicos:</strong>
                <ul class="list-disc pl-4 mt-1 space-y-1 text-slate-700 font-sans">
                  <li *ngFor="let obj of specificObjectives">{{obj}}</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 class="font-sans font-bold text-sm uppercase tracking-wide" [class]="getColors().text">
                {{renderSubTitle('1.4', 'Alcance')}}
              </h3>
              <p [class]="getBodyTextClass()">
                {{project.scopeLimitations}}
              </p>
            </div>

            <div>
              <h3 class="font-sans font-bold text-sm mb-2 uppercase tracking-wide" [class]="getColors().text">
                {{renderSubTitle('1.5', 'Wiki / Notas Técnicas de Diseño')}}
              </h3>
              <div class="border rounded-lg p-4 font-sans text-xs text-justify leading-relaxed" [class]="getWikiContainerClass()">
                <app-markdown-preview [content]="project.wikiNotes || ''"></app-markdown-preview>
              </div>
            </div>

            <div>
              <h3 class="font-sans font-bold text-sm mb-2 uppercase tracking-wide" [class]="getColors().text">
                {{renderSubTitle('1.6', 'Repositorios de Código Fuente Enlazados (GitHub)')}}
              </h3>
              <p [class]="getBodyTextClass()">
                Para garantizar el soporte del ciclo de desarrollo, la integración continua y la trazabilidad del código fuente, el proyecto se encuentra enlazado formalmente con los siguientes repositorios de la plataforma GitHub:
              </p>
              <div *ngIf="getGithubRepos().length === 0" class="italic text-slate-400 text-xs font-sans">
                No se han enlazado repositorios de GitHub en esta versión del documento.
              </div>
              <div *ngIf="getGithubRepos().length > 0" class="border rounded-lg overflow-hidden mt-3" [class]="template === 'technical' ? 'border-slate-400 font-mono' : 'border-slate-200'">
                <table class="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr class="font-bold border-b" [class]="template === 'technical' ? 'bg-slate-800 text-white border-slate-400' : 'bg-slate-100 text-slate-700 border-slate-200'">
                      <th class="p-2.5 pl-4 w-1/3">Repositorio</th>
                      <th class="p-2.5">Descripción</th>
                      <th class="p-2.5 w-24">Lenguaje</th>
                      <th class="p-2.5 w-20 text-center">Estrellas</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-200">
                    <tr *ngFor="let repo of getGithubRepos()" class="bg-white">
                      <td class="p-2.5 pl-4 font-semibold" [class]="getColors().text">
                        <a [href]="repo.htmlUrl" target="_blank" rel="noopener noreferrer" class="hover:underline">
                          {{repo.fullName}}
                        </a>
                      </td>
                      <td class="p-2.5 text-slate-600 text-[11px] leading-normal font-sans">{{repo.description || 'Sin descripción disponible'}}</td>
                      <td class="p-2.5 text-slate-600 font-mono text-[11px]">{{repo.language || 'N/A'}}</td>
                      <td class="p-2.5 text-slate-600 text-center font-mono">{{repo.stars}}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- CAPITULO 2 -->
        <div class="space-y-6 pt-6">
          <h2 class="font-sans font-extrabold text-xl text-slate-900 border-b-2 pb-2 uppercase" [class]="getColors().border">
            {{renderChapterTitle('2', 'Marco Teórico y Tecnológico')}}
          </h2>
          
          <div [class]="getLineSpacingClass()">
            <h3 class="font-sans font-bold text-sm uppercase tracking-wide" [class]="getColors().text">
              {{renderSubTitle('2.1', 'Ingeniería de Software y Metodología Ágil')}}
            </h3>
            <p [class]="getBodyTextClass()">
              Para el desarrollo del presente sistema, se seleccionó el paradigma de desarrollo ágil mediante el framework <strong>Scrum</strong>. Esta decisión permite estructurar el ciclo de vida del software en entregables rápidos e iterativos, denominados Sprints, garantizando una adaptación continua a los cambios y una comunicación constante con el cliente para mitigar riesgos tempranamente.
            </p>

            <h3 class="font-sans font-bold text-sm uppercase tracking-wide" [class]="getColors().text">
              {{renderSubTitle('2.7', 'Tecnologías Utilizadas')}}
            </h3>
            <p [class]="getBodyTextClass()">
              Las tecnologías seleccionadas para la materialización del proyecto comprenden los siguientes estándares de la industria moderna:
            </p>
            <ul class="list-disc pl-12 text-xs sm:text-sm space-y-1.5 text-slate-700 font-sans">
              <li><strong>Lenguajes de programación enlazados:</strong> {{project.languagesUsed}}</li>
              <li><strong>Frameworks y plataformas de software:</strong> {{project.frameworksUsed}}</li>
              <li><strong>Gestor y modelo de base de datos relacional:</strong> {{project.databasesUsed}}</li>
            </ul>
          </div>
        </div>

        <!-- CAPITULO 3 -->
        <div class="space-y-6 pt-6">
          <h2 class="font-sans font-extrabold text-xl text-slate-900 border-b-2 pb-2 uppercase" [class]="getColors().border">
            {{renderChapterTitle('3', 'Análisis de Requerimientos')}}
          </h2>

          <div [class]="getLineSpacingClass()">
            <div>
              <h3 class="font-sans font-bold text-sm mb-2 uppercase tracking-wide" [class]="getColors().text">
                {{renderSubTitle('3.4', 'Requerimientos Funcionales')}}
              </h3>
              <div class="border rounded-lg overflow-hidden font-sans text-xs" [class]="template === 'technical' ? 'border-slate-400' : 'border-slate-200'">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="font-bold border-b" [class]="template === 'technical' ? 'bg-slate-800 text-white border-slate-400' : 'bg-slate-100 text-slate-700 border-slate-200'">
                      <th class="p-2 w-20">Código</th>
                      <th class="p-2">Descripción del Requerimiento</th>
                      <th class="p-2 w-24">Prioridad</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-200">
                    <tr *ngIf="functionalRequirements.length === 0">
                      <td colSpan="3" class="p-4 text-center italic text-slate-400">Sin requerimientos declarados.</td>
                    </tr>
                    <tr *ngFor="let rf of functionalRequirements" class="hover:bg-slate-50/50">
                      <td class="p-2 font-mono font-bold" [class]="getColors().text">{{rf.code}}</td>
                      <td class="p-2 text-slate-700">{{rf.desc}}</td>
                      <td class="p-2 text-slate-600 font-medium">{{rf.priority}}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 class="font-sans font-bold text-sm mb-2 uppercase tracking-wide" [class]="getColors().text">
                {{renderSubTitle('3.5', 'Requerimientos No Funcionales')}}
              </h3>
              <div class="border rounded-lg overflow-hidden font-sans text-xs" [class]="template === 'technical' ? 'border-slate-400' : 'border-slate-200'">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="font-bold border-b" [class]="template === 'technical' ? 'bg-slate-800 text-white border-slate-400' : 'bg-slate-100 text-slate-700 border-slate-200'">
                      <th class="p-2 w-20">Código</th>
                      <th class="p-2">Descripción del Requerimiento</th>
                      <th class="p-2 w-32">Categoría</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-200">
                    <tr *ngIf="nonFunctionalRequirements.length === 0">
                      <td colSpan="3" class="p-4 text-center italic text-slate-400">Sin requerimientos no funcionales.</td>
                    </tr>
                    <tr *ngFor="let rnf of nonFunctionalRequirements" class="hover:bg-slate-50/50">
                      <td class="p-2 font-mono font-bold" [class]="getColors().text">{{rnf.code}}</td>
                      <td class="p-2 text-slate-700">{{rnf.desc}}</td>
                      <td class="p-2 text-slate-600 font-medium">{{rnf.category}}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 class="font-sans font-bold text-sm uppercase tracking-wide" [class]="getColors().text">
                {{renderSubTitle('3.7', 'Planificación de Iteraciones con Scrum')}}
              </h3>
              <p [class]="getBodyTextClass()">
                De acuerdo al backlog del producto, se planificaron las siguientes iteraciones (Sprints) para gestionar y dar seguimiento al desarrollo de las funcionalidades:
              </p>
              
              <div class="mt-3 space-y-3 font-sans">
                <div *ngFor="let iter of iterations" class="p-3 border rounded-lg text-xs space-y-1.5" [class]="template === 'executive' ? 'bg-indigo-50/30 border-indigo-100' : 'bg-slate-50 border-slate-200'">
                  <div class="flex justify-between font-bold text-slate-800">
                    <span>{{iter.name}} (Fechas: {{iter.startDate}} - {{iter.endDate}})</span>
                    <span class="font-bold" [class]="getColors().text">{{iter.status}}</span>
                  </div>
                  <p class="text-slate-600 italic">Meta: "{{iter.goal || 'Sin meta declarada.'}}"</p>
                  <div *ngIf="getTasksForIter(iter.id).length > 0" class="pt-1.5 border-t border-slate-200/60 mt-1">
                    <strong class="text-[10px] text-slate-500 uppercase font-bold block mb-1">Tareas del Sprint:</strong>
                    <ul class="list-disc pl-4 text-[11px] text-slate-700 space-y-0.5">
                      <li *ngFor="let task of getTasksForIter(iter.id)">
                        <strong>[{{task.status}}]</strong> {{task.title}} (Asignado: {{task.assignedTo || 'Sin asignar'}}) {{task.rfCode ? (' - Requisito: ' + task.rfCode) : ''}}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- CAPITULO 4 -->
        <div class="space-y-6 pt-6">
          <h2 class="font-sans font-extrabold text-xl text-slate-900 border-b-2 pb-2 uppercase" [class]="getColors().border">
            {{renderChapterTitle('4', 'Diseño del Sistema')}}
          </h2>

          <div [class]="getLineSpacingClass()">
            <div>
              <h3 class="font-sans font-bold text-sm uppercase tracking-wide" [class]="getColors().text">
                {{renderSubTitle('4.1', 'Arquitectura General')}}
              </h3>
              <p [class]="getBodyTextClass()">
                <strong>Estilo de Arquitectura Seleccionada:</strong> {{project.architectureType}}
              </p>
              <p [class]="getBodyTextClass()">
                {{project.architectureDescription}}
              </p>
            </div>

            <div>
              <h3 class="font-sans font-bold text-sm uppercase tracking-wide" [class]="getColors().text">
                {{renderSubTitle('4.5', 'Diseño Físico de Base de Datos (PostgreSQL DDL)')}}
              </h3>
              <p [class]="getBodyTextClass()">
                A continuación se muestra el script de base de datos generado en lenguaje de definición de datos (DDL) para crear las tablas físicas relacionales en PostgreSQL, incluyendo las llaves primarias, foráneas y restricciones lógicas:
              </p>
              
              <pre class="font-mono text-[10.5px] p-4 rounded-lg overflow-x-auto leading-relaxed border select-all" [class]="template === 'technical' ? 'bg-slate-950 text-emerald-400 border-slate-800' : 'bg-slate-50 text-slate-800 border-slate-200'">{{generateSqlScript()}}</pre>
            </div>

            <div>
              <h3 class="font-sans font-bold text-sm mb-2 uppercase tracking-wide" [class]="getColors().text">
                {{renderSubTitle('4.5.1', 'Diccionario de Datos Físico')}}
              </h3>
              <div *ngFor="let table of dbDesign" class="space-y-1.5 mb-4">
                <h4 class="font-mono text-xs font-bold" [class]="getColors().text">Tabla física: {{table.name}}</h4>
                <div class="border rounded-lg overflow-hidden font-sans text-xs" [class]="template === 'technical' ? 'border-slate-400' : 'border-slate-200'">
                  <table class="w-full text-left border-collapse">
                    <thead>
                      <tr class="font-bold border-b" [class]="template === 'technical' ? 'bg-slate-800 text-white border-slate-400' : 'bg-slate-100 text-slate-700 border-slate-200'">
                        <th class="p-1.5 pl-3">Campo</th>
                        <th class="p-1.5">Tipo de Dato</th>
                        <th class="p-1.5">Restricciones</th>
                        <th class="p-1.5 pr-3">Descripción / Uso</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-200 text-[11px]">
                      <tr *ngFor="let col of table.columns" class="hover:bg-slate-50/50">
                        <td class="p-1.5 pl-3 font-mono font-bold text-slate-800">{{col.name}}</td>
                        <td class="p-1.5 font-mono text-slate-600">{{col.type}}</td>
                        <td class="p-1.5">
                          <span *ngIf="col.isPk" class="bg-amber-50 text-amber-800 border border-amber-200 px-1 py-0.2 rounded font-mono font-bold text-[9px]">PK</span>
                          <span *ngIf="!col.isPk && col.isFk" class="bg-indigo-50 text-indigo-800 border border-indigo-200 px-1 py-0.2 rounded font-mono text-[9px]">FK ➔ {{col.fkRef}}</span>
                          <span *ngIf="!col.isPk && !col.isFk" class="text-slate-400">NOT NULL</span>
                        </td>
                        <td class="p-1.5 italic text-slate-500 pr-3">
                          {{col.isPk ? 'Identificador clave primaria de la tabla ' + table.name + '.' : 
                            col.isFk ? 'Clave foránea relacional referenciando a ' + col.fkRef + '.' : 
                            'Almacena el valor del atributo ' + col.name + '.'}}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- CAPITULO 5 -->
        <div class="space-y-6 pt-6">
          <h2 class="font-sans font-extrabold text-xl text-slate-900 border-b-2 pb-2 uppercase" [class]="getColors().border">
            {{renderChapterTitle('5', 'Implementación y Pruebas')}}
          </h2>

          <div [class]="getLineSpacingClass()">
            <h3 class="font-sans font-bold text-sm uppercase tracking-wide" [class]="getColors().text">
              {{renderSubTitle('5.2', 'Casos de Prueba Ejecutados y Evidencias')}}
            </h3>
            <p [class]="getBodyTextClass()">
              Para garantizar que el software se comporta de acuerdo a los requerimientos funcionales aprobados por el cliente, se definieron y ejecutaron los siguientes casos de prueba en la etapa de control de calidad (QA):
            </p>

            <div class="border rounded-lg overflow-hidden font-sans text-xs" [class]="template === 'technical' ? 'border-slate-400' : 'border-slate-200'">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="font-bold border-b" [class]="template === 'technical' ? 'bg-slate-800 text-white border-slate-400' : 'bg-slate-100 text-slate-700 border-slate-200'">
                    <th class="p-2 w-16 pl-3">Caso</th>
                    <th class="p-2">Nombre / Acción</th>
                    <th class="p-2">Pasos y Resultado Esperado</th>
                    <th class="p-2 w-24">Estado</th>
                    <th class="p-2 w-32 pr-3">Requisito</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200">
                  <tr *ngIf="testCases.length === 0">
                    <td colSpan="5" class="p-4 text-center italic text-slate-400">No se han registrado casos de prueba todavía.</td>
                  </tr>
                  <tr *ngFor="let test of testCases" class="hover:bg-slate-50/50">
                    <td class="p-2 pl-3 font-mono font-bold" [class]="getColors().text">{{test.code}}</td>
                    <td class="p-2">
                      <span class="font-bold block text-slate-800">{{test.name}}</span>
                      <span class="text-[10px] text-slate-500 block leading-normal font-sans">{{test.description}}</span>
                    </td>
                    <td class="p-2 text-slate-600 font-sans">
                      <span class="block"><strong>Pasos:</strong> {{test.steps}}</span>
                      <span class="block mt-0.5"><strong>Esperado:</strong> {{test.expectedResult}}</span>
                      <span *ngIf="test.evidenceNotes" class="block text-slate-500 text-[10px] bg-slate-100/50 px-1.5 py-0.5 rounded mt-1 font-sans">
                        <strong>Evidencia:</strong> {{test.evidenceNotes}}
                      </span>
                    </td>
                    <td class="p-2 font-bold font-sans">
                      <span class="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold inline-block" [class]="test.status === 'Passed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : test.status === 'Failed' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-50 text-slate-500 border border-slate-200'">
                        {{test.status === 'Passed' ? 'Aprobado' : test.status === 'Failed' ? 'Fallido' : 'Pendiente'}}
                      </span>
                    </td>
                    <td class="p-2 font-mono text-slate-500 pr-3 text-[10px]">{{test.rfCode || 'General'}}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- CAPITULO 6 -->
        <div class="space-y-6 pt-6">
          <h2 class="font-sans font-extrabold text-xl text-slate-900 border-b-2 pb-2 uppercase" [class]="getColors().border">
            {{renderChapterTitle('6', 'Conclusiones y Recomendaciones')}}
          </h2>

          <div [class]="getLineSpacingClass()">
            <div>
              <h3 class="font-sans font-bold text-sm uppercase tracking-wide" [class]="getColors().text">
                {{renderSubTitle('6.1', 'Conclusiones')}}
              </h3>
              <p [class]="getBodyTextClass()">
                {{project.conclusions}}
              </p>
            </div>

            <div>
              <h3 class="font-sans font-bold text-sm uppercase tracking-wide" [class]="getColors().text">
                {{renderSubTitle('6.2', 'Recomendaciones')}}
              </h3>
              <p [class]="getBodyTextClass()">
                {{project.recommendations}}
              </p>
            </div>

            <div>
              <h3 class="font-sans font-bold text-sm uppercase tracking-wide" [class]="getColors().text">
                {{renderSubTitle('6.3', 'Mejoras Futuras')}}
              </h3>
              <p [class]="getBodyTextClass()">
                {{project.futureImprovements}}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  `
})
export class ReportExporterComponent implements OnInit, OnChanges {
  @Input() project!: Project;
  @Input() iterations: ScrumIteration[] = [];
  @Input() tasks: ScrumTask[] = [];
  @Input() testCases: TestCase[] = [];

  specificObjectives: string[] = [];
  functionalRequirements: FunctionalRequirement[] = [];
  nonFunctionalRequirements: NonFunctionalRequirement[] = [];
  dbDesign: DbTable[] = [];

  template: 'academic' | 'executive' | 'technical' | 'minimal' = 'academic';
  fontFamily: 'serif' | 'sans' | 'mono' | 'georgia' = 'serif';
  fontSize: 'compact' | 'standard' | 'large' = 'standard';
  lineSpacing: 'single' | 'relaxed' | 'double' = 'relaxed';
  accentColor: 'indigo' | 'slate' | 'teal' | 'crimson' | 'ocean' = 'indigo';
  showCover: boolean = true;
  alignment: 'justify' | 'left' = 'justify';
  numberedSections: boolean = true;

  universityName = 'UNIVERSIDAD NACIONAL DE INGENIERÍA';
  facultyName = 'FACULTAD DE INGENIERÍA DE SISTEMAS';
  authorName = 'Grupo de Ingeniería de Software';
  showConfig: boolean = true;

  templateOptions = [
    { id: 'academic', label: 'Tesis / Académico Tradicional', desc: 'Times, sangrías, formal' },
    { id: 'executive', label: 'Informe Corporativo / Ejecutivo', desc: 'Sans, moderno, limpio' },
    { id: 'technical', label: 'Manual Técnico de Sistemas', desc: 'Compacto, grillas, código' },
    { id: 'minimal', label: 'Borrador Simple y Compacto', desc: 'Ahorro de tinta, sin portada' }
  ];

  fontOptions = [
    { id: 'serif', label: 'Classic Serif' },
    { id: 'sans', label: 'Modern Sans' },
    { id: 'mono', label: 'Tech Mono' },
    { id: 'georgia', label: 'Georgia Serif' }
  ];

  sizeOptions = [
    { id: 'compact', label: 'Compacto' },
    { id: 'standard', label: 'Estándar' },
    { id: 'large', label: 'Grande' }
  ];

  alignmentOptions = [
    { id: 'justify', label: 'Justificado' },
    { id: 'left', label: 'Alinear Izquierda' }
  ];

  colorOptions = [
    { id: 'indigo', color: 'bg-indigo-600' },
    { id: 'slate', color: 'bg-slate-900' },
    { id: 'teal', color: 'bg-teal-600' },
    { id: 'crimson', color: 'bg-rose-800' },
    { id: 'ocean', color: 'bg-sky-700' }
  ];

  lineSpacingOptions = [
    { id: 'single', label: 'Sencillo' },
    { id: 'relaxed', label: '1.5 líneas' },
    { id: 'double', label: 'Doble' }
  ];

  ngOnInit() {
    this.parseInputs();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['project']) {
      this.parseInputs();
    }
  }

  parseInputs() {
    if (!this.project) return;
    this.specificObjectives = this.getParsedList(this.project.specificObjectives);
    this.functionalRequirements = this.getParsedList(this.project.functionalRequirements);
    this.nonFunctionalRequirements = this.getParsedList(this.project.nonFunctionalRequirements);
    this.dbDesign = this.getParsedList(this.project.virtualDatabaseDesign);
  }

  getParsedList(jsonStr: string | null | undefined): any[] {
    try {
      if (!jsonStr) return [];
      return JSON.parse(jsonStr);
    } catch {
      return [];
    }
  }

  getEmisionDate(): string {
    if (!this.project || !this.project.createdAt) {
      return new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    return new Date(this.project.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  getTasksForIter(id: number): ScrumTask[] {
    return this.tasks.filter(t => t.iterationId === id);
  }

  getGithubRepos(): any[] {
    try {
      return JSON.parse(this.project.githubRepos || '[]');
    } catch {
      return [];
    }
  }

  generateSqlScript(): string {
    if (this.dbDesign.length === 0) return '-- No se han modelado tablas.';
    let sql = ``;
    this.dbDesign.forEach(table => {
      sql += `CREATE TABLE "${table.name}" (\n`;
      const colLines = table.columns.map(col => {
        let line = `  "${col.name}" ${col.type.toUpperCase()}`;
        if (col.isPk) line += ' PRIMARY KEY';
        if (!col.isPk && !col.isFk) line += ' NOT NULL';
        return line;
      });
      sql += colLines.join(',\n');
      sql += `\n);\n\n`;
    });

    this.dbDesign.forEach(table => {
      table.columns.forEach(col => {
        if (col.isFk && col.fkRef) {
          const parts = col.fkRef.split('.');
          if (parts.length === 2) {
            sql += `ALTER TABLE "${table.name}" ADD CONSTRAINT "fk_${table.name}_${col.name}"\n  FOREIGN KEY ("${col.name}") REFERENCES "${parts[0]}"("${parts[1]}") ON DELETE CASCADE;\n\n`;
          }
        }
      });
    });
    return sql;
  }

  handlePrint() {
    window.print();
  }

  resetSettings() {
    this.template = 'academic';
    this.fontFamily = 'serif';
    this.fontSize = 'standard';
    this.lineSpacing = 'relaxed';
    this.accentColor = 'indigo';
    this.showCover = true;
    this.alignment = 'justify';
    this.numberedSections = true;
    this.universityName = 'UNIVERSIDAD NACIONAL DE INGENIERÍA';
    this.facultyName = 'FACULTAD DE INGENIERÍA DE SISTEMAS';
    this.authorName = 'Grupo de Ingeniería de Software';
  }

  renderChapterTitle(num: string, text: string) {
    return this.numberedSections ? `Capítulo ${num}. ${text}` : text;
  }

  renderSubTitle(num: string, text: string) {
    return this.numberedSections ? `${num} ${text}` : text;
  }

  getFontClass() {
    switch (this.fontFamily) {
      case 'sans': return 'font-sans';
      case 'mono': return 'font-mono';
      case 'georgia': return 'font-serif';
      case 'serif':
      default:
        return 'font-serif';
    }
  }

  getFontInlineStyle() {
    if (this.fontFamily === 'georgia') {
      return { fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif' };
    }
    return {};
  }

  getBodyTextClass() {
    let classes = '';
    
    // Paragraph Alignment
    if (this.alignment === 'justify') {
      classes += ' text-justify';
    } else {
      classes += ' text-left';
    }

    // Font Size
    if (this.fontSize === 'compact') {
      classes += ' text-xs leading-normal';
    } else if (this.fontSize === 'large') {
      classes += ' text-base leading-loose';
    } else {
      classes += ' text-sm leading-relaxed';
    }

    // Indentation based on template
    if (this.template === 'academic') {
      classes += ' indent-8';
    } else {
      classes += ' indent-0';
    }

    return classes;
  }

  getLineSpacingClass() {
    switch (this.lineSpacing) {
      case 'single': return 'leading-normal space-y-4';
      case 'double': return 'leading-loose space-y-8';
      case 'relaxed':
      default:
        return 'leading-relaxed space-y-6';
    }
  }

  getColors() {
    switch (this.accentColor) {
      case 'slate': return { text: 'text-slate-900', bg: 'bg-slate-900', border: 'border-slate-900', ring: 'ring-slate-900' };
      case 'teal': return { text: 'text-teal-700', bg: 'bg-teal-700', border: 'border-teal-700', ring: 'ring-teal-700' };
      case 'crimson': return { text: 'text-rose-800', bg: 'bg-rose-800', border: 'border-rose-800', ring: 'ring-rose-800' };
      case 'ocean': return { text: 'text-sky-700', bg: 'bg-sky-700', border: 'border-sky-700', ring: 'ring-sky-700' };
      case 'indigo':
      default:
        return { text: 'text-indigo-600', bg: 'bg-indigo-600', border: 'border-indigo-600', ring: 'ring-indigo-600' };
    }
  }

  getWikiContainerClass() {
    if (this.template === 'executive') {
      return 'bg-indigo-50/45 border-indigo-150';
    } else if (this.template === 'technical') {
      return 'bg-slate-50 border-slate-300 font-mono text-[11px]';
    }
    return 'bg-slate-50 border-slate-150';
  }

  applyTemplatePreset(selectedTemplate: 'academic' | 'executive' | 'technical' | 'minimal') {
    this.template = selectedTemplate;
    if (selectedTemplate === 'academic') {
      this.fontFamily = 'serif';
      this.fontSize = 'standard';
      this.lineSpacing = 'relaxed';
      this.alignment = 'justify';
      this.numberedSections = true;
      this.showCover = true;
    } else if (selectedTemplate === 'executive') {
      this.fontFamily = 'sans';
      this.fontSize = 'standard';
      this.lineSpacing = 'relaxed';
      this.alignment = 'left';
      this.numberedSections = true;
      this.showCover = true;
      this.accentColor = 'indigo';
    } else if (selectedTemplate === 'technical') {
      this.fontFamily = 'sans';
      this.fontSize = 'compact';
      this.lineSpacing = 'single';
      this.alignment = 'left';
      this.numberedSections = true;
      this.showCover = true;
      this.accentColor = 'slate';
    } else if (selectedTemplate === 'minimal') {
      this.fontFamily = 'sans';
      this.fontSize = 'compact';
      this.lineSpacing = 'single';
      this.alignment = 'justify';
      this.numberedSections = false;
      this.showCover = false;
    }
  }
}
