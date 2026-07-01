import React, { useState, useEffect, useCallback } from 'react';
import { History, RefreshCw, ChevronDown, ChevronUp, Clock, FileEdit } from 'lucide-react';
import { fetchWithAuth } from '../lib/api.ts';

export interface ProjectChange {
  id: number;
  projectId: number;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  changedAt: string;
}

interface ProjectChangeHistoryProps {
  projectId: number;
  refreshTrigger?: number; // Allows parent to force refresh when changes happen
}

const FIELD_LABELS: Record<string, string> = {
  name: 'Nombre del Proyecto',
  description: 'Descripción',
  organization: 'Organización',
  problemContext: 'Contexto del Problema',
  orgDescription: 'Descripción de la Organización',
  identifiedNeed: 'Necesidad Identificada',
  currentSituation: 'Situación Actual',
  mainProblem: 'Problema Central',
  generalObjective: 'Objetivo General',
  specificObjectives: 'Objetivos Específicos',
  functionalRequirements: 'Requerimientos Funcionales',
  nonFunctionalRequirements: 'Requerimientos No Funcionales',
  scopeLimitations: 'Alcance y Limitaciones',
  wikiNotes: 'Notas y Wiki',
  architectureType: 'Tipo de Arquitectura',
  architectureDescription: 'Descripción de Arquitectura',
  languagesUsed: 'Lenguajes Utilizados',
  frameworksUsed: 'Frameworks Utilizados',
  databasesUsed: 'Bases de Datos Utilizadas',
  virtualDatabaseDesign: 'Diseño de Base de Datos Virtual',
  conclusions: 'Conclusiones',
  recommendations: 'Recomendaciones',
  futureImprovements: 'Trabajos Futuros',
  githubRepos: 'Repositorios GitHub'
};

export default function ProjectChangeHistory({ projectId, refreshTrigger }: ProjectChangeHistoryProps) {
  const [changes, setChanges] = useState<ProjectChange[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchChanges = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithAuth(`/api/projects/${projectId}/changes`);
      if (res.ok) {
        const data = await res.json();
        setChanges(data);
      } else {
        setError('No se pudo cargar el historial de cambios.');
      }
    } catch (err: any) {
      console.error('Error fetching changes:', err);
      setError('Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchChanges();
  }, [fetchChanges, refreshTrigger]);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  // Helper to format/truncate text nicely
  const renderValue = (val: string | null) => {
    if (!val) return <span className="text-slate-500 italic text-[11px]">Vacío</span>;
    
    // Check if it's a JSON array
    if (val.startsWith('[') && val.endsWith(']')) {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) {
          return (
            <div className="space-y-1">
              {parsed.map((item: any, idx) => {
                const label = item.desc || item.name || item.code || (typeof item === 'string' ? item : JSON.stringify(item));
                return (
                  <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-300">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full flex-shrink-0" />
                    <span className="truncate max-w-full">{String(label)}</span>
                  </div>
                );
              })}
            </div>
          );
        }
      } catch {
        // Fallback to normal text
      }
    }
    
    return <span className="break-words line-clamp-2 text-xs text-slate-300">{val}</span>;
  };

  const renderExpandedValue = (val: string | null) => {
    if (!val) return <div className="text-slate-500 italic text-xs py-1">Vacío</div>;
    
    if (val.startsWith('[') && val.endsWith(']')) {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) {
          return (
            <div className="space-y-2 max-h-60 overflow-y-auto p-2 bg-slate-900/50 rounded border border-slate-700/50">
              {parsed.map((item: any, idx) => (
                <div key={idx} className="p-1.5 bg-slate-800/40 rounded border border-slate-700/30 text-xs">
                  {typeof item === 'object' ? (
                    <div className="grid grid-cols-1 gap-1 text-slate-300">
                      {Object.entries(item).map(([k, v]) => (
                        <div key={k} className="flex gap-2">
                          <span className="font-mono text-[10px] text-slate-500 w-16 shrink-0">{k}:</span>
                          <span className="break-all">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-300">{String(item)}</span>
                  )}
                </div>
              ))}
            </div>
          );
        }
      } catch {
        // fallback
      }
    }
    
    return (
      <div className="p-2.5 bg-slate-900/40 rounded border border-slate-700/50 font-sans text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
        {val}
      </div>
    );
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 font-sans">
              Historial de Cambios del Proyecto
            </h3>
            <p className="text-[10px] text-slate-400 font-sans">
              Últimos 5 cambios detectados en tiempo real
            </p>
          </div>
        </div>

        <button
          onClick={fetchChanges}
          disabled={loading}
          className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
          title="Actualizar historial"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && changes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-slate-400 space-y-2">
          <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
          <span className="text-xs font-sans">Cargando trazabilidad...</span>
        </div>
      ) : error ? (
        <div className="p-3 text-center text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl font-sans">
          {error}
        </div>
      ) : changes.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-xs font-sans">
          Aún no se han registrado cambios en los campos de este proyecto.
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
          {changes.map((change) => {
            const label = FIELD_LABELS[change.fieldName] || change.fieldName;
            const isExpanded = expandedId === change.id;
            return (
              <div
                key={change.id}
                className={`group border rounded-xl transition-all duration-200 ${
                  isExpanded 
                    ? 'border-indigo-500/40 bg-indigo-505/5 shadow-md shadow-indigo-500/5' 
                    : 'border-slate-800 bg-slate-900/30 hover:bg-slate-900/50 hover:border-slate-700/60'
                }`}
              >
                {/* Header */}
                <div
                  onClick={() => toggleExpand(change.id)}
                  className="p-3 flex items-start gap-3 cursor-pointer select-none"
                >
                  <div className="p-1.5 bg-slate-800/80 rounded-lg text-indigo-400 group-hover:bg-slate-800 shrink-0">
                    <FileEdit className="w-3.5 h-3.5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-medium text-slate-200 truncate">
                        {label}
                      </span>
                      <span className="flex items-center gap-1 text-[9px] text-slate-400 font-mono">
                        <Clock className="w-2.5 h-2.5 text-slate-500" />
                        {formatTime(change.changedAt)}
                      </span>
                    </div>

                    {!isExpanded && (
                      <div className="grid grid-cols-2 gap-4 mt-1.5 pt-1.5 border-t border-slate-800/40">
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase font-mono tracking-wider block mb-0.5">Antes</span>
                          {renderValue(change.oldValue)}
                        </div>
                        <div>
                          <span className="text-[9px] text-indigo-400 uppercase font-mono tracking-wider block mb-0.5">Después</span>
                          {renderValue(change.newValue)}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-slate-500 group-hover:text-slate-300 self-center shrink-0">
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-850 bg-slate-950/20 rounded-b-xl space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <span className="text-[9px] text-slate-500 uppercase font-mono tracking-wider font-semibold block">
                          Valor Anterior
                        </span>
                        {renderExpandedValue(change.oldValue)}
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-[9px] text-indigo-400 uppercase font-mono tracking-wider font-semibold block flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping" />
                          Valor Nuevo
                        </span>
                        {renderExpandedValue(change.newValue)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
