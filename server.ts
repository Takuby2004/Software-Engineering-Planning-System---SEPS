import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db/index.ts';
import { projects, scrumIterations, scrumTasks, testCases, projectChanges } from './src/db/schema.ts';
import { eq, and, desc, gte } from 'drizzle-orm';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import { GoogleGenAI, Type } from '@google/genai';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// --------------------------------------------------------------------------------
// API ROUTES
// --------------------------------------------------------------------------------

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// 1. GET ALL PROJECTS (for current user)
app.get('/api/projects', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.dbUser) {
      return res.status(401).json({ error: 'User context not found' });
    }
    const userProjects = await db.select()
      .from(projects)
      .where(eq(projects.userId, req.dbUser.id));
    res.json(userProjects);
  } catch (error: any) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Database query failed', details: error.message });
  }
});

// 2. CREATE A PROJECT
app.post('/api/projects', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.dbUser) {
      return res.status(401).json({ error: 'User context not found' });
    }
    const { name, description, organization } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    // Default template for virtual database design (DER)
    const defaultDbDesign = JSON.stringify([
      { name: 'usuarios', columns: [
        { name: 'id', type: 'serial', isPk: true, isFk: false },
        { name: 'nombre', type: 'varchar(100)', isPk: false, isFk: false },
        { name: 'email', type: 'varchar(100)', isPk: false, isFk: false }
      ]},
      { name: 'tareas', columns: [
        { name: 'id', type: 'serial', isPk: true, isFk: false },
        { name: 'usuario_id', type: 'integer', isPk: false, isFk: true, fkRef: 'usuarios.id' },
        { name: 'titulo', type: 'varchar(200)', isPk: false, isFk: false },
        { name: 'completada', type: 'boolean', isPk: false, isFk: false }
      ]}
    ]);

    const result = await db.insert(projects)
      .values({
        userId: req.dbUser.id,
        name,
        description: description || '',
        organization: organization || 'Mi Organización',
        problemContext: 'Escribe aquí el contexto del problema o entorno de la organización...',
        orgDescription: 'Describe la organización donde se presenta el problema...',
        identifiedNeed: 'Identifica las necesidades tecnológicas u operacionales...',
        currentSituation: 'Describe el estado actual del proceso manual o ineficiente...',
        mainProblem: 'Define el problema principal que el software resolverá...',
        generalObjective: 'Objetivo general del software...',
        specificObjectives: JSON.stringify([
          'Objetivo específico 1: Diseñar la arquitectura...',
          'Objetivo específico 2: Desarrollar la base de datos...',
          'Objetivo específico 3: Implementar la lógica...'
        ]),
        functionalRequirements: JSON.stringify([
          { code: 'RF01', desc: 'El sistema debe permitir registrar nuevos usuarios con credenciales seguras.', priority: 'Alta' },
          { code: 'RF02', desc: 'El sistema debe permitir crear y editar proyectos de software.', priority: 'Alta' },
          { code: 'RF03', desc: 'El sistema debe permitir visualizar un tablero Scrum interactivo.', priority: 'Media' }
        ]),
        nonFunctionalRequirements: JSON.stringify([
          { code: 'RNF01', desc: 'El sistema debe responder a las peticiones en menos de 2 segundos (Rendimiento).', category: 'Rendimiento' },
          { code: 'RNF02', desc: 'El sistema debe cifrar los tokens de autenticación en tránsito (Seguridad).', category: 'Seguridad' },
          { code: 'RNF03', desc: 'La interfaz debe ser totalmente responsiva para móviles y escritorio (Usabilidad).', category: 'Usabilidad' }
        ]),
        scopeLimitations: 'Describe el alcance, limitaciones y exclusiones del proyecto...',
        architectureType: 'Cliente-Servidor',
        architectureDescription: 'Arquitectura en tres capas: Capa de Presentación (React con Tailwind), Capa de Negocio (Node.js con Express) y Capa de Datos (PostgreSQL en la nube).',
        languagesUsed: 'TypeScript, JavaScript, SQL',
        frameworksUsed: 'React, Express, Tailwind CSS, Drizzle ORM',
        databasesUsed: 'PostgreSQL (Google Cloud SQL)',
        virtualDatabaseDesign: defaultDbDesign,
        githubRepos: '[]',
        wikiNotes: '# Wiki del Proyecto y Decisiones de Diseño\n\nBienvenido a la wiki técnica del proyecto. Registra aquí las decisiones de arquitectura y diseño adicionales en formato Markdown.\n\n### 1. Decisiones de Diseño de Software\n- **Patrón de Arquitectura**: \n- **Manejo de Estado**: \n- **Estrategia de Seguridad**: \n- **Políticas de Integración**: \n\n### 2. Notas Técnicas Adicionales\n- *Escribe aquí tus apuntes sobre librerías, APIs, configuraciones de despliegue, etc.*',
        conclusions: 'Escribe las conclusiones obtenidas durante el desarrollo del proyecto...',
        recommendations: 'Escribe las recomendaciones de uso o para futuros ingenieros...',
        futureImprovements: 'Detalla las mejoras futuras sugeridas para el sistema...'
      })
      .returning();

    // Insert a default iteration (Sprint 1)
    const project = result[0];
    await db.insert(scrumIterations)
      .values({
        projectId: project.id,
        name: 'Sprint 1',
        goal: 'Establecer las bases funcionales y la base de datos del proyecto.',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 14*24*60*60*1000).toISOString().split('T')[0],
        status: 'In Progress'
      });

    res.status(201).json(project);
  } catch (error: any) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Database transaction failed', details: error.message });
  }
});

