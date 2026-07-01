import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { User as FirebaseUser, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { fetchWithAuth } from '../lib/api.ts';
import { Project, ScrumIteration, ScrumTask, TestCase, FunctionalRequirement, NonFunctionalRequirement } from '../types.ts';

// Ported Components
import { MarkdownPreviewComponent } from './components/markdown-preview.component';
import { AiSuggestModalComponent } from './components/ai-suggest-modal.component';
import { DocReviewModalComponent } from './components/doc-review-modal.component';
import { GithubLinkerComponent } from './components/github-linker.component';
import { VirtualDbDesignerComponent } from './components/virtual-db-designer.component';
import { GithubCodeExplorerComponent } from './components/github-code-explorer.component';
import { KanbanBoardComponent } from './components/kanban-board.component';
import { ReportExporterComponent } from './components/report-exporter.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MarkdownPreviewComponent,
    AiSuggestModalComponent,
    DocReviewModalComponent,
    GithubLinkerComponent,
    VirtualDbDesignerComponent,
    GithubCodeExplorerComponent,
    KanbanBoardComponent,
    ReportExporterComponent
  ],
  template: `
    <div class="min-h-screen bg-slate-50/50 flex flex-col font-sans text-xs antialiased text-slate-800">
      
      <!-- Top Navbar (Logged In) -->
      <header *ngIf="user" class="bg-white border-b border-slate-200/80 py-2 px-4 flex items-center justify-between sticky top-0 z-40 print:hidden select-none">
        <div class="flex items-center gap-1.5 cursor-pointer" (click)="activeProject = null">
          <!-- Logo Layers Icon -->
          <svg class="w-4 h-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2"/><polygon points="2 17 12 22 22 17"/><polygon points="2 12 12 17 22 12"/>
          </svg>
          <span class="font-bold text-sm text-slate-800">Variables + Innovación</span>
          <span class="bg-slate-100 border border-slate-200 text-slate-600 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold">Project Hub</span>
        </div>

        <div class="flex items-center gap-3 text-[11px] font-medium">
          <div class="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-2 py-1 rounded-md text-slate-700">
            <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            <span class="font-bold truncate max-w-[120px]">{{user.email}}</span>
          </div>

          <button
            (click)="handleLogout()"
            class="flex items-center gap-1 hover:text-red-600 font-bold text-slate-500 transition-colors cursor-pointer"
          >
            <!-- Logout Icon -->
            <svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Salir
          </button>
        </div>
      </header>

      <!-- AUTH LOADING SCREEN -->
      <div *ngIf="authLoading" class="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <svg class="w-8 h-8 text-indigo-600 animate-spin" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="text-sm font-medium text-slate-500">Iniciando aplicación y conectando con PostgreSQL...</p>
      </div>

      <!-- LANDING PAGE (NOT LOGGED IN) -->
      <div *ngIf="!authLoading && !user" class="min-h-screen bg-slate-50 flex flex-col justify-between text-xs">
        <!-- Header -->
        <header class="bg-white border-b border-slate-200/80 py-2.5 px-4 flex items-center justify-between select-none">
          <div class="flex items-center gap-1.5">
            <svg class="w-5 h-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2"/><polygon points="2 17 12 22 22 17"/><polygon points="2 12 12 17 22 12"/>
            </svg>
            <span class="font-bold text-sm text-slate-800 tracking-tight">Variables + Innovación</span>
          </div>
          <span class="text-[10px] text-slate-400 font-mono">Curso de Ingeniería de Software</span>
        </header>

        <!-- Hero Section -->
        <main class="flex-1 max-w-4xl mx-auto flex flex-col items-center justify-center text-center p-4 py-8 space-y-5">
          <div class="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-100/80 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-bold select-none">
            <!-- Sparkles Icon -->
            <svg class="w-3 h-3 text-indigo-500 fill-indigo-100" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707-.707"/>
            </svg>
            Full-Stack Project Hub con Node.js & PostgreSQL
          </div>

          <div class="space-y-2">
            <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 leading-tight">
              Diseña, Planifica y Compila tus Proyectos de <span class="text-indigo-600">Ingeniería de Software</span>
            </h1>
            <p class="text-xs text-slate-500 max-w-xl mx-auto leading-relaxed font-sans">
              Crea de manera interactiva la descripción, el marco teórico, el backlog ágil con Kanban, el modelo de base de datos relacional y los casos de prueba de tus sistemas. Todo listo para exportar a informe formal.
            </p>
          </div>

          <div class="flex flex-col items-center gap-1.5 pt-2 select-none">
            <button
              (click)="handleLogin()"
              class="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg transition-all shadow-sm hover:shadow-md scale-100 hover:scale-[1.01] active:scale-95 text-xs cursor-pointer"
            >
              <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google" class="w-4 h-4 bg-white p-0.5 rounded-full" />
              Ingresar con Google Workspace
            </button>
            <span class="text-[10px] text-slate-400 font-medium">Autenticación segura federada mediante Firebase</span>
          </div>

          <!-- Core Feature Bento -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-6 w-full max-w-3xl select-none">
            <div class="bg-white border border-slate-200/80 p-3.5 rounded-lg text-left space-y-1">
              <!-- CheckSquare Icon -->
              <svg class="w-4 h-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
              <h3 class="font-bold text-slate-800 text-xs">Backlog & Scrum</h3>
              <p class="text-[11px] text-slate-400 leading-normal font-sans">Planifica iteraciones por Sprint y haz seguimiento de historias con el tablero Kanban integrado.</p>
            </div>
            <div class="bg-white border border-slate-200/80 p-3.5 rounded-lg text-left space-y-1">
              <!-- Database Icon -->
              <svg class="w-4 h-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/>
              </svg>
              <h3 class="font-bold text-slate-800 text-xs">Modelador Relacional</h3>
              <p class="text-[11px] text-slate-400 leading-normal font-sans">Diseña tablas interactivamente, compila scripts DDL de PostgreSQL y genera el diccionario de datos.</p>
            </div>
            <div class="bg-white border border-slate-200/80 p-3.5 rounded-lg text-left space-y-1">
              <!-- Sparkles Icon -->
              <svg class="w-4 h-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707-.707"/>
              </svg>
              <h3 class="font-bold text-slate-800 text-xs">Copiloto IA Gemini</h3>
              <p class="text-[11px] text-slate-400 leading-normal font-sans">Utiliza el modelo avanzado gemini-3.5-flash para refinar la descripción de objetivos, alcances y pruebas.</p>
            </div>
          </div>
        </main>

        <!-- Footer -->
        <footer class="bg-white border-t border-slate-100 py-3 text-center text-[10px] text-slate-400 font-sans select-none">
          &copy; 2026 Variables + Innovación. Todos los derechos reservados.
        </footer>
      </div>

      <!-- MAIN WORKSPACE FRAME (LOGGED IN) -->
      <div *ngIf="!authLoading && user" class="flex-1 flex flex-col">
        
        <!-- DASHBOARD: PROJECT SELECTOR -->
        <main *ngIf="activeProject === null" class="flex-1 max-w-6xl w-full mx-auto p-4 space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-lg font-bold text-slate-900 leading-none">Mis Proyectos de Ingeniería</h1>
              <p class="text-slate-400 text-[11px] mt-1 font-sans">Crea, edita y compila informes metodológicos y bases de datos físicas.</p>
            </div>
            
            <button
              (click)="showCreateProject = true"
              class="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] px-3 py-2 rounded-md transition-colors shadow-sm cursor-pointer"
            >
              <!-- Plus Icon -->
              <svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Nuevo Proyecto
            </button>
          </div>

          <!-- Loading projects -->
          <div *ngIf="loadingProjects" class="text-center py-16 text-slate-500 font-semibold space-y-1.5">
            <svg class="w-6 h-6 text-indigo-500 animate-spin mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="text-[10px] font-sans">Consultando base de datos PostgreSQL...</p>
          </div>

          <!-- Empty state projects -->
          <div *ngIf="!loadingProjects && projects.length === 0" class="text-center border border-dashed border-slate-200 rounded-xl py-16 px-4 space-y-3 max-w-md mx-auto mt-8 select-none">
            <!-- Folder Icon -->
            <svg class="w-10 h-10 text-slate-300 mx-auto" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            <h3 class="font-bold text-slate-800 text-xs">¿Listo para comenzar tu proyecto?</h3>
            <p class="text-slate-500 text-[11px] leading-normal font-sans">Crea un nuevo proyecto para comenzar a registrar los requerimientos, iteraciones ágiles, modelo entidad relación SQL e informe final.</p>
            <button
              (click)="showCreateProject = true"
              class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] px-3 py-1.5 rounded-md transition-colors cursor-pointer"
            >
              Crear mi primer proyecto
            </button>
          </div>

          <!-- Projects grid -->
          <div *ngIf="!loadingProjects && projects.length > 0" class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div
              *ngFor="let p of projects"
              (click)="loadProjectDetails(p.id)"
              class="bg-white border border-slate-200/80 hover:border-indigo-500 rounded-lg p-3.5 shadow-xs hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div class="space-y-2.5">
                <div class="flex items-center justify-between">
                  <span class="bg-indigo-50 text-indigo-700 font-bold font-mono text-[9px] px-1.5 py-0.5 rounded select-none">
                    PostgreSQL Activo
                  </span>
                  <button
                    (click)="handleDeleteProject(p.id, $event)"
                    class="p-1 text-slate-300 hover:text-red-500 rounded transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                    title="Eliminar proyecto"
                  >
                    <!-- Trash Icon -->
                    <svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                  </button>
                </div>

                <div class="text-left space-y-0.5">
                  <h3 class="font-bold text-slate-900 group-hover:text-indigo-600 text-xs transition-colors leading-snug">
                    {{p.name}}
                  </h3>
                  <p class="text-[11px] text-slate-400 line-clamp-2 leading-relaxed font-sans">
                    {{p.description || 'Sin descripción adicional.'}}
                  </p>
                </div>
              </div>

              <div class="border-t border-slate-100 pt-2.5 mt-2.5 flex items-center justify-between text-[10px] text-slate-400">
                <span class="font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded text-[9px] select-none font-sans">{{p.organization}}</span>
                <span class="font-mono text-[9px] select-none">ID: {{p.id}}</span>
              </div>
            </div>
          </div>

          <!-- AI DOCUMENT INTEGRATION REVIEW DIALOG -->
          <app-doc-review-modal
            *ngIf="showDocReviewModal && parsedDocData"
            [data]="parsedDocData"
            (onClose)="showDocReviewModal = false"
            (onApply)="handleApplyParsedDoc($event)"
          ></app-doc-review-modal>

          <!-- CREATE PROJECT DIALOG -->
          <div *ngIf="showCreateProject" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-xs select-none">
            <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 text-left">
              <h2 class="font-extrabold text-slate-900 text-lg">Nuevo Proyecto de Ingeniería</h2>
              <p class="text-slate-500 text-xs font-sans">Crea el contenedor virtual de base de datos relacional para guardar toda tu documentación técnica.</p>

              <div class="space-y-3 text-xs">
                <div>
                  <label class="block text-slate-600 font-semibold mb-1 font-sans">Nombre del Software</label>
                  <input
                    type="text"
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white"
                    placeholder="Ej: MedMatch Clinicas"
                    [(ngModel)]="newProjName"
                  />
                </div>

                <div>
                  <label class="block text-slate-600 font-semibold mb-1 font-sans">Descripción Corta</label>
                  <textarea
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none h-16 resize-none bg-white font-sans"
                    placeholder="Ej: Sistema web para agendar citas médicas e historiales."
                    [(ngModel)]="newProjDesc"
                  ></textarea>
                </div>

                <div>
                  <label class="block text-slate-600 font-semibold mb-1 font-sans">Organización / Entorno de Estudio</label>
                  <input
                    type="text"
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white"
                    placeholder="Ej: Universidad de Software, Clínica XYZ"
                    [(ngModel)]="newProjOrg"
                  />
                </div>
              </div>

              <div class="flex gap-2 justify-end pt-2">
                <button
                  (click)="showCreateProject = false"
                  class="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer font-sans"
                >
                  Cancelar
                </button>
                <button
                  (click)="handleCreateProject()"
                  class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-lg cursor-pointer font-sans"
                >
                  Crear Proyecto
                </button>
              </div>
            </div>
          </div>
        </main>

        <!-- DASHBOARD: ACTIVE PROJECT WORKSPACE -->
        <div *ngIf="activeProject !== null" class="flex-1 flex flex-col md:flex-row text-xs">
          
          <!-- Sidebar Navigation -->
          <aside class="w-full md:w-52 bg-white border-b md:border-b-0 md:border-r border-slate-200/80 flex flex-col justify-between shrink-0 print:hidden text-[11px] select-none">
            <div class="p-3 space-y-3">
              <!-- Back to selector -->
              <button
                (click)="activeProject = null"
                class="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-800 font-bold transition-colors cursor-pointer"
              >
                &larr; PROYECTOS
              </button>

              <!-- Active Project Title Banner -->
              <div class="border-b border-slate-100 pb-2 text-left">
                <span class="text-[9px] font-bold text-indigo-600 uppercase tracking-wider font-mono block">Proyecto Activo</span>
                <h3 class="font-bold text-slate-900 text-xs truncate" [title]="activeProject.name">
                  {{activeProject.name}}
                </h3>
                <p class="text-[10px] text-slate-400 truncate font-sans">{{activeProject.organization}}</p>
              </div>

              <!-- Navigation Items -->
              <nav class="space-y-1">
                <button
                  *ngFor="let tab of tabItems"
                  (click)="activeTab = tab.id"
                  class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all text-left cursor-pointer"
                  [class]="activeTab === tab.id ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'"
                >
                  <!-- Render dynamic SVG icon in place of Lucide components -->
                  <svg class="w-4 h-4 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="tab.svgRaw"></svg>
                  <span>{{tab.title}}</span>
                </button>
              </nav>
            </div>

            <div class="p-4 bg-slate-50 border-t border-slate-200 text-left">
              <div class="flex items-center gap-2 text-indigo-700">
                <!-- Zap Icon -->
                <svg class="w-4 h-4 fill-indigo-200" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
                <span class="text-[10px] font-bold uppercase tracking-wider">Copiloto Gemini Activo</span>
              </div>
              <p class="text-[10px] text-slate-500 mt-1 leading-normal font-sans">Usa los botones con destellos para solicitar ayuda o redactar objetivos profesionales.</p>
            </div>
          </aside>

          <!-- Content Pane -->
          <main class="flex-1 p-6 md:p-8 overflow-y-auto print:p-0 print:overflow-visible">
            
            <!-- TAB: INFO (Overview / Integrator) -->
            <div *ngIf="activeTab === 'info'" class="space-y-6 max-w-4xl text-left">
              <div class="space-y-1">
                <h2 class="text-xl font-bold text-slate-800">1. Información del Software de Ingeniería</h2>
                <p class="text-xs text-slate-500 font-sans">Define los parámetros generales del sistema que estás documentando.</p>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white border border-slate-200 p-6 rounded-xl">
                <div class="space-y-4">
                  <div>
                    <label class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 select-none font-sans">Nombre del Software</label>
                    <input
                      type="text"
                      className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-medium bg-white"
                      [(ngModel)]="activeProject.name"
                      (blur)="handleSyncProjectDetails()"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 select-none font-sans">Organización / Empresa</label>
                    <input
                      type="text"
                      className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white"
                      [(ngModel)]="activeProject.organization"
                      (blur)="handleSyncProjectDetails()"
                    />
                  </div>
                </div>

                <div class="space-y-4">
                  <div>
                    <label class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 select-none font-sans">Descripción General</label>
                    <textarea
                      className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none h-28 resize-none bg-white font-sans"
                      [(ngModel)]="activeProject.description"
                      (blur)="handleSyncProjectDetails()"
                    ></textarea>
                  </div>
                </div>
              </div>

              <div class="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl flex items-start gap-3 select-none">
                <!-- Sparkles Icon -->
                <svg class="w-5 h-5 text-indigo-600 fill-indigo-200 shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707-.707"/>
                </svg>
                <div class="space-y-1 text-left">
                  <h4 class="font-bold text-indigo-900 text-xs">¿Cómo funciona esta guía?</h4>
                  <p class="text-[11px] text-indigo-800 leading-relaxed font-sans">
                    Navega por cada capítulo de la barra lateral izquierda para completar los requisitos solicitados en la rúbrica del proyecto. Al finalizar, ve al último capítulo para exportar tu informe formateado bajo normativa estándar APA 7.
                  </p>
                </div>
              </div>

              <!-- AI DOCUMENT INTEGRATOR -->
              <div class="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <div class="flex items-center gap-2 border-b pb-3 select-none">
                  <!-- Sparkles Icon -->
                  <svg class="w-5 h-5 text-indigo-600 fill-indigo-100 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707-.707"/>
                  </svg>
                  <div>
                    <h3 class="font-extrabold text-slate-800 text-xs">Integrador Inteligente de Documentación (IA)</h3>
                    <p class="text-[10px] text-slate-400 mt-0.5 font-sans">
                      Sube un archivo de tu documentación técnica ya escrita o pega el texto directamente. Nuestra IA Gemini estructurará e integrará automáticamente el contenido en todo el proyecto.
                    </p>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <!-- File Upload Zone -->
                  <div 
                    (click)="fileInput.click()"
                    class="border border-dashed border-slate-250 hover:border-indigo-400 rounded-lg p-5 text-center bg-slate-50/50 hover:bg-indigo-50/10 transition-all flex flex-col justify-center items-center cursor-pointer relative select-none"
                  >
                    <input 
                      #fileInput
                      type="file"
                      accept=".txt,.md,.json,.html"
                      class="hidden"
                      (change)="handleFileUpload($event)"
                    />
                    <!-- FileText Icon -->
                    <svg class="w-8 h-8 text-slate-400 mb-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                    </svg>
                    <p class="text-xs font-bold text-slate-700">
                      {{docFileName ? ('Archivo: ' + docFileName) : 'Arrastra o selecciona tu archivo'}}
                    </p>
                    <p class="text-[10px] text-slate-400 mt-1 font-sans">Soporta .txt, .md, .json</p>
                  </div>

                  <!-- Paste text area -->
                  <div class="space-y-1 text-left flex flex-col justify-between">
                    <div class="flex-1 flex flex-col">
                      <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 select-none font-sans">
                        O Pega el Texto de tu Documentación
                      </label>
                      <textarea
                        placeholder="Pega aquí el contenido, actas de requerimientos, objetivos, etc..."
                        class="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none flex-1 min-h-[100px] resize-none bg-white font-sans"
                        [(ngModel)]="docText"
                      ></textarea>
                    </div>
                  </div>
                </div>

                <div *ngIf="docIntegrationError" class="flex items-start gap-1.5 text-[10px] text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-150 text-left font-sans">
                  <!-- AlertCircle Icon -->
                  <svg class="w-4 h-4 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span>{{docIntegrationError}}</span>
                </div>

                <div class="flex justify-end gap-2 pt-2 border-t border-slate-100 select-none">
                  <button
                    *ngIf="docText.trim()"
                    (click)="docText = ''; docFileName = ''; docIntegrationError = null;"
                    class="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 font-semibold cursor-pointer font-sans"
                  >
                    Limpiar
                  </button>
                  <button
                    (click)="handleIntegrateDocument()"
                    [disabled]="integratingDoc || !docText.trim()"
                    class="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-xs px-4 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-sm cursor-pointer font-sans"
                  >
                    <svg *ngIf="integratingDoc" class="w-3.5 h-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <!-- Sparkles Icon -->
                    <svg *ngIf="!integratingDoc" class="w-3.5 h-3.5 fill-indigo-200" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707-.707"/>
                    </svg>
                    <span>{{integratingDoc ? 'Procesando con IA...' : 'Analizar e Integrar Documentación'}}</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- TAB: CAPITULO 1 (Descripción del Proyecto) -->
            <div *ngIf="activeTab === 'cap1'" class="space-y-6 max-w-4xl text-left">
              <div class="flex items-center justify-between border-b pb-3 select-none">
                <div>
                  <h2 class="text-xl font-bold text-slate-800">Capítulo 1. Descripción del Proyecto</h2>
                  <p class="text-xs text-slate-500 font-sans">Completa el contexto de negocio, problema, objetivos del proyecto y alcance funcional.</p>
                </div>
                
                <button
                  (click)="handleAiSuggestObjectives()"
                  class="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs px-3 py-2 rounded-lg transition-colors border border-indigo-100 cursor-pointer font-sans"
                >
                  <!-- Sparkles Icon -->
                  <svg class="w-3.5 h-3.5 fill-indigo-200" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707-.707"/>
                  </svg>
                  Refinar con Gemini IA
                </button>
              </div>

              <!-- Introducción y Necesidades -->
              <div class="space-y-4 bg-white border border-slate-200 p-6 rounded-xl">
                <h3 class="font-bold text-slate-800 text-sm border-b pb-2 select-none">1.1 Introducción y Necesidades</h3>
                
                <div class="space-y-4 font-sans">
                  <!-- Context -->
                  <div>
                    <div class="flex items-center justify-between mb-1 select-none">
                      <label class="block text-xs font-bold text-slate-500 uppercase tracking-wide">Contexto del Problema</label>
                      <button
                        (click)="triggerAiRedactor('Contexto del Problema (1.1)', activeProject.problemContext, 'problemContext')"
                        class="text-[10px] font-semibold text-indigo-600 flex items-center gap-0.5 hover:underline cursor-pointer"
                      >
                        <!-- Sparkles -->
                        <svg class="w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707-.707"/></svg>
                        Redactar con IA
                      </button>
                    </div>
                    <textarea
                      className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none h-24 bg-white font-sans"
                      [(ngModel)]="activeProject.problemContext"
                      (blur)="handleSyncProjectDetails()"
                    ></textarea>
                  </div>

                  <!-- Org Description -->
                  <div>
                    <div class="flex items-center justify-between mb-1 select-none">
                      <label class="block text-xs font-bold text-slate-500 uppercase tracking-wide">Descripción de la Organización</label>
                      <button
                        (click)="triggerAiRedactor('Descripción de la Organización (1.1)', activeProject.orgDescription, 'orgDescription')"
                        class="text-[10px] font-semibold text-indigo-600 flex items-center gap-0.5 hover:underline cursor-pointer"
                      >
                        <!-- Sparkles -->
                        <svg class="w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707-.707"/></svg>
                        Redactar con IA
                      </button>
                    </div>
                    <textarea
                      className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none h-20 bg-white font-sans"
                      [(ngModel)]="activeProject.orgDescription"
                      (blur)="handleSyncProjectDetails()"
                    ></textarea>
                  </div>

                  <!-- Identified Need -->
                  <div>
                    <div class="flex items-center justify-between mb-1 select-none">
                      <label class="block text-xs font-bold text-slate-500 uppercase tracking-wide">Necesidad Identificada</label>
                      <button
                        (click)="triggerAiRedactor('Necesidad Identificada (1.1)', activeProject.identifiedNeed, 'identifiedNeed')"
                        class="text-[10px] font-semibold text-indigo-600 flex items-center gap-0.5 hover:underline cursor-pointer"
                      >
                        <!-- Sparkles -->
                        <svg class="w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707-.707"/></svg>
                        Redactar con IA
                      </button>
                    </div>
                    <textarea
                      className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none h-20 bg-white font-sans"
                      [(ngModel)]="activeProject.identifiedNeed"
                      (blur)="handleSyncProjectDetails()"
                    ></textarea>
                  </div>
                </div>
              </div>

              <!-- El problema -->
              <div class="space-y-4 bg-white border border-slate-200 p-6 rounded-xl">
                <h3 class="font-bold text-slate-800 text-sm border-b pb-2 select-none">1.2 Definición del Problema</h3>
                
                <div class="space-y-4 font-sans">
                  <!-- Current Situation -->
                  <div>
                    <div class="flex items-center justify-between mb-1 select-none">
                      <label class="block text-xs font-bold text-slate-500 uppercase tracking-wide">Situación Actual (Proceso Manual)</label>
                      <button
                        (click)="triggerAiRedactor('Situación Actual (1.2)', activeProject.currentSituation, 'currentSituation')"
                        class="text-[10px] font-semibold text-indigo-600 flex items-center gap-0.5 hover:underline cursor-pointer"
                      >
                        <!-- Sparkles -->
                        <svg class="w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707-.707"/></svg>
                        Redactar con IA
                      </button>
                    </div>
                    <textarea
                      className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none h-20 bg-white font-sans"
                      [(ngModel)]="activeProject.currentSituation"
                      (blur)="handleSyncProjectDetails()"
                    ></textarea>
                  </div>

                  <!-- Main Problem -->
                  <div>
                    <div class="flex items-center justify-between mb-1 select-none">
                      <label class="block text-xs font-bold text-slate-500 uppercase tracking-wide">Problema Principal</label>
                      <button
                        (click)="triggerAiRedactor('Problema Principal (1.2)', activeProject.mainProblem, 'mainProblem')"
                        class="text-[10px] font-semibold text-indigo-600 flex items-center gap-0.5 hover:underline cursor-pointer"
                      >
                        <!-- Sparkles -->
                        <svg class="w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707-.707"/></svg>
                        Redactar con IA
                      </button>
                    </div>
                    <textarea
                      className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none h-20 bg-white font-sans"
                      [(ngModel)]="activeProject.mainProblem"
                      (blur)="handleSyncProjectDetails()"
                    ></textarea>
                  </div>
                </div>
              </div>

              <!-- Objetivos -->
              <div class="space-y-4 bg-white border border-slate-200 p-6 rounded-xl">
                <h3 class="font-bold text-slate-800 text-sm border-b pb-2 select-none">1.3 Objetivos Técnicos</h3>
                
                <div class="space-y-4">
                  <div>
                    <label class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 select-none font-sans">Objetivo General</label>
                    <input
                      type="text"
                      className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white font-sans"
                      [(ngModel)]="activeProject.generalObjective"
                      (blur)="handleSyncProjectDetails()"
                    />
                  </div>

                  <div>
                    <label class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 select-none font-sans">Objetivos Específicos</label>
                    <div class="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                      <ul class="list-disc pl-5 text-xs text-slate-700 space-y-1.5 font-medium font-sans">
                        <li *ngFor="let obj of getSpecificObjectivesList()">{{obj}}</li>
                        <li *ngIf="getSpecificObjectivesList().length === 0" class="italic text-slate-400">Sin objetivos específicos.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Requerimientos Funcionales -->
              <div class="space-y-4 bg-white border border-slate-200 p-6 rounded-xl">
                <h3 class="font-bold text-slate-800 text-sm border-b pb-2 flex items-center justify-between select-none">
                  <span>1.4 Requerimientos Funcionales (Product Backlog)</span>
                  <button
                    (click)="triggerAiRedactor('Requerimientos Funcionales', activeProject.functionalRequirements, 'functionalRequirements')"
                    class="text-[10px] text-indigo-600 font-bold flex items-center gap-0.5 hover:underline cursor-pointer font-sans"
                  >
                    <!-- Sparkles -->
                    <svg class="w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707-.707"/></svg>
                    Generar con IA
                  </button>
                </h3>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-3 items-end bg-slate-50 p-4 rounded-lg select-none">
                  <div>
                    <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-sans">Código</label>
                    <input
                      type="text"
                      className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white font-mono"
                      placeholder="ej: RF01"
                      [(ngModel)]="newRfCode"
                    />
                  </div>
                  <div>
                    <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-sans">Descripción del Requerimiento</label>
                    <input
                      type="text"
                      className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white font-sans"
                      placeholder="El sistema debe permitir..."
                      [(ngModel)]="newRfDesc"
                    />
                  </div>
                  <div class="flex gap-2">
                    <select
                      className="w-1/2 text-xs border border-slate-200 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white font-sans"
                      [(ngModel)]="newRfPriority"
                    >
                      <option value="Alta">Alta</option>
                      <option value="Media">Media</option>
                      <option value="Baja">Baja</option>
                    </select>
                    <button
                      (click)="handleAddRf()"
                      class="w-1/2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-1.5 rounded cursor-pointer font-sans"
                    >
                      Añadir
                    </button>
                  </div>
                </div>

                <div class="border border-slate-200 rounded-lg overflow-hidden font-sans">
                  <table class="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr class="bg-slate-50 font-bold text-slate-500 border-b border-slate-100 select-none">
                        <th class="p-2.5 pl-4 w-20">Código</th>
                        <th class="p-2.5">Descripción del Requisito</th>
                        <th class="p-2.5 w-24">Prioridad</th>
                        <th class="p-2.5 text-right pr-4 w-16">Acción</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                      <tr *ngIf="getFunctionalRequirementsList().length === 0">
                        <td colSpan="4" class="p-4 text-center italic text-slate-400">No hay requisitos registrados.</td>
                      </tr>
                      <tr *ngFor="let rf of getFunctionalRequirementsList()" class="hover:bg-slate-50">
                        <td class="p-2.5 pl-4 font-mono font-bold text-indigo-600 select-none">{{rf.code}}</td>
                        <td class="p-2.5 text-slate-700 leading-normal">{{rf.desc}}</td>
                        <td class="p-2.5 font-semibold text-slate-600 select-none">{{rf.priority}}</td>
                        <td class="p-2.5 text-right pr-4 select-none">
                          <button
                            (click)="handleDeleteRf(rf.code)"
                            class="text-slate-400 hover:text-red-500 cursor-pointer"
                          >
                            <!-- Trash Icon -->
                            <svg class="w-4 h-4 inline" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Requerimientos NO Funcionales -->
              <div class="space-y-4 bg-white border border-slate-200 p-6 rounded-xl">
                <h3 class="font-bold text-slate-800 text-sm border-b pb-2 select-none">1.4.1 Requerimientos No Funcionales (SLA)</h3>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-3 items-end bg-slate-50 p-4 rounded-lg select-none">
                  <div>
                    <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-sans">Código</label>
                    <input
                      type="text"
                      className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white font-mono"
                      placeholder="ej: RNF01"
                      [(ngModel)]="newRnfCode"
                    />
                  </div>
                  <div>
                    <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-sans">Descripción</label>
                    <input
                      type="text"
                      className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white font-sans"
                      placeholder="ej: El sistema debe encriptar..."
                      [(ngModel)]="newRnfDesc"
                    />
                  </div>
                  <div class="flex gap-2">
                    <select
                      className="w-1/2 text-xs border border-slate-200 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white font-sans"
                      [(ngModel)]="newRnfCategory"
                    >
                      <option value="Red">Red</option>
                      <option value="Seguridad">Seguridad</option>
                      <option value="Rendimiento">Rendimiento</option>
                      <option value="Disponibilidad">Disponibilidad</option>
                      <option value="Usabilidad">Usabilidad</option>
                    </select>
                    <button
                      (click)="handleAddRnf()"
                      class="w-1/2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-1.5 rounded cursor-pointer font-sans"
                    >
                      Añadir
                    </button>
                  </div>
                </div>

                <div class="border border-slate-200 rounded-lg overflow-hidden font-sans">
                  <table class="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr class="bg-slate-50 font-bold text-slate-500 border-b border-slate-100 select-none">
                        <th class="p-2.5 pl-4 w-20">Código</th>
                        <th class="p-2.5">Descripción del Requisito</th>
                        <th class="p-2.5 w-32">Categoría</th>
                        <th class="p-2.5 text-right pr-4 w-16">Acción</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                      <tr *ngIf="getNonFunctionalRequirementsList().length === 0">
                        <td colSpan="4" class="p-4 text-center italic text-slate-400">No hay requisitos no funcionales registrados.</td>
                      </tr>
                      <tr *ngFor="let rnf of getNonFunctionalRequirementsList()" class="hover:bg-slate-50">
                        <td class="p-2.5 pl-4 font-mono font-bold text-indigo-600 select-none">{{rnf.code}}</td>
                        <td class="p-2.5 text-slate-700 leading-normal">{{rnf.desc}}</td>
                        <td class="p-2.5 font-semibold text-slate-600 select-none">{{rnf.category}}</td>
                        <td class="p-2.5 text-right pr-4 select-none">
                          <button
                            (click)="handleDeleteRnf(rnf.code)"
                            class="text-slate-400 hover:text-red-500 cursor-pointer"
                          >
                            <!-- Trash Icon -->
                            <svg class="w-4 h-4 inline" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Alcance y Limitaciones -->
              <div class="space-y-4 bg-white border border-slate-200 p-6 rounded-xl">
                <div class="flex items-center justify-between border-b pb-2 select-none">
                  <h3 class="font-bold text-slate-800 text-sm">1.4.2 Alcance y Limitaciones del Proyecto</h3>
                  <button
                    (click)="triggerAiRedactor('Alcance y Limitaciones (1.4)', activeProject.scopeLimitations, 'scopeLimitations')"
                    class="text-[10px] text-indigo-600 font-bold flex items-center gap-0.5 hover:underline cursor-pointer font-sans"
                  >
                    <!-- Sparkles -->
                    <svg class="w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707-.707"/></svg>
                    Redactar con IA
                  </button>
                </div>
                
                <textarea
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none h-28 bg-white font-sans"
                  [(ngModel)]="activeProject.scopeLimitations"
                  (blur)="handleSyncProjectDetails()"
                ></textarea>
              </div>

              <!-- Wiki / Notas Técnicas (Capítulo 1.5) -->
              <div class="space-y-4 bg-white border border-slate-200 p-6 rounded-xl">
                <div class="flex items-center justify-between border-b pb-2">
                  <div class="text-left">
                    <h3 class="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                      <!-- Book Open Icon -->
                      <svg class="w-4 h-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                      </svg>
                      1.5 Wiki / Notas Técnicas de Diseño
                    </h3>
                    <p class="text-[10px] text-slate-400 mt-0.5 font-sans">
                      Registra decisiones de arquitectura, patrones de diseño y notas adicionales usando formato Markdown.
                    </p>
                  </div>
                  <button
                    (click)="triggerAiRedactor('Wiki y Decisiones de Diseño Técnico (1.5)', activeProject.wikiNotes || '', 'wikiNotes')"
                    class="text-[10px] text-indigo-600 font-bold flex items-center gap-0.5 hover:underline cursor-pointer font-sans select-none"
                  >
                    <!-- Sparkles -->
                    <svg class="w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707-.707"/></svg>
                    Redactar con IA
                  </button>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <!-- Input Editor -->
                  <div class="space-y-1.5 text-left">
                    <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wide select-none font-sans">Editor Markdown</label>
                    <textarea
                      class="w-full text-xs border border-slate-200 rounded-lg p-3 focus:ring-1 focus:ring-indigo-500 focus:outline-none h-80 font-mono text-slate-700 leading-relaxed bg-white"
                      placeholder="# Wiki del Proyecto\n\n### Patrón de Arquitectura\nEscribe aquí tus decisiones de diseño técnico..."
                      [(ngModel)]="activeProject.wikiNotes"
                      (blur)="handleSyncProjectDetails()"
                    ></textarea>
                    <p class="text-[9px] text-slate-400 font-sans select-none">
                      Puedes usar '#' para títulos, '-' para viñetas, '**negrita**', '*cursiva*' y 'codigo' con acentos graves.
                    </p>
                  </div>

                  <!-- Live Preview -->
                  <div class="space-y-1.5 text-left flex flex-col">
                    <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wide select-none font-sans">Vista Previa Renderizada</label>
                    <div class="flex-1 min-h-[200px] lg:h-[320px] bg-slate-50 border border-slate-200 rounded-lg p-4 overflow-y-auto">
                      <app-markdown-preview [content]="activeProject.wikiNotes || ''"></app-markdown-preview>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Enlace con GitHub (Capítulo 1.6) -->
              <app-github-linker
                [project]="activeProject"
                (onUpdateProject)="handleDirectUpdateProject($event)"
              ></app-github-linker>
            </div>

            <!-- TAB: CAPITULO 2 (Marco Tecnológico y Arquitectura) -->
            <div *ngIf="activeTab === 'cap2'" class="space-y-6 max-w-4xl text-left">
              <div class="space-y-1 select-none">
                <h2 class="text-xl font-bold text-slate-800">Capítulo 2 & 4. Marco Tecnológico y Arquitectura</h2>
                <p class="text-xs text-slate-500 font-sans">Configura los componentes de hardware y software y visualiza la arquitectura de tu aplicación.</p>
              </div>

              <!-- Architecture Selector -->
              <div class="bg-white border border-slate-200 p-6 rounded-xl space-y-4">
                <h3 class="font-bold text-slate-800 text-sm border-b pb-2 select-none">2.5 Estilo de Arquitectura del Software</h3>
                
                <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 select-none">
                  <div
                    *ngFor="let type of ['Cliente-Servidor', 'MVC', 'Arquitectura en capas', 'Microservicios']"
                    (click)="activeProject.architectureType = type; handleSyncProjectDetails();"
                    class="border rounded-xl p-4 text-center cursor-pointer transition-all"
                    [class]="activeProject.architectureType === type ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-1 ring-indigo-500 font-bold' : 'border-slate-200 text-slate-600 hover:bg-slate-50'"
                  >
                    <!-- Layers Icon -->
                    <svg class="w-5 h-5 mx-auto text-indigo-500 mb-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polygon points="12 2 2 7 12 12 22 7 12 2"/><polygon points="2 17 12 22 22 17"/><polygon points="2 12 12 17 22 12"/>
                    </svg>
                    <span class="text-xs font-sans">{{type}}</span>
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 select-none font-sans">Descripción de la Arquitectura Física</label>
                  <textarea
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none h-24 bg-white font-sans"
                    [(ngModel)]="activeProject.architectureDescription"
                    (blur)="handleSyncProjectDetails()"
                  ></textarea>
                </div>
              </div>

              <!-- Architecture High-fidelity Preview Card -->
              <div class="bg-slate-900 rounded-xl p-6 text-center text-white border border-slate-800 relative overflow-hidden select-none">
                <h4 class="font-bold font-mono text-indigo-400 text-xs mb-6 text-left flex items-center gap-1">
                  <!-- Layers Icon -->
                  <svg class="w-4 h-4 text-indigo-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="12 2 2 7 12 12 22 7 12 2"/><polygon points="2 17 12 22 22 17"/><polygon points="2 12 12 17 22 12"/>
                  </svg>
                  Vista Física y Lógica - Estilo: {{activeProject.architectureType}}
                </h4>

                <!-- Dynamic CSS Architecture Diagrams -->
                <div class="flex flex-col md:flex-row items-center justify-center gap-6 relative z-10 text-xs font-semibold">
                  <div class="w-40 bg-indigo-950 border border-indigo-500 p-4 rounded-xl text-center space-y-2">
                    <span class="bg-indigo-600 text-[10px] px-1.5 py-0.5 rounded uppercase font-bold text-white">Presentación</span>
                    <p class="font-bold text-indigo-300 font-mono text-[10px]">{{getFirstFramework()}}</p>
                  </div>

                  <div class="text-indigo-400 font-bold text-lg rotate-90 md:rotate-0">➔</div>

                  <div class="w-40 bg-slate-950 border border-indigo-500 p-4 rounded-xl text-center space-y-2">
                    <span class="bg-indigo-600 text-[10px] px-1.5 py-0.5 rounded uppercase font-bold text-white">Lógica</span>
                    <p class="font-bold text-indigo-300 font-mono text-[10px]">Express API Route</p>
                  </div>

                  <div class="text-indigo-400 font-bold text-lg rotate-90 md:rotate-0">➔</div>

                  <div class="w-40 bg-emerald-950 border border-emerald-500 p-4 rounded-xl text-center space-y-2">
                    <span class="bg-emerald-600 text-[10px] px-1.5 py-0.5 rounded uppercase font-bold text-white">Datos</span>
                    <p class="font-bold text-emerald-300 font-mono text-[10px]">{{activeProject.databasesUsed || 'PostgreSQL'}}</p>
                  </div>
                </div>
              </div>

              <!-- Tech definitions -->
              <div class="bg-white border border-slate-200 p-6 rounded-xl space-y-4">
                <h3 class="font-bold text-slate-800 text-sm border-b pb-2 select-none">2.7 Stack de Lenguajes y Gestor de Datos</h3>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 select-none font-sans">Lenguajes de Programación</label>
                    <input
                      type="text"
                      className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white font-sans"
                      [(ngModel)]="activeProject.languagesUsed"
                      (blur)="handleSyncProjectDetails()"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 select-none font-sans">Frameworks Seleccionados</label>
                    <input
                      type="text"
                      className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white font-sans"
                      [(ngModel)]="activeProject.frameworksUsed"
                      (blur)="handleSyncProjectDetails()"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 select-none font-sans">Gestor de Base de Datos</label>
                    <input
                      type="text"
                      className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white font-sans"
                      [(ngModel)]="activeProject.databasesUsed"
                      (blur)="handleSyncProjectDetails()"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- TAB: CAPITULO 3 (Scrum Kanban Board) -->
            <div *ngIf="activeTab === 'cap3'" class="space-y-6">
              <app-kanban-board
                [projectId]="activeProject.id"
                [iterations]="iterations"
                [tasks]="tasks"
                [functionalRequirements]="getFunctionalRequirementsList()"
                (onAddTask)="handleAddTask($event)"
                (onUpdateTask)="handleUpdateTaskEvent($event)"
                (onDeleteTask)="handleDeleteTask($event)"
                (onAddIteration)="handleAddIteration($event)"
              ></app-kanban-board>
            </div>

            <!-- TAB: CAPITULO 4 (Database Virtual Designer) -->
            <div *ngIf="activeTab === 'cap4'" class="space-y-6">
              <app-virtual-db-designer
                [initialDesign]="activeProject.virtualDatabaseDesign"
                (onSave)="handleSaveDbDesign($event)"
              ></app-virtual-db-designer>
            </div>

            <!-- TAB: CAPITULO 5 (Casos de prueba & QA) -->
            <div *ngIf="activeTab === 'cap5'" class="space-y-6 max-w-5xl text-left">
              <div class="flex items-center justify-between border-b pb-4 select-none">
                <div>
                  <h2 class="text-xl font-bold text-slate-800">Capítulo 5. Casos de Prueba & QA</h2>
                  <p class="text-sm text-slate-500 font-sans">Genera y ejecuta escenarios de prueba académicos asociados a tus requerimientos.</p>
                </div>

                <button
                  (click)="handleAiGenerateTestCases()"
                  [disabled]="generatingTests"
                  class="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition-colors shadow-sm disabled:opacity-50 cursor-pointer font-sans"
                >
                  <svg *ngIf="generatingTests" class="w-3.5 h-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <!-- Sparkles Icon -->
                  <svg *ngIf="!generatingTests" class="w-3.5 h-3.5 text-amber-300 fill-amber-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707-.707"/>
                  </svg>
                  <span>{{generatingTests ? 'Analizando requisitos...' : 'Generar Pruebas con IA'}}</span>
                </button>
              </div>

              <!-- Interactive Test Cases List -->
              <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Left list -->
                <div class="lg:col-span-2 space-y-4">
                  <div *ngIf="testCases.length === 0" class="text-center py-20 border border-dashed border-slate-200 bg-white rounded-xl space-y-2 select-none">
                    <!-- Award Icon -->
                    <svg class="w-10 h-10 text-slate-300 mx-auto" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
                    </svg>
                    <h4 class="font-bold text-slate-700 text-sm">Sin Casos de Prueba</h4>
                    <p class="text-xs text-slate-500 font-sans">Haz clic en "Generar Pruebas con IA" para que Gemini construya los casos para tus RF01, RF02, etc. automáticamente!</p>
                  </div>

                  <div *ngFor="let test of testCases" class="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
                    <div class="flex items-center justify-between select-none">
                      <span class="font-mono font-bold text-indigo-700 text-xs bg-indigo-50 border border-indigo-100 rounded px-2 py-0.5">
                        {{test.code}}
                      </span>
                      <div class="flex items-center gap-2">
                        <select
                          [class]="test.status === 'Passed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : test.status === 'Failed' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-50 text-slate-500 border-slate-200'"
                          class="text-[10px] font-bold border rounded px-2 py-0.5 focus:outline-none uppercase bg-white font-sans cursor-pointer"
                          [(ngModel)]="test.status"
                          (change)="handleUpdateTestCase(test.id, { status: test.status })"
                        >
                          <option value="Pending">Pendiente</option>
                          <option value="Passed">Aprobado</option>
                          <option value="Failed">Fallido</option>
                        </select>
                        <button
                          (click)="handleDeleteTestCase(test.id)"
                          class="text-slate-400 hover:text-red-500 p-1 rounded transition-colors cursor-pointer"
                        >
                          <!-- Trash Icon -->
                          <svg class="w-4 h-4 inline" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div class="space-y-1.5 text-xs text-slate-700">
                      <h4 class="font-bold text-slate-800 text-sm font-sans">{{test.name}}</h4>
                      <p class="text-slate-500 italic font-sans">"{{test.description}}"</p>
                      
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 font-medium font-sans">
                        <div>
                          <span class="text-[10px] uppercase font-bold text-slate-400 block mb-0.5 select-none">Pasos</span>
                          <p class="bg-slate-50 p-2 rounded whitespace-pre-line border border-slate-100 font-sans">{{test.steps}}</p>
                        </div>
                        <div>
                          <span class="text-[10px] uppercase font-bold text-slate-400 block mb-0.5 select-none">Resultado Esperado</span>
                          <p class="bg-indigo-50/30 p-2 rounded whitespace-pre-line border border-indigo-50 font-sans">{{test.expectedResult}}</p>
                        </div>
                      </div>

                      <!-- Evidence Notes -->
                      <div class="pt-2 font-sans">
                        <span class="text-[10px] uppercase font-bold text-slate-400 block mb-1 select-none">Notas de Evidencia / Captura</span>
                        <input
                          type="text"
                          className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white font-sans"
                          placeholder="Escribe el estado del log o la confirmación visual..."
                          [(ngModel)]="test.evidenceNotes"
                          (blur)="handleUpdateTestCase(test.id, { evidenceNotes: test.evidenceNotes })"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Manual Test creation panel -->
                <div class="lg:col-span-1">
                  <div class="bg-white border border-slate-200 rounded-xl p-5 space-y-4 sticky top-24 text-left">
                    <h3 class="font-bold text-slate-800 text-sm select-none">Crear Caso Manual</h3>
                    
                    <div class="space-y-3 text-xs">
                      <div class="grid grid-cols-2 gap-2 select-none">
                        <div>
                          <label class="block text-slate-500 font-semibold mb-1 font-sans">Código</label>
                          <input type="text" class="w-full border border-slate-200 rounded p-1.5 bg-white font-mono" placeholder="CP01" [(ngModel)]="manCode" />
                        </div>
                        <div>
                          <label class="block text-slate-500 font-semibold mb-1 font-sans">Requisito</label>
                          <input type="text" class="w-full border border-slate-200 rounded p-1.5 bg-white font-mono" placeholder="RF01" [(ngModel)]="manRf" />
                        </div>
                      </div>

                      <div>
                        <label class="block text-slate-500 font-semibold mb-1 select-none font-sans">Nombre</label>
                        <input type="text" class="w-full border border-slate-200 rounded p-1.5 bg-white font-sans" placeholder="ej: Validar Login" [(ngModel)]="manName" />
                      </div>

                      <div>
                        <label class="block text-slate-500 font-semibold mb-1 select-none font-sans">Pasos</label>
                        <textarea class="w-full border border-slate-200 rounded p-1.5 h-16 resize-none bg-white font-sans" placeholder="1. Abrir... 2. Hacer clic..." [(ngModel)]="manSteps"></textarea>
                      </div>

                      <div>
                        <label class="block text-slate-500 font-semibold mb-1 select-none font-sans">Esperado</label>
                        <textarea class="w-full border border-slate-200 rounded p-1.5 h-12 resize-none bg-white font-sans" placeholder="El sistema debe redireccionar..." [(ngModel)]="manExp"></textarea>
                      </div>

                      <button
                        (click)="handleCreateTestCaseManual()"
                        class="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 rounded transition-colors cursor-pointer font-sans select-none"
                      >
                        Añadir Caso
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- TAB: CODIGO (GitHub Explorer) -->
            <div *ngIf="activeTab === 'codigo'" class="space-y-6">
              <div class="space-y-1 text-left select-none">
                <h2 class="text-xl font-bold text-slate-800">Código Fuente del Proyecto</h2>
                <p class="text-xs text-slate-500 font-sans">
                  Navega de manera interactiva por las carpetas, submódulos y código de tus repositorios de GitHub vinculados.
                </p>
              </div>
              <app-github-code-explorer [project]="activeProject"></app-github-code-explorer>
            </div>

            <!-- TAB: CAPITULO 6 & EXPORT (Conclusiones & Export) -->
            <div *ngIf="activeTab === 'cap6'" class="space-y-6 max-w-5xl text-left">
              <div class="space-y-1 select-none">
                <h2 class="text-xl font-bold text-slate-800">Capítulo 6. Cierre del Proyecto & Generador</h2>
                <p class="text-xs text-slate-500 font-sans">Agrega las conclusiones y recomendaciones obtenidas, y compila el informe definitivo.</p>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Left inputs -->
                <div class="md:col-span-1 space-y-4">
                  <div class="bg-white border border-slate-200 p-5 rounded-xl space-y-4 text-xs font-sans">
                    <div>
                      <div class="flex items-center justify-between border-b pb-1.5 select-none">
                        <span class="font-bold text-slate-800">Conclusiones del Proyecto</span>
                        <button
                          (click)="triggerAiRedactor('Conclusiones (6.1)', activeProject.conclusions, 'conclusions')"
                          class="text-[10px] text-indigo-600 font-bold flex items-center gap-0.5 hover:underline cursor-pointer"
                        >
                          <!-- Sparkles -->
                          <svg class="w-3 h-3 animate-pulse" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707-.707"/></svg>
                          IA
                        </button>
                      </div>
                      <textarea
                        class="w-full border border-slate-200 rounded p-2 h-24 bg-white font-sans mt-2"
                        [(ngModel)]="activeProject.conclusions"
                        (blur)="handleSyncProjectDetails()"
                      ></textarea>
                    </div>

                    <div>
                      <div class="flex items-center justify-between border-b pb-1.5 select-none">
                        <span class="font-bold text-slate-800">Recomendaciones</span>
                        <button
                          (click)="triggerAiRedactor('Recomendaciones (6.2)', activeProject.recommendations, 'recommendations')"
                          class="text-[10px] text-indigo-600 font-bold flex items-center gap-0.5 hover:underline cursor-pointer"
                        >
                          <!-- Sparkles -->
                          <svg class="w-3 h-3 animate-pulse" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707-.707"/></svg>
                          IA
                        </button>
                      </div>
                      <textarea
                        class="w-full border border-slate-200 rounded p-2 h-24 bg-white font-sans mt-2"
                        [(ngModel)]="activeProject.recommendations"
                        (blur)="handleSyncProjectDetails()"
                      ></textarea>
                    </div>

                    <div>
                      <div class="flex items-center justify-between border-b pb-1.5 select-none">
                        <span class="font-bold text-slate-800">Mejoras Futuras</span>
                        <button
                          (click)="triggerAiRedactor('Mejoras Futuras (6.3)', activeProject.futureImprovements, 'futureImprovements')"
                          class="text-[10px] text-indigo-600 font-bold flex items-center gap-0.5 hover:underline cursor-pointer"
                        >
                          <!-- Sparkles -->
                          <svg class="w-3 h-3 animate-pulse" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707-.707"/></svg>
                          IA
                        </button>
                      </div>
                      <textarea
                        class="w-full border border-slate-200 rounded p-2 h-24 bg-white font-sans mt-2"
                        [(ngModel)]="activeProject.futureImprovements"
                        (blur)="handleSyncProjectDetails()"
                      ></textarea>
                    </div>
                  </div>
                </div>

                <!-- Right printable sheet preview -->
                <div class="md:col-span-2">
                  <app-report-exporter
                    [project]="activeProject"
                    [iterations]="iterations"
                    [tasks]="tasks"
                    [testCases]="testCases"
                  ></app-report-exporter>
                </div>
              </div>
            </div>

          </main>
        </div>
      </div>

      <!-- GLOBAL AI ASSIST MODAL -->
      <app-ai-suggest-modal
        *ngIf="aiModal && activeProject"
        [projectId]="activeProject.id"
        [sectionName]="aiModal.section"
        [currentText]="aiModal.currentText"
        (onApply)="handleApplyAiRedaction($event)"
        (onClose)="aiModal = null"
      ></app-ai-suggest-modal>

    </div>
  `
})
export class AppComponent implements OnInit, OnDestroy {
  user: FirebaseUser | null = null;
  authLoading = true;
  projects: Project[] = [];
  loadingProjects = false;

