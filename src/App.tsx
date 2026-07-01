import React, { useState, useEffect } from 'react';
import {
  auth,
  googleAuthProvider
} from './lib/firebase.ts';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import {
  Plus,
  Trash2,
  Folder,
  LogOut,
  Sparkles,
  BookOpen,
  Layers,
  Database,
  CheckSquare,
  FileText,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Award,
  ArrowRight,
  Save,
  Check,
  Zap,
  Info,
  Code
} from 'lucide-react';
import { Project, ScrumIteration, ScrumTask, TestCase, FunctionalRequirement, NonFunctionalRequirement } from './types.ts';
import { fetchWithAuth } from './lib/api.ts';

// Components
import AiSuggestModal from './components/AiSuggestModal.tsx';
import VirtualDbDesigner from './components/VirtualDbDesigner.tsx';
import KanbanBoard from './components/KanbanBoard.tsx';
import ReportExporter from './components/ReportExporter.tsx';
import MarkdownPreview from './components/MarkdownPreview.tsx';
import GithubLinker from './components/GithubLinker.tsx';
import GithubCodeExplorer from './components/GithubCodeExplorer.tsx';
import { DocReviewModal } from './components/DocReviewModal.tsx';
import ProjectChangeHistory from './components/ProjectChangeHistory.tsx';

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  
  // Active Project Workspace
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [iterations, setIterations] = useState<ScrumIteration[]>([]);
  const [tasks, setTasks] = useState<ScrumTask[]>([]);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [loadingProjectDetails, setLoadingProjectDetails] = useState(false);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);

  // Active workspace tab
  const [activeTab, setActiveTab] = useState<'info' | 'cap1' | 'cap2' | 'cap3' | 'cap4' | 'cap5' | 'cap6' | 'codigo'>('info');

  // AI assistant states
  const [aiModal, setAiModal] = useState<{ section: string; currentText: string; onApply: (t: string) => void } | null>(null);
  const [generatingTests, setGeneratingTests] = useState(false);

  // Modal / form states for project creation
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjOrg, setNewProjOrg] = useState('');

  // States for requirement forms
  const [newRfCode, setNewRfCode] = useState('');
  const [newRfDesc, setNewRfDesc] = useState('');
  const [newRfPriority, setNewRfPriority] = useState<'Alta' | 'Media' | 'Baja'>('Alta');

  const [newRnfCode, setNewRnfCode] = useState('');
  const [newRnfDesc, setNewRnfDesc] = useState('');
  const [newRnfCategory, setNewRnfCategory] = useState<'Red' | 'Seguridad' | 'Rendimiento' | 'Disponibilidad' | 'Usabilidad'>('Rendimiento');

  // Document Integration States
  const [docText, setDocText] = useState('');
  const [docFileName, setDocFileName] = useState('');
  const [integratingDoc, setIntegratingDoc] = useState(false);
  const [docIntegrationError, setDocIntegrationError] = useState<string | null>(null);
  const [parsedDocData, setParsedDocData] = useState<any | null>(null);
  const [showDocReviewModal, setShowDocReviewModal] = useState(false);

  // Track Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      setUser(usr);
      setAuthLoading(false);
      if (usr) {
        loadProjects();
      } else {
        setProjects([]);
        setActiveProject(null);
      }
    });
    return unsubscribe;
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (error) {
      console.error('Error logging in:', error);
      alert('Error al iniciar sesión con Google.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Load user projects
  const loadProjects = async () => {
    setLoadingProjects(true);
    try {
      const res = await fetchWithAuth('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoadingProjects(false);
    }
  };

  // Load selected project details
  const loadProjectDetails = async (projectId: number) => {
    setLoadingProjectDetails(true);
    try {
      const res = await fetchWithAuth(`/api/projects/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setActiveProject(data.project);
        setIterations(data.iterations);
        setTasks(data.tasks);
        setTestCases(data.testCases);
        setActiveTab('info');
      } else {
        alert('No se pudieron cargar los detalles del proyecto.');
      }
    } catch (error) {
      console.error('Error loading details:', error);
    } finally {
      setLoadingProjectDetails(false);
    }
  };

  // Create project handler
  const handleCreateProject = async () => {
    if (!newProjName.trim()) return;
    try {
      const res = await fetchWithAuth('/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: newProjName.trim(),
          description: newProjDesc.trim(),
          organization: newProjOrg.trim() || 'Mi Organización',
        }),
      });
      if (res.ok) {
        const newProj = await res.json();
        setProjects([...projects, newProj]);
        loadProjectDetails(newProj.id);
        setShowCreateProject(false);
        setNewProjName('');
        setNewProjDesc('');
        setNewProjOrg('');
      } else {
        alert('Error al crear el proyecto.');
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Update project details (Capítulo inputs)
  const handleUpdateProjectDetails = async (fieldsToUpdate: Partial<Project>) => {
    if (!activeProject) return;
    try {
      const res = await fetchWithAuth(`/api/projects/${activeProject.id}`, {
        method: 'PUT',
        body: JSON.stringify(fieldsToUpdate),
      });
      if (res.ok) {
        const updated = await res.json();
        setActiveProject(updated);
        // Sync local projects list
        setProjects(projects.map(p => p.id === updated.id ? updated : p));
        setHistoryRefreshTrigger(prev => prev + 1);
      } else {
        alert('Error al guardar los cambios.');
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Delete project
  const handleDeleteProject = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este proyecto y toda su documentación de Scrum y base de datos?')) return;
    try {
      const res = await fetchWithAuth(`/api/projects/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setProjects(projects.filter(p => p.id !== id));
        if (activeProject?.id === id) {
          setActiveProject(null);
        }
      } else {
        alert('Error al eliminar el proyecto.');
      }
    } catch (error) {
      console.error(error);
    }
  };

  // --------------------------------------------------------------------------------
  // SCRUM BOARD & KANBAN ACTIONS
  // --------------------------------------------------------------------------------
  const handleAddIteration = async (iter: Partial<ScrumIteration>) => {
    if (!activeProject) return;
    try {
      const res = await fetchWithAuth(`/api/projects/${activeProject.id}/iterations`, {
        method: 'POST',
        body: JSON.stringify(iter),
      });
      if (res.ok) {
        const newIter = await res.json();
        setIterations([...iterations, newIter]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddTask = async (task: Partial<ScrumTask>) => {
    if (!activeProject) return;
    try {
      const res = await fetchWithAuth(`/api/projects/${activeProject.id}/tasks`, {
        method: 'POST',
        body: JSON.stringify(task),
      });
      if (res.ok) {
        const newTask = await res.json();
        setTasks([...tasks, newTask]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateTask = async (taskId: number, taskUpdates: Partial<ScrumTask>) => {
    if (!activeProject) return;
    try {
      const res = await fetchWithAuth(`/api/projects/${activeProject.id}/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify(taskUpdates),
      });
      if (res.ok) {
        const updated = await res.json();
        setTasks(tasks.map(t => t.id === taskId ? updated : t));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!activeProject) return;
    try {
      const res = await fetchWithAuth(`/api/projects/${activeProject.id}/tasks/${taskId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setTasks(tasks.filter(t => t.id !== taskId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // --------------------------------------------------------------------------------
  // TEST CASES ACTIONS
  // --------------------------------------------------------------------------------
  const handleAddTestCase = async (test: Partial<TestCase>) => {
    if (!activeProject) return;
    try {
      const res = await fetchWithAuth(`/api/projects/${activeProject.id}/test-cases`, {
        method: 'POST',
        body: JSON.stringify(test),
      });
      if (res.ok) {
        const newTest = await res.json();
        setTestCases([...testCases, newTest]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateTestCase = async (testId: number, testUpdates: Partial<TestCase>) => {
    if (!activeProject) return;
    try {
      const res = await fetchWithAuth(`/api/projects/${activeProject.id}/test-cases/${testId}`, {
        method: 'PUT',
        body: JSON.stringify(testUpdates),
      });
      if (res.ok) {
        const updated = await res.json();
        setTestCases(testCases.map(t => t.id === testId ? updated : t));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTestCase = async (testId: number) => {
    if (!activeProject) return;
    try {
      const res = await fetchWithAuth(`/api/projects/${activeProject.id}/test-cases/${testId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setTestCases(testCases.filter(t => t.id !== testId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // AI Test Cases generator!
  const handleAiGenerateTestCases = async () => {
    if (!activeProject) return;
    setGeneratingTests(true);
    try {
      // Get requirements list
      const rfs = JSON.parse(activeProject.functionalRequirements || '[]');
      if (rfs.length === 0) {
        alert('Debes definir al menos un Requerimiento Funcional (RF) en el Capítulo 1 antes de generar pruebas.');
        return;
      }

      // Query Gemini
      const prompt = `Genera un listado de casos de prueba académicos estructurados en formato JSON para el proyecto de Ingeniería de Software "${activeProject.name}".
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

      const res = await fetchWithAuth(`/api/projects/${activeProject.id}/ai-suggest`, {
        method: 'POST',
        body: JSON.stringify({
          section: 'Casos de Prueba (Automático)',
          currentText: '',
          prompt,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Clean the JSON string from Gemini (remove markdown block backticks if any)
      let cleanedJson = data.suggestion.trim();
      if (cleanedJson.startsWith('```json')) {
        cleanedJson = cleanedJson.substring(7);
      }
      if (cleanedJson.endsWith('```')) {
        cleanedJson = cleanedJson.substring(0, cleanedJson.length - 3);
      }
      cleanedJson = cleanedJson.trim();

      const parsedTests = JSON.parse(cleanedJson);
      
      // Batch insert or save one by one
      for (const test of parsedTests) {
        await handleAddTestCase({
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
      setGeneratingTests(false);
    }
  };

  // Document Integration Handlers
  const handleIntegrateDocument = async () => {
    if (!activeProject || !docText.trim()) return;
    setIntegratingDoc(true);
    setDocIntegrationError(null);
    setParsedDocData(null);

    try {
      const res = await fetchWithAuth(`/api/projects/${activeProject.id}/ai-integrate-doc`, {
        method: 'POST',
        body: JSON.stringify({ documentText: docText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al procesar el documento.');
      }
      setParsedDocData(data);
      setShowDocReviewModal(true);
    } catch (err: any) {
      console.error(err);
      setDocIntegrationError(err.message || 'Error de conexión con la IA.');
    } finally {
      setIntegratingDoc(false);
    }
  };

  const handleApplyParsedDoc = async (selectedFields: Record<string, boolean>) => {
    if (!activeProject || !parsedDocData) return;
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
      if (selectedFields[key] && parsedDocData[key] !== undefined) {
        const val = parsedDocData[key];
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
      await handleUpdateProjectDetails(fieldsToUpdate);
      alert('¡Documentación integrada exitosamente al proyecto!');
      setShowDocReviewModal(false);
      setDocText('');
      setDocFileName('');
      setParsedDocData(null);
    } catch (err: any) {
      alert('Error al aplicar los datos integrados: ' + err.message);
    }
  };

  // --------------------------------------------------------------------------------
  // REQUIREMENT HELPERS
  // --------------------------------------------------------------------------------
  const handleAddRf = () => {
    if (!activeProject || !newRfCode.trim() || !newRfDesc.trim()) return;
    const rfs = JSON.parse(activeProject.functionalRequirements || '[]');
    const newRf: FunctionalRequirement = {
      code: newRfCode.trim().toUpperCase(),
      desc: newRfDesc.trim(),
      priority: newRfPriority,
    };
    if (rfs.some((r: any) => r.code === newRf.code)) {
      alert('Ya existe un requerimiento con ese código.');
      return;
    }
    const updated = [...rfs, newRf];
    handleUpdateProjectDetails({ functionalRequirements: JSON.stringify(updated) });
    setNewRfCode('');
    setNewRfDesc('');
  };

  const handleDeleteRf = (code: string) => {
    if (!activeProject) return;
    const rfs = JSON.parse(activeProject.functionalRequirements || '[]');
    const updated = rfs.filter((r: any) => r.code !== code);
    handleUpdateProjectDetails({ functionalRequirements: JSON.stringify(updated) });
  };

  const handleAddRnf = () => {
    if (!activeProject || !newRnfCode.trim() || !newRnfDesc.trim()) return;
    const rnfs = JSON.parse(activeProject.nonFunctionalRequirements || '[]');
    const newRnf: NonFunctionalRequirement = {
      code: newRnfCode.trim().toUpperCase(),
      desc: newRnfDesc.trim(),
      category: newRnfCategory,
    };
    if (rnfs.some((r: any) => r.code === newRnf.code)) {
      alert('Ya existe un requerimiento con ese código.');
      return;
    }
    const updated = [...rnfs, newRnf];
    handleUpdateProjectDetails({ nonFunctionalRequirements: JSON.stringify(updated) });
    setNewRnfCode('');
    setNewRnfDesc('');
  };

  const handleDeleteRnf = (code: string) => {
    if (!activeProject) return;
    const rnfs = JSON.parse(activeProject.nonFunctionalRequirements || '[]');
    const updated = rnfs.filter((r: any) => r.code !== code);
    handleUpdateProjectDetails({ nonFunctionalRequirements: JSON.stringify(updated) });
  };

  // Helper for Bloom taxonomy or clean AI objectives
  const handleAiSuggestObjectives = () => {
    if (!activeProject) return;
    setAiModal({
      section: 'Objetivos del Proyecto',
      currentText: `Objetivo General: ${activeProject.generalObjective}\nObjetivos Específicos: ${activeProject.specificObjectives}`,
      onApply: (newText) => {
        // Simple heuristic to split text into General and Specific list
        const lines = newText.split('\n');
        let gen = activeProject.generalObjective;
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

        handleUpdateProjectDetails({
          generalObjective: gen,
          specificObjectives: JSON.stringify(specs)
        });
        setAiModal(null);
      }
    });
  };

  if (authLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Iniciando aplicación y conectando con PostgreSQL...</p>
      </div>
    );
  }

  // --------------------------------------------------------------------------------
  // LANDING PAGE (NOT LOGGED IN)
  // --------------------------------------------------------------------------------
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-xs">
        {/* Header */}
        <header className="bg-white border-b border-slate-200/80 py-2.5 px-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Layers className="w-5 h-5 text-indigo-600" />
            <span className="font-bold text-sm text-slate-800 tracking-tight">Variables + Innovación</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Curso de Ingeniería de Software</span>
        </header>

        {/* Hero Section */}
        <main className="flex-1 max-w-4xl mx-auto flex flex-col items-center justify-center text-center p-4 py-8 space-y-5">
          <div className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-100/80 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-bold">
            <Sparkles className="w-3 h-3 fill-indigo-100" />
            Full-Stack Project Hub con Node.js & PostgreSQL
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 leading-tight">
              Diseña, Planifica y Compila tus Proyectos de <span className="text-indigo-600">Ingeniería de Software</span>
            </h1>
            <p className="text-xs text-slate-500 max-w-xl mx-auto leading-relaxed">
              Crea de manera interactiva la descripción, el marco teórico, el backlog ágil con Kanban, el modelo de base de datos relacional y los casos de prueba de tus sistemas. Todo listo para exportar a informe formal.
            </p>
          </div>

          <div className="flex flex-col items-center gap-1.5 pt-2">
            <button
              onClick={handleLogin}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg transition-all shadow-sm hover:shadow-md scale-100 hover:scale-[1.01] active:scale-95 text-xs"
            >
              <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google" className="w-4 h-4 bg-white p-0.5 rounded-full" />
              Ingresar con Google Workspace
            </button>
            <span className="text-[10px] text-slate-400 font-medium">Autenticación segura federada mediante Firebase</span>
          </div>

          {/* Core Feature Bento */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-6 w-full max-w-3xl">
            <div className="bg-white border border-slate-200/80 p-3.5 rounded-lg text-left space-y-1">
              <CheckSquare className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-slate-800 text-xs">Backlog & Scrum</h3>
              <p className="text-[11px] text-slate-400 leading-normal">Planifica iteraciones por Sprint y haz seguimiento de historias con el tablero Kanban integrado.</p>
            </div>
            <div className="bg-white border border-slate-200/80 p-3.5 rounded-lg text-left space-y-1">
              <Database className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-slate-800 text-xs">Modelador Relacional</h3>
              <p className="text-[11px] text-slate-400 leading-normal">Diseña tablas interactivamente, compila scripts DDL de PostgreSQL y genera el diccionario de datos.</p>
            </div>
            <div className="bg-white border border-slate-200/80 p-3.5 rounded-lg text-left space-y-1">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-slate-800 text-xs">Copiloto IA Gemini</h3>
              <p className="text-[11px] text-slate-400 leading-normal">Utiliza el modelo avanzado gemini-3.5-flash para refinar la descripción de objetivos, alcances y pruebas.</p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-100 py-3 text-center text-[10px] text-slate-400 font-sans">
          &copy; 2026 Variables + Innovación. Todos los derechos reservados.
        </footer>
      </div>
    );
  }

  // --------------------------------------------------------------------------------
  // MAIN WORKSPACE INTERFACES (LOGGED IN)
  // --------------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans text-xs antialiased">
      
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200/80 py-2 px-4 flex items-center justify-between sticky top-0 z-40 print:hidden">
        <div
          className="flex items-center gap-1.5 cursor-pointer"
          onClick={() => setActiveProject(null)}
        >
          <Layers className="w-4 h-4 text-indigo-600" />
          <span className="font-bold text-sm text-slate-800">Variables + Innovación</span>
          <span className="bg-slate-100 border border-slate-200 text-slate-600 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold">Project Hub</span>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-medium">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-2 py-1 rounded-md text-slate-700">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="font-bold truncate max-w-[120px]">{user.email}</span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1 hover:text-red-600 font-bold text-slate-500 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Salir
          </button>
        </div>
      </header>

      {/* Main Workspace Frame */}
      {activeProject === null ? (
        // PROJECT SELECTOR DASHBOARD
        <main className="flex-1 max-w-6xl w-full mx-auto p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-none">Mis Proyectos de Ingeniería</h1>
              <p className="text-slate-400 text-[11px] mt-1">Crea, edita y compila informes metodológicos y bases de datos físicas.</p>
            </div>
            
            <button
              onClick={() => setShowCreateProject(true)}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] px-3 py-2 rounded-md transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Nuevo Proyecto
            </button>
          </div>

          {/* Loading status */}
          {loadingProjects ? (
            <div className="text-center py-16 text-slate-500 font-semibold space-y-1.5">
              <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin mx-auto" />
              <p className="text-[10px]">Consultando base de datos PostgreSQL...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center border border-dashed border-slate-200 rounded-xl py-16 px-4 space-y-3 max-w-md mx-auto mt-8">
              <Folder className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-xs">¿Listo para comenzar tu proyecto?</h3>
              <p className="text-slate-500 text-[11px] leading-normal">Crea un nuevo proyecto para comenzar a registrar los requerimientos, iteraciones ágiles, modelo entidad relación SQL e informe final.</p>
              <button
                onClick={() => setShowCreateProject(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] px-3 py-1.5 rounded-md transition-colors"
              >
                Crear mi primer proyecto
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {projects.map(p => (
                <div
                  key={p.id}
                  onClick={() => loadProjectDetails(p.id)}
                  className="bg-white border border-slate-200/80 hover:border-indigo-500 rounded-lg p-3.5 shadow-xs hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="bg-indigo-50 text-indigo-700 font-bold font-mono text-[9px] px-1.5 py-0.5 rounded">
                        PostgreSQL Activo
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(p.id);
                        }}
                        className="p-1 text-slate-300 hover:text-red-500 rounded transition-colors opacity-0 group-hover:opacity-100"
                        title="Eliminar proyecto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-left space-y-0.5">
                      <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 text-xs transition-colors leading-snug">
                        {p.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {p.description || 'Sin descripción adicional.'}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-2.5 mt-2.5 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded text-[9px]">{p.organization}</span>
                    <span className="font-mono text-[9px]">ID: {p.id}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* AI DOCUMENT INTEGRATION REVIEW DIALOG */}
          {showDocReviewModal && parsedDocData && (
            <DocReviewModal
              data={parsedDocData}
              onClose={() => setShowDocReviewModal(false)}
              onApply={handleApplyParsedDoc}
            />
          )}

          {/* CREATE PROJECT DIALOG */}
          {showCreateProject && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
                <h2 className="font-extrabold text-slate-900 text-lg">Nuevo Proyecto de Ingeniería</h2>
                <p className="text-slate-500 text-xs">Crea el contenedor virtual de base de datos relacional para guardar toda tu documentación técnica.</p>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Nombre del Software</label>
                    <input
                      type="text"
                      className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      placeholder="Ej: MedMatch Clinicas"
                      value={newProjName}
                      onChange={(e) => setNewProjName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Descripción Corta</label>
                    <textarea
                      className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none h-16 resize-none"
                      placeholder="Ej: Sistema web para agendar citas médicas e historiales."
                      value={newProjDesc}
                      onChange={(e) => setNewProjDesc(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Organización / Entorno de Estudio</label>
                    <input
                      type="text"
                      className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      placeholder="Ej: Universidad de Software, Clínica XYZ"
                      value={newProjOrg}
                      onChange={(e) => setNewProjOrg(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    onClick={() => setShowCreateProject(false)}
                    className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateProject}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-lg"
                  >
                    Crear Proyecto
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      ) : (
        // ACTIVE PROJECT EDITING WORKSPACE
        <div className="flex-1 flex flex-col md:flex-row text-xs">
          
          {/* Sidebar Navigation */}
          <aside className="w-full md:w-52 bg-white border-b md:border-b-0 md:border-r border-slate-200/80 flex flex-col justify-between shrink-0 print:hidden text-[11px]">
            <div className="p-3 space-y-3">
              {/* Back to selector */}
              <button
                onClick={() => setActiveProject(null)}
                className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-800 font-bold transition-colors"
              >
                &larr; PROYECTOS
              </button>

              {/* Active Project Title Banner */}
              <div className="border-b border-slate-100 pb-2">
                <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider font-mono block">Proyecto Activo</span>
                <h3 className="font-bold text-slate-900 text-xs truncate" title={activeProject.name}>
                  {activeProject.name}
                </h3>
                <p className="text-[10px] text-slate-400 truncate">{activeProject.organization}</p>
              </div>

              {/* Navigation Items */}
              <nav className="space-y-1">
                {[
                  { id: 'info', title: '1. Información Inicial', icon: Info },
                  { id: 'cap1', title: 'Cap. 1: Descripción', icon: BookOpen },
                  { id: 'cap2', title: 'Cap. 2 & 4: Arquitectura', icon: Layers },
                  { id: 'cap3', title: 'Cap. 3: Scrum Board', icon: CheckSquare },
                  { id: 'cap4', title: 'Cap. 4.5: Diseño DB', icon: Database },
                  { id: 'cap5', title: 'Cap. 5: Casos de Prueba', icon: Award },
                  { id: 'codigo', title: 'Código del Proyecto', icon: Code },
                  { id: 'cap6', title: 'Cap. 6 & Compilar', icon: FileText },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as any)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all text-left ${
                        activeTab === item.id
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {item.title}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200">
              <div className="flex items-center gap-2 text-indigo-700">
                <Zap className="w-4 h-4 fill-indigo-200" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Copiloto Gemini Activo</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 leading-normal">Usa los botones con destellos para solicitar ayuda o redactar objetivos profesionales.</p>
            </div>
          </aside>

          {/* Content Pane */}
          <main className="flex-1 p-6 md:p-8 overflow-y-auto print:p-0 print:overflow-visible">
            
            {/* TAB: INFO (Overview/Settings) */}
            {activeTab === 'info' && (
              <div className="space-y-6 max-w-4xl text-left">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-slate-800">1. Información del Software de Ingeniería</h2>
                  <p className="text-xs text-slate-500">Define los parámetros generales del sistema que estás documentando.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white border border-slate-200 p-6 rounded-xl">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Nombre del Software</label>
                      <input
                        type="text"
                        className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-medium"
                        value={activeProject.name}
                        onChange={(e) => handleUpdateProjectDetails({ name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Organización / Empresa</label>
                      <input
                        type="text"
                        className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        value={activeProject.organization}
                        onChange={(e) => handleUpdateProjectDetails({ organization: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Descripción General</label>
                      <textarea
                        className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none h-28 resize-none"
                        value={activeProject.description}
                        onChange={(e) => handleUpdateProjectDetails({ description: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* HISTORIAL DE CAMBIOS */}
                <ProjectChangeHistory projectId={activeProject.id} refreshTrigger={historyRefreshTrigger} />

                <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-indigo-600 fill-indigo-200 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-bold text-indigo-900 text-xs">¿Cómo funciona esta guía?</h4>
                    <p className="text-[11px] text-indigo-800 leading-relaxed">
                      Navega por cada capítulo de la barra lateral izquierda para completar los requisitos solicitados en la rúbrica del proyecto. Al finalizar, ve al último capítulo para exportar tu informe formateado bajo normativa estándar APA 7.
                    </p>
                  </div>
                </div>

                {/* AI DOCUMENT INTEGRATOR */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                  <div className="flex items-center gap-2 border-b pb-3">
                    <Sparkles className="w-5 h-5 text-indigo-600 fill-indigo-100 shrink-0" />
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-xs">Integrador Inteligente de Documentación (IA)</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Sube un archivo de tu documentación técnica ya escrita o pega el texto directamente. Nuestra IA Gemini estructurará e integrará automáticamente el contenido en todo el proyecto.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* File Upload Zone */}
                    <div 
                      className="border border-dashed border-slate-250 hover:border-indigo-400 rounded-lg p-5 text-center bg-slate-50/50 hover:bg-indigo-50/10 transition-all flex flex-col justify-center items-center cursor-pointer relative"
                      onClick={() => document.getElementById('doc-file-input')?.click()}
                    >
                      <input 
                        id="doc-file-input"
                        type="file"
                        accept=".txt,.md,.json,.html"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setDocFileName(file.name);
                            const reader = new FileReader();
                            reader.onload = (evt) => {
                              if (evt.target?.result) {
                                setDocText(evt.target.result as string);
                              }
                            };
                            reader.readAsText(file);
                          }
                        }}
                      />
                      <FileText className="w-8 h-8 text-slate-400 mb-2" />
                      <p className="text-xs font-bold text-slate-700">
                        {docFileName ? `Archivo: ${docFileName}` : 'Arrastra o selecciona tu archivo'}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">Soporta .txt, .md, .json</p>
                    </div>

                    {/* Paste text area */}
                    <div className="space-y-1 text-left flex flex-col justify-between">
                      <div className="flex-1 flex flex-col">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                          O Pega el Texto de tu Documentación
                        </label>
                        <textarea
                          placeholder="Pega aquí el contenido, actas de requerimientos, objetivos, etc..."
                          className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none flex-1 min-h-[100px] resize-none"
                          value={docText}
                          onChange={(e) => setDocText(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {docIntegrationError && (
                    <div className="flex items-start gap-1.5 text-[10px] text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-150 text-left">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{docIntegrationError}</span>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    {docText.trim() && (
                      <button
                        type="button"
                        onClick={() => {
                          setDocText('');
                          setDocFileName('');
                          setDocIntegrationError(null);
                        }}
                        className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 font-semibold"
                      >
                        Limpiar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleIntegrateDocument}
                      disabled={integratingDoc || !docText.trim()}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-xs px-4 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      {integratingDoc ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Procesando con IA...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 fill-indigo-200" />
                          Analizar e Integrar Documentación
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: CAPITULO 1 (Análisis y Descripción) */}
            {activeTab === 'cap1' && (
              <div className="space-y-6 max-w-4xl text-left">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Capítulo 1. Descripción del Proyecto</h2>
                    <p className="text-xs text-slate-500">Completa el contexto de negocio, problema, objetivos del proyecto y alcance funcional.</p>
                  </div>
                  
                  <button
                    onClick={handleAiSuggestObjectives}
                    className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs px-3 py-2 rounded-lg transition-colors border border-indigo-100"
                  >
                    <Sparkles className="w-3.5 h-3.5 fill-indigo-200" />
                    Refinar con Gemini IA
                  </button>
                </div>

                {/* Introduccion y Contexto */}
                <div className="space-y-4 bg-white border border-slate-200 p-6 rounded-xl">
                  <h3 className="font-bold text-slate-800 text-sm border-b pb-2">1.1 Introducción y Necesidades</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Contexto del Problema</label>
                        <button
                          onClick={() => setAiModal({
                            section: 'Contexto del Problema (1.1)',
                            currentText: activeProject.problemContext,
                            onApply: (t) => { handleUpdateProjectDetails({ problemContext: t }); setAiModal(null); }
                          })}
                          className="text-[10px] font-semibold text-indigo-600 flex items-center gap-0.5 hover:underline"
                        >
                          <Sparkles className="w-3 h-3" /> Redactar con IA
                        </button>
                      </div>
                      <textarea
                        className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none h-24"
                        value={activeProject.problemContext}
                        onChange={(e) => handleUpdateProjectDetails({ problemContext: e.target.value })}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Descripción de la Organización</label>
                        <button
                          onClick={() => setAiModal({
                            section: 'Descripción de la Organización (1.1)',
                            currentText: activeProject.orgDescription,
                            onApply: (t) => { handleUpdateProjectDetails({ orgDescription: t }); setAiModal(null); }
                          })}
                          className="text-[10px] font-semibold text-indigo-600 flex items-center gap-0.5 hover:underline"
                        >
                          <Sparkles className="w-3 h-3" /> Redactar con IA
                        </button>
                      </div>
                      <textarea
                        className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none h-20"
                        value={activeProject.orgDescription}
                        onChange={(e) => handleUpdateProjectDetails({ orgDescription: e.target.value })}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Necesidad Identificada</label>
                        <button
                          onClick={() => setAiModal({
                            section: 'Necesidad Identificada (1.1)',
                            currentText: activeProject.identifiedNeed,
                            onApply: (t) => { handleUpdateProjectDetails({ identifiedNeed: t }); setAiModal(null); }
                          })}
                          className="text-[10px] font-semibold text-indigo-600 flex items-center gap-0.5 hover:underline"
                        >
                          <Sparkles className="w-3 h-3" /> Redactar con IA
                        </button>
                      </div>
                      <textarea
                        className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none h-20"
                        value={activeProject.identifiedNeed}
                        onChange={(e) => handleUpdateProjectDetails({ identifiedNeed: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* El problema */}
                <div className="space-y-4 bg-white border border-slate-200 p-6 rounded-xl">
                  <h3 className="font-bold text-slate-800 text-sm border-b pb-2">1.2 Definición del Problema</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Situación Actual (Proceso Manual)</label>
                        <button
                          onClick={() => setAiModal({
                            section: 'Situación Actual (1.2)',
                            currentText: activeProject.currentSituation,
                            onApply: (t) => { handleUpdateProjectDetails({ currentSituation: t }); setAiModal(null); }
                          })}
                          className="text-[10px] font-semibold text-indigo-600 flex items-center gap-0.5 hover:underline"
                        >
                          <Sparkles className="w-3 h-3" /> Redactar con IA
                        </button>
                      </div>
                      <textarea
                        className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none h-20"
                        value={activeProject.currentSituation}
                        onChange={(e) => handleUpdateProjectDetails({ currentSituation: e.target.value })}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Problema Principal</label>
                        <button
                          onClick={() => setAiModal({
                            section: 'Problema Principal (1.2)',
                            currentText: activeProject.mainProblem,
                            onApply: (t) => { handleUpdateProjectDetails({ mainProblem: t }); setAiModal(null); }
                          })}
                          className="text-[10px] font-semibold text-indigo-600 flex items-center gap-0.5 hover:underline"
                        >
                          <Sparkles className="w-3 h-3" /> Redactar con IA
                        </button>
                      </div>
                      <textarea
                        className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none h-20"
                        value={activeProject.mainProblem}
                        onChange={(e) => handleUpdateProjectDetails({ mainProblem: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Objetivos */}
                <div className="space-y-4 bg-white border border-slate-200 p-6 rounded-xl">
                  <h3 className="font-bold text-slate-800 text-sm border-b pb-2">1.3 Objetivos Técnicos</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Objetivo General</label>
                      <input
                        type="text"
                        className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        value={activeProject.generalObjective}
                        onChange={(e) => handleUpdateProjectDetails({ generalObjective: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Objetivos Específicos</label>
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                        <ul className="list-disc pl-5 text-xs text-slate-700 space-y-1.5 font-medium">
                          {(() => {
                            try {
                              const list = JSON.parse(activeProject.specificObjectives || '[]');
                              return list.map((obj: string, i: number) => (
                                <li key={i}>{obj}</li>
                              ));
                            } catch {
                              return <li className="italic text-slate-400">Sin objetivos específicos.</li>;
                            }
                          })()}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Requerimientos Funcionales */}
                <div className="space-y-4 bg-white border border-slate-200 p-6 rounded-xl">
                  <h3 className="font-bold text-slate-800 text-sm border-b pb-2 flex items-center justify-between">
                    <span>1.4 Requerimientos Funcionales (Product Backlog)</span>
                    <button
                      onClick={() => setAiModal({
                        section: 'Requerimientos Funcionales',
                        currentText: activeProject.functionalRequirements,
                        onApply: (t) => { handleUpdateProjectDetails({ functionalRequirements: t }); setAiModal(null); }
                      })}
                      className="text-[10px] text-indigo-600 font-bold flex items-center gap-0.5 hover:underline"
                    >
                      <Sparkles className="w-3 h-3" /> Generar con IA
                    </button>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end bg-slate-50 p-4 rounded-lg">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Código</label>
                      <input
                        type="text"
                        className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white"
                        placeholder="ej: RF01"
                        value={newRfCode}
                        onChange={(e) => setNewRfCode(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Descripción del Requerimiento</label>
                      <input
                        type="text"
                        className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white"
                        placeholder="El sistema debe permitir..."
                        value={newRfDesc}
                        onChange={(e) => setNewRfDesc(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <select
                        className="w-1/2 text-xs border border-slate-200 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white"
                        value={newRfPriority}
                        onChange={(e: any) => setNewRfPriority(e.target.value)}
                      >
                        <option value="Alta">Alta</option>
                        <option value="Media">Media</option>
                        <option value="Baja">Baja</option>
                      </select>
                      <button
                        onClick={handleAddRf}
                        className="w-1/2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-1.5 rounded"
                      >
                        Añadir
                      </button>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 font-bold text-slate-500 border-b border-slate-100">
                          <th className="p-2.5 pl-4 w-20">Código</th>
                          <th className="p-2.5">Descripción del Requisito</th>
                          <th className="p-2.5 w-24">Prioridad</th>
                          <th className="p-2.5 text-right pr-4 w-16">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(() => {
                          try {
                            const rfs = JSON.parse(activeProject.functionalRequirements || '[]');
                            if (rfs.length === 0) {
                              return <tr><td colSpan={4} className="p-4 text-center italic text-slate-400">No hay requisitos registrados.</td></tr>;
                            }
                            return rfs.map((rf: any) => (
                              <tr key={rf.code} className="hover:bg-slate-50">
                                <td className="p-2.5 pl-4 font-mono font-bold text-indigo-600">{rf.code}</td>
                                <td className="p-2.5 text-slate-700">{rf.desc}</td>
                                <td className="p-2.5 font-semibold text-slate-600">{rf.priority}</td>
                                <td className="p-2.5 text-right pr-4">
                                  <button
                                    onClick={() => handleDeleteRf(rf.code)}
                                    className="text-slate-400 hover:text-red-500"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ));
                          } catch {
                            return null;
                          }
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Requerimientos NO Funcionales */}
                <div className="space-y-4 bg-white border border-slate-200 p-6 rounded-xl">
                  <h3 className="font-bold text-slate-800 text-sm border-b pb-2">1.4.1 Requerimientos No Funcionales (SLA)</h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end bg-slate-50 p-4 rounded-lg">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Código</label>
                      <input
                        type="text"
                        className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white"
                        placeholder="ej: RNF01"
                        value={newRnfCode}
                        onChange={(e) => setNewRnfCode(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Descripción</label>
                      <input
                        type="text"
                        className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white"
                        placeholder="ej: El sistema debe encriptar..."
                        value={newRnfDesc}
                        onChange={(e) => setNewRnfDesc(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <select
                        className="w-1/2 text-xs border border-slate-200 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white"
                        value={newRnfCategory}
                        onChange={(e: any) => setNewRnfCategory(e.target.value)}
                      >
                        <option value="Red">Red</option>
                        <option value="Seguridad">Seguridad</option>
                        <option value="Rendimiento">Rendimiento</option>
                        <option value="Disponibilidad">Disponibilidad</option>
                        <option value="Usabilidad">Usabilidad</option>
                      </select>
                      <button
                        onClick={handleAddRnf}
                        className="w-1/2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-1.5 rounded"
                      >
                        Añadir
                      </button>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 font-bold text-slate-500 border-b border-slate-100">
                          <th className="p-2.5 pl-4 w-20">Código</th>
                          <th className="p-2.5">Descripción del Requisito</th>
                          <th className="p-2.5 w-32">Categoría</th>
                          <th className="p-2.5 text-right pr-4 w-16">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(() => {
                          try {
                            const rnfs = JSON.parse(activeProject.nonFunctionalRequirements || '[]');
                            if (rnfs.length === 0) {
                              return <tr><td colSpan={4} className="p-4 text-center italic text-slate-400">No hay requisitos no funcionales registrados.</td></tr>;
                            }
                            return rnfs.map((rnf: any) => (
                              <tr key={rnf.code} className="hover:bg-slate-50">
                                <td className="p-2.5 pl-4 font-mono font-bold text-indigo-600">{rnf.code}</td>
                                <td className="p-2.5 text-slate-700">{rnf.desc}</td>
                                <td className="p-2.5 font-semibold text-slate-600">{rnf.category}</td>
                                <td className="p-2.5 text-right pr-4">
                                  <button
                                    onClick={() => handleDeleteRnf(rnf.code)}
                                    className="text-slate-400 hover:text-red-500"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ));
                          } catch {
                            return null;
                          }
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Alcance y Limitaciones */}
                <div className="space-y-4 bg-white border border-slate-200 p-6 rounded-xl">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="font-bold text-slate-800 text-sm">1.4.2 Alcance y Limitaciones del Proyecto</h3>
                    <button
                      onClick={() => setAiModal({
                        section: 'Alcance y Limitaciones (1.4)',
                        currentText: activeProject.scopeLimitations,
                        onApply: (t) => { handleUpdateProjectDetails({ scopeLimitations: t }); setAiModal(null); }
                      })}
                      className="text-[10px] text-indigo-600 font-bold flex items-center gap-0.5 hover:underline"
                    >
                      <Sparkles className="w-3 h-3" /> Redactar con IA
                    </button>
                  </div>
                  
                  <textarea
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none h-28"
                    value={activeProject.scopeLimitations}
                    onChange={(e) => handleUpdateProjectDetails({ scopeLimitations: e.target.value })}
                  />
                </div>

                {/* Wiki / Notas Técnicas (Capítulo 1.5) */}
                <div className="space-y-4 bg-white border border-slate-200 p-6 rounded-xl">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-indigo-600" />
                        1.5 Wiki / Notas Técnicas de Diseño
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Registra decisiones de arquitectura, patrones de diseño y notas adicionales usando formato Markdown.
                      </p>
                    </div>
                    <button
                      onClick={() => setAiModal({
                        section: 'Wiki y Decisiones de Diseño Técnico (1.5)',
                        currentText: activeProject.wikiNotes || '',
                        onApply: (t) => { handleUpdateProjectDetails({ wikiNotes: t }); setAiModal(null); }
                      })}
                      className="text-[10px] text-indigo-600 font-bold flex items-center gap-0.5 hover:underline"
                    >
                      <Sparkles className="w-3 h-3" /> Redactar con IA
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Input Editor */}
                    <div className="space-y-1.5 text-left">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Editor Markdown</label>
                      <textarea
                        className="w-full text-xs border border-slate-200 rounded-lg p-3 focus:ring-1 focus:ring-indigo-500 focus:outline-none h-80 font-mono text-slate-700 leading-relaxed"
                        placeholder="# Wiki del Proyecto\n\n### Patrón de Arquitectura\nEscribe aquí tus decisiones de diseño técnico..."
                        value={activeProject.wikiNotes || ''}
                        onChange={(e) => handleUpdateProjectDetails({ wikiNotes: e.target.value })}
                      />
                      <p className="text-[9px] text-slate-400">
                        Puedes usar `#` para títulos, `-` para viñetas, `**negrita**`, `*cursiva*` y `codigo` con acentos graves (`).
                      </p>
                    </div>

                    {/* Live Preview */}
                    <div className="space-y-1.5 text-left flex flex-col">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Vista Previa Renderizada</label>
                      <div className="flex-1 min-h-[200px] lg:h-[320px] bg-slate-50 border border-slate-200 rounded-lg p-4 overflow-y-auto">
                        <MarkdownPreview content={activeProject.wikiNotes || ''} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enlace con GitHub (Capítulo 1.6) */}
                <GithubLinker
                  project={activeProject}
                  onUpdateProject={handleUpdateProjectDetails}
                />
              </div>
            )}

            {/* TAB: CAPITULO 2 (Marco Teórico & Arquitectura) */}
            {activeTab === 'cap2' && (
              <div className="space-y-6 max-w-4xl text-left">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-slate-800">Capítulo 2 & 4. Marco Tecnológico y Arquitectura</h2>
                  <p className="text-xs text-slate-500">Configura los componentes de hardware y software y visualiza la arquitectura de tu aplicación.</p>
                </div>

                {/* Architecture Selector */}
                <div className="bg-white border border-slate-200 p-6 rounded-xl space-y-4">
                  <h3 className="font-bold text-slate-800 text-sm border-b pb-2">2.5 Estilo de Arquitectura del Software</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    {['Cliente-Servidor', 'MVC', 'Arquitectura en capas', 'Microservicios'].map(type => (
                      <div
                        key={type}
                        onClick={() => handleUpdateProjectDetails({ architectureType: type })}
                        className={`border rounded-xl p-4 text-center cursor-pointer transition-all ${
                          activeProject.architectureType === type
                            ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-1 ring-indigo-500 font-bold'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Layers className="w-5 h-5 mx-auto text-indigo-500 mb-1" />
                        <span className="text-xs">{type}</span>
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Descripción de la Arquitectura Física</label>
                    <textarea
                      className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none h-24"
                      value={activeProject.architectureDescription}
                      onChange={(e) => handleUpdateProjectDetails({ architectureDescription: e.target.value })}
                    />
                  </div>
                </div>

                {/* Architecture High-fidelity Preview Card */}
                <div className="bg-slate-900 rounded-xl p-6 text-center text-white border border-slate-800 relative overflow-hidden">
                  <h4 className="font-bold font-mono text-indigo-400 text-xs mb-6 text-left flex items-center gap-1">
                    <Layers className="w-4 h-4 text-indigo-500" />
                    Vista Física y Lógica - Estilo: {activeProject.architectureType}
                  </h4>

                  {/* Dynamic CSS Architecture Diagrams */}
                  <div className="flex flex-col md:flex-row items-center justify-center gap-6 relative z-10 text-xs font-semibold">
                    <div className="w-40 bg-indigo-950 border border-indigo-500 p-4 rounded-xl text-center space-y-2">
                      <span className="bg-indigo-600 text-[10px] px-1.5 py-0.5 rounded uppercase font-bold text-white">Presentación</span>
                      <p className="font-bold text-indigo-300 font-mono text-[10px]">{activeProject.frameworksUsed?.split(',')[0] || 'Frontend App'}</p>
                    </div>

                    <div className="text-indigo-400 font-bold text-lg rotate-90 md:rotate-0">➔</div>

                    <div className="w-40 bg-slate-950 border border-indigo-500 p-4 rounded-xl text-center space-y-2">
                      <span className="bg-indigo-600 text-[10px] px-1.5 py-0.5 rounded uppercase font-bold text-white">Lógica</span>
                      <p className="font-bold text-indigo-300 font-mono text-[10px]">Express API Route</p>
                    </div>

                    <div className="text-indigo-400 font-bold text-lg rotate-90 md:rotate-0">➔</div>

                    <div className="w-40 bg-emerald-950 border border-emerald-500 p-4 rounded-xl text-center space-y-2">
                      <span className="bg-emerald-600 text-[10px] px-1.5 py-0.5 rounded uppercase font-bold text-white">Datos</span>
                      <p className="font-bold text-emerald-300 font-mono text-[10px]">{activeProject.databasesUsed || 'PostgreSQL'}</p>
                    </div>
                  </div>
                </div>

                {/* Tech definitions */}
                <div className="bg-white border border-slate-200 p-6 rounded-xl space-y-4">
                  <h3 className="font-bold text-slate-800 text-sm border-b pb-2">2.7 Stack de Lenguajes y Gestor de Datos</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Lenguajes de Programación</label>
                      <input
                        type="text"
                        className="w-full text-xs border border-slate-200 rounded-lg p-2.5"
                        value={activeProject.languagesUsed}
                        onChange={(e) => handleUpdateProjectDetails({ languagesUsed: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Frameworks Seleccionados</label>
                      <input
                        type="text"
                        className="w-full text-xs border border-slate-200 rounded-lg p-2.5"
                        value={activeProject.frameworksUsed}
                        onChange={(e) => handleUpdateProjectDetails({ frameworksUsed: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Gestor de Base de Datos</label>
                      <input
                        type="text"
                        className="w-full text-xs border border-slate-200 rounded-lg p-2.5"
                        value={activeProject.databasesUsed}
                        onChange={(e) => handleUpdateProjectDetails({ databasesUsed: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: CAPITULO 3 (Scrum Kanban Board) */}
            {activeTab === 'cap3' && (
              <div className="space-y-6">
                {/* Embedded sub-component Kanban Board */}
                <KanbanBoard
                  projectId={activeProject.id}
                  iterations={iterations}
                  tasks={tasks}
                  functionalRequirements={JSON.parse(activeProject.functionalRequirements || '[]')}
                  onAddTask={handleAddTask}
                  onUpdateTask={handleUpdateTask}
                  onDeleteTask={handleDeleteTask}
                  onAddIteration={handleAddIteration}
                />
              </div>
            )}

            {/* TAB: CAPITULO 4.5 (Database Virtual Designer) */}
            {activeTab === 'cap4' && (
              <div className="space-y-6">
                {/* Embedded database table designer */}
                <VirtualDbDesigner
                  initialDesign={activeProject.virtualDatabaseDesign}
                  onSave={(json) => handleUpdateProjectDetails({ virtualDatabaseDesign: json })}
                />
              </div>
            )}

            {/* TAB: CAPITULO 5 (Casos de prueba & QA) */}
            {activeTab === 'cap5' && (
              <div className="space-y-6 max-w-5xl text-left">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Capítulo 5. Casos de Prueba & QA</h2>
                    <p className="text-sm text-slate-500">Genera y ejecuta escenarios de prueba académicos asociados a tus requerimientos.</p>
                  </div>

                  <button
                    onClick={handleAiGenerateTestCases}
                    disabled={generatingTests}
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                  >
                    {generatingTests ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Analizando requisitos...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                        Generar Pruebas con IA
                      </>
                    )}
                  </button>
                </div>

                {/* Interactive Test Cases list */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left list */}
                  <div className="lg:col-span-2 space-y-4">
                    {testCases.length === 0 ? (
                      <div className="text-center py-20 border border-dashed border-slate-200 bg-white rounded-xl space-y-2">
                        <Award className="w-10 h-10 text-slate-300 mx-auto" />
                        <h4 className="font-bold text-slate-700 text-sm">Sin Casos de Prueba</h4>
                        <p className="text-xs text-slate-500">Haz clic en "Generar Pruebas con IA" para que Gemini construya los casos para tus RF01, RF02, etc. automáticamente!</p>
                      </div>
                    ) : (
                      testCases.map(test => (
                        <div key={test.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-indigo-700 text-xs bg-indigo-50 border border-indigo-100 rounded px-2 py-0.5">
                              {test.code}
                            </span>
                            <div className="flex items-center gap-2">
                              <select
                                className={`text-[10px] font-bold border rounded px-2 py-0.5 focus:outline-none uppercase ${
                                  test.status === 'Passed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                  test.status === 'Failed' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                  'bg-slate-50 text-slate-500 border-slate-200'
                                }`}
                                value={test.status}
                                onChange={(e: any) => handleUpdateTestCase(test.id, { status: e.target.value })}
                              >
                                <option value="Pending">Pendiente</option>
                                <option value="Passed">Aprobado</option>
                                <option value="Failed">Fallido</option>
                              </select>
                              <button
                                onClick={() => handleDeleteTestCase(test.id)}
                                className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-1.5 text-xs text-slate-700">
                            <h4 className="font-bold text-slate-800 text-sm">{test.name}</h4>
                            <p className="text-slate-500 italic">"{test.description}"</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 font-medium">
                              <div>
                                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Pasos</span>
                                <p className="bg-slate-50 p-2 rounded whitespace-pre-line border border-slate-100">{test.steps}</p>
                              </div>
                              <div>
                                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Resultado Esperado</span>
                                <p className="bg-indigo-50/30 p-2 rounded whitespace-pre-line border border-indigo-50">{test.expectedResult}</p>
                              </div>
                            </div>

                            {/* Evidence notes */}
                            <div className="pt-2">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Notas de Evidencia / Captura</span>
                              <input
                                type="text"
                                className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                placeholder="Escribe el estado del log o la confirmación visual..."
                                value={test.evidenceNotes || ''}
                                onChange={(e) => handleUpdateTestCase(test.id, { evidenceNotes: e.target.value })}
                                onBlur={(e) => handleUpdateTestCase(test.id, { evidenceNotes: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Manual Test creation panel */}
                  <div className="lg:col-span-1">
                    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 sticky top-24">
                      <h3 className="font-bold text-slate-800 text-sm">Crear Caso Manual</h3>
                      
                      {/* We can write a simple state form here */}
                      <div className="space-y-3 text-xs">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-slate-500 font-semibold mb-1">Código</label>
                            <input id="man-code" type="text" className="w-full border border-slate-200 rounded p-1.5" placeholder="CP01" />
                          </div>
                          <div>
                            <label className="block text-slate-500 font-semibold mb-1">Requisito</label>
                            <input id="man-rf" type="text" className="w-full border border-slate-200 rounded p-1.5" placeholder="RF01" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-500 font-semibold mb-1">Nombre</label>
                          <input id="man-name" type="text" className="w-full border border-slate-200 rounded p-1.5" placeholder="ej: Validar Login" />
                        </div>

                        <div>
                          <label className="block text-slate-500 font-semibold mb-1">Pasos</label>
                          <textarea id="man-steps" className="w-full border border-slate-200 rounded p-1.5 h-16 resize-none" placeholder="1. Abrir... 2. Hacer clic..." />
                        </div>

                        <div>
                          <label className="block text-slate-500 font-semibold mb-1">Esperado</label>
                          <textarea id="man-exp" className="w-full border border-slate-200 rounded p-1.5 h-12 resize-none" placeholder="El sistema debe redireccionar..." />
                        </div>

                        <button
                          onClick={() => {
                            const code = (document.getElementById('man-code') as HTMLInputElement)?.value;
                            const name = (document.getElementById('man-name') as HTMLInputElement)?.value;
                            const rfCode = (document.getElementById('man-rf') as HTMLInputElement)?.value;
                            const steps = (document.getElementById('man-steps') as HTMLTextAreaElement)?.value;
                            const expectedResult = (document.getElementById('man-exp') as HTMLTextAreaElement)?.value;

                            if (!code || !name) {
                              alert('Código y Nombre son obligatorios.');
                              return;
                            }

                            handleAddTestCase({
                              code,
                              name,
                              rfCode,
                              steps,
                              expectedResult,
                              status: 'Pending',
                              description: 'Creado de manera manual.'
                            });

                            // clear fields
                            (document.getElementById('man-code') as HTMLInputElement).value = '';
                            (document.getElementById('man-name') as HTMLInputElement).value = '';
                            (document.getElementById('man-rf') as HTMLInputElement).value = '';
                            (document.getElementById('man-steps') as HTMLTextAreaElement).value = '';
                            (document.getElementById('man-exp') as HTMLTextAreaElement).value = '';
                          }}
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 rounded transition-colors"
                        >
                          Añadir Caso
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: CODIGO (GitHub Code Explorer) */}
            {activeTab === 'codigo' && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-slate-800">Código Fuente del Proyecto</h2>
                  <p className="text-xs text-slate-500">
                    Navega de manera interactiva por las carpetas, submódulos y código de tus repositorios de GitHub vinculados.
                  </p>
                </div>
                <GithubCodeExplorer project={activeProject} />
              </div>
            )}

            {/* TAB: CAPITULO 6 & EXPORT (Conclusiones & Export) */}
            {activeTab === 'cap6' && (
              <div className="space-y-6 max-w-5xl text-left">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-slate-800">Capítulo 6. Cierre del Proyecto & Generador</h2>
                  <p className="text-xs text-slate-500">Agrega las conclusiones y recomendaciones obtenidas, y compila el informe definitivo.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left inputs */}
                  <div className="md:col-span-1 space-y-4">
                    <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-4 text-xs">
                      <div className="flex items-center justify-between border-b pb-1.5">
                        <span className="font-bold text-slate-800">Conclusiones del Proyecto</span>
                        <button
                          onClick={() => setAiModal({
                            section: 'Conclusiones (6.1)',
                            currentText: activeProject.conclusions,
                            onApply: (t) => { handleUpdateProjectDetails({ conclusions: t }); setAiModal(null); }
                          })}
                          className="text-[10px] text-indigo-600 font-bold flex items-center gap-0.5 hover:underline"
                        >
                          <Sparkles className="w-3 h-3 animate-pulse" /> IA
                        </button>
                      </div>
                      <textarea
                        className="w-full border border-slate-200 rounded p-2 h-24"
                        value={activeProject.conclusions}
                        onChange={(e) => handleUpdateProjectDetails({ conclusions: e.target.value })}
                      />

                      <div className="flex items-center justify-between border-b pb-1.5">
                        <span className="font-bold text-slate-800">Recomendaciones</span>
                        <button
                          onClick={() => setAiModal({
                            section: 'Recomendaciones (6.2)',
                            currentText: activeProject.recommendations,
                            onApply: (t) => { handleUpdateProjectDetails({ recommendations: t }); setAiModal(null); }
                          })}
                          className="text-[10px] text-indigo-600 font-bold flex items-center gap-0.5 hover:underline"
                        >
                          <Sparkles className="w-3 h-3 animate-pulse" /> IA
                        </button>
                      </div>
                      <textarea
                        className="w-full border border-slate-200 rounded p-2 h-24"
                        value={activeProject.recommendations}
                        onChange={(e) => handleUpdateProjectDetails({ recommendations: e.target.value })}
                      />

                      <div className="flex items-center justify-between border-b pb-1.5">
                        <span className="font-bold text-slate-800">Mejoras Futuras</span>
                        <button
                          onClick={() => setAiModal({
                            section: 'Mejoras Futuras (6.3)',
                            currentText: activeProject.futureImprovements,
                            onApply: (t) => { handleUpdateProjectDetails({ futureImprovements: t }); setAiModal(null); }
                          })}
                          className="text-[10px] text-indigo-600 font-bold flex items-center gap-0.5 hover:underline"
                        >
                          <Sparkles className="w-3 h-3 animate-pulse" /> IA
                        </button>
                      </div>
                      <textarea
                        className="w-full border border-slate-200 rounded p-2 h-24"
                        value={activeProject.futureImprovements}
                        onChange={(e) => handleUpdateProjectDetails({ futureImprovements: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Right printable sheet preview */}
                  <div className="md:col-span-2">
                    <ReportExporter
                      project={activeProject}
                      iterations={iterations}
                      tasks={tasks}
                      testCases={testCases}
                    />
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>
      )}

      {/* GLOBAL AI ASSIST MODAL */}
      {aiModal && (
        <AiSuggestModal
          projectId={activeProject!.id}
          sectionName={aiModal.section}
          currentText={aiModal.currentText}
          onApply={aiModal.onApply}
          onClose={() => setAiModal(null)}
        />
      )}

    </div>
  );
}