// 3. GET SPECIFIC PROJECT (complete detail with iterations, tasks, test cases)
app.get('/api/projects/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.dbUser) {
      return res.status(401).json({ error: 'User context not found' });
    }
    const projectId = parseInt(req.params.id);
    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    // Verify ownership
    const projectList = await db.select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, req.dbUser.id)));

    if (projectList.length === 0) {
      return res.status(404).json({ error: 'Project not found or unauthorized' });
    }

    const projectItem = projectList[0];

    // Fetch related iterations
    const iterations = await db.select()
      .from(scrumIterations)
      .where(eq(scrumIterations.projectId, projectId));

    // Fetch related tasks
    const tasks = await db.select()
      .from(scrumTasks)
      .where(eq(scrumTasks.projectId, projectId));

    // Fetch related test cases
    const tests = await db.select()
      .from(testCases)
      .where(eq(testCases.projectId, projectId));

    res.json({
      project: projectItem,
      iterations,
      tasks,
      testCases: tests
    });
  } catch (error: any) {
    console.error('Error fetching project detail:', error);
    res.status(500).json({ error: 'Database query failed', details: error.message });
  }
});

// 4. UPDATE PROJECT DETAILS
app.put('/api/projects/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.dbUser) {
      return res.status(401).json({ error: 'User context not found' });
    }
    const projectId = parseInt(req.params.id);
    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    // Check ownership
    const projectCheck = await db.select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, req.dbUser.id)));

    if (projectCheck.length === 0) {
      return res.status(404).json({ error: 'Project not found or unauthorized' });
    }

    const updateData = { ...req.body };
    delete updateData.id;
    delete updateData.userId;
    delete updateData.createdAt;
    
    updateData.updatedAt = new Date();

    // Track changes
    const oldProject = projectCheck[0];
    for (const key of Object.keys(updateData)) {
      if (key === 'updatedAt' || key === 'id' || key === 'userId' || key === 'createdAt') {
        continue;
      }
      const oldRaw = (oldProject as any)[key];
      const newRaw = updateData[key];
      
      const oldVal = oldRaw !== null && oldRaw !== undefined ? String(oldRaw) : '';
      const newVal = newRaw !== null && newRaw !== undefined ? String(newRaw) : '';

      if (oldVal !== newVal) {
        const fifteenSecondsAgo = new Date(Date.now() - 15000);
        try {
          const recentChange = await db.select()
            .from(projectChanges)
            .where(
              and(
                eq(projectChanges.projectId, projectId),
                eq(projectChanges.fieldName, key),
                gte(projectChanges.changedAt, fifteenSecondsAgo)
              )
            )
            .orderBy(desc(projectChanges.changedAt))
            .limit(1);

          if (recentChange.length > 0) {
            await db.update(projectChanges)
              .set({
                newValue: newVal,
                changedAt: new Date()
              })
              .where(eq(projectChanges.id, recentChange[0].id));
          } else {
            await db.insert(projectChanges)
              .values({
                projectId,
                fieldName: key,
                oldValue: oldVal,
                newValue: newVal,
                changedAt: new Date()
              });
          }
        } catch (err) {
          console.error('Error logging project change:', err);
        }
      }
    }

    const result = await db.update(projects)
      .set(updateData)
      .where(eq(projects.id, projectId))
      .returning();

    res.json(result[0]);
  } catch (error: any) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project', details: error.message });
  }
});

