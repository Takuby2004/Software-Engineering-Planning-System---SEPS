import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DbTable, DbColumn } from '../../types.ts';

interface Connection {
  fromTable: string;
  fromColumn: string;
  fromColIndex: number;
  toTable: string;
  toColumn: string;
  toColIndex: number;
}

@Component({
  selector: 'app-virtual-db-designer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-4 text-xs text-left">
      <!-- Designer Navigation -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
        <div>
          <h2 class="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <svg class="w-4 h-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/>
            </svg>
            Modelador de Base de Datos Relacional (PostgreSQL)
          </h2>
          <p class="text-[11px] text-slate-400">
            Diseña tus tablas interactivamente para generar el Diagrama ER, Script SQL y el Diccionario de Datos.
          </p>
        </div>

        <div class="flex bg-slate-100 rounded-md p-0.5 self-start">
          <button
            (click)="activeTab = 'der'"
            class="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer"
            [class.bg-white]="activeTab === 'der'"
            [class.text-indigo-600]="activeTab === 'der'"
            [class.shadow-xs]="activeTab === 'der'"
            [class.text-slate-600]="activeTab !== 'der'"
            [class.hover:text-slate-900]="activeTab !== 'der'"
          >
            <svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/><circle cx="12" cy="12" r="3"/>
            </svg>
            Diagrama DER
          </button>
          <button
            (click)="activeTab = 'sql'"
            class="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer"
            [class.bg-white]="activeTab === 'sql'"
            [class.text-indigo-600]="activeTab === 'sql'"
            [class.shadow-xs]="activeTab === 'sql'"
            [class.text-slate-600]="activeTab !== 'sql'"
            [class.hover:text-slate-900]="activeTab !== 'sql'"
          >
            <svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
            </svg>
            Script SQL
          </button>
          <button
            (click)="activeTab = 'dict'"
            class="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer"
            [class.bg-white]="activeTab === 'dict'"
            [class.text-indigo-600]="activeTab === 'dict'"
            [class.shadow-xs]="activeTab === 'dict'"
            [class.text-slate-600]="activeTab !== 'dict'"
            [class.hover:text-slate-900]="activeTab !== 'dict'"
          >
            <svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
            Diccionario de Datos
          </button>
        </div>
      </div>

      <!-- Main Designer Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <!-- Left Side: Tables List -->
        <div class="lg:col-span-1 space-y-3">
          <div class="bg-white rounded-lg shadow-xs border border-slate-200 p-3">
            <h3 class="font-bold text-slate-800 text-xs mb-2 flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5 text-emerald-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Agregar Nueva Tabla
            </h3>
            <div class="space-y-1.5">
              <input
                type="text"
                class="w-full text-xs border border-slate-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                placeholder="Nombre de tabla (ej: clientes)"
                [(ngModel)]="newTableName"
                (keydown.enter)="handleAddTable()"
              />
              <button
                (click)="handleAddTable()"
                class="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-1.5 rounded-md transition-colors cursor-pointer"
              >
                Agregar Tabla
              </button>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-xs border border-slate-200 p-3">
            <h3 class="font-bold text-slate-800 text-xs mb-2">
              Tablas del Modelo ({{tables.length}})
            </h3>
            <div *ngIf="tables.length === 0" class="text-[11px] text-slate-400 italic">No hay tablas creadas.</div>
            <div *ngIf="tables.length > 0" class="space-y-1 max-h-64 overflow-y-auto">
              <div
                *ngFor="let table of tables; let idx = index"
                class="flex items-center justify-between p-1.5 rounded-md text-xs cursor-pointer transition-colors"
                [class.bg-indigo-50]="editingTableIndex === idx"
                [class.border]="editingTableIndex === idx"
                [class.border-indigo-100]="editingTableIndex === idx"
                [class.text-indigo-900]="editingTableIndex === idx"
                [class.font-bold]="editingTableIndex === idx"
                [class.hover:bg-slate-50]="editingTableIndex !== idx"
                [class.text-slate-600]="editingTableIndex !== idx"
                (click)="editingTableIndex = idx"
              >
                <span class="truncate flex items-center gap-1">
                  <svg class="w-3 h-3 text-indigo-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/>
                  </svg>
                  {{table.name}}
                </span>
                <button
                  (click)="$event.stopPropagation(); handleDeleteTable(idx)"
                  class="p-1 text-slate-400 hover:text-red-500 rounded transition-colors cursor-pointer"
                >
                  <svg class="w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Side: Views -->
        <div class="lg:col-span-3 space-y-4">
          <!-- DER TAB -->
          <div *ngIf="activeTab === 'der'" class="space-y-4">
            <!-- Table Fields Editor -->
            <div *ngIf="editingTableIndex !== null && tables[editingTableIndex]" class="bg-slate-50 rounded-xl border border-indigo-100 p-4 space-y-4">
              <div class="flex items-center justify-between border-b border-indigo-100 pb-2">
                <h4 class="font-semibold text-slate-800 text-sm flex items-center gap-2">
                  <svg class="w-4 h-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                  </svg>
                  Campos de la Tabla: <span class="font-mono text-indigo-600 font-bold">"{{tables[editingTableIndex].name}}"</span>
                </h4>
                <button
                  (click)="editingTableIndex = null"
                  class="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cerrar Editor
                </button>
              </div>

              <!-- Add Column Form -->
              <div class="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                <div>
                  <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nombre</label>
                  <input
                    type="text"
                    class="w-full text-xs border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                    placeholder="id, nombre, etc."
                    [(ngModel)]="newColName"
                  />
                </div>

                <div>
                  <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tipo de Dato</label>
                  <select
                    class="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                    [(ngModel)]="newColType"
                  >
                    <option value="serial">SERIAL</option>
                    <option value="integer">INTEGER</option>
                    <option value="varchar(100)">VARCHAR(100)</option>
                    <option value="varchar(255)">VARCHAR(255)</option>
                    <option value="text">TEXT</option>
                    <option value="boolean">BOOLEAN</option>
                    <option value="timestamp">TIMESTAMP</option>
                    <option value="numeric">NUMERIC</option>
                  </select>
                </div>

                <div class="flex gap-4 items-center h-9 justify-start">
                  <label class="flex items-center gap-1 text-xs cursor-pointer select-none">
                    <input
                      type="checkbox"
                      [checked]="newColIsPk"
                      (change)="toggleColPk($event)"
                    />
                    🔑 PK
                  </label>
                  <label class="flex items-center gap-1 text-xs cursor-pointer select-none">
                    <input
                      type="checkbox"
                      [checked]="newColIsFk"
                      (change)="toggleColFk($event)"
                    />
                    🔗 FK
                  </label>
                </div>

                <div>
                  <button
                    (click)="handleAddColumn(editingTableIndex)"
                    class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs py-2 rounded-lg transition-colors cursor-pointer"
                  >
                    Añadir Campo
                  </button>
                </div>
              </div>

              <!-- FK Options -->
              <div *ngIf="newColIsFk" class="bg-amber-50/50 border border-amber-100 p-2.5 rounded-lg flex items-center gap-3">
                <span class="text-xs text-amber-800 flex items-center gap-1">
                  <!-- Link Icon -->
                  <svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                  </svg>
                  Referencia Clave Foránea:
                </span>
                <select
                  class="text-xs border border-slate-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  [(ngModel)]="newColFkRef"
                >
                  <option value="">-- Selecciona campo destino PK --</option>
                  <option *ngFor="let t of getFkTargets()" [value]="t">{{t}}</option>
                </select>
              </div>

              <!-- Columns list -->
              <div class="border border-slate-200 rounded-lg overflow-hidden bg-white">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                      <th class="p-2.5 pl-4">Columna</th>
                      <th class="p-2.5">Tipo</th>
                      <th class="p-2.5">Atributos</th>
                      <th class="p-2.5 text-right pr-4">Acción</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 text-xs text-slate-700">
                    <tr *ngIf="tables[editingTableIndex].columns.length === 0">
                      <td colSpan="4" class="p-4 text-center text-slate-400 italic">No hay columnas creadas todavía.</td>
                    </tr>
                    <tr *ngFor="let col of tables[editingTableIndex].columns; let cIdx = index" class="hover:bg-slate-50">
                      <td class="p-2.5 pl-4 font-mono font-medium">{{col.name}}</td>
                      <td class="p-2.5 font-mono text-slate-500">{{col.type}}</td>
                      <td class="p-2.5 flex items-center gap-1.5 h-9">
                        <span *ngIf="col.isPk" class="bg-amber-50 text-amber-700 border border-amber-200 rounded-md px-1.5 py-0.5 text-[10px] font-bold flex items-center gap-0.5">
                          🔑 PK
                        </span>
                        <span *ngIf="col.isFk" class="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md px-1.5 py-0.5 text-[10px] font-bold flex items-center gap-0.5">
                          🔗 FK ➔ {{col.fkRef}}
                        </span>
                        <span *ngIf="!col.isPk && !col.isFk" class="text-slate-400 text-[10px]">NOT NULL</span>
                      </td>
                      <td class="p-2.5 text-right pr-4">
                        <button
                          (click)="handleDeleteColumn(editingTableIndex, cIdx)"
                          class="text-slate-400 hover:text-red-500 p-1 cursor-pointer"
                        >
                          <svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Controls bar -->
            <div *ngIf="tables.length > 0" class="flex items-center justify-between bg-slate-800/90 p-3 border border-slate-700/60 rounded-xl text-slate-200">
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-indigo-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/>
                </svg>
                <span class="text-[10px] text-slate-300 font-medium">
                  Arrastra los encabezados para organizar tu base de datos relacional. Se detectaron <strong class="text-indigo-400">{{connections.length}} relaciones</strong>.
                </span>
              </div>
              <button
                type="button"
                (click)="resetLayout()"
                class="px-3 py-1 text-[10px] font-bold bg-slate-900 hover:bg-slate-750 border border-slate-700 text-slate-200 hover:text-white rounded-lg transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
              >
                Restaurar Distribución
              </button>
            </div>

            <!-- Graphical ER Panel (Interactive Canvas) -->
            <div 
              class="w-full h-[520px] overflow-auto border border-slate-800 bg-slate-950 rounded-xl relative select-none der-container scrollbar-thin scrollbar-thumb-slate-800"
              (mousemove)="handleContainerMouseMove($event)"
              (mouseup)="handleContainerMouseUp()"
              (mouseleave)="handleContainerMouseUp()"
            >
              <div *ngIf="tables.length === 0" class="absolute inset-0 flex flex-col justify-center items-center text-center text-slate-500 p-8 space-y-2">
                <svg class="w-12 h-12 text-slate-600 animate-bounce" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/>
                </svg>
                <h5 class="font-bold text-slate-300">Diagrama de Entidad Relación Vacío</h5>
                <p class="text-xs max-w-sm font-sans">Usa la barra lateral izquierda para crear tablas e ingresar sus columnas correspondientes.</p>
              </div>

              <div *ngIf="tables.length > 0" class="w-[1600px] h-[1000px] relative bg-slate-950/80">
                <!-- Grid Blueprint Wallpaper -->
                <div class="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1.5px,transparent_1.5px),linear-gradient(to_bottom,#1e293b_1.5px,transparent_1.5px)] bg-[size:28px_28px] opacity-25 pointer-events-none"></div>
                
                <!-- SVG Connector layer -->
                <svg class="absolute inset-0 pointer-events-none w-full h-full z-0">
                  <defs>
                    <!-- Crow's Foot / N-side (FK) relation marker -->
                    <marker
                      id="crow-many"
                      markerWidth="12"
                      markerHeight="12"
                      refX="2"
                      refY="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 12 1 L 1 6 L 12 11" fill="none" stroke="#6366f1" stroke-width="1.5" />
                      <line x1="8" y1="1" x2="8" y2="11" stroke="#6366f1" stroke-width="1" />
                    </marker>
                    
                    <!-- One-side (PK) relation marker -->
                    <marker
                      id="crow-one"
                      markerWidth="12"
                      markerHeight="12"
                      refX="10"
                      refY="6"
                      orient="auto-start-reverse"
                    >
                      <line x1="4" y1="1" x2="4" y2="11" stroke="#fbbf24" stroke-width="2" />
                      <line x1="8" y1="1" x2="8" y2="11" stroke="#fbbf24" stroke-width="2" />
                    </marker>
                  </defs>

                  <g *ngFor="let c of connections; let idx = index">
                    <!-- Fat hoverable helper path -->
                    <path
                      [attr.d]="getConnectionPath(c)"
                      fill="none"
                      stroke="transparent"
                      stroke-width="12"
                      class="cursor-pointer pointer-events-auto"
                      (mouseenter)="hoveredConnection = idx"
                      (mouseleave)="hoveredConnection = null"
                    />
                    <!-- Real visual path -->
                    <path
                      [attr.d]="getConnectionPath(c)"
                      fill="none"
                      [attr.stroke]="hoveredConnection === idx ? '#818cf8' : hoveredConnection !== null ? '#1e293b' : '#6366f1'"
                      [attr.stroke-width]="hoveredConnection === idx ? 2.5 : 1.5"
                      marker-start="url(#crow-many)"
                      marker-end="url(#crow-one)"
                      class="transition-all duration-150"
                    />
                  </g>
                </svg>

                <!-- Table boxes -->
                <div
                  *ngFor="let table of tables; let tIdx = index"
                  [style.left.px]="tablePositions[table.name]?.x ?? (50 + tIdx * 280)"
                  [style.top.px]="tablePositions[table.name]?.y ?? 50"
                  class="w-64 bg-slate-950 border rounded-xl shadow-2xl overflow-hidden absolute z-10 transition-shadow duration-150 text-left"
                  [class.border-indigo-500]="editingTableIndex === tIdx"
                  [class.ring-2]="editingTableIndex === tIdx"
                  [class.ring-indigo-500-40]="editingTableIndex === tIdx"
                  (click)="editingTableIndex = tIdx"
                >
                  <!-- Table Header Drag Handle -->
                  <div 
                    (mousedown)="handleMouseDown(table.name, $event)"
                    class="bg-slate-900/90 px-3.5 py-2.5 border-b border-slate-800 flex items-center justify-between cursor-grab active:cursor-grabbing select-none hover:bg-slate-800/80 transition-colors"
                  >
                    <span class="font-mono text-xs font-extrabold text-indigo-400 flex items-center gap-1.5 truncate" [title]="table.name">
                      <svg class="w-3.5 h-3.5 shrink-0 text-indigo-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/>
                      </svg>
                      {{table.name}}
                    </span>
                    <span class="text-[9px] font-mono font-bold bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
                      {{table.columns.length}} campos
                    </span>
                  </div>

                  <!-- Columns List inside the Box -->
                  <div class="p-1.5 space-y-0.5 bg-slate-950/40">
                    <div *ngIf="table.columns.length === 0" class="text-center py-5 text-[10px] text-slate-600 italic font-sans">
                      Sin campos. Haz clic para agregar.
                    </div>
                    <div 
                      *ngFor="let col of table.columns" 
                      class="flex items-center justify-between text-[11px] h-[21px] px-2 font-mono text-slate-300 hover:bg-slate-900/50 rounded transition-colors"
                    >
                      <span class="flex items-center gap-1 truncate font-medium">
                        <span *ngIf="col.isPk" class="text-amber-400 shrink-0 font-bold">🔑</span>
                        <span *ngIf="col.isFk" class="text-emerald-400 shrink-0 font-bold">🔗</span>
                        <span [class.text-amber-300]="col.isPk" [class.font-bold]="col.isPk" [class.text-emerald-300]="col.isFk" [class.font-medium]="col.isFk" class="text-slate-300">
                          {{col.name}}
                        </span>
                      </span>
                      <span class="text-slate-500 text-[9px] uppercase tracking-tight shrink-0 font-bold">{{col.type}}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- SQL TAB -->
          <div *ngIf="activeTab === 'sql'" class="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
            <div class="flex items-center justify-between border-b border-slate-800 pb-2">
              <span class="text-xs font-bold text-indigo-400 font-mono flex items-center gap-1.5">
                <svg class="w-4 h-4 text-indigo-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
                </svg>
                postgresql_schema.sql
              </span>
              <button
                (click)="copySql()"
                class="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg transition-colors font-semibold cursor-pointer"
              >
                Copiar Código
              </button>
            </div>
            <pre class="font-mono text-xs text-slate-300 p-4 bg-slate-950 overflow-x-auto max-h-96 leading-relaxed select-all text-left">{{generateSql()}}</pre>
          </div>

          <!-- DICTIONARY TAB -->
          <div *ngIf="activeTab === 'dict'" class="bg-white border border-slate-200 rounded-xl p-5 space-y-6 text-left">
            <h3 class="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-2">
              Diccionario de Datos del Proyecto (Estándar Académico)
            </h3>
            
            <div *ngIf="tables.length === 0" class="text-xs text-slate-400 italic text-center py-10 font-sans">
              Crea tablas para generar el diccionario de datos.
            </div>

            <div *ngIf="tables.length > 0" class="space-y-6">
              <div *ngFor="let table of tables" class="space-y-2">
                <h4 class="font-mono text-xs font-bold text-indigo-600 flex items-center gap-1.5">
                  <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/>
                  </svg>
                  Tabla: {{table.name}}
                </h4>
                <div class="border border-slate-200 rounded-lg overflow-hidden">
                  <table class="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr class="bg-slate-50 font-bold text-slate-600 border-b border-slate-200">
                        <th class="p-2.5 w-1/4">Campo</th>
                        <th class="p-2.5 w-1/5">Tipo de Dato</th>
                        <th class="p-2.5 w-1/4">Restricciones (Constraints)</th>
                        <th class="p-2.5 w-1/3">Descripción del Campo</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-200 text-slate-700">
                      <tr *ngIf="table.columns.length === 0">
                        <td colSpan="4" class="p-3 text-center text-slate-400 italic font-sans">No hay campos en esta tabla.</td>
                      </tr>
                      <tr *ngFor="let col of table.columns">
                        <td class="p-2.5 font-mono font-bold text-indigo-900">{{col.name}}</td>
                        <td class="p-2.5 font-mono text-slate-600">{{col.type.toUpperCase()}}</td>
                        <td class="p-2.5 font-sans font-medium">
                          <span *ngIf="col.isPk">Primary Key (Clave Primaria)</span>
                          <span *ngIf="col.isFk">Foreign Key (Clave Foránea) referencias {{col.fkRef}}</span>
                          <span *ngIf="!col.isPk && !col.isFk">NOT NULL</span>
                        </td>
                        <td class="p-2.5 font-sans italic text-slate-500">
                          {{ col.isPk ? 'Identificador único para la tabla ' + table.name + '.' : 
                             col.isFk ? 'Llave relacional asociada con la tabla "' + col.fkRef?.split('.')[0] + '".' : 
                             'Almacena el valor de ' + col.name + ' para cada registro.' }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class VirtualDbDesignerComponent implements OnInit, OnChanges {
  @Input() initialDesign: string = '';
  @Output() save = new EventEmitter<string>();

  tables: DbTable[] = [];
  activeTab: 'der' | 'sql' | 'dict' = 'der';

  // Forms states
  newTableName: string = '';
  editingTableIndex: number | null = null;

  newColName: string = '';
  newColType: string = 'varchar(100)';
  newColIsPk: boolean = false;
  newColIsFk: boolean = false;
  newColFkRef: string = '';

  // ER Positions
  tablePositions: Record<string, { x: number; y: number }> = {};
  draggingTable: string | null = null;
  dragOffset = { x: 0, y: 0 };
  hoveredConnection: number | null = null;

  connections: Connection[] = [];

  ngOnInit() {
    this.parseInitialDesign();
    this.updateConnections();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['initialDesign']) {
      this.parseInitialDesign();
      this.updateConnections();
    }
  }

  parseInitialDesign() {
    try {
      if (this.initialDesign) {
        this.tables = JSON.parse(this.initialDesign);
      } else {
        this.tables = [];
      }
    } catch (e) {
      console.error('Error parsing database design:', e);
      this.tables = [];
    }
    this.recalculatePositions();
  }

  saveChanges() {
    this.save.emit(JSON.stringify(this.tables));
    this.updateConnections();
  }

  recalculatePositions() {
    if (this.tables.length === 0) return;
    const updated = { ...this.tablePositions };
    let changed = false;

    this.tables.forEach((table, index) => {
      if (!updated[table.name]) {
        const col = index % 3;
        const row = Math.floor(index / 3);
        updated[table.name] = {
          x: col * 290 + 40,
          y: row * 240 + 40
        };
        changed = true;
      }
    });

    if (changed) {
      this.tablePositions = updated;
    }
  }

  resetLayout() {
    const updated: Record<string, { x: number; y: number }> = {};
    this.tables.forEach((table, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      updated[table.name] = {
        x: col * 290 + 40,
        y: row * 240 + 40
      };
    });
    this.tablePositions = updated;
  }

  // Mouse drag handles
  handleMouseDown(tableName: string, e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('select') || target.closest('input')) {
      return;
    }
    e.preventDefault();
    const currentPos = this.tablePositions[tableName] || { x: 0, y: 0 };
    this.draggingTable = tableName;
    this.dragOffset = {
      x: e.clientX - currentPos.x,
      y: e.clientY - currentPos.y
    };
  }

  handleContainerMouseMove(e: MouseEvent) {
    if (!this.draggingTable) return;
    const newX = Math.max(10, Math.min(1500, e.clientX - this.dragOffset.x));
    const newY = Math.max(10, Math.min(1000, e.clientY - this.dragOffset.y));
    this.tablePositions[this.draggingTable] = { x: newX, y: newY };
  }

  handleContainerMouseUp() {
    this.draggingTable = null;
  }

  updateConnections() {
    const list: Connection[] = [];
    this.tables.forEach((table) => {
      table.columns.forEach((col, colIdx) => {
        if (col.isFk && col.fkRef) {
          const parts = col.fkRef.split('.');
          if (parts.length === 2) {
            const targetTableName = parts[0];
            const targetColName = parts[1];
            
            const targetTableIdx = this.tables.findIndex(t => t.name === targetTableName);
            if (targetTableIdx !== -1) {
              const targetColIdx = this.tables[targetTableIdx].columns.findIndex(c => c.name === targetColName);
              list.push({
                fromTable: table.name,
                fromColumn: col.name,
                fromColIndex: colIdx,
                toTable: targetTableName,
                toColumn: targetColName,
                toColIndex: targetColIdx !== -1 ? targetColIdx : 0
              });
            }
          }
        }
      });
    });
    this.connections = list;
  }

  getConnectionPath(c: Connection): string {
    const posA = this.tablePositions[c.fromTable] || { x: 40, y: 40 };
    const posB = this.tablePositions[c.toTable] || { x: 40, y: 40 };

    const tableWidth = 256;
    const headerHeight = 36;
    const rowHeight = 21;
    
    const yA = posA.y + headerHeight + (c.fromColIndex * rowHeight) + 12;
    const yB = posB.y + headerHeight + (c.toColIndex * rowHeight) + 12;
    
    let xA = 0;
    let xB = 0;
    
    if (posA.x + tableWidth < posB.x) {
      xA = posA.x + tableWidth;
      xB = posB.x;
    } else if (posB.x + tableWidth < posA.x) {
      xA = posA.x;
      xB = posB.x + tableWidth;
    } else {
      if (posA.x < posB.x) {
        xA = posA.x + tableWidth;
        xB = posB.x;
      } else {
        xA = posA.x;
        xB = posB.x + tableWidth;
      }
    }

    const dx = Math.abs(xB - xA);
    const controlOffset = Math.max(60, dx * 0.45);

    const cp1X = xA === posA.x + tableWidth ? xA + controlOffset : xA - controlOffset;
    const cp2X = xB === posB.x + tableWidth ? xB + controlOffset : xB - controlOffset;

    return `M ${xA} ${yA} C ${cp1X} ${yA}, ${cp2X} ${yB}, ${xB} ${yB}`;
  }

  handleAddTable() {
    if (!this.newTableName.trim()) return;
    const cleanName = this.newTableName.trim().toLowerCase().replace(/\s+/g, '_');
    if (this.tables.some(t => t.name === cleanName)) {
      alert('Ya existe una tabla con ese nombre.');
      return;
    }
    this.tables.push({ name: cleanName, columns: [] });
    this.saveChanges();
    this.newTableName = '';
    this.recalculatePositions();
  }

  handleDeleteTable(index: number) {
    if (!confirm('¿Estás seguro de eliminar esta tabla?')) return;
    this.tables.splice(index, 1);
    this.saveChanges();
    if (this.editingTableIndex === index) {
      this.editingTableIndex = null;
    } else if (this.editingTableIndex !== null && this.editingTableIndex > index) {
      this.editingTableIndex--;
    }
  }

  toggleColPk(e: any) {
    this.newColIsPk = e.target.checked;
    if (this.newColIsPk) {
      this.newColIsFk = false;
    }
  }

  toggleColFk(e: any) {
    this.newColIsFk = e.target.checked;
    if (this.newColIsFk) {
      this.newColIsPk = false;
    }
  }

  handleAddColumn(tableIndex: number) {
    if (!this.newColName.trim()) return;
    const cleanColName = this.newColName.trim().toLowerCase().replace(/\s+/g, '_');
    const table = this.tables[tableIndex];
    if (table.columns.some(c => c.name === cleanColName)) {
      alert('Ya existe una columna con ese nombre en esta tabla.');
      return;
    }

    const newColumn: DbColumn = {
      name: cleanColName,
      type: this.newColType,
      isPk: this.newColIsPk,
      isFk: this.newColIsFk,
      fkRef: this.newColIsFk ? this.newColFkRef : undefined,
    };

    table.columns.push(newColumn);
    this.saveChanges();

    // Reset column form
    this.newColName = '';
    this.newColType = 'varchar(100)';
    this.newColIsPk = false;
    this.newColIsFk = false;
    this.newColFkRef = '';
  }

  handleDeleteColumn(tableIndex: number, colIndex: number) {
    this.tables[tableIndex].columns.splice(colIndex, 1);
    this.saveChanges();
  }

  generateSql(): string {
    if (this.tables.length === 0) return '-- No hay tablas definidas en el modelo todavía.';
    let sql = `-- SCRIPT DE CREACION FISICA - POSTGRESQL\n-- Generado automáticamente por Variables + Innovación Project Hub\n\n`;
    
    this.tables.forEach(table => {
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

    let hasFks = false;
    this.tables.forEach(table => {
      table.columns.forEach(col => {
        if (col.isFk && col.fkRef) {
          const parts = col.fkRef.split('.');
          if (parts.length === 2) {
            hasFks = true;
            const refTable = parts[0];
            const refCol = parts[1];
            sql += `ALTER TABLE "${table.name}" \n  ADD CONSTRAINT "fk_${table.name}_${col.name}" \n  FOREIGN KEY ("${col.name}") REFERENCES "${refTable}"("${refCol}") ON DELETE CASCADE;\n\n`;
          }
        }
      });
    });

    if (!hasFks) {
      sql += `-- No se detectaron claves foráneas adicionales para referenciar.`;
    }

    return sql;
  }

  getFkTargets(): string[] {
    const targets: string[] = [];
    this.tables.forEach(table => {
      table.columns.forEach(col => {
        if (col.isPk) {
          targets.push(`${table.name}.${col.name}`);
        }
      });
    });
    return targets;
  }

  copySql() {
    navigator.clipboard.writeText(this.generateSql());
    alert('¡Script copiado al portapapeles!');
  }
}