  // Active Project Workspace
  activeProject: Project | null = null;
  iterations: ScrumIteration[] = [];
  tasks: ScrumTask[] = [];
  testCases: TestCase[] = [];
  loadingProjectDetails = false;

  // Active tab
  activeTab: 'info' | 'cap1' | 'cap2' | 'cap3' | 'cap4' | 'cap5' | 'codigo' | 'cap6' = 'info';

  // AI Assistant Suggest modal
  aiModal: { section: string; currentText: string; fieldName: string } | null = null;
  generatingTests = false;

  // Modals / Project Creation state
  showCreateProject = false;
  newProjName = '';
  newProjDesc = '';
  newProjOrg = '';

  // Requirement Form state
  newRfCode = '';
  newRfDesc = '';
  newRfPriority: 'Alta' | 'Media' | 'Baja' = 'Alta';

  newRnfCode = '';
  newRnfDesc = '';
  newRnfCategory: 'Red' | 'Seguridad' | 'Rendimiento' | 'Disponibilidad' | 'Usabilidad' = 'Rendimiento';

  // Document Integration state
  docText = '';
  docFileName = '';
  integratingDoc = false;
  docIntegrationError: string | null = null;
  parsedDocData: any | null = null;
  showDocReviewModal = false;

  // Manual Test scenario creation
  manCode = '';
  manRf = '';
  manName = '';
  manSteps = '';
  manExp = '';