// GET PROJECT CHANGE HISTORY (last 5 changes)
app.get('/api/projects/:id/changes', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.dbUser) {
      return res.status(401).json({ error: 'User context not found' });
    }
    const projectId = parseInt(req.params.id);
    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    // Check ownership
    const projectCheck = await db.select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, req.dbUser.id)));

    if (projectCheck.length === 0) {
      return res.status(404).json({ error: 'Project not found or unauthorized' });
    }

    // Fetch last 5 changes
    const changes = await db.select()
      .from(projectChanges)
      .where(eq(projectChanges.projectId, projectId))
      .orderBy(desc(projectChanges.changedAt))
      .limit(5);

    res.json(changes);
  } catch (error: any) {
    console.error('Error fetching project changes:', error);
    res.status(500).json({ error: 'Failed to fetch changes', details: error.message });
  }
});

// 5. DELETE PROJECT
app.delete('/api/projects/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.dbUser) {
      return res.status(401).json({ error: 'User context not found' });
    }
    const projectId = parseInt(req.params.id);
    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    // Check ownership
    const projectCheck = await db.select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, req.dbUser.id)));

    if (projectCheck.length === 0) {
      return res.status(404).json({ error: 'Project not found or unauthorized' });
    }

    await db.delete(projects).where(eq(projects.id, projectId));
    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project', details: error.message });
  }
});

// 6. SCRUM ITERATIONS CRUD
app.post('/api/projects/:id/iterations', requireAuth, async (req: AuthRequest, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const { name, goal, startDate, endDate, status } = req.body;
    if (!name) return res.status(400).json({ error: 'Iteration name is required' });

    // Validate ownership
    const pCheck = await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.userId, req.dbUser!.id)));
    if (pCheck.length === 0) return res.status(404).json({ error: 'Project not found or unauthorized' });

    const result = await db.insert(scrumIterations)
      .values({
        projectId,
        name,
        goal: goal || '',
        startDate: startDate || '',
        endDate: endDate || '',
        status: status || 'Planning'
      })
      .returning();

    res.status(201).json(result[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/projects/:id/iterations/:iterId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const iterId = parseInt(req.params.iterId);

    const pCheck = await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.userId, req.dbUser!.id)));
    if (pCheck.length === 0) return res.status(404).json({ error: 'Project not found or unauthorized' });

    const updateData = { ...req.body };
    delete updateData.id;
    delete updateData.projectId;

    const result = await db.update(scrumIterations)
      .set(updateData)
      .where(and(eq(scrumIterations.id, iterId), eq(scrumIterations.projectId, projectId)))
      .returning();

    res.json(result[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/projects/:id/iterations/:iterId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const iterId = parseInt(req.params.iterId);

    const pCheck = await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.userId, req.dbUser!.id)));
    if (pCheck.length === 0) return res.status(404).json({ error: 'Project not found or unauthorized' });

    await db.delete(scrumIterations).where(and(eq(scrumIterations.id, iterId), eq(scrumIterations.projectId, projectId)));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 7. SCRUM TASKS CRUD
