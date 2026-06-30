import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  File, 
  ChevronRight, 
  ArrowLeft, 
  Copy, 
  Check, 
  ExternalLink, 
  Github, 
  RefreshCw, 
  AlertCircle, 
  Search, 
  FileText, 
  Code, 
  Lock, 
  Key, 
  ChevronDown 
} from 'lucide-react';
import { Project, GithubRepo } from '../types.ts';

interface GithubCodeExplorerProps {
  project: Project;
}

interface FileNode {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null;
  type: 'dir' | 'file' | 'submodule' | 'symlink';
}

export default function GithubCodeExplorer({ project }: GithubCodeExplorerProps) {
  // Parse linked repos
  const linkedRepos: GithubRepo[] = React.useMemo(() => {
    try {
      return JSON.parse(project.githubRepos || '[]');
    } catch {
      return [];
    }
  }, [project.githubRepos]);

  const [selectedRepo, setSelectedRepo] = useState<GithubRepo | null>(
    linkedRepos.length > 0 ? linkedRepos[0] : null
  );

  const [currentPath, setCurrentPath] = useState<string>(''); // empty string means root
  const [items, setItems] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // File viewing states
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [loadingFile, setLoadingFile] = useState<boolean>(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Token state for rate limit handling & private repos (saved to localStorage)
  const [pat, setPat] = useState<string>(() => localStorage.getItem('github_explorer_pat') || '');
  const [showPatInput, setShowPatInput] = useState<boolean>(false);

  // Filter state for current folder items
  const [filterQuery, setFilterQuery] = useState<string>('');

  // Update selected repo if linked repos change or selected repo is removed
  useEffect(() => {
    if (linkedRepos.length > 0) {
      if (!selectedRepo || !linkedRepos.some(r => r.id === selectedRepo.id)) {
        setSelectedRepo(linkedRepos[0]);
      }
    } else {
      setSelectedRepo(null);
    }
  }, [project.githubRepos]);

  // Fetch directory contents whenever selectedRepo or currentPath changes
  useEffect(() => {
    if (selectedRepo) {
      fetchDirectoryContents();
    } else {
      setItems([]);
      setCurrentPath('');
      setSelectedFile(null);
    }
  }, [selectedRepo, currentPath]);

  const savePat = (token: string) => {
    setPat(token);
    localStorage.setItem('github_explorer_pat', token);
  };

  const fetchDirectoryContents = async () => {
    if (!selectedRepo) return;
    setLoading(true);
    setError(null);
    setFilterQuery('');

    try {
      const headers: HeadersInit = {
        'Accept': 'application/vnd.github.v3+json',
      };
      if (pat.trim()) {
        headers['Authorization'] = `token ${pat.trim()}`;
      }

      const url = `https://api.github.com/repos/${selectedRepo.fullName}/contents/${currentPath}`;
      const response = await fetch(url, { headers });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('No se encontró el directorio o el repositorio.');
        } else if (response.status === 403) {
          throw new Error('Límite de peticiones API alcanzado o acceso prohibido. Considera configurar un Token de Acceso Personal (PAT).');
        } else {
          throw new Error(`Error de API: ${response.statusText}`);
        }
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        // Sort directories first, then files
        const sorted = data.sort((a, b) => {
          if (a.type === b.type) {
            return a.name.localeCompare(b.name);
          }
          return a.type === 'dir' ? -1 : 1;
        });
        setItems(sorted);
      } else {
        // If data is not an array, it's a file. But we usually fetch paths known to be folders.
        throw new Error('La ruta especificada no es un directorio.');
      }
    } catch (err: any) {
      setError(err.message || 'Error al obtener contenidos del repositorio.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFile = async (file: FileNode) => {
    setSelectedFile(file);
    setLoadingFile(true);
    setFileError(null);
    setFileContent('');
    setCopied(false);

    try {
      const headers: HeadersInit = {
        'Accept': 'application/vnd.github.v3.raw', // Request raw file content directly
      };
      if (pat.trim()) {
        headers['Authorization'] = `token ${pat.trim()}`;
      }

      // We can fetch from raw URL or use raw headers with download_url / url
      const targetUrl = file.download_url || `https://api.github.com/repos/${selectedRepo?.fullName}/contents/${file.path}`;
      const response = await fetch(targetUrl, { headers });

      if (!response.ok) {
        throw new Error(`No se pudo cargar el archivo. (${response.statusText})`);
      }

      // Check content type or size
      const text = await response.text();
      setFileContent(text);
    } catch (err: any) {
      setFileError(err.message || 'Error al descargar el contenido del archivo.');
    } finally {
      setLoadingFile(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(fileContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Navigates down into a directory
  const handleNavigateDir = (dirPath: string) => {
    setSelectedFile(null);
    setCurrentPath(dirPath);
  };

  // Navigates up or directly to a breadcrumb
  const handleBreadcrumbClick = (path: string) => {
    setSelectedFile(null);
    setCurrentPath(path);
  };

  const getBreadcrumbs = () => {
    const parts = currentPath.split('/').filter(Boolean);
    const crumbs = [{ name: 'raiz', path: '' }];
    
    let accum = '';
    parts.forEach(p => {
      accum = accum ? `${accum}/${p}` : p;
      crumbs.push({ name: p, path: accum });
    });

    return crumbs;
  };

  // Filter items in the current folder
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts':
      case 'tsx':
      case 'js':
      case 'jsx':
      case 'json':
      case 'html':
      case 'css':
      case 'py':
      case 'go':
      case 'java':
      case 'kt':
      case 'cpp':
      case 'c':
      case 'sh':
      case 'yml':
      case 'yaml':
        return <Code className="w-4 h-4 text-indigo-500 shrink-0" />;
      case 'md':
      case 'txt':
      case 'pdf':
      case 'doc':
      case 'docx':
        return <FileText className="w-4 h-4 text-blue-500 shrink-0" />;
      default:
        return <File className="w-4 h-4 text-slate-400 shrink-0" />;
    }
  };

  if (linkedRepos.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4 text-left max-w-4xl mx-auto">
        <Github className="w-12 h-12 text-slate-350 mx-auto" />
        <div className="space-y-1.5">
          <h3 className="font-extrabold text-slate-800 text-sm">No hay repositorios de GitHub enlazados</h3>
          <p className="text-slate-500 text-xs leading-normal max-w-lg mx-auto">
            Para poder navegar, inspeccionar y auditar el código fuente del sistema en la sección de Código, 
            primero debes enlazar uno o más repositorios de GitHub.
          </p>
        </div>
        <div className="pt-2">
          <p className="text-[11px] text-slate-400">
            Consejo: Ve a la pestaña <span className="font-bold text-indigo-600">Cap. 1: Descripción</span> y desplázate hasta abajo para enlazar tus repositorios.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto text-left">
      {/* Selector de Repositorio y Configuración de Token */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-slate-100 p-2 rounded-lg text-slate-700">
            <Github className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              Explorador de Código Remoto
              <span className="bg-indigo-50 text-indigo-700 text-[9px] font-bold font-mono px-1.5 py-0.5 rounded uppercase">
                GitHub API Activa
              </span>
            </h3>
            <p className="text-[10px] text-slate-400">
              Examina directorios y archivos de código en tiempo real.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Dropdown Selector */}
          <div className="relative">
            <select
              value={selectedRepo?.id || ''}
              onChange={(e) => {
                const repo = linkedRepos.find(r => r.id === Number(e.target.value));
                if (repo) {
                  setSelectedRepo(repo);
                  setCurrentPath('');
                  setSelectedFile(null);
                }
              }}
              className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer focus:ring-1 focus:ring-indigo-500"
            >
              {linkedRepos.map(repo => (
                <option key={repo.id} value={repo.id}>
                  {repo.fullName}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* PAT Configuration Button */}
          <button
            onClick={() => setShowPatInput(!showPatInput)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-colors ${
              pat ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/70' : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
            title="Configurar Token Personal de GitHub"
          >
            <Key className="w-3.5 h-3.5" />
            {pat ? 'Token Configurado' : 'Añadir Token PAT'}
          </button>
        </div>
      </div>

      {/* PAT Input Box if shown */}
      {showPatInput && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-indigo-600" />
            <span className="font-bold text-slate-700">Token de Acceso Personal (PAT) de GitHub</span>
          </div>
          <p className="text-slate-500 text-[10px] leading-relaxed">
            Para evitar los límites estrictos de tasa de la API pública de GitHub (60 peticiones/hora para IP públicas compartidas) o para acceder a repositorios privados, ingresa un token de acceso personal. Se almacenará de forma local en tu navegador.
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              placeholder="ghp_..."
              value={pat}
              onChange={(e) => savePat(e.target.value)}
              className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
            {pat && (
              <button
                onClick={() => savePat('')}
                className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg font-bold"
              >
                Limpiar
              </button>
            )}
            <button
              onClick={() => setShowPatInput(false)}
              className="bg-slate-900 text-white hover:bg-slate-800 px-3 py-1.5 rounded-lg font-bold"
            >
              Listo
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace Grid (Left directory panel, Right file view panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        
        {/* Left Directory Panel (1/3 weight) */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-4 space-y-3.5 min-h-[450px] flex flex-col">
          
          {/* Breadcrumbs */}
          <div className="flex flex-wrap items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-slate-50 p-2.5 rounded-lg overflow-x-auto">
            {getBreadcrumbs().map((crumb, idx) => (
              <React.Fragment key={crumb.path}>
                {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-300" />}
                <button
                  onClick={() => handleBreadcrumbClick(crumb.path)}
                  className={`hover:text-indigo-600 transition-colors shrink-0 ${
                    idx === getBreadcrumbs().length - 1 ? 'text-slate-700' : ''
                  }`}
                >
                  {crumb.name}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Search bar inside folder */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Filtrar archivos..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Directory Items List */}
          <div className="flex-1 overflow-y-auto max-h-[350px] lg:max-h-[500px] space-y-1 pr-1">
            {loading ? (
              <div className="py-12 text-center text-slate-400 font-medium space-y-2">
                <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin mx-auto" />
                <p className="text-[10px]">Cargando directorio remoto...</p>
              </div>
            ) : error ? (
              <div className="py-8 px-2 text-center text-red-600 bg-red-50 rounded-lg border border-red-100 space-y-1 text-[11px]">
                <AlertCircle className="w-4 h-4 mx-auto" />
                <p className="font-bold">Error al cargar</p>
                <p className="text-[10px] leading-normal">{error}</p>
                <button 
                  onClick={fetchDirectoryContents} 
                  className="mt-2 text-indigo-600 hover:underline font-bold flex items-center justify-center gap-0.5 mx-auto text-[10px]"
                >
                  <RefreshCw className="w-3 h-3" /> Reintentar
                </button>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="py-12 text-center text-slate-400 italic text-[11px]">
                No se encontraron archivos en este directorio.
              </div>
            ) : (
              <div className="space-y-0.5">
                {/* Back button if not at root */}
                {currentPath !== '' && (
                  <button
                    onClick={() => {
                      const parts = currentPath.split('/').filter(Boolean);
                      parts.pop();
                      setCurrentPath(parts.join('/'));
                    }}
                    className="w-full text-left p-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2 border border-slate-100 border-dashed"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
                    <span>.. (Regresar)</span>
                  </button>
                )}

                {filteredItems.map(item => {
                  const isDir = item.type === 'dir';
                  const isSelected = selectedFile?.sha === item.sha;

                  return (
                    <div
                      key={item.sha}
                      onClick={() => {
                        if (isDir) {
                          handleNavigateDir(item.path);
                        } else {
                          handleOpenFile(item);
                        }
                      }}
                      className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between gap-2 cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-indigo-50 border border-indigo-150 text-indigo-900 font-bold shadow-xs' 
                          : 'hover:bg-slate-50 border border-transparent text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {isDir ? (
                          <Folder className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
                        ) : (
                          getFileIcon(item.name)
                        )}
                        <span className="truncate">{item.name}</span>
                      </div>
                      
                      <div className="text-[9px] text-slate-400 shrink-0">
                        {isDir ? (
                          <ChevronRight className="w-3 h-3 text-slate-350" />
                        ) : (
                          formatSize(item.size)
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Source Code Viewer (2/3 weight) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-4 min-h-[450px] flex flex-col justify-between">
          {!selectedFile ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-3">
              <FileText className="w-10 h-10 text-slate-300" />
              <div className="space-y-1">
                <p className="font-bold text-slate-600 text-xs">Ningún archivo abierto</p>
                <p className="text-[11px] text-slate-400 max-w-sm leading-relaxed">
                  Haz clic en cualquier archivo en el panel izquierdo para descargar y visualizar su contenido con formato y numeración de líneas.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col h-full justify-between space-y-3">
              {/* File Info Header */}
              <div className="flex items-center justify-between border-b pb-2.5">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    {getFileIcon(selectedFile.name)}
                    <span className="font-bold text-xs text-slate-800">{selectedFile.name}</span>
                    <span className="text-[10px] text-slate-400">({formatSize(selectedFile.size)})</span>
                  </div>
                  <p className="text-[9px] text-slate-400 truncate max-w-xs md:max-w-md">
                    Ruta completa: <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-600">{selectedFile.path}</code>
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Open in GitHub */}
                  <a
                    href={selectedFile.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold"
                    title="Ver en GitHub"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Ver GitHub</span>
                  </a>

                  {/* Copy Code Button */}
                  <button
                    onClick={handleCopyCode}
                    disabled={loadingFile || !!fileError || !fileContent}
                    className="p-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 border border-slate-200 text-slate-600 hover:text-indigo-600 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Copiar Código</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Code Container */}
              <div className="flex-1 bg-slate-950 border border-slate-900 rounded-xl p-4 overflow-auto max-h-[450px] lg:max-h-[550px] font-mono text-xs text-slate-200 relative">
                {loadingFile ? (
                  <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center text-center p-4 space-y-2">
                    <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
                    <p className="text-[11px] text-slate-300">Descargando contenido del archivo remoto...</p>
                  </div>
                ) : fileError ? (
                  <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center text-center p-6 space-y-2">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                    <p className="font-bold text-red-400">Error al leer archivo</p>
                    <p className="text-[10px] text-slate-400 max-w-xs">{fileError}</p>
                  </div>
                ) : (
                  <div className="flex items-start gap-4">
                    {/* Line numbers column */}
                    <div className="text-slate-600 text-right select-none pr-2 border-r border-slate-800/80 font-mono text-[11px] leading-relaxed">
                      {fileContent.split('\n').map((_, index) => (
                        <div key={index} className="h-5">{index + 1}</div>
                      ))}
                    </div>

                    {/* Preformated code */}
                    <pre className="flex-1 text-left font-mono text-[11px] leading-relaxed text-slate-300 selection:bg-indigo-500 selection:text-white">
                      {fileContent || <span className="text-slate-500 italic">Archivo vacío</span>}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
