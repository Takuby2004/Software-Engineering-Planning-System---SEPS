import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// 1. Users Table (aligned with Firebase Auth UID)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 2. Projects Table (Capítulo 1, 2, 6, and core settings)
export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  name: text('name').notNull(),
  description: text('description'),
  organization: text('organization'),
  
  // Capítulo 1.1 Introducción
  problemContext: text('problem_context'),
  orgDescription: text('org_description'),
  identifiedNeed: text('identified_need'),
  
  // Capítulo 1.2 Problema
  currentSituation: text('current_situation'),
  mainProblem: text('main_problem'),
  
  // Capítulo 1.3 Objetivos
  generalObjective: text('general_objective'),
  specificObjectives: text('specific_objectives'), // stored as serialized string or markdown list
  
  // Capítulo 1.4 Alcance / Requerimientos
  functionalRequirements: text('functional_requirements'), // JSON string representing array of RFs
  nonFunctionalRequirements: text('non_functional_requirements'), // JSON string representing array of RNFs
  scopeLimitations: text('scope_limitations'),
  wikiNotes: text('wiki_notes'),
  githubRepos: text('github_repos'), // JSON string representing array of linked GitHub repositories
  
  // Capítulo 2.5, 2.7 & 4.1 Arquitectura y Tecnologías
  architectureType: text('architecture_type'), // e.g., 'Cliente-Servidor', 'MVC', 'Arquitectura en capas', 'Microservicios'
  architectureDescription: text('architecture_description'),
  languagesUsed: text('languages_used'),
  frameworksUsed: text('frameworks_used'),
  databasesUsed: text('databases_used'),
  
  // Capítulo 4.5 Virtual Database Design (stored as JSON)
  // Represents the entity-relationship data designed by the user, from which we can generate SQL script, DER, and Dictionary
  virtualDatabaseDesign: text('virtual_database_design'), 

  // Capítulo 6 Conclusiones y recomendaciones
  conclusions: text('conclusions'),
  recommendations: text('recommendations'),
  futureImprovements: text('future_improvements'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 3. Scrum Iterations Table (Capítulo 3.7 Planificación de iteraciones con Scrum)
export const scrumIterations = pgTable('scrum_iterations', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id')
    .references(() => projects.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(), // e.g., 'Sprint 1', 'Sprint 2'
  goal: text('goal'),
  startDate: text('start_date'),
  endDate: text('end_date'),
  status: text('status').default('Planning'), // Planning, In Progress, Completed
  createdAt: timestamp('created_at').defaultNow(),
});

// 4. Scrum Tasks Table (Capítulo 3.4/3.7 Scrum backlog and board)
export const scrumTasks = pgTable('scrum_tasks', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id')
    .references(() => projects.id, { onDelete: 'cascade' })
    .notNull(),
  iterationId: integer('iteration_id')
    .references(() => scrumIterations.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  description: text('description'),
  type: text('type').default('Feature'), // Feature, Bug, Documentation, Testing
  priority: text('priority').default('Medium'), // Low, Medium, High
  status: text('status').default('To Do'), // To Do, In Progress, Review, Done
  assignedTo: text('assigned_to'), // e.g., "Estudiante A", "Actor: Cliente"
  rfCode: text('rf_code'), // maps to functional requirement code, e.g., "RF01"
  createdAt: timestamp('created_at').defaultNow(),
});

// 5. Test Cases Table (Capítulo 5.2 / Módulo Pruebas y Evidencias)
export const testCases = pgTable('test_cases', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id')
    .references(() => projects.id, { onDelete: 'cascade' })
    .notNull(),
  code: text('code').notNull(), // e.g., "CP01"
  name: text('name').notNull(),
  description: text('description'),
  preconditions: text('preconditions'),
  steps: text('steps'),
  expectedResult: text('expected_result'),
  actualResult: text('actual_result'),
  status: text('status').default('Pending'), // Pending, Passed, Failed
  rfCode: text('rf_code'), // e.g., "RF01"
  evidenceNotes: text('evidence_notes'), // description of evidence or screenshot caption
  createdAt: timestamp('created_at').defaultNow(),
});

// 6. Project Changes Table (for tracking edits to project fields)
export const projectChanges = pgTable('project_changes', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id')
    .references(() => projects.id, { onDelete: 'cascade' })
    .notNull(),
  fieldName: text('field_name').notNull(),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  changedAt: timestamp('changed_at').defaultNow(),
});

// Relationships
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  author: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  scrumIterations: many(scrumIterations),
  scrumTasks: many(scrumTasks),
  testCases: many(testCases),
  projectChanges: many(projectChanges),
}));

export const projectChangesRelations = relations(projectChanges, ({ one }) => ({
  project: one(projects, {
    fields: [projectChanges.projectId],
    references: [projects.id],
  }),
}));

export const scrumIterationsRelations = relations(scrumIterations, ({ one, many }) => ({
  project: one(projects, {
    fields: [scrumIterations.projectId],
    references: [projects.id],
  }),
  tasks: many(scrumTasks),
}));

export const scrumTasksRelations = relations(scrumTasks, ({ one }) => ({
  project: one(projects, {
    fields: [scrumTasks.projectId],
    references: [projects.id],
  }),
  iteration: one(scrumIterations, {
    fields: [scrumTasks.iterationId],
    references: [scrumIterations.id],
  }),
}));

export const testCasesRelations = relations(testCases, ({ one }) => ({
  project: one(projects, {
    fields: [testCases.projectId],
    references: [projects.id],
  }),
}));