app.post('/api/projects/:id/tasks', requireAuth, async (req: AuthRequest, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const { title, description, iterationId, type, priority, status, assignedTo, rfCode } = req.body;
    if (!title) return res.status(400).json({ error: 'Task title is required' });

    const pCheck = await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.userId, req.dbUser!.id)));
    if (pCheck.length === 0) return res.status(404).json({ error: 'Project not found or unauthorized' });

    const result = await db.insert(scrumTasks)
      .values({
        projectId,
        iterationId: iterationId ? parseInt(iterationId) : null,
        title,
        description: description || '',
        type: type || 'Feature',
        priority: priority || 'Medium',
        status: status || 'To Do',
        assignedTo: assignedTo || '',
        rfCode: rfCode || ''
      })
      .returning();

    res.status(201).json(result[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/projects/:id/tasks/:taskId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const taskId = parseInt(req.params.taskId);

    const pCheck = await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.userId, req.dbUser!.id)));
    if (pCheck.length === 0) return res.status(404).json({ error: 'Project not found or unauthorized' });

    const updateData = { ...req.body };
    delete updateData.id;
    delete updateData.projectId;
    if (updateData.iterationId !== undefined) {
      updateData.iterationId = updateData.iterationId ? parseInt(updateData.iterationId) : null;
    }

    const result = await db.update(scrumTasks)
      .set(updateData)
      .where(and(eq(scrumTasks.id, taskId), eq(scrumTasks.projectId, projectId)))
      .returning();

    res.json(result[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/projects/:id/tasks/:taskId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const taskId = parseInt(req.params.taskId);

    const pCheck = await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.userId, req.dbUser!.id)));
    if (pCheck.length === 0) return res.status(404).json({ error: 'Project not found or unauthorized' });

    await db.delete(scrumTasks).where(and(eq(scrumTasks.id, taskId), eq(scrumTasks.projectId, projectId)));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 8. TEST CASES CRUD
app.post('/api/projects/:id/test-cases', requireAuth, async (req: AuthRequest, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const { code, name, description, preconditions, steps, expectedResult, actualResult, status, rfCode, evidenceNotes } = req.body;
    if (!code || !name) return res.status(400).json({ error: 'Code and Name are required' });

    const pCheck = await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.userId, req.dbUser!.id)));
    if (pCheck.length === 0) return res.status(404).json({ error: 'Project not found or unauthorized' });

    const result = await db.insert(testCases)
      .values({
        projectId,
        code,
        name,
        description: description || '',
        preconditions: preconditions || '',
        steps: steps || '',
        expectedResult: expectedResult || '',
        actualResult: actualResult || '',
        status: status || 'Pending',
        rfCode: rfCode || '',
        evidenceNotes: evidenceNotes || ''
      })
      .returning();

    res.status(201).json(result[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/projects/:id/test-cases/:testId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const testId = parseInt(req.params.testId);

    const pCheck = await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.userId, req.dbUser!.id)));
    if (pCheck.length === 0) return res.status(404).json({ error: 'Project not found or unauthorized' });

    const updateData = { ...req.body };
    delete updateData.id;
    delete updateData.projectId;

    const result = await db.update(testCases)
      .set(updateData)
      .where(and(eq(testCases.id, testId), eq(testCases.projectId, projectId)))
      .returning();

    res.json(result[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/projects/:id/test-cases/:testId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const testId = parseInt(req.params.testId);

    const pCheck = await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.userId, req.dbUser!.id)));
    if (pCheck.length === 0) return res.status(404).json({ error: 'Project not found or unauthorized' });

    await db.delete(testCases).where(and(eq(testCases.id, testId), eq(testCases.projectId, projectId)));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 9. AI SUGGESTION ENDPOINT (Using Gemini API)
