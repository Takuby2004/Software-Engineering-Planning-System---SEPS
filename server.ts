import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db/index.ts';
import { projects, scrumIterations, scrumTasks, testCases } from './src/db/schema.ts';
import { eq, and } from 'drizzle-orm';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import { GoogleGenAI } from '@google/genai';
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
