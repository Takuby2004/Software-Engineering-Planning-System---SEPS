import React, { useState } from 'react';
import { Sparkles, X, Check, ArrowRight, RefreshCw } from 'lucide-react';
import { fetchWithAuth } from '../lib/api.ts';

interface AiSuggestModalProps {
  projectId: number;
  sectionName: string;
  currentText: string;
  onApply: (newText: string) => void;
  onClose: () => void;
}

export default function AiSuggestModal({
  projectId,
  sectionName,
  currentText,
  onApply,
  onClose,
}: AiSuggestModalProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchWithAuth(`/api/projects/${projectId}/ai-suggest`, {
        method: 'POST',
        body: JSON.stringify({
          section: sectionName,
          currentText,
          prompt,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo obtener la sugerencia de la IA.');
      }
      setSuggestion(data.suggestion);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse" />
            <h3 className="font-semibold text-lg">Asistente IA - {sectionName}</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Instrucciones para la IA (Opcional)
            </label>
            <textarea
              className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={3}
              placeholder="Ej: Hazlo más formal y técnico, añade más detalles sobre la arquitectura, redacta 3 objetivos basados en la taxonomía de Bloom..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm px-4 py-2.5 rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generando sugerencias...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                  Consultar a Gemini
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
              {error}
            </div>
          )}

          {suggestion && (
            <div className="mt-4 space-y-3">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Propuesta de Gemini (Sugerencia)
              </label>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 font-sans whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                {suggestion}
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => onApply(suggestion)}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Reemplazar / Usar Texto
                </button>
                <button
                  onClick={() => onApply((currentText ? currentText + '\n\n' : '') + suggestion)}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors"
                >
                  <ArrowRight className="w-4 h-4" />
                  Agregar al final
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