app.post('/api/projects/:id/ai-suggest', requireAuth, async (req: AuthRequest, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const { section, currentText, prompt: userPrompt } = req.body;
    
    if (!section) return res.status(400).json({ error: 'Section is required' });

    const pCheck = await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.userId, req.dbUser!.id)));
    if (pCheck.length === 0) return res.status(404).json({ error: 'Project not found or unauthorized' });

    const project = pCheck[0];

    // Build model prompt based on requested section
    let systemPrompt = `Actúa como un Consultor Senior de Ingeniería de Software y Metodologías Ágiles.
Tu tarea es ayudar a un estudiante o equipo de desarrollo a mejorar, redactar o corregir la siguiente sección de su informe técnico de proyecto, siguiendo estándares profesionales (IEEE, Scrum, etc.).

Detalles del proyecto actual:
- Nombre: ${project.name}
- Descripción: ${project.description}
- Organización: ${project.organization}

Sección a redactar/mejorar: "${section}"
Texto actual de la sección:
"""
${currentText || '(Vacio)'}
"""

Instrucciones del usuario o contexto: ${userPrompt || 'Ninguno en específico.'}

Responde en español, de manera clara, concisa, profesional y estructurada. Ofrece sugerencias directamente aplicables que el usuario pueda copiar y usar. No incluyas explicaciones de relleno sobre el formato del prompt o tu rol, ve directamente al grano técnico.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: systemPrompt,
    });

    res.json({ suggestion: response.text });
  } catch (error: any) {
    console.error('Error with Gemini API:', error);
    res.status(500).json({ error: 'AI Suggestion failed. Make sure your API Key is configured in settings.', details: error.message });
  }
});

// 10. AI DOCUMENT INTEGRATION ENDPOINT
app.post('/api/projects/:id/ai-integrate-doc', requireAuth, async (req: AuthRequest, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const { documentText } = req.body;
    
    if (!documentText) return res.status(400).json({ error: 'El contenido del documento es requerido.' });

    const pCheck = await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.userId, req.dbUser!.id)));
    if (pCheck.length === 0) return res.status(404).json({ error: 'Proyecto no encontrado o no autorizado.' });

    const docSchema = {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "Nombre resumido o formal del software/sistema." },
        description: { type: Type.STRING, description: "Descripción del sistema." },
        organization: { type: Type.STRING, description: "Organización o entidad donde se aplicará." },
        problemContext: { type: Type.STRING, description: "Contexto del problema de ingeniería." },
        orgDescription: { type: Type.STRING, description: "Descripción detallada del entorno u organización." },
        identifiedNeed: { type: Type.STRING, description: "Necesidad tecnológica o de proceso identificada." },
        currentSituation: { type: Type.STRING, description: "Situación actual (cómo se realiza el proceso hoy, p. ej. manual o ineficiente)." },
        mainProblem: { type: Type.STRING, description: "Formulación del problema principal." },
        generalObjective: { type: Type.STRING, description: "Objetivo general del software usando verbos de taxonomía de Bloom (Diseñar, Desarrollar, Implementar, etc.)." },
        specificObjectives: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Objetivos específicos para lograr el objetivo general (p. ej. Analizar requisitos, Diseñar base de datos, Implementar frontend, Realizar pruebas)."
        },
        functionalRequirements: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              code: { type: Type.STRING, description: "Código secuencial, ej: RF01, RF02..." },
              desc: { type: Type.STRING, description: "Descripción detallada del requerimiento funcional." },
              priority: { type: Type.STRING, description: "Prioridad del requerimiento: Alta, Media o Baja." }
            },
            required: ["code", "desc", "priority"]
          },
          description: "Listado de requerimientos funcionales del sistema extraídos del texto."
        },
        nonFunctionalRequirements: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              code: { type: Type.STRING, description: "Código secuencial, ej: RNF01, RNF02..." },
              desc: { type: Type.STRING, description: "Descripción del requerimiento no funcional." },
              category: { type: Type.STRING, description: "Categoría: Red, Seguridad, Rendimiento, Disponibilidad o Usabilidad." }
            },
            required: ["code", "desc", "category"]
          },
          description: "Listado de requerimientos no funcionales extraídos del texto."
        },
        scopeLimitations: { type: Type.STRING, description: "Alcance y limitaciones del sistema." },
        architectureType: { type: Type.STRING, description: "Tipo de arquitectura de software, ej: Cliente-Servidor, Microservicios, Monolito..." },
        architectureDescription: { type: Type.STRING, description: "Descripción detallada de la arquitectura de software." },
        languagesUsed: { type: Type.STRING, description: "Lenguajes de programación recomendados o mencionados, ej: TypeScript, Python, SQL..." },
        frameworksUsed: { type: Type.STRING, description: "Frameworks o librerías mencionadas, ej: React, Express, NestJS..." },
        databasesUsed: { type: Type.STRING, description: "Bases de datos mencionadas o recomendadas, ej: PostgreSQL, MySQL, MongoDB..." },
        conclusions: { type: Type.STRING, description: "Conclusiones del proyecto." },
        recommendations: { type: Type.STRING, description: "Recomendaciones técnicas o del negocio." },
        futureImprovements: { type: Type.STRING, description: "Mejoras futuras para fases posteriores." }
      },
      required: ["name", "description", "problemContext", "generalObjective", "specificObjectives", "functionalRequirements", "nonFunctionalRequirements"]
    };

    const systemPrompt = `Actúa como un Analista de Requisitos y Arquitecto de Software Senior.