  // Tab configurations
  tabItems = [
    { id: 'info', title: '1. Información Inicial', svgRaw: `<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>` },
    { id: 'cap1', title: 'Cap. 1: Descripción', svgRaw: `<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>` },
    { id: 'cap2', title: 'Cap. 2 & 4: Arquitectura', svgRaw: `<polygon points="12 2 2 7 12 12 22 7 12 2"/><polygon points="2 17 12 22 22 17"/><polygon points="2 12 12 17 22 12"/>` },
    { id: 'cap3', title: 'Cap. 3: Scrum Board', svgRaw: `<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>` },
    { id: 'cap4', title: 'Cap. 4.5: Diseño DB', svgRaw: `<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/>` },
    { id: 'cap5', title: 'Cap. 5: Casos de Prueba', svgRaw: `<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>` },
    { id: 'codigo', title: 'Código del Proyecto', svgRaw: `<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>` },
    { id: 'cap6', title: 'Cap. 6 & Compilar', svgRaw: `<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>` }
  ];

  private authSub?: () => void;

  ngOnInit() {
    this.authSub = onAuthStateChanged(auth, (usr) => {
      this.user = usr;
      this.authLoading = false;
      if (usr) {
        this.loadProjects();
      } else {
        this.projects = [];
        this.activeProject = null;
      }
    });
  }

