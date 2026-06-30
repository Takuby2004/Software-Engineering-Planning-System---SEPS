import React, { useState } from 'react';
import { Check, X, ShieldAlert, Sparkles, HelpCircle, Layers, CheckSquare, Award } from 'lucide-react';

interface DocReviewModalProps {
  data: {
    name?: string;
    description?: string;
    organization?: string;
    problemContext?: string;
    orgDescription?: string;
    identifiedNeed?: string;
    currentSituation?: string;
    mainProblem?: string;
    generalObjective?: string;
    specificObjectives?: string[];
    functionalRequirements?: Array<{ code: string; desc: string; priority: string }>;
    nonFunctionalRequirements?: Array<{ code: string; desc: string; category: string }>;
    scopeLimitations?: string;
    architectureType?: string;
    architectureDescription?: string;
    languagesUsed?: string;
    frameworksUsed?: string;
    databasesUsed?: string;
    conclusions?: string;
    recommendations?: string;
    futureImprovements?: string;
  };
  onClose: () => void;
  onApply: (selectedFields: Record<string, boolean>) => void;
}

export const DocReviewModal: React.FC<DocReviewModalProps> = ({ data, onClose, onApply }) => {
  const [selectedFields, setSelectedFields] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    Object.keys(data).forEach(key => {
      initial[key] = true;
    });
    return initial;
  });

  const toggleField = (key: string) => {
    setSelectedFields(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAll = (val: boolean) => {
    const updated: Record<string, boolean> = {};
    Object.keys(data).forEach(key => {
      updated[key] = val;
    });
    setSelectedFields(updated);
  };

  // Helper to format requirements lists beautifully
  const renderReqs = (reqs: any[], isFunc: boolean) => {
    if (!Array.isArray(reqs) || reqs.length === 0) return <p className="text-slate-400 italic text-[11px]">No se encontraron.</p>;
    return (
      <div className="space-y-1.5 mt-1 border-l border-slate-100 pl-3">
        {reqs.map((r, i) => (
          <div key={i} className="text-[11px] leading-relaxed">
            <span className="font-mono font-bold bg-slate-50 text-slate-700 px-1 rounded mr-1.5">{r.code}</span>
            <span className="text-slate-600">{r.desc}</span>
            <span className="ml-1.5 text-[9px] font-bold text-indigo-500 font-mono bg-indigo-50 px-1 rounded">
              {isFunc ? r.priority : r.category}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const fieldList = [
    { key: 'name', label: 'Nombre del Software', category: 'General', value: data.name },
    { key: 'organization', label: 'Organización / Empresa', category: 'General', value: data.organization },
    { key: 'description', label: 'Descripción del Sistema', category: 'General', value: data.description },
    
    { key: 'problemContext', label: 'Contexto del Problema', category: 'Capítulo 1: Descripción', value: data.problemContext },
    { key: 'orgDescription', label: 'Descripción de la Organización', category: 'Capítulo 1: Descripción', value: data.orgDescription },
    { key: 'identifiedNeed', label: 'Necesidad Identificada', category: 'Capítulo 1: Descripción', value: data.identifiedNeed },
    { key: 'currentSituation', label: 'Situación Actual', category: 'Capítulo 1: Descripción', value: data.currentSituation },
    { key: 'mainProblem', label: 'Problema Principal', category: 'Capítulo 1: Descripción', value: data.mainProblem },
    { key: 'generalObjective', label: 'Objetivo General', category: 'Capítulo 1: Descripción', value: data.generalObjective },
    { 
      key: 'specificObjectives', 
      label: 'Objetivos Específicos', 
      category: 'Capítulo 1: Descripción', 
      value: data.specificObjectives,
      isList: true 
    },
    { 
      key: 'functionalRequirements', 
      label: 'Requerimientos Funcionales', 
      category: 'Capítulo 1: Descripción', 
      value: data.functionalRequirements,
      isReqs: true,
      isFunc: true
    },
    { 
      key: 'nonFunctionalRequirements', 
      label: 'Requerimientos No Funcionales', 
      category: 'Capítulo 1: Descripción', 
      value: data.nonFunctionalRequirements,
      isReqs: true,
      isFunc: false
    },
    { key: 'scopeLimitations', label: 'Alcance y Limitaciones', category: 'Capítulo 1: Descripción', value: data.scopeLimitations },
    
    { key: 'architectureType', label: 'Tipo de Arquitectura', category: 'Capítulo 2: Arquitectura', value: data.architectureType },
    { key: 'architectureDescription', label: 'Descripción de la Arquitectura', category: 'Capítulo 2: Arquitectura', value: data.architectureDescription },
    { key: 'languagesUsed', label: 'Lenguajes de Programación', category: 'Capítulo 2: Arquitectura', value: data.languagesUsed },
    { key: 'frameworksUsed', label: 'Frameworks / Librerías', category: 'Capítulo 2: Arquitectura', value: data.frameworksUsed },
    { key: 'databasesUsed', label: 'Bases de Datos', category: 'Capítulo 2: Arquitectura', value: data.databasesUsed },
    
    { key: 'conclusions', label: 'Conclusiones', category: 'Capítulo 6: Cierre', value: data.conclusions },
    { key: 'recommendations', label: 'Recomendaciones', category: 'Capítulo 6: Cierre', value: data.recommendations },
    { key: 'futureImprovements', label: 'Mejoras Futuras', category: 'Capítulo 6: Cierre', value: data.futureImprovements },
  ].filter(f => f.value !== undefined && f.value !== null && (Array.isArray(f.value) ? f.value.length > 0 : String(f.value).trim() !== ''));

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs text-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-150 flex justify-between items-center bg-slate-50 rounded-t-xl">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600 fill-indigo-100" />
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Vista Previa de la Documentación Procesada</h3>
              <p className="text-[10px] text-slate-500">Selecciona qué campos deseas importar y fusionar con tu proyecto actual.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Controls */}
        <div className="px-5 py-2.5 bg-slate-100/50 border-b border-slate-200 flex justify-between items-center">
          <span className="text-[10px] text-slate-500 font-medium">
            Se detectaron {fieldList.length} secciones redactadas
          </span>
          <div className="flex gap-2">
            <button 
              type="button" 
              onClick={() => toggleAll(true)}
              className="px-2 py-1 text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 rounded"
            >
              Seleccionar Todo
            </button>
            <button 
              type="button" 
              onClick={() => toggleAll(false)}
              className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:bg-slate-100 rounded"
            >
              Deseleccionar Todo
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {fieldList.map((f, i) => {
            const isSelected = !!selectedFields[f.key];
            return (
              <div 
                key={i} 
                className={`border rounded-lg p-3.5 transition-all ${
                  isSelected 
                    ? 'border-indigo-150 bg-indigo-50/5' 
                    : 'border-slate-150 bg-slate-50/40 opacity-70'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleField(f.key)}
                    className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{f.label}</span>
                      <span className="text-[9px] font-bold font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase">
                        {f.category}
                      </span>
                    </div>

                    {/* Previews based on field types */}
                    <div className="text-[11px] text-slate-600 leading-relaxed mt-1 bg-white p-2 border rounded border-slate-100">
                      {f.isReqs ? (
                        renderReqs(f.value as any[], f.isFunc ?? true)
                      ) : f.isList ? (
                        <ul className="list-disc list-inside space-y-0.5 pl-1.5 text-slate-600">
                          {(f.value as string[]).map((li, idx) => (
                            <li key={idx}>{li}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="whitespace-pre-wrap">{String(f.value)}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-150 flex justify-end gap-2 bg-slate-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-3.5 py-2 font-bold text-slate-600 hover:bg-slate-150 rounded-lg transition-all"
          >
            Descartar
          </button>
          <button
            onClick={() => onApply(selectedFields)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-5 py-2 rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Check className="w-4 h-4" />
            Integrar Campos Seleccionados
          </button>
        </div>
      </div>
    </div>
  );
};