Analiza con precisión el siguiente documento de texto que contiene especificaciones o documentación ya redactada del proyecto.
Extrae y estructura la información correspondiente a cada uno de los campos del esquema del proyecto en español.
Si alguna sección o campo no se menciona en absoluto en el documento, infiérela de manera profesional basándote en el contexto del proyecto y el resto del documento.
No dejes campos vacíos, genera textos coherentes de Ingeniería de Software.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [
        { text: systemPrompt },
        { text: `Documento a analizar:\n"""\n${documentText}\n"""` }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: docSchema,
        temperature: 0.2
      }
    });

    const resultText = response.text || '{}';
    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.error('Error integrating document:', error);
    res.status(500).json({ error: 'Error al procesar el documento con IA.', details: error.message });
  }
});

// 11. AI GITHUB REPOSITORY INTEGRATION ENDPOINT
app.post('/api/projects/:id/ai-integrate-github', requireAuth, async (req: AuthRequest, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const { repoName, repoDesc, repoLanguage, filesList } = req.body;

    if (!repoName) return res.status(400).json({ error: 'El nombre del repositorio es requerido.' });

    const pCheck = await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.userId, req.dbUser!.id)));
    if (pCheck.length === 0) return res.status(404).json({ error: 'Proyecto no encontrado o no autorizado.' });

    const githubSchema = {
      type: Type.OBJECT,
      properties: {
        description: { type: Type.STRING, description: "Descripción técnica u operativa resumida para el proyecto basada en el repositorio." },
        languagesUsed: { type: Type.STRING, description: "Lenguajes de programación detectados, ej: TypeScript, JavaScript, HTML, CSS..." },
        frameworksUsed: { type: Type.STRING, description: "Frameworks y librerías clave detectados (ej: React, Express, Tailwind, Vite...)." },
        databasesUsed: { type: Type.STRING, description: "Bases de datos detectadas u optimizadas para este stack (ej: PostgreSQL, SQLite...)." },
        architectureType: { type: Type.STRING, description: "Tipo de arquitectura deducido (ej: Cliente-Servidor, MVC, Monolito modular...)." },
        architectureDescription: { type: Type.STRING, description: "Descripción técnica detallada de cómo está estructurado el código y los directorios de este repositorio." },
        virtualDatabaseDesign: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Nombre de la tabla de la base de datos." },
              columns: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "Nombre de la columna." },
                    type: { type: Type.STRING, description: "Tipo de dato de la columna, ej: serial, integer, varchar(100), boolean..." },
                    isPk: { type: Type.BOOLEAN, description: "True si es llave primaria (Primary Key)." },
                    isFk: { type: Type.BOOLEAN, description: "True si es llave foránea (Foreign Key)." },
                    fkRef: { type: Type.STRING, description: "Opcional. Tabla y columna de referencia si es llave foránea, ej: usuarios.id." }
                  },
                  required: ["name", "type", "isPk", "isFk"]
                }
              }
            },
            required: ["name", "columns"]
          },
          description: "Diseño lógico sugerido o derivado para la base de datos relacional PostgreSQL con tablas y columnas basadas en la estructura de archivos y directorios del repositorio de código."
        }
      },
      required: ["description", "languagesUsed", "frameworksUsed", "databasesUsed", "architectureType", "architectureDescription", "virtualDatabaseDesign"]
    };

    const systemPrompt = `Actúa como un Arquitecto de Software y Analista de Sistemas Senior.
Analiza la información proporcionada de un repositorio de GitHub para deducir y estructurar los detalles técnicos del proyecto en español.
En base al nombre, descripción, lenguaje principal y la lista de archivos/carpetas en la raíz del repositorio, describe la arquitectura técnica, los lenguajes, frameworks, bases de datos ideales para este stack, y genera un diseño lógico para la base de datos relacional PostgreSQL sugerida o derivada para este sistema.`;

    const repoContext = `Repositorio: ${repoName}
Descripción: ${repoDesc || 'Sin descripción'}
Lenguaje principal: ${repoLanguage || 'No especificado'}
Estructura de archivos y directorios:
${filesList ? filesList.join('\n') : 'No especificada'}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [
        { text: systemPrompt },
        { text: repoContext }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: githubSchema,
        temperature: 0.2
      }
    });

    const resultText = response.text || '{}';
    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.error('Error integrating GitHub repo:', error);
    res.status(500).json({ error: 'Error al analizar el repositorio de GitHub con IA.', details: error.message });
  }
});

// --------------------------------------------------------------------------------
// VITE OR STATIC SERVING MIDDLEWARE
// --------------------------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