  ngOnDestroy() {
    if (this.authSub) {
      this.authSub();
    }
  }

  async handleLogin() {
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (error) {
      console.error('Error logging in:', error);
      alert('Error al iniciar sesión con Google.');
    }
  }

  async handleLogout() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  // Load user projects
  async loadProjects() {
    this.loadingProjects = true;
    try {
      const res = await fetchWithAuth('/api/projects');
      if (res.ok) {
        this.projects = await res.json();
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      this.loadingProjects = false;
    }
  }

  // Load active project details
  async loadProjectDetails(projectId: number) {
    this.loadingProjectDetails = true;
    try {
      const res = await fetchWithAuth(`/api/projects/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        this.activeProject = data.project;
        this.iterations = data.iterations;
        this.tasks = data.tasks;
        this.testCases = data.testCases;
        this.activeTab = 'info';
      } else {
        alert('No se pudieron cargar los detalles del proyecto.');
      }
    } catch (error) {
      console.error('Error loading details:', error);
    } finally {
      this.loadingProjectDetails = false;
    }
  }

  // Create project handler
  async handleCreateProject() {
    if (!this.newProjName.trim()) return;
    try {
      const res = await fetchWithAuth('/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: this.newProjName.trim(),
          description: this.newProjDesc.trim(),
          organization: this.newProjOrg.trim() || 'Mi Organización',
        }),
      });
      if (res.ok) {
        const newProj = await res.json();
        this.projects.push(newProj);
        this.loadProjectDetails(newProj.id);
        this.showCreateProject = false;
        this.newProjName = '';
        this.newProjDesc = '';
        this.newProjOrg = '';
      } else {
        alert('Error al crear el proyecto.');
      }
    } catch (error) {
      console.error(error);
    }
  }

  // Direct sync handler for blurry inputs
  async handleSyncProjectDetails() {
    if (!this.activeProject) return;
    try {
      const res = await fetchWithAuth(`/api/projects/${this.activeProject.id}`, {
        method: 'PUT',
        body: JSON.stringify(this.activeProject),
      });
      if (res.ok) {
        const updated = await res.json();
        this.activeProject = updated;
        this.projects = this.projects.map(p => p.id === updated.id ? updated : p);
      }
    } catch (error) {
      console.error(error);
    }
  }

  // Explicit update function (for modals/dialogs)
  async handleUpdateProjectDetails(fieldsToUpdate: Partial<Project>) {
    if (!this.activeProject) return;
    try {
      const res = await fetchWithAuth(`/api/projects/${this.activeProject.id}`, {
        method: 'PUT',
        body: JSON.stringify(fieldsToUpdate),
      });
      if (res.ok) {
        const updated = await res.json();
        this.activeProject = updated;
        this.projects = this.projects.map(p => p.id === updated.id ? updated : p);
      } else {
        alert('Error al guardar los cambios.');
      }
    } catch (error) {
      console.error(error);
    }
  }

  // Event handler for components updating projects
  handleDirectUpdateProject(fields: Partial<Project>) {
    this.handleUpdateProjectDetails(fields);
  }

  // Delete project
  async handleDeleteProject(id: number, event: Event) {
    event.stopPropagation();
    if (!confirm('¿Estás seguro de que deseas eliminar este proyecto y toda su documentación de Scrum y base de datos?')) return;
    try {
      const res = await fetchWithAuth(`/api/projects/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        this.projects = this.projects.filter(p => p.id !== id);
        if (this.activeProject?.id === id) {
          this.activeProject = null;
        }
      } else {
        alert('Error al eliminar el proyecto.');
      }
    } catch (error) {
      console.error(error);
    }
  }

  // SCRUM / KANBAN HANDLERS
  async handleAddIteration(iter: Partial<ScrumIteration>) {
    if (!this.activeProject) return;
    try {
      const res = await fetchWithAuth(`/api/projects/${this.activeProject.id}/iterations`, {
        method: 'POST',
        body: JSON.stringify(iter),
      });
      if (res.ok) {
        const newIter = await res.json();
        this.iterations = [...this.iterations, newIter];
      }
    } catch (e) {
      console.error(e);
    }
  }

  async handleAddTask(task: Partial<ScrumTask>) {
    if (!this.activeProject) return;
    try {
      const res = await fetchWithAuth(`/api/projects/${this.activeProject.id}/tasks`, {
        method: 'POST',
        body: JSON.stringify(task),
      });
      if (res.ok) {
        const newTask = await res.json();
        this.tasks = [...this.tasks, newTask];
      }
    } catch (e) {
      console.error(e);
    }
  }

  async handleUpdateTask(taskId: number, taskUpdates: Partial<ScrumTask>) {
    if (!this.activeProject) return;
    try {
      const res = await fetchWithAuth(`/api/projects/${this.activeProject.id}/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify(taskUpdates),
      });
      if (res.ok) {
        const updated = await res.json();
        this.tasks = this.tasks.map(t => t.id === taskId ? updated : t);
      }
    } catch (e) {
      console.error(e);
    }
  }

  handleUpdateTaskEvent(event: { taskId: number; updates: Partial<ScrumTask> }) {
    this.handleUpdateTask(event.taskId, event.updates);
  }

  async handleDeleteTask(taskId: number) {
    if (!this.activeProject) return;
    try {
      const res = await fetchWithAuth(`/api/projects/${this.activeProject.id}/tasks/${taskId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        this.tasks = this.tasks.filter(t => t.id !== taskId);
      }
    } catch (e) {
      console.error(e);
    }
  }

  // DATABASE SCHEMA SAVE
  handleSaveDbDesign(designJson: string) {
    this.handleUpdateProjectDetails({ virtualDatabaseDesign: designJson });
  }

  // TEST CASES HANDLERS
  async handleAddTestCase(test: Partial<TestCase>) {
    if (!this.activeProject) return;
    try {
      const res = await fetchWithAuth(`/api/projects/${this.activeProject.id}/test-cases`, {
        method: 'POST',
        body: JSON.stringify(test),
      });
      if (res.ok) {
        const newTest = await res.json();
        this.testCases = [...this.testCases, newTest];
      }
    } catch (e) {
      console.error(e);
    }
  }

  async handleUpdateTestCase(testId: number, testUpdates: Partial<TestCase>) {
    if (!this.activeProject) return;
    try {
      const res = await fetchWithAuth(`/api/projects/${this.activeProject.id}/test-cases/${testId}`, {
        method: 'PUT',
        body: JSON.stringify(testUpdates),
      });
      if (res.ok) {
        const updated = await res.json();
        this.testCases = this.testCases.map(t => t.id === testId ? updated : t);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async handleDeleteTestCase(testId: number) {
    if (!this.activeProject) return;
    try {
      const res = await fetchWithAuth(`/api/projects/${this.activeProject.id}/test-cases/${testId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        this.testCases = this.testCases.filter(t => t.id !== testId);
      }
    } catch (e) {
      console.error(e);
    }
  }

  // AI Suggest Test Cases generator!
  async handleAiGenerateTestCases() {
    if (!this.activeProject) return;
    this.generatingTests = true;
    try {
      const rfs = this.getFunctionalRequirementsList();
      if (rfs.length === 0) {
        alert('Debes definir al menos un Requerimiento Funcional (RF) en el Capítulo 1 antes de generar pruebas.');
        return;
      }

      const prompt = `Genera un listado de casos de prueba académicos estructurados en formato JSON para el proyecto de Ingeniería de Software "${this.activeProject.name}".
Los requerimientos del sistema son: ${JSON.stringify(rfs)}

Devuelve estrictamente un arreglo JSON válido (sin explicaciones, sin tags de markdown o código), donde cada elemento tenga exactamente esta estructura:
[
  {
    "code": "CP01",
    "name": "Verificar registro de usuario",
    "description": "Prueba para comprobar el caso de uso de registro de usuarios.",
    "preconditions": "Conectividad a la red y base de datos activa.",
    "steps": "1. Ingresar correo y contraseña\\n2. Hacer clic en Enviar.",
    "expectedResult": "El sistema almacena el usuario y muestra mensaje de éxito.",
    "rfCode": "RF01"
  }
]`;

      const res = await fetchWithAuth(`/api/projects/${this.activeProject.id}/ai-suggest`, {
        method: 'POST',
        body: JSON.stringify({
          section: 'Casos de Prueba (Automático)',
          currentText: '',
          prompt,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      let cleanedJson = data.suggestion.trim();
      if (cleanedJson.startsWith('```json')) {
        cleanedJson = cleanedJson.substring(7);
      }
      if (cleanedJson.endsWith('```')) {
        cleanedJson = cleanedJson.substring(0, cleanedJson.length - 3);
      }
      cleanedJson = cleanedJson.trim();

      const parsedTests = JSON.parse(cleanedJson);
      
      for (const test of parsedTests) {
        await this.handleAddTestCase({
          code: test.code,
          name: test.name,
          description: test.description,
          preconditions: test.preconditions,
          steps: test.steps,
          expectedResult: test.expectedResult,
          status: 'Pending',
          rfCode: test.rfCode,
        });
      }

      alert(`Se han generado e insertado exitosamente ${parsedTests.length} Casos de Prueba con Inteligencia Artificial!`);
    } catch (err: any) {
      console.error(err);
      alert('Error al parsear o generar los casos de prueba con la IA: ' + err.message);
    } finally {
      this.generatingTests = false;
    }
  }

  // DOCUMENT INTEGRATOR IA
  handleFileUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.docFileName = file.name;
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          this.docText = evt.target.result as string;
        }
      };
      reader.readAsText(file);
    }
  }

  async handleIntegrateDocument() {
    if (!this.activeProject || !this.docText.trim()) return;
    this.integratingDoc = true;
    this.docIntegrationError = null;
    this.parsedDocData = null;

    try {
      const res = await fetchWithAuth(`/api/projects/${this.activeProject.id}/ai-integrate-doc`, {
        method: 'POST',
        body: JSON.stringify({ documentText: this.docText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al procesar el documento.');
      }
      this.parsedDocData = data;
      this.showDocReviewModal = true;
    } catch (err: any) {
      console.error(err);
      this.docIntegrationError = err.message || 'Error de conexión con la IA.';
    } finally {
      this.integratingDoc = false;
    }
  }

  async handleApplyParsedDoc(selectedFields: Record<string, boolean>) {
    if (!this.activeProject || !this.parsedDocData) return;
    const fieldsToUpdate: Partial<Project> = {};

    const docFieldsMapping: Record<string, string> = {
      name: 'name',
      description: 'description',
      organization: 'organization',
      problemContext: 'problemContext',
      orgDescription: 'orgDescription',
      identifiedNeed: 'identifiedNeed',
      currentSituation: 'currentSituation',
      mainProblem: 'mainProblem',
      generalObjective: 'generalObjective',
      specificObjectives: 'specificObjectives',
      functionalRequirements: 'functionalRequirements',
      nonFunctionalRequirements: 'nonFunctionalRequirements',
      scopeLimitations: 'scopeLimitations',
      architectureType: 'architectureType',
      architectureDescription: 'architectureDescription',
      languagesUsed: 'languagesUsed',
      frameworksUsed: 'frameworksUsed',
      databasesUsed: 'databasesUsed',
      conclusions: 'conclusions',
      recommendations: 'recommendations',
      futureImprovements: 'futureImprovements'
    };

    for (const key of Object.keys(docFieldsMapping)) {
      if (selectedFields[key] && this.parsedDocData[key] !== undefined) {
        const val = this.parsedDocData[key];
        if (typeof val === 'object') {
          (fieldsToUpdate as any)[docFieldsMapping[key]] = JSON.stringify(val);
        } else {
          (fieldsToUpdate as any)[docFieldsMapping[key]] = val;
        }
      }
    }

    if (Object.keys(fieldsToUpdate).length === 0) {
      alert('Debes seleccionar al menos un campo para integrar.');
      return;
    }

    try {
      await this.handleUpdateProjectDetails(fieldsToUpdate);
      alert('¡Documentación integrada exitosamente al proyecto!');
      this.showDocReviewModal = false;
      this.docText = '';
      this.docFileName = '';
      this.parsedDocData = null;
    } catch (err: any) {
      alert('Error al aplicar los datos integrados: ' + err.message);
    }
  }

  // REQUIREMENT ACTIONS
  handleAddRf() {
    if (!this.activeProject || !this.newRfCode.trim() || !this.newRfDesc.trim()) return;
    const rfs = this.getFunctionalRequirementsList();
    const newRf: FunctionalRequirement = {
      code: this.newRfCode.trim().toUpperCase(),
      desc: this.newRfDesc.trim(),
      priority: this.newRfPriority,
    };
    if (rfs.some((r: any) => r.code === newRf.code)) {
      alert('Ya existe un requerimiento con ese código.');
      return;
    }
    const updated = [...rfs, newRf];
    this.handleUpdateProjectDetails({ functionalRequirements: JSON.stringify(updated) });
    this.newRfCode = '';
    this.newRfDesc = '';
  }

  handleDeleteRf(code: string) {
    if (!this.activeProject) return;
    const rfs = this.getFunctionalRequirementsList();
    const updated = rfs.filter((r: any) => r.code !== code);
    this.handleUpdateProjectDetails({ functionalRequirements: JSON.stringify(updated) });
  }

  handleAddRnf() {
    if (!this.activeProject || !this.newRnfCode.trim() || !this.newRnfDesc.trim()) return;
    const rnfs = this.getNonFunctionalRequirementsList();
    const newRnf: NonFunctionalRequirement = {
      code: this.newRnfCode.trim().toUpperCase(),
      desc: this.newRnfDesc.trim(),
      category: this.newRnfCategory,
    };
    if (rnfs.some((r: any) => r.code === newRnf.code)) {
      alert('Ya existe un requerimiento con ese código.');
      return;
    }
    const updated = [...rnfs, newRnf];
    this.handleUpdateProjectDetails({ nonFunctionalRequirements: JSON.stringify(updated) });
    this.newRnfCode = '';
    this.newRnfDesc = '';
  }

  handleDeleteRnf(code: string) {
    if (!this.activeProject) return;
    const rnfs = this.getNonFunctionalRequirementsList();
    const updated = rnfs.filter((r: any) => r.code !== code);
    this.handleUpdateProjectDetails({ nonFunctionalRequirements: JSON.stringify(updated) });
  }

  // MANUAL TEST CREATION
  handleCreateTestCaseManual() {
    if (!this.manCode.trim() || !this.manName.trim()) {
      alert('Código y Nombre son obligatorios.');
      return;
    }
    this.handleAddTestCase({
      code: this.manCode.trim(),
      name: this.manName.trim(),
      rfCode: this.manRf.trim(),
      steps: this.manSteps.trim(),
      expectedResult: this.manExp.trim(),
      status: 'Pending',
      description: 'Creado de manera manual.'
    });
    this.manCode = '';
    this.manRf = '';
    this.manName = '';
    this.manSteps = '';
    this.manExp = '';
  }

  // PARSING UTILITIES
  getSpecificObjectivesList(): string[] {
    if (!this.activeProject) return [];
    try {
      return JSON.parse(this.activeProject.specificObjectives || '[]');
    } catch {
      return [];
    }
  }

  getFunctionalRequirementsList(): FunctionalRequirement[] {
    if (!this.activeProject) return [];
    try {
      return JSON.parse(this.activeProject.functionalRequirements || '[]');
    } catch {
      return [];
    }
  }

  getNonFunctionalRequirementsList(): NonFunctionalRequirement[] {
    if (!this.activeProject) return [];
    try {
      return JSON.parse(this.activeProject.nonFunctionalRequirements || '[]');
    } catch {
      return [];
    }
  }

  getFirstFramework(): string {
    if (!this.activeProject || !this.activeProject.frameworksUsed) return 'Frontend App';
    return this.activeProject.frameworksUsed.split(',')[0] || 'Frontend App';
  }

  // REDACTOR IA CO-PILOT
  triggerAiRedactor(sectionName: string, currentText: string, fieldName: string) {
    this.aiModal = {
      section: sectionName,
      currentText: currentText || '',
      fieldName: fieldName
    };
  }

  handleApplyAiRedaction(newText: string) {
    if (!this.aiModal) return;
    const field = this.aiModal.fieldName;
    this.handleUpdateProjectDetails({ [field]: newText });
    this.aiModal = null;
  }

  // SUGGEST OBJECTIVES BLOOM TAXONOMY
  handleAiSuggestObjectives() {
    if (!this.activeProject) return;
    this.aiModal = {
      section: 'Objetivos del Proyecto',
      currentText: `Objetivo General: ${this.activeProject.generalObjective}\nObjetivos Específicos: ${this.activeProject.specificObjectives}`,
      fieldName: 'objectives_bloom'
    };
  }

  handleApplyAiObjectives(newText: string) {
    const lines = newText.split('\n');
    let gen = this.activeProject?.generalObjective || '';
    let specs: string[] = [];
    
    lines.forEach(line => {
      const l = line.trim();
      if (l.toLowerCase().startsWith('objetivo general:')) {
        gen = l.replace(/objetivo general:/i, '').trim();
      } else if (l.startsWith('-') || l.startsWith('*') || /^\d+\./.test(l)) {
        specs.push(l.replace(/^[-*\d.]\s*/, '').trim());
      } else if (l.length > 5) {
        specs.push(l);
      }
    });

    if (specs.length === 0) {
      specs = ['Diseñar e implementar...', 'Desarrollar la base de datos...', 'Ejecutar pruebas unitarias...'];
    }

    this.handleUpdateProjectDetails({
      generalObjective: gen,
      specificObjectives: JSON.stringify(specs)
    });
    this.aiModal = null;
  }
}
