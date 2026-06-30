import React, { useState, useEffect } from 'react';
import { Github, ExternalLink, Star, Plus, Trash2, Link2, Search, RefreshCw, AlertCircle, Check, GitBranch, Sparkles, Database, X } from 'lucide-react';
import { Project, GithubRepo } from '../types.ts';
import { fetchWithAuth } from '../lib/api.ts';

interface GithubLinkerProps {
  project: Project;
  onUpdateProject: (fields: Partial<Project>) => void;
}

export default function GithubLinker({ project, onUpdateProject }: GithubLinkerProps) {
  const [username, setUsername] = useState('');
  const [personalToken, setPersonalToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedRepos, setFetchedRepos] = useState<any[]>([]);
  const [selectedRepoIds, setSelectedRepoIds] = useState<number[]>([]);
  
  const [manualUrl, setManualUrl] = useState('');
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  // GitHub AI Integration States
  const [analyzingRepoId, setAnalyzingRepoId] = useState<number | null>(null);
  const [githubParseResult, setGithubParseResult] = useState<any | null>(null);
  const [showGithubReviewModal, setShowGithubReviewModal] = useState(false);
  const [selectedGithubFields, setSelectedGithubFields] = useState<Record<string, boolean>>({
    description: true,
    languagesUsed: true,
    frameworksUsed: true,
    databasesUsed: true,
    architectureType: true,
    architectureDescription: true,
    virtualDatabaseDesign: true
  });

  const handleIntegrateGithubRepo = async (repo: GithubRepo) => {
    setAnalyzingRepoId(repo.id);
    setGithubParseResult(null);

    try {
      // 1. Fetch root directories and files to give context to Gemini
      let filesList: string[] = [];
      try {
        const headers: HeadersInit = { 'Accept': 'application/vnd.github.v3+json' };
        if (personalToken.trim()) headers['Authorization'] = `token ${personalToken.trim()}`;
        const response = await fetch(`https://api.github.com/repos/${repo.fullName}/contents`, { headers });
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            filesList = data.map((item: any) => `${item.type === 'dir' ? '[DIR]' : '[FILE]'} ${item.path}`);
          }
        }
      } catch (e) {
        console.warn('Could not fetch repo files, relying on repo metadata only:', e);
      }

      // 2. Call our backend Express endpoint
      const res = await fetchWithAuth(`/api/projects/${project.id}/ai-integrate-github`, {
        method: 'POST',
        body: JSON.stringify({
          repoName: repo.fullName,
          repoDesc: repo.description,
          repoLanguage: repo.language,
          filesList
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al analizar el repositorio.');
      }

      setGithubParseResult(data);
      setShowGithubReviewModal(true);
    } catch (err: any) {
      alert('Error al analizar el repositorio con IA: ' + err.message);
    } finally {
      setAnalyzingRepoId(null);
    }
  };

  const handleApplyGithubIntegration = () => {
    if (!githubParseResult) return;
    const fieldsToUpdate: Partial<Project> = {};

    if (selectedGithubFields.description && githubParseResult.description) {
      fieldsToUpdate.description = githubParseResult.description;
    }
    if (selectedGithubFields.languagesUsed && githubParseResult.languagesUsed) {
      fieldsToUpdate.languagesUsed = githubParseResult.languagesUsed;
    }
    if (selectedGithubFields.frameworksUsed && githubParseResult.frameworksUsed) {
      fieldsToUpdate.frameworksUsed = githubParseResult.frameworksUsed;
    }
    if (selectedGithubFields.databasesUsed && githubParseResult.databasesUsed) {
      fieldsToUpdate.databasesUsed = githubParseResult.databasesUsed;
    }
    if (selectedGithubFields.architectureType && githubParseResult.architectureType) {
      fieldsToUpdate.architectureType = githubParseResult.architectureType;
    }
    if (selectedGithubFields.architectureDescription && githubParseResult.architectureDescription) {
      fieldsToUpdate.architectureDescription = githubParseResult.architectureDescription;
    }
    if (selectedGithubFields.virtualDatabaseDesign && githubParseResult.virtualDatabaseDesign) {
      fieldsToUpdate.virtualDatabaseDesign = JSON.stringify(githubParseResult.virtualDatabaseDesign);
    }

    if (Object.keys(fieldsToUpdate).length === 0) {
      alert('Selecciona al menos un campo para integrar.');
      return;
    }

    onUpdateProject(fieldsToUpdate);
    alert('¡Repositorio de GitHub integrado y estructurado en tu documento de ingeniería con éxito!');
    setShowGithubReviewModal(false);
    setGithubParseResult(null);
  };

  // Parse existing repos
  const linkedRepos: GithubRepo[] = React.useMemo(() => {
    try {
      return JSON.parse(project.githubRepos || '[]');
    } catch {
      return [];
    }
  }, [project.githubRepos]);

  const saveLinkedRepos = (repos: GithubRepo[]) => {
    onUpdateProject({ githubRepos: JSON.stringify(repos) });
  };

  // Fetch repositories from public GitHub API
  const handleFetchRepos = async () => {
    if (!username.trim()) {
      setError('Por favor, ingresa un nombre de usuario de GitHub.');
      return;
    }

    setLoading(true);
    setError(null);
    setFetchedRepos([]);
    setSelectedRepoIds([]);

    try {
      const headers: HeadersInit = {
        'Accept': 'application/vnd.github.v3+json',
      };
      if (personalToken.trim()) {
        headers['Authorization'] = `token ${personalToken.trim()}`;
      }

      const response = await fetch(`https://api.github.com/users/${username.trim()}/repos?sort=updated&per_page=50`, {
        headers
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Usuario de GitHub no encontrado.');
        } else if (response.status === 403) {
          throw new Error('Límite de peticiones de GitHub API alcanzado. Considera ingresar un Token de Acceso Personal (PAT).');
        } else {
          throw new Error(`Error de GitHub API: ${response.statusText}`);
        }
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Formato de respuesta inesperado.');
      }

      setFetchedRepos(data);
    } catch (err: any) {
      setError(err.message || 'Error al conectar con GitHub.');
    } finally {
      setLoading(false);
    }
  };

  // Handle manual repo addition by URL/Name
  const handleAddManualRepo = async () => {
    let target = manualUrl.trim();
    if (!target) {
      setManualError('Ingresa un URL o identificador "propietario/repositorio".');
      return;
    }

    // Try to extract owner/repo from URL
    // e.g., https://github.com/owner/repo or github.com/owner/repo
    const githubUrlRegex = /(?:github\.com\/|^)([a-zA-Z0-9-_]+)\/([a-zA-Z0-9-_\.]+)/i;
    const match = target.match(githubUrlRegex);
    
    let owner = '';
    let repo = '';

    if (match) {
      owner = match[1];
      repo = match[2].replace(/\.git$/, '');
    } else {
      // Check if it's just owner/repo
      const parts = target.split('/');
      if (parts.length === 2) {
        owner = parts[0];
        repo = parts[1];
      }
    }

    if (!owner || !repo) {
      setManualError('Formato inválido. Usa "propietario/nombre" o un URL completo de GitHub.');
      return;
    }

    setManualLoading(true);
    setManualError(null);

    try {
      const headers: HeadersInit = {
        'Accept': 'application/vnd.github.v3+json',
      };
      if (personalToken.trim()) {
        headers['Authorization'] = `token ${personalToken.trim()}`;
      }

      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
      if (!response.ok) {
        throw new Error(`No se pudo encontrar el repositorio (${response.statusText})`);
      }

      const data = await response.json();
      
      // Check if already linked
      if (linkedRepos.some(r => r.id === data.id)) {
        setManualError('Este repositorio ya se encuentra enlazado.');
        return;
      }

      const newRepo: GithubRepo = {
        id: data.id,
        name: data.name,
        fullName: data.full_name,
        htmlUrl: data.html_url,
        description: data.description,
        stars: data.stargazers_count,
        language: data.language,
        linkedAt: new Date().toISOString().split('T')[0]
      };

      saveLinkedRepos([...linkedRepos, newRepo]);
      setManualUrl('');
      // Show mini success inside input
      setManualError(null);
    } catch (err: any) {
      setManualError(err.message || 'No se pudo obtener información del repositorio.');
    } finally {
      setManualLoading(false);
    }
  };

  // Toggle selection for fetched repos
  const toggleSelectRepo = (id: number) => {
    setSelectedRepoIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Link selected repos from fetched list
  const handleLinkSelected = () => {
    const toLink = fetchedRepos.filter(r => selectedRepoIds.includes(r.id));
    const newRepos: GithubRepo[] = [];

    toLink.forEach(data => {
      if (!linkedRepos.some(r => r.id === data.id)) {
        newRepos.push({
          id: data.id,
          name: data.name,
          fullName: data.full_name,
          htmlUrl: data.html_url,
          description: data.description,
          stars: data.stargazers_count,
          language: data.language,
          linkedAt: new Date().toISOString().split('T')[0]
        });
      }
    });

    if (newRepos.length > 0) {
      saveLinkedRepos([...linkedRepos, ...newRepos]);
    }
    
    // Reset selection list
    setSelectedRepoIds([]);
    setFetchedRepos(prev => prev.filter(r => !selectedRepoIds.includes(r.id)));
  };

  const handleRemoveRepo = (id: number) => {
    saveLinkedRepos(linkedRepos.filter(r => r.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Explicación y Repositorios Enlazados */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <div>
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Github className="w-4 h-4 text-slate-900" />
              1.6 Enlace con Repositorios de Código Fuente (GitHub)
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Enlaza este proyecto con tus repositorios de GitHub para integrarlos en el diccionario técnico y reporte formal.
            </p>
          </div>
        </div>

        {/* Repositorios Enlazados Actualmente */}
        <div className="space-y-2">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">
            Repositorios Enlazados ({linkedRepos.length})
          </label>
          
          {linkedRepos.length === 0 ? (
            <div className="border border-dashed border-slate-200 rounded-lg p-6 text-center bg-slate-50/50">
              <Link2 className="w-6 h-6 text-slate-350 mx-auto mb-1.5" />
              <p className="text-xs text-slate-500 font-medium">Ningún repositorio enlazado todavía</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Utiliza las herramientas de búsqueda o entrada manual abajo para enlazar tu código fuente.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {linkedRepos.map((repo) => (
                <div key={repo.id} className="border border-slate-150 rounded-lg p-3 bg-slate-50 hover:bg-slate-100/50 transition-colors flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <GitBranch className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="font-bold text-xs text-slate-800 truncate">{repo.fullName}</span>
                      <a href={repo.htmlUrl} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-600">
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    {repo.description && (
                      <p className="text-[10px] text-slate-500 line-clamp-1">{repo.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-[9px] text-slate-400 font-bold">
                      {repo.language && (
                        <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-sm">{repo.language}</span>
                      )}
                      <span className="flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                        {repo.stars}
                      </span>
                      <span>Enlazado: {repo.linkedAt}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col justify-between items-end gap-2 h-full min-h-[50px] shrink-0">
                    <button
                      onClick={() => handleRemoveRepo(repo.id)}
                      className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="Desenlazar repositorio"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleIntegrateGithubRepo(repo)}
                      disabled={analyzingRepoId !== null}
                      className="px-2 py-1 text-[9px] font-extrabold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 disabled:bg-slate-100 disabled:text-slate-400 rounded transition-all flex items-center gap-1 shadow-2xs"
                      title="Analizar e integrar estructura de este repo al proyecto con IA"
                    >
                      {analyzingRepoId === repo.id ? (
                        <>
                          <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-2.5 h-2.5 fill-indigo-200" />
                          Integrar al Informe (IA)
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Controles para Enlazar Nuevos Repositorios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Opción A: Búsqueda por Usuario de GitHub */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 text-left">
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-indigo-500" />
              Buscar por Usuario o Organización
            </h4>
            <p className="text-[10px] text-slate-400">
              Introduce un usuario para listar y seleccionar repositorios públicos de manera interactiva.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-400">
                  <Github className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  className="w-full text-xs border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white text-slate-700 font-medium"
                  placeholder="ej: octocat"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFetchRepos()}
                />
              </div>
              <button
                onClick={handleFetchRepos}
                disabled={loading}
                className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
              >
                {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                Cargar
              </button>
            </div>

            {/* Opcional: Token para repos privados o evitar rate limits */}
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-slate-400 uppercase">Token de Acceso Personal (Opcional)</label>
              <input
                type="password"
                className="w-full text-[10px] border border-slate-200 rounded-md px-2 py-1 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white text-slate-600 font-mono"
                placeholder="ghp_..."
                value={personalToken}
                onChange={(e) => setPersonalToken(e.target.value)}
              />
              <p className="text-[9px] text-slate-400">Solo se procesa localmente en tu navegador si necesitas ver repositorios privados o evitar límites de tasa.</p>
            </div>

            {/* Error handling */}
            {error && (
              <div className="flex items-start gap-1 text-[10px] text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Resultados de búsqueda */}
            {fetchedRepos.length > 0 && (
              <div className="space-y-2 border-t border-slate-100 pt-2">
                <div className="flex justify-between items-center text-[10px] text-slate-500">
                  <span>Encontrados: {fetchedRepos.length} repositorios</span>
                  <button
                    onClick={handleLinkSelected}
                    disabled={selectedRepoIds.length === 0}
                    className="text-indigo-600 font-bold hover:underline disabled:text-slate-300 disabled:no-underline flex items-center gap-0.5"
                  >
                    <Check className="w-3 h-3" /> Enlazar Seleccionados ({selectedRepoIds.length})
                  </button>
                </div>

                <div className="max-h-40 overflow-y-auto border border-slate-150 rounded-lg divide-y divide-slate-100 bg-white">
                  {fetchedRepos.map((repo) => {
                    const isAlreadyLinked = linkedRepos.some(r => r.id === repo.id);
                    const isSelected = selectedRepoIds.includes(repo.id);

                    return (
                      <div
                        key={repo.id}
                        onClick={() => !isAlreadyLinked && toggleSelectRepo(repo.id)}
                        className={`p-2 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                          isAlreadyLinked ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected || isAlreadyLinked}
                            disabled={isAlreadyLinked}
                            onChange={() => {}} // handled by parent div click
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 shrink-0 w-3 h-3"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-[11px] truncate">{repo.name}</p>
                            <p className="text-[9px] text-slate-400 truncate">{repo.description || 'Sin descripción'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-[9px] text-slate-400 shrink-0 font-bold ml-2">
                          {repo.language && <span className="bg-slate-100 px-1 rounded">{repo.language}</span>}
                          {isAlreadyLinked && <span className="text-emerald-600 font-bold">Enlazado</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

      {/* GITHUB INTEGRATION REVIEW DIALOG */}
      {showGithubReviewModal && githubParseResult && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm text-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col">
            
            {/* Header */}
            <div className="p-4 border-b border-slate-150 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <div className="flex items-center gap-2 text-left">
                <Sparkles className="w-5 h-5 text-indigo-600 fill-indigo-100 shrink-0" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Vista Previa de la Integración (GitHub + IA)</h3>
                  <p className="text-[10px] text-slate-500">Revisa la estructura técnica y de bases de datos que se agregará a tu informe.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowGithubReviewModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Selector list */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-left">
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-amber-800 text-[10px] leading-relaxed flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Nota técnica:</strong> Integrar esta información actualizará los campos de lenguaje, frameworks, base de datos y arquitectura técnica en el informe. También sugerirá tablas PostgreSQL correspondientes en tu diseñador de base de datos virtual.
                </span>
              </div>

              {/* Checkboxes field by field */}
              <div className="space-y-3">
                {/* 1. Description */}
                {githubParseResult.description && (
                  <div className="border border-slate-150 rounded-lg p-3 bg-white">
                    <label className="flex items-start gap-2 font-bold text-slate-800 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={selectedGithubFields.description} 
                        onChange={() => setSelectedGithubFields(prev => ({ ...prev, description: !prev.description }))}
                        className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Descripción Técnica / Resumen</span>
                    </label>
                    {selectedGithubFields.description && (
                      <p className="mt-1.5 text-[11px] text-slate-600 pl-6 leading-relaxed bg-slate-50 p-2 rounded border border-slate-100">
                        {githubParseResult.description}
                      </p>
                    )}
                  </div>
                )}

                {/* 2. Languages / Frameworks / Databases */}
                <div className="border border-slate-150 rounded-lg p-3 bg-white space-y-2">
                  <span className="font-bold text-slate-800 block">Stack Tecnológico y Herramientas</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pl-1">
                    {/* Languages */}
                    <div>
                      <label className="flex items-center gap-1.5 font-semibold text-slate-700 text-[11px] cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={selectedGithubFields.languagesUsed} 
                          onChange={() => setSelectedGithubFields(prev => ({ ...prev, languagesUsed: !prev.languagesUsed }))}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>Lenguajes</span>
                      </label>
                      {selectedGithubFields.languagesUsed && (
                        <p className="mt-1 text-[10px] text-slate-500 pl-5">{githubParseResult.languagesUsed || 'No detectados'}</p>
                      )}
                    </div>

                    {/* Frameworks */}
                    <div>
                      <label className="flex items-center gap-1.5 font-semibold text-slate-700 text-[11px] cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={selectedGithubFields.frameworksUsed} 
                          onChange={() => setSelectedGithubFields(prev => ({ ...prev, frameworksUsed: !prev.frameworksUsed }))}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>Frameworks</span>
                      </label>
                      {selectedGithubFields.frameworksUsed && (
                        <p className="mt-1 text-[10px] text-slate-500 pl-5">{githubParseResult.frameworksUsed || 'No detectados'}</p>
                      )}
                    </div>

                    {/* Databases */}
                    <div>
                      <label className="flex items-center gap-1.5 font-semibold text-slate-700 text-[11px] cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={selectedGithubFields.databasesUsed} 
                          onChange={() => setSelectedGithubFields(prev => ({ ...prev, databasesUsed: !prev.databasesUsed }))}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>Bases de Datos</span>
                      </label>
                      {selectedGithubFields.databasesUsed && (
                        <p className="mt-1 text-[10px] text-slate-500 pl-5">{githubParseResult.databasesUsed || 'No detectados'}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Architecture Type / Description */}
                {(githubParseResult.architectureType || githubParseResult.architectureDescription) && (
                  <div className="border border-slate-150 rounded-lg p-3 bg-white space-y-2">
                    <span className="font-bold text-slate-800 block">Arquitectura del Software</span>
                    <div className="space-y-1.5 pl-1">
                      <label className="flex items-center gap-1.5 font-semibold text-slate-700 text-[11px] cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={selectedGithubFields.architectureType && selectedGithubFields.architectureDescription} 
                          onChange={() => setSelectedGithubFields(prev => ({ 
                            ...prev, 
                            architectureType: !prev.architectureType,
                            architectureDescription: !prev.architectureDescription 
                          }))}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>Tipo y Descripción de la Arquitectura</span>
                      </label>
                      {selectedGithubFields.architectureType && (
                        <div className="mt-1 text-[11px] text-slate-600 pl-5 space-y-1 bg-slate-50 p-2 rounded border border-slate-100">
                          <p className="font-bold">Patrón: {githubParseResult.architectureType}</p>
                          <p className="text-[10px] whitespace-pre-wrap">{githubParseResult.architectureDescription}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. Database Schema (virtualDatabaseDesign) */}
                {githubParseResult.virtualDatabaseDesign && githubParseResult.virtualDatabaseDesign.length > 0 && (
                  <div className="border border-slate-150 rounded-lg p-3 bg-white space-y-2">
                    <label className="flex items-center gap-1.5 font-bold text-slate-800 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={selectedGithubFields.virtualDatabaseDesign} 
                        onChange={() => setSelectedGithubFields(prev => ({ ...prev, virtualDatabaseDesign: !prev.virtualDatabaseDesign }))}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Diseño de Base de Datos Relacional Sugerido ({githubParseResult.virtualDatabaseDesign.length} Tablas)</span>
                    </label>

                    {selectedGithubFields.virtualDatabaseDesign && (
                      <div className="pl-6 space-y-2 max-h-56 overflow-y-auto">
                        {githubParseResult.virtualDatabaseDesign.map((table: any, idx: number) => (
                          <div key={idx} className="bg-slate-50/50 border border-slate-150 rounded-md p-2">
                            <div className="flex items-center gap-1.5 font-mono font-bold text-slate-800 text-[10px]">
                              <Database className="w-3.5 h-3.5 text-indigo-500" />
                              {table.name}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 mt-1 text-[9px] font-mono pl-5">
                              {table.columns?.map((col: any, colIdx: number) => (
                                <div key={colIdx} className="text-slate-600 flex justify-between bg-white border border-slate-100 p-1 rounded">
                                  <span>{col.name} <span className="text-slate-400">({col.type})</span></span>
                                  <div className="flex gap-1">
                                    {col.isPk && <span className="bg-indigo-100 text-indigo-800 text-[8px] font-bold px-1 rounded">PK</span>}
                                    {col.isFk && <span className="bg-amber-100 text-amber-800 text-[8px] font-bold px-1 rounded" title={col.fkRef}>FK</span>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-150 flex justify-end gap-2 bg-slate-50 rounded-b-xl">
              <button
                onClick={() => setShowGithubReviewModal(false)}
                className="px-3.5 py-1.5 font-bold text-slate-600 hover:bg-slate-150 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleApplyGithubIntegration}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm"
              >
                <Check className="w-4 h-4" />
                Integrar Datos del Repositorio
              </button>
            </div>
          </div>
        </div>
      )}

        {/* Opción B: Enlace Manual Directo */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 text-left">
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-indigo-500" />
              Enlace Directo / Repositorio Específico
            </h4>
            <p className="text-[10px] text-slate-400">
              Enlaza un repositorio específico directamente ingresando su URL o su identificador (ej: `propietario/repositorio`).
            </p>
          </div>

          <div className="space-y-2.5">
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-slate-400 uppercase">URL o Identificador de Repositorio</label>
              <input
                type="text"
                className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white text-slate-700 font-medium"
                placeholder="ej: https://github.com/propietario/repositorio"
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddManualRepo()}
              />
            </div>

            <button
              onClick={handleAddManualRepo}
              disabled={manualLoading || !manualUrl.trim()}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold text-xs py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              {manualLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Enlazar Repositorio Directo
            </button>

            {manualError && (
              <div className="flex items-start gap-1 text-[10px] text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{manualError}</span>
              </div>
            )}

            <div className="bg-slate-50 border border-slate-150 rounded-lg p-3 text-[10px] text-slate-500 space-y-1 leading-normal">
              <p className="font-bold text-slate-600">Ejemplos de formatos aceptados:</p>
              <ul className="list-disc pl-3 space-y-0.5">
                <li><code className="font-mono bg-slate-200 px-0.5 rounded text-[9px]">https://github.com/facebook/react</code></li>
                <li><code className="font-mono bg-slate-200 px-0.5 rounded text-[9px]">facebook/react</code></li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
