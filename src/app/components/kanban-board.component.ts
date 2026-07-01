import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScrumIteration, ScrumTask, FunctionalRequirement } from '../../types.ts';

interface ColumnConfig {
  title: string;
  status: ScrumTask['status'];
  bg: string;
  text: string;
  border: string;
}

@Component({
  selector: 'app-kanban-board',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-4 text-xs text-left">
      <!-- Scrum Board Header & Selectors -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h2 class="text-sm font-bold text-slate-850 flex items-center gap-1.5">
            <!-- Check Square Icon -->
            <svg class="w-4 h-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            Planificación Ágil - Scrum Board & Backlog
          </h2>
          <p class="text-[11px] text-slate-400 font-sans">
            Crea iteraciones (Sprints), gestiona el backlog y visualiza las tareas en el tablero ágil.
          </p>
        </div>

        <div class="flex flex-wrap gap-1.5">
          <button
            (click)="showAddIterForm = true"
            class="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-md transition-colors cursor-pointer shadow-3xs"
          >
            <!-- Calendar Icon -->
            <svg class="w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Nuevo Sprint
          </button>
          <button
            (click)="showAddTaskForm = true"
            class="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-md transition-colors cursor-pointer shadow-3xs"
          >
            <!-- Plus Icon -->
            <svg class="w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nueva Tarea
          </button>
        </div>
      </div>

      <!-- Sprints Filter bar -->
      <div class="flex items-center gap-1.5 overflow-x-auto pb-1 select-none">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wide mr-1.5 shrink-0 font-sans">Filtrar:</span>
        <button
          (click)="selectedIterationId = 'all'"
          class="px-2 py-1 text-[11px] rounded-md border font-bold shrink-0 transition-colors cursor-pointer"
          [class.bg-indigo-50]="selectedIterationId === 'all'"
          [class.border-indigo-200]="selectedIterationId === 'all'"
          [class.text-indigo-700]="selectedIterationId === 'all'"
          [class.bg-white]="selectedIterationId !== 'all'"
          [class.border-slate-200]="selectedIterationId !== 'all'"
          [class.text-slate-600]="selectedIterationId !== 'all'"
          [class.hover:bg-slate-50]="selectedIterationId !== 'all'"
        >
          Todo ({{tasks.length}})
        </button>
        <button
          (click)="selectedIterationId = 'backlog'"
          class="px-2 py-1 text-[11px] rounded-md border font-bold shrink-0 transition-colors cursor-pointer"
          [class.bg-indigo-50]="selectedIterationId === 'backlog'"
          [class.border-indigo-200]="selectedIterationId === 'backlog'"
          [class.text-indigo-700]="selectedIterationId === 'backlog'"
          [class.bg-white]="selectedIterationId !== 'backlog'"
          [class.border-slate-200]="selectedIterationId !== 'backlog'"
          [class.text-slate-600]="selectedIterationId !== 'backlog'"
          [class.hover:bg-slate-50]="selectedIterationId !== 'backlog'"
        >
          Backlog ({{getBacklogCount()}})
        </button>
        <button
          *ngFor="let iter of iterations"
          (click)="selectedIterationId = iter.id"
          class="px-2 py-1 text-[11px] rounded-md border font-bold shrink-0 transition-colors cursor-pointer"
          [class.bg-indigo-50]="selectedIterationId === iter.id"
          [class.border-indigo-200]="selectedIterationId === iter.id"
          [class.text-indigo-700]="selectedIterationId === iter.id"
          [class.bg-white]="selectedIterationId !== iter.id"
          [class.border-slate-200]="selectedIterationId !== iter.id"
          [class.text-slate-600]="selectedIterationId !== iter.id"
          [class.hover:bg-slate-50]="selectedIterationId !== iter.id"
        >
          {{iter.name}} ({{getIterCount(iter.id)}})
        </button>
      </div>

      <!-- active iteration details banner -->
      <div *ngIf="getActiveIteration() as activeIter" class="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-[11px]">
        <div class="space-y-0.5">
          <h4 class="font-bold text-slate-850 flex items-center gap-1">
            <!-- Calendar Icon -->
            <svg class="w-3.5 h-3.5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {{activeIter.name}} &middot; Meta del Sprint
          </h4>
          <p class="text-[10px] text-slate-500 italic font-sans">"{{activeIter.goal || 'Sin meta definida.'}}"</p>
        </div>
        <div class="text-[10px] font-mono text-slate-400 flex gap-3 shrink-0">
          <span>Inicio: <strong class="text-slate-600">{{activeIter.startDate}}</strong></span>
          <span>Fin: <strong class="text-slate-600">{{activeIter.endDate}}</strong></span>
          <span class="capitalize">Estado: <strong class="text-indigo-600">{{activeIter.status}}</strong></span>
        </div>
      </div>

      <!-- SPRINT FORM MODAL -->
      <div *ngIf="showAddIterForm" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
        <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
          <h3 class="font-bold text-slate-900 text-base">Crear Nueva Iteración (Sprint)</h3>
          
          <div class="space-y-3 text-xs">
            <div>
              <label class="block text-slate-600 font-semibold mb-1">Nombre</label>
              <input
                type="text"
                class="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white"
                placeholder="Ej: Sprint 1 - Core Backend"
                [(ngModel)]="iterName"
              />
            </div>

            <div>
              <label class="block text-slate-600 font-semibold mb-1">Meta del Sprint</label>
              <textarea
                class="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none h-20 resize-none bg-white font-sans"
                placeholder="Ej: Implementar registro de usuarios y la base de datos relacional"
                [(ngModel)]="iterGoal"
              ></textarea>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-slate-600 font-semibold mb-1">Fecha de Inicio</label>
                <input
                  type="date"
                  class="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white"
                  [(ngModel)]="iterStart"
                />
              </div>
              <div>
                <label class="block text-slate-600 font-semibold mb-1">Fecha de Fin</label>
                <input
                  type="date"
                  class="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white"
                  [(ngModel)]="iterEnd"
                />
              </div>
            </div>
          </div>

          <div class="flex gap-2 justify-end">
            <button
              (click)="showAddIterForm = false"
              class="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer"
            >
              Cancelar
            </button>
            <button
              (click)="handleCreateIteration()"
              class="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2 rounded-lg cursor-pointer"
            >
              Crear Sprint
            </button>
          </div>
        </div>
      </div>

      <!-- TASK FORM MODAL -->
      <div *ngIf="showAddTaskForm" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
        <div class="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
          <h3 class="font-bold text-slate-900 text-base">Crear Nueva Tarea (Historias / Backlog)</h3>

          <div class="space-y-3 text-xs">
            <div>
              <label class="block text-slate-600 font-semibold mb-1">Título de la Tarea</label>
              <input
                type="text"
                class="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white"
                placeholder="Ej: Configurar conexión de PostgreSQL en Express"
                [(ngModel)]="taskTitle"
              />
            </div>

            <div>
              <label class="block text-slate-600 font-semibold mb-1">Descripción</label>
              <textarea
                class="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none h-20 resize-none bg-white font-sans"
                placeholder="Detalles sobre qué código implementar, archivos afectados y criterios de aceptación..."
                [(ngModel)]="taskDesc"
              ></textarea>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-slate-600 font-semibold mb-1">Asignar Sprint</label>
                <select
                  class="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white text-xs"
                  [(ngModel)]="taskIterationId"
                >
                  <option value="">-- Backlog (Sin Sprint) --</option>
                  <option *ngFor="let iter of iterations" [value]="iter.id">{{iter.name}}</option>
                </select>
              </div>

              <div>
                <label class="block text-slate-600 font-semibold mb-1">Requerimiento Funcional Asociado</label>
                <select
                  class="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white text-xs"
                  [(ngModel)]="taskRfCode"
                >
                  <option value="">-- Tarea General / No aplica --</option>
                  <option *ngFor="let rf of functionalRequirements" [value]="rf.code">
                    {{rf.code}}: {{rf.desc.substring(0, 40)}}...
                  </option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block text-slate-600 font-semibold mb-1">Tipo</label>
                <select
                  class="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white text-xs"
                  [(ngModel)]="taskType"
                >
                  <option value="Feature">Feature (Desarrollo)</option>
                  <option value="Bug">Bug (Corrección)</option>
                  <option value="Documentation">Documentación</option>
                  <option value="Testing">Pruebas</option>
                </select>
              </div>

              <div>
                <label class="block text-slate-600 font-semibold mb-1">Prioridad</label>
                <select
                  class="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white text-xs"
                  [(ngModel)]="taskPriority"
                >
                  <option value="High">Alta</option>
                  <option value="Medium">Media</option>
                  <option value="Low">Baja</option>
                </select>
              </div>

              <div>
                <label class="block text-slate-600 font-semibold mb-1">Asignado A</label>
                <input
                  type="text"
                  class="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white"
                  placeholder="ej: Juan Pérez, Actor"
                  [(ngModel)]="taskAssignedTo"
                />
              </div>
            </div>
          </div>

          <div class="flex gap-2 justify-end pt-2">
            <button
              (click)="showAddTaskForm = false"
              class="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer"
            >
              Cancelar
            </button>
            <button
              (click)="handleCreateTask()"
              class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-lg cursor-pointer"
            >
              Crear Tarea
            </button>
          </div>
        </div>
      </div>

      <!-- KANBAN BOARD COLUMNS -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div *ngFor="let col of columns" class="rounded-lg border p-2.5 flex flex-col min-h-[380px]" [class]="col.border + ' ' + col.bg">
          <!-- Column Title -->
          <div class="flex items-center justify-between mb-2.5 border-b pb-1.5 select-none">
            <h3 class="font-bold text-[11px] flex items-center gap-1.5" [class]="col.text">
              {{col.title}}
            </h3>
            <span class="bg-white/80 border border-slate-200/60 text-[9px] font-bold px-1.5 py-0.5 rounded-md text-slate-500 font-sans">
              {{getColTasks(col.status).length}}
            </span>
          </div>

          <!-- Tasks List -->
          <div class="space-y-2 flex-1 overflow-y-auto">
            <div *ngIf="getColTasks(col.status).length === 0" class="h-full min-h-[60px] flex items-center justify-center border border-dashed border-slate-200 rounded-lg p-2 text-center text-slate-400 bg-slate-50/20 font-sans">
              <span class="text-[9px] italic">Sin tareas</span>
            </div>

            <div
              *ngFor="let task of getColTasks(col.status)"
              class="bg-white border border-slate-200/80 rounded-lg p-2.5 shadow-xs space-y-2 hover:border-indigo-400 transition-all group text-left"
            >
              <!-- Top tags -->
              <div class="flex items-center justify-between select-none">
                <span class="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 border rounded-sm" [class]="getTypeColor(task.type)">
                  {{task.type}}
                </span>
                <span class="text-[9px] font-bold border rounded px-1.5 py-0.5 font-sans" [class]="getPriorityBadgeClass(task.priority)">
                  {{task.priority === 'High' ? 'Alta' : task.priority === 'Medium' ? 'Media' : 'Baja'}}
                </span>
              </div>

              <!-- Main Title & Description -->
              <div class="space-y-1">
                <h4 class="font-semibold text-slate-800 text-xs leading-snug group-hover:text-indigo-600 transition-colors">
                  {{task.title}}
                </h4>
                <p *ngIf="task.description" class="text-[10px] text-slate-500 line-clamp-2 font-sans leading-normal">
                  {{task.description}}
                </p>
              </div>

              <!-- RF mapping -->
              <div *ngIf="task.rfCode && task.rfCode !== 'General'" class="flex items-center gap-1 bg-indigo-50/50 text-indigo-700 px-1.5 py-0.5 rounded text-[9px] w-fit font-mono font-bold select-none">
                <!-- Tag Icon -->
                <svg class="w-2.5 h-2.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
                </svg>
                {{task.rfCode}}
              </div>

              <!-- Footer: User / Actions -->
              <div class="flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] text-slate-400">
                <div class="flex items-center gap-1 min-w-0">
                  <!-- User Icon -->
                  <svg class="w-3 h-3 text-slate-400 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  <span class="truncate max-w-[100px] font-sans font-medium">{{task.assignedTo || 'Sin asignar'}}</span>
                </div>

                <!-- Move action buttons -->
                <div class="flex items-center gap-1 shrink-0 select-none">
                  <button
                    *ngIf="col.status !== 'To Do'"
                    (click)="moveTaskPrev(task, col.status)"
                    title="Mover anterior"
                    class="p-1 hover:bg-slate-100 text-slate-500 rounded transition-colors cursor-pointer text-xs font-bold font-sans"
                  >
                    ‹
                  </button>
                  <button
                    *ngIf="col.status !== 'Done'"
                    (click)="moveTaskNext(task, col.status)"
                    title="Mover siguiente"
                    class="p-1 hover:bg-slate-100 text-slate-500 rounded transition-colors cursor-pointer text-xs font-bold font-sans"
                  >
                    ›
                  </button>
                  <button
                    (click)="deleteTask(task.id)"
                    class="p-1 text-slate-300 hover:text-red-500 rounded transition-colors cursor-pointer"
                  >
                    <!-- Trash Icon -->
                    <svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class KanbanBoardComponent {
  @Input() projectId!: number;
  @Input() iterations: ScrumIteration[] = [];
  @Input() tasks: ScrumTask[] = [];
  @Input() functionalRequirements: FunctionalRequirement[] = [];

  @Output() addTask = new EventEmitter<Partial<ScrumTask>>();
  @Output() updateTask = new EventEmitter<{ taskId: number, task: Partial<ScrumTask> }>();
  @Output() onDeleteTask = new EventEmitter<number>();
  @Output() addIteration = new EventEmitter<Partial<ScrumIteration>>();

  selectedIterationId: number | 'all' | 'backlog' = 'all';

  // Create task modal/form states
  showAddTaskForm = false;
  taskTitle = '';
  taskDesc = '';
  taskType: 'Feature' | 'Bug' | 'Documentation' | 'Testing' = 'Feature';
  taskPriority: 'Low' | 'Medium' | 'High' = 'Medium';
  taskAssignedTo = '';
  taskRfCode = '';
  taskIterationId = '';

  // Create iteration form states
  showAddIterForm = false;
  iterName = '';
  iterGoal = '';
  iterStart = '';
  iterEnd = '';

  columns: ColumnConfig[] = [
    { title: 'Por Hacer', status: 'To Do', bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
    { title: 'En Progreso', status: 'In Progress', bg: 'bg-blue-50/50', text: 'text-blue-700', border: 'border-blue-200' },
    { title: 'En Revisión', status: 'Review', bg: 'bg-amber-50/50', text: 'text-amber-700', border: 'border-amber-200' },
    { title: 'Completado', status: 'Done', bg: 'bg-emerald-50/50', text: 'text-emerald-700', border: 'border-emerald-200' },
  ];

  getBacklogCount(): number {
    return this.tasks.filter(t => t.iterationId === null).length;
  }

  getIterCount(iterId: number): number {
    return this.tasks.filter(t => t.iterationId === iterId).length;
  }

  getActiveIteration(): ScrumIteration | null {
    if (this.selectedIterationId === 'all' || this.selectedIterationId === 'backlog') return null;
    return this.iterations.find(i => i.id === this.selectedIterationId) || null;
  }

  getColTasks(status: ScrumTask['status']): ScrumTask[] {
    return this.tasks.filter(task => {
      if (task.status !== status) return false;
      if (this.selectedIterationId === 'all') return true;
      if (this.selectedIterationId === 'backlog') return task.iterationId === null;
      return task.iterationId === this.selectedIterationId;
    });
  }

  getPriorityBadgeClass(priority: ScrumTask['priority']): string {
    switch (priority) {
      case 'High': return 'bg-red-50 text-red-700 border-red-200';
      case 'Medium': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Low': return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  }

  getTypeColor(type: ScrumTask['type']): string {
    switch (type) {
      case 'Feature': return 'text-indigo-600 bg-indigo-50 border-indigo-100';
      case 'Bug': return 'text-rose-600 bg-rose-50 border-rose-100';
      case 'Documentation': return 'text-slate-600 bg-slate-50 border-slate-100';
      case 'Testing': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    }
  }

  handleCreateTask() {
    if (!this.taskTitle.trim()) return;
    this.addTask.emit({
      title: this.taskTitle.trim(),
      description: this.taskDesc.trim(),
      type: this.taskType,
      priority: this.taskPriority,
      status: 'To Do',
      assignedTo: this.taskAssignedTo.trim() || 'Sin asignar',
      rfCode: this.taskRfCode || 'General',
      iterationId: this.taskIterationId ? parseInt(this.taskIterationId) : null,
    });

    // Reset
    this.taskTitle = '';
    this.taskDesc = '';
    this.taskType = 'Feature';
    this.taskPriority = 'Medium';
    this.taskAssignedTo = '';
    this.taskRfCode = '';
    this.taskIterationId = '';
    this.showAddTaskForm = false;
  }

  handleCreateIteration() {
    if (!this.iterName.trim()) return;
    this.addIteration.emit({
      name: this.iterName.trim(),
      goal: this.iterGoal.trim(),
      startDate: this.iterStart || new Date().toISOString().split('T')[0],
      endDate: this.iterEnd || new Date(Date.now() + 14*24*60*60*1000).toISOString().split('T')[0],
      status: 'Planning',
    });

    this.iterName = '';
    this.iterGoal = '';
    this.iterStart = '';
    this.iterEnd = '';
    this.showAddIterForm = false;
  }

  moveTaskPrev(task: ScrumTask, currentStatus: ScrumTask['status']) {
    const prevStatus = currentStatus === 'In Progress' ? 'To Do' : currentStatus === 'Review' ? 'In Progress' : 'Review';
    this.updateTask.emit({ taskId: task.id, task: { status: prevStatus } });
  }

  moveTaskNext(task: ScrumTask, currentStatus: ScrumTask['status']) {
    const nextStatus = currentStatus === 'To Do' ? 'In Progress' : currentStatus === 'In Progress' ? 'Review' : 'Done';
    this.updateTask.emit({ taskId: task.id, task: { status: nextStatus } });
  }

  deleteTask(id: number) {
    this.onDeleteTask.emit(id);
  }
}
