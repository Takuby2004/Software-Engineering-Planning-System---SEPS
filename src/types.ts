export interface User {
  id: number;
  uid: string;
  email: string;
  createdAt: string;
}

export interface Project {
  id: number;
  userId: number;
  name: string;
  description: string;
  organization: string;
  
  // Capítulo 1
  problemContext: string;
  orgDescription: string;
  identifiedNeed: string;
  currentSituation: string;
  mainProblem: string;
  
  // Capítulo 1.3 & 1.4
  generalObjective: string;
  specificObjectives: string; // JSON array of strings
  functionalRequirements: string; // JSON array of FunctionalRequirement
  nonFunctionalRequirements: string; // JSON array of NonFunctionalRequirement
  scopeLimitations: string;
  wikiNotes: string;
  githubRepos: string; // JSON array of GithubRepo

  // Capítulo 2 & 4.1
  architectureType: string;
  architectureDescription: string;
  languagesUsed: string;
  frameworksUsed: string;
  databasesUsed: string;
  
  // Capítulo 4.5 Virtual Database Design
  virtualDatabaseDesign: string; // JSON array of DbTable

  // Capítulo 6
  conclusions: string;
  recommendations: string;
  futureImprovements: string;

  createdAt: string;
  updatedAt: string;
}

export interface FunctionalRequirement {
  code: string;
  desc: string;
  priority: 'Alta' | 'Media' | 'Baja';
}

export interface NonFunctionalRequirement {
  code: string;
  desc: string;
  category: 'Red' | 'Seguridad' | 'Rendimiento' | 'Disponibilidad' | 'Usabilidad';
}

export interface DbColumn {
  name: string;
  type: string;
  isPk: boolean;
  isFk: boolean;
  fkRef?: string; // format: "tablename.columnname"
}

export interface DbTable {
  name: string;
  columns: DbColumn[];
}

export interface ScrumIteration {
  id: number;
  projectId: number;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  status: 'Planning' | 'In Progress' | 'Completed';
  createdAt: string;
}

export interface ScrumTask {
  id: number;
  projectId: number;
  iterationId: number | null;
  title: string;
  description: string;
  type: 'Feature' | 'Bug' | 'Documentation' | 'Testing';
  priority: 'Low' | 'Medium' | 'High';
  status: 'To Do' | 'In Progress' | 'Review' | 'Done';
  assignedTo: string;
  rfCode: string; // maps to RF code e.g. "RF01"
  createdAt: string;
}

export interface TestCase {
  id: number;
  projectId: number;
  code: string; // e.g. "CP01"
  name: string;
  description: string;
  preconditions: string;
  steps: string;
  expectedResult: string;
  actualResult: string;
  status: 'Pending' | 'Passed' | 'Failed';
  rfCode: string; // maps to RF code
  evidenceNotes: string;
  createdAt: string;
}

export interface GithubRepo {
  id: number;
  name: string;
  fullName: string;
  htmlUrl: string;
  description: string | null;
  stars: number;
  language: string | null;
  linkedAt: string;
}

