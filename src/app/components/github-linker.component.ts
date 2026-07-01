import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Project, GithubRepo } from '../../types.ts';
import { fetchWithAuth } from '../../lib/api.ts';

@Component({
  selector: 'app-github-linker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-4">
      <!-- Explanations & Linked Repositories -->
      <div class="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div class="flex items-center justify-between border-b pb-2">
          <div class="text-left">
            <h3 class="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <svg class="w-4 h-4 text-slate-900" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
                <path d="M9 18c-4.51 2-5-2-7-2"/>
              </svg>
              1.6 Enlace con Repositorios de Código Fuente (GitHub)
            </h3>
            <p class="text-[10px] text-slate-400 mt-0.5">
              Enlaza este proyecto con tus repositorios de GitHub para integrarlos en el diccionario técnico y reporte formal.
            </p>
          </div>
        </div>

        <!-- Linked Repositories List -->
        <div class="space-y-2 text-left">
          <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">
            Repositorios Enlazados ({{linkedRepos.length}})
          </label>
          
          <div *ngIf="linkedRepos.length === 0" class="border border-dashed border-slate-200 rounded-lg p-6 text-center bg-slate-50/50">
            <svg class="w-6 h-6 text-slate-350 mx-auto mb-1.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m8 8-4 4 4 4"/><path d="m16 8 4 4-4 4"/><path d="m14 4-4 16"/>
            </svg>
            <p class="text-xs text-slate-500 font-medium">Ningún repositorio enlazado todavía</p>
            <p class="text-[10px] text-slate-400 mt-0.5">Utiliza las herramientas de búsqueda o entrada manual abajo para enlazar tu código fuente.</p>
          </div>

          <div *ngIf="linkedRepos.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div *ngFor="let repo of linkedRepos" class="border border-slate-150 rounded-lg p-3 bg-slate-50 hover:bg-slate-100/50 transition-colors flex items-start justify-between gap-3">
              <div class="space-y-1 min-w-0">
                <div class="flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5 text-indigo-500 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>
                  </svg>
                  <span class="font-bold text-xs text-slate-800 truncate">{{repo.fullName}}</span>
                  <a [href]="repo.htmlUrl" target="_blank" rel="noopener noreferrer" class="text-slate-400 hover:text-slate-600">
                    <svg class="w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                  </a>
                </div>
                <p *ngIf="repo.description" class="text-[10px] text-slate-500 line-clamp-1">{{repo.description}}</p>
                <div class="flex items-center gap-2 text-[9px] text-slate-400 font-bold">
                  <span *ngIf="repo.language" class="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-sm">{{repo.language}}</span>
                  <span class="flex items-center gap-0.5">
                    <svg class="w-2.5 h-2.5 text-amber-500 fill-amber-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    {{repo.stars}}
                  </span>
                  <span>Enlazado: {{repo.linkedAt}}</span>
                </div>
              </div>
              
              <div class="flex flex-col justify-between items-end gap-2 h-full min-h-[50px] shrink-0">
                <button
                  (click)="handleRemoveRepo(repo.id)"
                  class="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer"
                  title="Desenlazar repositorio"
                >
                  <svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                  </svg>
                </button>

                <button
                  (click)="handleIntegrateGithubRepo(repo)"
                  [disabled]="analyzingRepoId !== null"
                  class="px-2 py-1 text-[9px] font-extrabold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 disabled:bg-slate-100 disabled:text-slate-400 rounded transition-all flex items-center gap-1 shadow-2xs cursor-pointer animate-pulse"
                >
                  <ng-container *ngIf="analyzingRepoId === repo.id; else integrateBtn">
                    <svg class="w-2.5 h-2.5 animate-spin" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                    Procesando...
                  </ng-container>
                  <ng-template #integrateBtn>
                    <svg class="w-2.5 h-2.5 text-indigo-500 fill-indigo-200" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z"/>
                    </svg>
                    Integrar al Informe (IA)
                  </ng-template>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Controls to link new repositories -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Option A: User search -->
        <div class="bg-white border border-slate-200 rounded-xl p-5 space-y-3 text-left">
          <div class="space-y-0.5">
            <h4 class="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              Buscar por Usuario o Organización
            </h4>
            <p class="text-[10px] text-slate-400">
              Introduce un usuario para listar y seleccionar repositorios públicos de manera interactiva.
            </p>
          </div>

          <div class="space-y-2">
            <div class="flex gap-2">
              <div class="relative flex-1">
                <span class="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-400">
                  <svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
                  </svg>
                </span>
                <input
                  type="text"
                  class="w-full text-xs border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white text-slate-700 font-medium"
                  placeholder="ej: octocat"
                  [(ngModel)]="username"
                  (keydown.enter)="handleFetchRepos()"
                />
              </div>
              <button
                (click)="handleFetchRepos()"
                [disabled]="loading"
                class="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
              >
                <svg *ngIf="loading" class="w-3 h-3 animate-spin" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                <svg *ngIf="!loading" class="w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                </svg>
                Cargar
              </button>
            </div>

            <!-- PAT Input -->
            <div class="space-y-1">
              <label class="block text-[9px] font-bold text-slate-400 uppercase">Token de Acceso Personal (Opcional)</label>
              <input
                type="password"
                class="w-full text-[10px] border border-slate-200 rounded-md px-2 py-1 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white text-slate-600 font-mono"
                placeholder="ghp_..."
                [(ngModel)]="personalToken"
              />
              <p class="text-[9px] text-slate-400 font-sans">Solo se procesa localmente en tu navegador si necesitas ver repositorios privados o evitar límites de tasa.</p>
            </div>

            <div *ngIf="error" class="flex items-start gap-1 text-[10px] text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
              <span class="font-bold">⚠️</span>
              <span>{{error}}</span>
            </div>

            <!-- Search Results -->
            <div *ngIf="fetchedRepos.length > 0" class="space-y-2 border-t border-slate-100 pt-2 text-left">
              <div class="flex justify-between items-center text-[10px] text-slate-500 font-sans">
                <span>Encontrados: {{fetchedRepos.length}} repositorios</span>
                <button
                  (click)="handleLinkSelected()"
                  [disabled]="selectedRepoIds.length === 0"
                  class="text-indigo-600 font-bold hover:underline disabled:text-slate-300 disabled:no-underline flex items-center gap-0.5 cursor-pointer"
                >
                  Enlazar Seleccionados ({{selectedRepoIds.length}})
                </button>
              </div>

              <div class="max-h-40 overflow-y-auto border border-slate-150 rounded-lg divide-y divide-slate-100 bg-white">
                <div
                  *ngFor="let repo of fetchedRepos"
                  (click)="!isLinked(repo.id) && toggleSelectRepo(repo.id)"
                  class="p-2 flex items-center justify-between text-xs transition-colors cursor-pointer"
                  [class.bg-slate-50]="isLinked(repo.id)"
                  [class.text-slate-400]="isLinked(repo.id)"
                  [class.hover:bg-slate-50]="!isLinked(repo.id)"
                  [class.text-slate-700]="!isLinked(repo.id)"
                >
                  <div class="flex items-center gap-2 min-w-0">
                    <input
                      type="checkbox"
                      [checked]="isSelected(repo.id) || isLinked(repo.id)"
                      [disabled]="isLinked(repo.id)"
                      (change)="$event.stopPropagation()"
                      class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 shrink-0 w-3 h-3"
                    />
                    <div class="min-w-0 text-left">
                      <p class="font-bold text-[11px] truncate">{{repo.name}}</p>
                      <p class="text-[9px] text-slate-400 truncate">{{repo.description || 'Sin descripción'}}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-1 text-[9px] text-slate-400 shrink-0 font-bold ml-2">
                    <span *ngIf="repo.language" class="bg-slate-100 px-1 rounded">{{repo.language}}</span>
                    <span *ngIf="isLinked(repo.id)" class="text-emerald-600 font-bold">Enlazado</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Option B: Manual Input -->
        <div class="bg-white border border-slate-200 rounded-xl p-5 space-y-3 text-left">
          <div class="space-y-0.5">
            <h4 class="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              Enlace Directo / Repositorio Específico
            </h4>
            <p class="text-[10px] text-slate-400">
              Enlaza un repositorio específico directamente ingresando su URL o su identificador (ej: 'propietario/repositorio').
            </p>
          </div>

          <div class="space-y-2.5">
            <div class="space-y-1">
              <label class="block text-[9px] font-bold text-slate-400 uppercase">URL o Identificador de Repositorio</label>
              <input
                type="text"
                class="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white text-slate-700 font-medium"
                placeholder="ej: https://github.com/propietario/repositorio"
                [(ngModel)]="manualUrl"
                (keydown.enter)="handleAddManualRepo()"
              />
            </div>

            <button
              (click)="handleAddManualRepo()"
              [disabled]="manualLoading || !manualUrl.trim()"
              class="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold text-xs py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <svg *ngIf="manualLoading" class="w-3 h-3 animate-spin" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              <svg *ngIf="!manualLoading" class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Enlazar Repositorio Directo
            </button>

            <div *ngIf="manualError" class="flex items-start gap-1 text-[10px] text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
              <span class="font-bold">⚠️</span>
              <span>{{manualError}}</span>
            </div>

            <div class="bg-slate-50 border border-slate-150 rounded-lg p-3 text-[10px] text-slate-500 space-y-1 leading-normal font-sans">
              <p class="font-bold text-slate-600">Ejemplos de formatos aceptados:</p>
              <ul class="list-disc pl-3 space-y-0.5">
                <li><code class="font-mono bg-slate-200 px-0.5 rounded text-[9px]">https://github.com/facebook/react</code></li>
                <li><code class="font-mono bg-slate-200 px-0.5 rounded text-[9px]">facebook/react</code></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- REVIEW DIALOG -->
      <div *ngIf="showGithubReviewModal && githubParseResult" class="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm text-xs">
        <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col">
          <!-- Header -->
          <div class="p-4 border-b border-slate-150 flex justify-between items-center bg-slate-50 rounded-t-xl text-left">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-indigo-600 fill-indigo-100 shrink-0 animate-pulse" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z"/>
              </svg>
              <div>
                <h3 class="font-extrabold text-slate-900 text-sm">Vista Previa de la Integración (GitHub + IA)</h3>
                <p class="text-[10px] text-slate-500">Revisa la estructura técnica y de bases de datos que se agregará a tu informe.</p>
              </div>
            </div>
            <button 
              (click)="showGithubReviewModal = false"
              class="p-1 rounded-lg text-slate-400 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
              </svg>
            </button>
          </div>

          <!-- Selector list -->
          <div class="flex-1 overflow-y-auto p-5 space-y-4 text-left">
            <div class="bg-amber-50 border border-amber-100 rounded-lg p-3 text-amber-800 text-[10px] leading-relaxed flex items-start gap-2">
              <span class="font-bold">⚠️</span>
              <span>
                <strong>Nota técnica:</strong> Integrar esta información actualizará los campos de lenguaje, frameworks, base de datos y arquitectura técnica en el informe. También sugerirá tablas PostgreSQL correspondientes en tu diseñador de base de datos virtual.
              </span>
            </div>

            <!-- Fields -->
            <div class="space-y-3">
              <!-- Description -->
              <div *ngIf="githubParseResult.description" class="border border-slate-150 rounded-lg p-3 bg-white">
                <label class="flex items-start gap-2 font-bold text-slate-800 cursor-pointer">
                  <input 
                    type="checkbox" 
                    [(ngModel)]="selectedGithubFields.description" 
                    class="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Descripción Técnica / Resumen</span>
                </label>
                <p *ngIf="selectedGithubFields.description" class="mt-1.5 text-[11px] text-slate-600 pl-6 leading-relaxed bg-slate-50 p-2 rounded border border-slate-100 font-sans">
                  {{githubParseResult.description}}
                </p>
              </div>

              <!-- Tech Stack -->
              <div class="border border-slate-150 rounded-lg p-3 bg-white space-y-2">
                <span class="font-bold text-slate-800 block">Stack Tecnológico y Herramientas</span>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3 pl-1">
                  <div>
                    <label class="flex items-center gap-1.5 font-semibold text-slate-700 text-[11px] cursor-pointer">
                      <input 
                        type="checkbox" 
                        [(ngModel)]="selectedGithubFields.languagesUsed" 
                        class="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Lenguajes</span>
                    </label>
                    <p *ngIf="selectedGithubFields.languagesUsed" class="mt-1 text-[10px] text-slate-500 pl-5">{{githubParseResult.languagesUsed || 'No detectados'}}</p>
                  </div>

                  <div>
                    <label class="flex items-center gap-1.5 font-semibold text-slate-700 text-[11px] cursor-pointer">
                      <input 
                        type="checkbox" 
                        [(ngModel)]="selectedGithubFields.frameworksUsed" 
                        class="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Frameworks</span>
                    </label>
                    <p *ngIf="selectedGithubFields.frameworksUsed" class="mt-1 text-[10px] text-slate-500 pl-5">{{githubParseResult.frameworksUsed || 'No detectados'}}</p>
                  </div>

                  <div>
                    <label class="flex items-center gap-1.5 font-semibold text-slate-700 text-[11px] cursor-pointer">
                      <input 
                        type="checkbox" 
                        [(ngModel)]="selectedGithubFields.databasesUsed" 
                        class="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Bases de Datos</span>
                    </label>
                    <p *ngIf="selectedGithubFields.databasesUsed" class="mt-1 text-[10px] text-slate-500 pl-5">{{githubParseResult.databasesUsed || 'No detectados'}}</p>
                  </div>
                </div>
              </div>

              <!-- Architecture -->
              <div *ngIf="githubParseResult.architectureType || githubParseResult.architectureDescription" class="border border-slate-150 rounded-lg p-3 bg-white space-y-2">
                <span class="font-bold text-slate-800 block">Arquitectura del Software</span>
                <div class="space-y-1.5 pl-1">
                  <label class="flex items-center gap-1.5 font-semibold text-slate-700 text-[11px] cursor-pointer">
                    <input 
                      type="checkbox" 
                      [checked]="selectedGithubFields.architectureType && selectedGithubFields.architectureDescription"
                      (change)="toggleArchitectureField()" 
                      class="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Tipo y Descripción de la Arquitectura</span>
                  </label>
                  <div *ngIf="selectedGithubFields.architectureType" class="mt-1 text-[11px] text-slate-600 pl-5 space-y-1 bg-slate-50 p-2 rounded border border-slate-100 font-sans">
                    <p class="font-bold text-slate-700">Patrón: {{githubParseResult.architectureType}}</p>
                    <p class="text-[10px] whitespace-pre-wrap leading-relaxed">{{githubParseResult.architectureDescription}}</p>
                  </div>
                </div>
              </div>

              <!-- Virtual Database design -->
              <div *ngIf="githubParseResult.virtualDatabaseDesign && githubParseResult.virtualDatabaseDesign.length > 0" class="border border-slate-150 rounded-lg p-3 bg-white space-y-2">
                <label class="flex items-center gap-1.5 font-bold text-slate-800 cursor-pointer">
                  <input 
                    type="checkbox" 
                    [(ngModel)]="selectedGithubFields.virtualDatabaseDesign" 
                    class="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Diseño de Base de Datos Relacional Sugerido ({{githubParseResult.virtualDatabaseDesign.length}} Tablas)</span>
                </label>

                <div *ngIf="selectedGithubFields.virtualDatabaseDesign" class="pl-6 space-y-2 max-h-56 overflow-y-auto">
                  <div *ngFor="let table of githubParseResult.virtualDatabaseDesign" class="bg-slate-50 border border-slate-150 rounded-md p-2">
                    <div class="flex items-center gap-1.5 font-mono font-bold text-slate-800 text-[10px]">
                      <svg class="w-3.5 h-3.5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/>
                      </svg>
                      {{table.name}}
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-1.5 mt-1 text-[9px] font-mono pl-5">
                      <div *ngFor="let col of table.columns" class="text-slate-600 flex justify-between bg-white border border-slate-100 p-1 rounded">
                        <span>{{col.name}} <span class="text-slate-400">({{col.type})</span></span>
                        <div class="flex gap-1">
                          <span *ngIf="col.isPk" class="bg-indigo-100 text-indigo-800 text-[8px] font-bold px-1 rounded">PK</span>
                          <span *ngIf="col.isFk" class="bg-amber-100 text-amber-800 text-[8px] font-bold px-1 rounded" [title]="col.fkRef">FK</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="p-4 border-t border-slate-150 flex justify-end gap-2 bg-slate-50 rounded-b-xl">
            <button
              (click)="showGithubReviewModal = false"
              class="px-3.5 py-1.5 font-bold text-slate-600 hover:bg-slate-150 rounded-lg cursor-pointer"
            >
              Cancelar
            </button>
            <button
              (click)="handleApplyGithubIntegration()"
              class="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <!-- Check Icon -->
              <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 6 9 17l-5-5"/>
              </svg>
              Integrar Datos del Repositorio
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class GithubLinkerComponent implements OnChanges {
  @Input() project!: Project;
  @Output() updateProject = new EventEmitter<Partial<Project>>();

  username: string = '';
  personalToken: string = '';
  loading: boolean = false;
  error: string | null = null;
  fetchedRepos: any[] = [];
  selectedRepoIds: number[] = [];
  
  manualUrl: string = '';
  manualLoading: boolean = false;
  manualError: string | null = null;

  // GitHub AI Integration States
  analyzingRepoId: number | null = null;
  githubParseResult: any | null = null;
  showGithubReviewModal: boolean = false;
  selectedGithubFields: Record<string, boolean> = {
    description: true,
    languagesUsed: true,
    frameworksUsed: true,
    databasesUsed: true,
    architectureType: true,
    architectureDescription: true,
    virtualDatabaseDesign: true
  };

  linkedRepos: GithubRepo[] = [];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['project']) {
      try {
        this.linkedRepos = JSON.parse(this.project.githubRepos || '[]');
      } catch {
        this.linkedRepos = [];
      }
    }
  }

  saveLinkedRepos(repos: GithubRepo[]) {
    this.updateProject.emit({ githubRepos: JSON.stringify(repos) });
  }

  isLinked(id: number): boolean {
    return this.linkedRepos.some(r => r.id === id);
  }

  isSelected(id: number): boolean {
    return this.selectedRepoIds.includes(id);
  }

  toggleSelectRepo(id: number) {
    if (this.selectedRepoIds.includes(id)) {
      this.selectedRepoIds = this.selectedRepoIds.filter(item => item !== id);
    } else {
      this.selectedRepoIds.push(id);
    }
  }

  toggleArchitectureField() {
    const nextVal = !(this.selectedGithubFields['architectureType'] && this.selectedGithubFields['architectureDescription']);
    this.selectedGithubFields['architectureType'] = nextVal;
    this.selectedGithubFields['architectureDescription'] = nextVal;
  }

  async handleFetchRepos() {
    if (!this.username.trim()) {
      this.error = 'Por favor, ingresa un nombre de usuario de GitHub.';
      return;
    }

    this.loading = true;
    this.error = null;
    this.fetchedRepos = [];
    this.selectedRepoIds = [];

    try {
      const headers: HeadersInit = {
        'Accept': 'application/vnd.github.v3+json',
      };
      if (this.personalToken.trim()) {
        headers['Authorization'] = `token ${this.personalToken.trim()}`;
      }

      const response = await fetch(`https://api.github.com/users/${this.username.trim()}/repos?sort=updated&per_page=50`, {
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

      this.fetchedRepos = data;
    } catch (err: any) {
      this.error = err.message || 'Error al conectar con GitHub.';
    } finally {
      this.loading = false;
    }
  }

  handleLinkSelected() {
    const toLink = this.fetchedRepos.filter(r => this.selectedRepoIds.includes(r.id));
    const newRepos: GithubRepo[] = [];

    toLink.forEach(data => {
      if (!this.isLinked(data.id)) {
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
      this.saveLinkedRepos([...this.linkedRepos, ...newRepos]);
    }
    
    this.selectedRepoIds = [];
    this.fetchedRepos = this.fetchedRepos.filter(r => !this.selectedRepoIds.includes(r.id));
  }

  handleRemoveRepo(id: number) {
    this.saveLinkedRepos(this.linkedRepos.filter(r => r.id !== id));
  }

  async handleAddManualRepo() {
    const target = this.manualUrl.trim();
    if (!target) {
      this.manualError = 'Ingresa un URL o identificador "propietario/repositorio".';
      return;
    }

    const githubUrlRegex = /(?:github\.com\/|^)([a-zA-Z0-9-_]+)\/([a-zA-Z0-9-_\.]+)/i;
    const match = target.match(githubUrlRegex);
    
    let owner = '';
    let repo = '';

    if (match) {
      owner = match[1];
      repo = match[2].replace(/\.git$/, '');
    } else {
      const parts = target.split('/');
      if (parts.length === 2) {
        owner = parts[0];
        repo = parts[1];
      }
    }

    if (!owner || !repo) {
      this.manualError = 'Formato inválido. Usa "propietario/nombre" o un URL completo de GitHub.';
      return;
    }

    this.manualLoading = true;
    this.manualError = null;

    try {
      const headers: HeadersInit = {
        'Accept': 'application/vnd.github.v3+json',
      };
      if (this.personalToken.trim()) {
        headers['Authorization'] = `token ${this.personalToken.trim()}`;
      }

      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
      if (!response.ok) {
        throw new Error(`No se pudo encontrar el repositorio (${response.statusText})`);
      }

      const data = await response.json();
      
      if (this.isLinked(data.id)) {
        this.manualError = 'Este repositorio ya se encuentra enlazado.';
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

      this.saveLinkedRepos([...this.linkedRepos, newRepo]);
      this.manualUrl = '';
      this.manualError = null;
    } catch (err: any) {
      this.manualError = err.message || 'No se pudo obtener información del repositorio.';
    } finally {
      this.manualLoading = false;
    }
  }

  async handleIntegrateGithubRepo(repo: GithubRepo) {
    this.analyzingRepoId = repo.id;
    this.githubParseResult = null;

    try {
      let filesList: string[] = [];
      try {
        const headers: HeadersInit = { 'Accept': 'application/vnd.github.v3+json' };
        if (this.personalToken.trim()) headers['Authorization'] = `token ${this.personalToken.trim()}`;
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

      const res = await fetchWithAuth(`/api/projects/${this.project.id}/ai-integrate-github`, {
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

      this.githubParseResult = data;
      this.showGithubReviewModal = true;
    } catch (err: any) {
      alert('Error al analizar el repositorio con IA: ' + err.message);
    } finally {
      this.analyzingRepoId = null;
    }
  }

  handleApplyGithubIntegration() {
    if (!this.githubParseResult) return;
    const fieldsToUpdate: Partial<Project> = {};

    if (this.selectedGithubFields['description'] && this.githubParseResult.description) {
      fieldsToUpdate.description = this.githubParseResult.description;
    }
    if (this.selectedGithubFields['languagesUsed'] && this.githubParseResult.languagesUsed) {
      fieldsToUpdate.languagesUsed = this.githubParseResult.languagesUsed;
    }
    if (this.selectedGithubFields['frameworksUsed'] && this.githubParseResult.frameworksUsed) {
      fieldsToUpdate.frameworksUsed = this.githubParseResult.frameworksUsed;
    }
    if (this.selectedGithubFields['databasesUsed'] && this.githubParseResult.databasesUsed) {
      fieldsToUpdate.databasesUsed = this.githubParseResult.databasesUsed;
    }
    if (this.selectedGithubFields['architectureType'] && this.githubParseResult.architectureType) {
      fieldsToUpdate.architectureType = this.githubParseResult.architectureType;
    }
    if (this.selectedGithubFields['architectureDescription'] && this.githubParseResult.architectureDescription) {
      fieldsToUpdate.architectureDescription = this.githubParseResult.architectureDescription;
    }
    if (this.selectedGithubFields['virtualDatabaseDesign'] && this.githubParseResult.virtualDatabaseDesign) {
      fieldsToUpdate.virtualDatabaseDesign = JSON.stringify(this.githubParseResult.virtualDatabaseDesign);
    }

    if (Object.keys(fieldsToUpdate).length === 0) {
      alert('Selecciona al menos un campo para integrar.');
      return;
    }

    this.updateProject.emit(fieldsToUpdate);
    alert('¡Repositorio de GitHub integrado y estructurado en tu documento de ingeniería con éxito!');
    this.showGithubReviewModal = false;
    this.githubParseResult = null;
  }
}
