import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Project, GithubRepo } from '../../types.ts';

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

@Component({
  selector: 'app-github-code-explorer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Empty State -->
    <div *ngIf="linkedRepos.length === 0" class="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4 max-w-4xl mx-auto text-left">
      <!-- Github Icon -->
      <svg class="w-12 h-12 text-slate-350 mx-auto" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
      </svg>
      <div class="space-y-1.5 text-center">
        <h3 class="font-extrabold text-slate-800 text-sm">No hay repositorios de GitHub enlazados</h3>
        <p class="text-slate-500 text-xs leading-normal max-w-lg mx-auto font-sans">
          Para poder navegar, inspeccionar y auditar el código fuente del sistema en la sección de Código, 
          primero debes enlazar uno o más repositorios de GitHub.
        </p>
      </div>
      <div class="pt-2 text-center">
        <p class="text-[11px] text-slate-400 font-sans">
          Consejo: Ve a la pestaña <span class="font-bold text-indigo-600">Cap. 1: Descripción</span> y desplázate hasta abajo para enlazar tus repositorios.
        </p>
      </div>
    </div>

    <!-- Main Explorer -->
    <div *ngIf="linkedRepos.length > 0" class="space-y-4 max-w-5xl mx-auto text-left">
      <!-- Selector & Token Setup -->
      <div class="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div class="flex items-center gap-3">
          <div class="bg-slate-100 p-2 rounded-lg text-slate-700">
            <!-- Github Icon -->
            <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
            </svg>
          </div>
          <div>
            <h3 class="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              Explorador de Código Remoto
              <span class="bg-indigo-50 text-indigo-700 text-[9px] font-bold font-mono px-1.5 py-0.5 rounded uppercase">
                GitHub API Activa
              </span>
            </h3>
            <p class="text-[10px] text-slate-400 font-sans">
              Examina directorios y archivos de código en tiempo real.
            </p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <!-- Dropdown Selector -->
          <div class="relative">
            <select
              [ngModel]="selectedRepo?.id"
              (ngModelChange)="onRepoSelect($event)"
              class="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer focus:ring-1 focus:ring-indigo-500"
            >
              <option *ngFor="let repo of linkedRepos" [value]="repo.id">
                {{repo.fullName}}
              </option>
            </select>
            <!-- Chevron Down Icon -->
            <svg class="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>

          <!-- PAT Config Button -->
          <button
            (click)="showPatInput = !showPatInput"
            class="px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            [class.border-emerald-200]="pat"
            [class.bg-emerald-50]="pat"
            [class.text-emerald-700]="pat"
            [class.hover:bg-emerald-100]="pat"
            [class.border-slate-200]="!pat"
            [class.bg-slate-50]="!pat"
            [class.text-slate-600]="!pat"
            [class.hover:bg-slate-100]="!pat"
          >
            <!-- Key Icon -->
            <svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 1.5 1.5M15.5 7.5 14 6"/>
            </svg>
            {{pat ? 'Token Configurado' : 'Añadir Token PAT'}}
          </button>
        </div>
      </div>

      <!-- PAT Input Box -->
      <div *ngIf="showPatInput" class="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs text-left">
        <div class="flex items-center gap-1.5">
          <!-- Lock Icon -->
          <svg class="w-3.5 h-3.5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span class="font-bold text-slate-700">Token de Acceso Personal (PAT) de GitHub</span>
        </div>
        <p class="text-slate-500 text-[10px] leading-relaxed font-sans">
          Para evitar los límites estrictos de tasa de la API pública de GitHub (60 peticiones/hora para IP públicas compartidas) o para acceder a repositorios privados, ingresa un token de acceso personal. Se almacenará de forma local en tu navegador.
        </p>
        <div class="flex gap-2">
          <input
            type="password"
            placeholder="ghp_..."
            [(ngModel)]="pat"
            (ngModelChange)="savePat($event)"
            class="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none text-xs"
          />
          <button
            *ngIf="pat"
            (click)="clearPat()"
            class="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg font-bold cursor-pointer"
          >
            Limpiar
          </button>
          <button
            (click)="showPatInput = false"
            class="bg-slate-900 text-white hover:bg-slate-800 px-3 py-1.5 rounded-lg font-bold cursor-pointer"
          >
            Listo
          </button>
        </div>
      </div>

      <!-- Main Workspace Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <!-- Left Panel: Dir structure -->
        <div class="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-4 space-y-3.5 min-h-[450px] flex flex-col justify-start">
          <!-- Breadcrumbs -->
          <div class="flex flex-wrap items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-slate-50 p-2.5 rounded-lg overflow-x-auto">
            <ng-container *ngFor="let crumb of getBreadcrumbs(); let first = first; let last = last">
              <svg *ngIf="!first" class="w-3 h-3 text-slate-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
              <button
                (click)="handleBreadcrumbClick(crumb.path)"
                class="hover:text-indigo-600 transition-colors shrink-0 cursor-pointer"
                [class.text-slate-700]="last"
              >
                {{crumb.name}}
              </button>
            </ng-container>
          </div>

          <!-- Filter -->
          <div class="relative">
            <!-- Search Icon -->
            <svg class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Filtrar archivos..."
              [(ngModel)]="filterQuery"
              class="w-full text-xs border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
            />
          </div>

          <!-- Dir items list -->
          <div class="flex-1 overflow-y-auto max-h-[350px] lg:max-h-[500px] space-y-1 pr-1 text-left">
            <div *ngIf="loading" class="py-12 text-center text-slate-400 font-medium space-y-2">
              <svg class="w-5 h-5 text-indigo-500 animate-spin mx-auto" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              <p class="text-[10px] font-sans">Cargando directorio remoto...</p>
            </div>

            <div *ngIf="error" class="py-8 px-2 text-center text-red-600 bg-red-50 rounded-lg border border-red-100 space-y-1 text-[11px] font-sans">
              <p class="font-bold">Error al cargar</p>
              <p class="text-[10px] leading-normal">{{error}}</p>
              <button 
                (click)="fetchDirectoryContents()" 
                class="mt-2 text-indigo-600 hover:underline font-bold flex items-center justify-center gap-0.5 mx-auto text-[10px] cursor-pointer"
              >
                Reintentar
              </button>
            </div>

            <div *ngIf="!loading && !error && filteredItems.length === 0" class="py-12 text-center text-slate-400 italic text-[11px] font-sans">
              No se encontraron archivos en este directorio.
            </div>

            <div *ngIf="!loading && !error && filteredItems.length > 0" class="space-y-0.5">
              <!-- Back button -->
              <button
                *ngIf="currentPath !== ''"
                (click)="navigateUp()"
                class="w-full text-left p-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2 border border-slate-100 border-dashed cursor-pointer"
              >
                <!-- Arrow Left -->
                <svg class="w-3.5 h-3.5 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                </svg>
                <span>.. (Regresar)</span>
              </button>

              <div
                *ngFor="let item of filteredItems"
                (click)="onNodeClick(item)"
                class="w-full text-left p-2 rounded-lg text-xs flex items-center justify-between gap-2 cursor-pointer transition-all border border-transparent"
                [class.bg-indigo-50]="selectedFile?.sha === item.sha"
                [class.border-indigo-150]="selectedFile?.sha === item.sha"
                [class.text-indigo-900]="selectedFile?.sha === item.sha"
                [class.font-bold]="selectedFile?.sha === item.sha"
                [class.shadow-xs]="selectedFile?.sha === item.sha"
                [class.hover:bg-slate-50]="selectedFile?.sha !== item.sha"
                [class.text-slate-700]="selectedFile?.sha !== item.sha"
              >
                <div class="flex items-center gap-2 min-w-0">
                  <ng-container *ngIf="item.type === 'dir'; else fileIconT">
                    <!-- Folder Icon -->
                    <svg class="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                  </ng-container>
                  <ng-template #fileIconT>
                    <!-- File Icon -->
                    <svg class="w-4 h-4 text-indigo-500 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
                    </svg>
                  </ng-template>
                  <span class="truncate">{{item.name}}</span>
                </div>
                
                <div class="text-[9px] text-slate-400 shrink-0 font-sans font-medium">
                  <ng-container *ngIf="item.type === 'dir'; else fileSizeT">
                    <!-- Chevron Right -->
                    <svg class="w-3 h-3 text-slate-350" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </ng-container>
                  <ng-template #fileSizeT>
                    {{formatSize(item.size)}}
                  </ng-template>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Panel: Code viewer -->
        <div class="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-4 min-h-[450px] flex flex-col justify-start">
          <div *ngIf="!selectedFile" class="flex-grow flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-3 h-[410px]">
            <!-- File Text Icon -->
            <svg class="w-10 h-10 text-slate-350" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>
            </svg>
            <div class="space-y-1">
              <p class="font-bold text-slate-600 text-xs">Ningún archivo abierto</p>
              <p class="text-[11px] text-slate-400 max-w-sm leading-relaxed font-sans">
                Haz clic en cualquier archivo en el panel izquierdo para descargar y visualizar su contenido con formato y numeración de líneas.
              </p>
            </div>
          </div>

          <div *ngIf="selectedFile" class="flex flex-col flex-grow justify-start space-y-3">
            <!-- File Info Header -->
            <div class="flex items-center justify-between border-b pb-2.5 text-left">
              <div class="space-y-0.5">
                <div class="flex items-center gap-1.5">
                  <span class="text-indigo-500 font-bold">📄</span>
                  <span class="font-bold text-xs text-slate-800">{{selectedFile.name}}</span>
                  <span class="text-[10px] text-slate-400">({{formatSize(selectedFile.size)}})</span>
                </div>
                <p class="text-[9px] text-slate-400 truncate max-w-xs md:max-w-md font-sans">
                  Ruta completa: <code class="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-600">{{selectedFile.path}}</code>
                </p>
              </div>

              <div class="flex items-center gap-1.5 shrink-0">
                <!-- Open in GitHub -->
                <a
                  [href]="selectedFile.html_url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-extrabold shadow-3xs"
                  title="Ver en GitHub"
                >
                  <!-- External Link Icon -->
                  <svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                  <span class="hidden sm:inline">Ver GitHub</span>
                </a>

                <!-- Copy Code Button -->
                <button
                  (click)="handleCopyCode()"
                  [disabled]="loadingFile || !!fileError || !fileContent"
                  class="p-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 border border-slate-200 text-slate-600 hover:text-indigo-600 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-extrabold shadow-3xs cursor-pointer"
                >
                  <ng-container *ngIf="copied; else defaultCopy">
                    <!-- Check Icon -->
                    <svg class="w-3.5 h-3.5 text-emerald-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M20 6 9 17l-5-5"/>
                    </svg>
                    <span class="text-emerald-600">¡Copiado!</span>
                  </ng-container>
                  <ng-template #defaultCopy>
                    <!-- Copy Icon -->
                    <svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                    <span class="hidden sm:inline">Copiar Código</span>
                  </ng-template>
                </button>
              </div>
            </div>

            <!-- Code Container -->
            <div class="flex-1 bg-slate-950 border border-slate-900 rounded-xl p-4 overflow-auto max-h-[450px] lg:max-h-[550px] font-mono text-[11px] text-slate-200 relative min-h-[300px]">
              <div *ngIf="loadingFile" class="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center text-center p-4 space-y-2">
                <svg class="w-6 h-6 text-indigo-400 animate-spin" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                <p class="text-[11px] text-slate-300 font-sans">Descargando contenido del archivo remoto...</p>
              </div>

              <div *ngIf="fileError" class="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center text-center p-6 space-y-2 font-sans">
                <!-- Alert Circle Icon -->
                <svg class="w-8 h-8 text-red-500 animate-bounce" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p class="font-bold text-red-400">Error al leer archivo</p>
                <p class="text-[10px] text-slate-400 max-w-xs">{{fileError}}</p>
              </div>

              <div *ngIf="!loadingFile && !fileError" class="flex items-start gap-4">
                <!-- Line numbers column -->
                <div class="text-slate-600 text-right select-none pr-2 border-r border-slate-800/80 font-mono text-[11px] leading-relaxed">
                  <div *ngFor="let line of getLines(); let lineIdx = index" class="h-5">
                    {{lineIdx + 1}}
                  </div>
                </div>

                <!-- Preformatted code -->
                <pre class="flex-1 text-left font-mono text-[11px] leading-relaxed text-slate-300 selection:bg-indigo-500 selection:text-white">{{fileContent || 'Archivo vacío'}}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class GithubCodeExplorerComponent implements OnInit, OnChanges {
  @Input() project!: Project;

  linkedRepos: GithubRepo[] = [];
  selectedRepo: GithubRepo | null = null;

  currentPath: string = '';
  items: FileNode[] = [];
  loading: boolean = false;
  error: string | null = null;

  selectedFile: FileNode | null = null;
  fileContent: string = '';
  loadingFile: boolean = false;
  fileError: string | null = null;
  copied: boolean = false;

  pat: string = '';
  showPatInput: boolean = false;
  filterQuery: string = '';

  ngOnInit() {
    this.pat = localStorage.getItem('github_explorer_pat') || '';
    this.parseLinkedRepos();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['project']) {
      this.parseLinkedRepos();
    }
  }

  parseLinkedRepos() {
    try {
      this.linkedRepos = JSON.parse(this.project.githubRepos || '[]');
    } catch {
      this.linkedRepos = [];
    }

    if (this.linkedRepos.length > 0) {
      if (!this.selectedRepo || !this.linkedRepos.some(r => r.id === this.selectedRepo!.id)) {
        this.selectedRepo = this.linkedRepos[0];
        this.currentPath = '';
        this.selectedFile = null;
        this.fetchDirectoryContents();
      }
    } else {
      this.selectedRepo = null;
      this.items = [];
      this.currentPath = '';
      this.selectedFile = null;
    }
  }

  onRepoSelect(repoId: any) {
    const repo = this.linkedRepos.find(r => r.id === Number(repoId));
    if (repo) {
      this.selectedRepo = repo;
      this.currentPath = '';
      this.selectedFile = null;
      this.fetchDirectoryContents();
    }
  }

  savePat(token: string) {
    this.pat = token;
    localStorage.setItem('github_explorer_pat', token);
    this.fetchDirectoryContents();
  }

  clearPat() {
    this.pat = '';
    localStorage.removeItem('github_explorer_pat');
    this.fetchDirectoryContents();
  }

  async fetchDirectoryContents() {
    if (!this.selectedRepo) return;
    this.loading = true;
    this.error = null;
    this.filterQuery = '';

    try {
      const headers: HeadersInit = {
        'Accept': 'application/vnd.github.v3+json',
      };
      if (this.pat.trim()) {
        headers['Authorization'] = `token ${this.pat.trim()}`;
      }

      const url = `https://api.github.com/repos/${this.selectedRepo.fullName}/contents/${this.currentPath}`;
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
        const sorted = data.sort((a, b) => {
          if (a.type === b.type) {
            return a.name.localeCompare(b.name);
          }
          return a.type === 'dir' ? -1 : 1;
        });
        this.items = sorted;
      } else {
        throw new Error('La ruta especificada no es un directorio.');
      }
    } catch (err: any) {
      this.error = err.message || 'Error al obtener contenidos del repositorio.';
    } finally {
      this.loading = false;
    }
  }

  async handleOpenFile(file: FileNode) {
    this.selectedFile = file;
    this.loadingFile = true;
    this.fileError = null;
    this.fileContent = '';
    this.copied = false;

    try {
      const headers: HeadersInit = {
        'Accept': 'application/vnd.github.v3.raw',
      };
      if (this.pat.trim()) {
        headers['Authorization'] = `token ${this.pat.trim()}`;
      }

      const targetUrl = file.download_url || `https://api.github.com/repos/${this.selectedRepo?.fullName}/contents/${file.path}`;
      const response = await fetch(targetUrl, { headers });

      if (!response.ok) {
        throw new Error(`No se pudo cargar el archivo. (${response.statusText})`);
      }

      const text = await response.text();
      this.fileContent = text;
    } catch (err: any) {
      this.fileError = err.message || 'Error al descargar el contenido del archivo.';
    } finally {
      this.loadingFile = false;
    }
  }

  handleCopyCode() {
    navigator.clipboard.writeText(this.fileContent);
    this.copied = true;
    setTimeout(() => this.copied = false, 2000);
  }

  onNodeClick(node: FileNode) {
    if (node.type === 'dir') {
      this.selectedFile = null;
      this.currentPath = node.path;
      this.fetchDirectoryContents();
    } else {
      this.handleOpenFile(node);
    }
  }

  handleBreadcrumbClick(path: string) {
    this.selectedFile = null;
    this.currentPath = path;
    this.fetchDirectoryContents();
  }

  navigateUp() {
    const parts = this.currentPath.split('/').filter(Boolean);
    parts.pop();
    this.currentPath = parts.join('/');
    this.selectedFile = null;
    this.fetchDirectoryContents();
  }

  getBreadcrumbs() {
    const parts = this.currentPath.split('/').filter(Boolean);
    const crumbs = [{ name: 'raiz', path: '' }];
    
    let accum = '';
    parts.forEach(p => {
      accum = accum ? `${accum}/${p}` : p;
      crumbs.push({ name: p, path: accum });
    });

    return crumbs;
  }

  get filteredItems(): FileNode[] {
    return this.items.filter(item => 
      item.name.toLowerCase().includes(this.filterQuery.toLowerCase())
    );
  }

  formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  getLines(): string[] {
    return this.fileContent ? this.fileContent.split('\n') : [];
  }
}
