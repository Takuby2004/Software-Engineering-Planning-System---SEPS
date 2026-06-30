import React, { useState } from 'react';
import { Plus, Trash2, Calendar, User, ArrowLeftRight, CheckSquare, Tag, AlertCircle } from 'lucide-react';
import { ScrumIteration, ScrumTask, FunctionalRequirement } from '../types.ts';

interface KanbanBoardProps {
  projectId: number;
  iterations: ScrumIteration[];
  tasks: ScrumTask[];
  functionalRequirements: FunctionalRequirement[];
  onAddTask: (task: Partial<ScrumTask>) => void;
  onUpdateTask: (taskId: number, task: Partial<ScrumTask>) => void;
  onDeleteTask: (taskId: number) => void;
  onAddIteration: (iteration: Partial<ScrumIteration>) => void;
}

export default function KanbanBoard({
  projectId,
  iterations,
  tasks,
  functionalRequirements,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onAddIteration,
}: KanbanBoardProps) {
  const [selectedIterationId, setSelectedIterationId] = useState<number | 'all' | 'backlog'>('all');
  
  // Create task modal/form states
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskType, setTaskType] = useState<'Feature' | 'Bug' | 'Documentation' | 'Testing'>('Feature');
  const [taskPriority, setTaskPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [taskAssignedTo, setTaskAssignedTo] = useState('');
  const [taskRfCode, setTaskRfCode] = useState('');
  const [taskIterationId, setTaskIterationId] = useState<string>('');

  // Create iteration form states
  const [showAddIterForm, setShowAddIterForm] = useState(false);
  const [iterName, setIterName] = useState('');
  const [iterGoal, setIterGoal] = useState('');
  const [iterStart, setIterStart] = useState('');
  const [iterEnd, setIterEnd] = useState('');

  const columns: { title: string; status: ScrumTask['status']; bg: string; text: string; border: string }[] = [
    { title: 'Por Hacer', status: 'To Do', bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
    { title: 'En Progreso', status: 'In Progress', bg: 'bg-blue-50/50', text: 'text-blue-700', border: 'border-blue-200' },
    { title: 'En Revisión', status: 'Review', bg: 'bg-amber-50/50', text: 'text-amber-700', border: 'border-amber-200' },
    { title: 'Completado', status: 'Done', bg: 'bg-emerald-50/50', text: 'text-emerald-700', border: 'border-emerald-200' },
  ];

  const handleCreateTask = () => {
    if (!taskTitle.trim()) return;
    onAddTask({
      title: taskTitle.trim(),
      description: taskDesc.trim(),
      type: taskType,
      priority: taskPriority,
      status: 'To Do',
      assignedTo: taskAssignedTo.trim() || 'Sin asignar',
      rfCode: taskRfCode || 'General',
      iterationId: taskIterationId ? parseInt(taskIterationId) : null,
    });

    // Reset Form
    setTaskTitle('');
    setTaskDesc('');
    setTaskType('Feature');
    setTaskPriority('Medium');
    setTaskAssignedTo('');
    setTaskRfCode('');
    setTaskIterationId('');
    setShowAddTaskForm(false);
  };

  const handleCreateIteration = () => {
    if (!iterName.trim()) return;
    onAddIteration({
      name: iterName.trim(),
      goal: iterGoal.trim(),
      startDate: iterStart || new Date().toISOString().split('T')[0],
      endDate: iterEnd || new Date(Date.now() + 14*24*60*60*1000).toISOString().split('T')[0],
      status: 'Planning',
    });

    setIterName('');
    setIterGoal('');
    setIterStart('');
    setIterEnd('');
    setShowAddIterForm(false);
  };

  const filteredTasks = tasks.filter(task => {
    if (selectedIterationId === 'all') return true;
    if (selectedIterationId === 'backlog') return task.iterationId === null;
    return task.iterationId === selectedIterationId;
  });

  const getPriorityBadge = (priority: ScrumTask['priority']) => {
    switch (priority) {
      case 'High':
        return <span className="bg-red-50 text-red-700 border border-red-200 rounded px-1.5 py-0.5 text-[9px] font-bold">Alta</span>;
      case 'Medium':
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 rounded px-1.5 py-0.5 text-[9px] font-bold">Media</span>;
      case 'Low':
        return <span className="bg-slate-50 text-slate-500 border border-slate-200 rounded px-1.5 py-0.5 text-[9px] font-bold">Baja</span>;
    }
  };

  const getTypeColor = (type: ScrumTask['type']) => {
    switch (type) {
      case 'Feature': return 'text-indigo-600 bg-indigo-50 border-indigo-100';
      case 'Bug': return 'text-rose-600 bg-rose-50 border-rose-100';
      case 'Documentation': return 'text-slate-600 bg-slate-50 border-slate-100';
      case 'Testing': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    }
  };
  return (
    <div className="space-y-4 text-xs">
      {/* Scrum Board Header & Selectors */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-sm font-bold text-slate-850 flex items-center gap-1.5">
            <CheckSquare className="w-4 h-4 text-indigo-600" />
            Planificación Ágil - Scrum Board & Backlog
          </h2>
          <p className="text-[11px] text-slate-400">
            Crea iteraciones (Sprints), gestiona el backlog y visualiza las tareas en el tablero ágil.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setShowAddIterForm(true)}
            className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-md transition-colors"
          >
            <Calendar className="w-3 h-3" />
            Nuevo Sprint
          </button>
          <button
            onClick={() => setShowAddTaskForm(true)}
            className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-md transition-colors"
          >
            <Plus className="w-3 h-3" />
            Nueva Tarea
          </button>
        </div>
      </div>

      {/* Sprints Filter bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mr-1.5 shrink-0">Filtrar:</span>
        <button
          onClick={() => setSelectedIterationId('all')}
          className={`px-2 py-1 text-[11px] rounded-md border font-bold shrink-0 transition-colors ${
            selectedIterationId === 'all' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Todo ({tasks.length})
        </button>
        <button
          onClick={() => setSelectedIterationId('backlog')}
          className={`px-2 py-1 text-[11px] rounded-md border font-bold shrink-0 transition-colors ${
            selectedIterationId === 'backlog' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Backlog ({tasks.filter(t => t.iterationId === null).length})
        </button>
        {iterations.map(iter => (
          <button
            key={iter.id}
            onClick={() => setSelectedIterationId(iter.id)}
            className={`px-2 py-1 text-[11px] rounded-md border font-bold shrink-0 transition-colors ${
              selectedIterationId === iter.id ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {iter.name} ({tasks.filter(t => t.iterationId === iter.id).length})
          </button>
        ))}
      </div>

      {/* active iteration details banner */}
      {selectedIterationId !== 'all' && selectedIterationId !== 'backlog' && (
        (() => {
          const activeIter = iterations.find(i => i.id === selectedIterationId);
          if (!activeIter) return null;
          return (
            <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-[11px]">
              <div className="space-y-0.5">
                <h4 className="font-bold text-slate-850 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  {activeIter.name} &middot; Meta del Sprint
                </h4>
                <p className="text-[10px] text-slate-500 italic">"{activeIter.goal || 'Sin meta definida.'}"</p>
              </div>
              <div className="text-[10px] font-mono text-slate-400 flex gap-3 shrink-0">
                <span>Inicio: <strong className="text-slate-600">{activeIter.startDate}</strong></span>
                <span>Fin: <strong className="text-slate-600">{activeIter.endDate}</strong></span>
                <span className="capitalize">Estado: <strong className="text-indigo-600">{activeIter.status}</strong></span>
              </div>
            </div>
          );
        })()
      )}

      {/* SPRINT FORM MODAL */}
      {showAddIterForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Crear Nueva Iteración (Sprint)</h3>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Nombre</label>
                <input
                  type="text"
                  className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Ej: Sprint 1 - Core Backend"
                  value={iterName}
                  onChange={(e) => setIterName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Meta del Sprint</label>
                <textarea
                  className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none h-20 resize-none"
                  placeholder="Ej: Implementar registro de usuarios y la base de datos relacional"
                  value={iterGoal}
                  onChange={(e) => setIterGoal(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Fecha de Inicio</label>
                  <input
                    type="date"
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    value={iterStart}
                    onChange={(e) => setIterStart(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Fecha de Fin</label>
                  <input
                    type="date"
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    value={iterEnd}
                    onChange={(e) => setIterEnd(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowAddIterForm(false)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateIteration}
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2 rounded-lg"
              >
                Crear Sprint
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TASK FORM MODAL */}
      {showAddTaskForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-slate-900 text-base">Crear Nueva Tarea (Historias / Backlog)</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Título de la Tarea</label>
                <input
                  type="text"
                  className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Ej: Configurar conexión de PostgreSQL en Express"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Descripción</label>
                <textarea
                  className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none h-20 resize-none"
                  placeholder="Detalles sobre qué código implementar, archivos afectados y criterios de aceptación..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Asignar Sprint</label>
                  <select
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white"
                    value={taskIterationId}
                    onChange={(e) => setTaskIterationId(e.target.value)}
                  >
                    <option value="">-- Backlog (Sin Sprint) --</option>
                    {iterations.map(iter => (
                      <option key={iter.id} value={iter.id}>{iter.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Requerimiento Funcional Asociado</label>
                  <select
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white"
                    value={taskRfCode}
                    onChange={(e) => setTaskRfCode(e.target.value)}
                  >
                    <option value="">-- Tarea General / No aplica --</option>
                    {functionalRequirements.map(rf => (
                      <option key={rf.code} value={rf.code}>{rf.code}: {rf.desc.substring(0, 40)}...</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Tipo</label>
                  <select
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white"
                    value={taskType}
                    onChange={(e: any) => setTaskType(e.target.value)}
                  >
                    <option value="Feature">Feature (Desarrollo)</option>
                    <option value="Bug">Bug (Corrección)</option>
                    <option value="Documentation">Documentación</option>
                    <option value="Testing">Pruebas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Prioridad</label>
                  <select
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white"
                    value={taskPriority}
                    onChange={(e: any) => setTaskPriority(e.target.value)}
                  >
                    <option value="High">Alta</option>
                    <option value="Medium">Media</option>
                    <option value="Low">Baja</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Asignado A</label>
                  <input
                    type="text"
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    placeholder="ej: Juan Pérez, Actor"
                    value={taskAssignedTo}
                    onChange={(e) => setTaskAssignedTo(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setShowAddTaskForm(false)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateTask}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-lg"
              >
                Crear Tarea
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KANBAN BOARD COLUMNS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {columns.map(col => {
          const colTasks = filteredTasks.filter(task => task.status === col.status);
          return (
            <div key={col.status} className={`rounded-lg border ${col.border} ${col.bg} p-2.5 flex flex-col min-h-[380px]`}>
              {/* Column Title */}
              <div className="flex items-center justify-between mb-2.5 border-b pb-1.5">
                <h3 className={`font-bold text-[11px] flex items-center gap-1.5 ${col.text}`}>
                  {col.title}
                </h3>
                <span className="bg-white/80 border border-slate-200/60 text-[9px] font-bold px-1.5 py-0.5 rounded-md text-slate-500">
                  {colTasks.length}
                </span>
              </div>

              {/* Tasks List */}
              <div className="space-y-2 flex-1 overflow-y-auto">
                {colTasks.length === 0 ? (
                  <div className="h-full min-h-[60px] flex items-center justify-center border border-dashed border-slate-200 rounded-lg p-2 text-center text-slate-400 bg-slate-50/20">
                    <span className="text-[9px] italic">Sin tareas</span>
                  </div>
                ) : (
                  colTasks.map(task => (
                    <div
                      key={task.id}
                      className="bg-white border border-slate-200/80 rounded-lg p-2.5 shadow-xs space-y-2 hover:border-indigo-400 transition-all group"
                    >
                      {/* Top tags */}
                      <div className="flex items-center justify-between">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 border rounded-sm ${getTypeColor(task.type)}`}>
                          {task.type}
                        </span>
                        {getPriorityBadge(task.priority)}
                      </div>

                      {/* Main Title & Description */}
                      <div className="space-y-1 text-left">
                        <h4 className="font-semibold text-slate-800 text-xs leading-snug group-hover:text-indigo-600 transition-colors">
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-[10px] text-slate-500 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                      </div>

                      {/* RF mapping */}
                      {task.rfCode && task.rfCode !== 'General' && (
                        <div className="flex items-center gap-1 bg-indigo-50/50 text-indigo-700 px-1.5 py-0.5 rounded text-[9px] w-fit font-mono font-bold">
                          <Tag className="w-2.5 h-2.5" />
                          {task.rfCode}
                        </div>
                      )}

                      {/* Footer: User / Actions */}
                      <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] text-slate-400">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-[100px] font-medium">{task.assignedTo || 'Sin asignar'}</span>
                        </div>

                        {/* Move action buttons */}
                        <div className="flex items-center gap-1">
                          {col.status !== 'To Do' && (
                            <button
                              onClick={() => {
                                const prevStatus = col.status === 'In Progress' ? 'To Do' : col.status === 'Review' ? 'In Progress' : 'Review';
                                onUpdateTask(task.id, { status: prevStatus });
                              }}
                              title="Mover anterior"
                              className="p-1 hover:bg-slate-100 text-slate-500 rounded transition-colors"
                            >
                              ‹
                            </button>
                          )}
                          {col.status !== 'Done' && (
                            <button
                              onClick={() => {
                                const nextStatus = col.status === 'To Do' ? 'In Progress' : col.status === 'In Progress' ? 'Review' : 'Done';
                                onUpdateTask(task.id, { status: nextStatus });
                              }}
                              title="Mover siguiente"
                              className="p-1 hover:bg-slate-100 text-slate-500 rounded transition-colors"
                            >
                              ›
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (confirm('¿Eliminar esta tarea?')) onDeleteTask(task.id);
                            }}
                            className="p-1 text-slate-300 hover:text-red-500 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
