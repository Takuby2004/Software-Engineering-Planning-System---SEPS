import React, { useState, useEffect } from 'react';
import { Github, ExternalLink, Star, Plus, Trash2, Link2, Search, RefreshCw, AlertCircle, Check, GitBranch } from 'lucide-react';
import { Project, GithubRepo } from '../types.ts';

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
                  
                  <button
                    onClick={() => handleRemoveRepo(repo.id)}
                    className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    title="Desenlazar repositorio"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
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
