import React, { useState } from 'react';
import { 
  Printer, 
  BookOpen, 
  Layers, 
  CheckSquare, 
  Shield, 
  HelpCircle, 
  FileText, 
  Settings, 
  Type, 
  Palette, 
  Sliders, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  RotateCcw, 
  FileSignature, 
  Code2, 
  BookMarked,
  Search
} from 'lucide-react';
import { Project, ScrumIteration, ScrumTask, TestCase, FunctionalRequirement, NonFunctionalRequirement, DbTable } from '../types.ts';
import MarkdownPreview from './MarkdownPreview.tsx';

interface ReportExporterProps {
  project: Project;
  iterations: ScrumIteration[];
  tasks: ScrumTask[];
  testCases: TestCase[];
}

export default function ReportExporter({ project, iterations, tasks, testCases }: ReportExporterProps) {
  // Parsing utilities
  const getParsedList = (jsonStr: string | null | undefined): any[] => {
    try {
      if (!jsonStr) return [];
      return JSON.parse(jsonStr);
    } catch {
      return [];
    }
  };

  const specificObjectives: string[] = getParsedList(project.specificObjectives);
  const functionalRequirements: FunctionalRequirement[] = getParsedList(project.functionalRequirements);
  const nonFunctionalRequirements: NonFunctionalRequirement[] = getParsedList(project.nonFunctionalRequirements);
  const dbDesign: DbTable[] = getParsedList(project.virtualDatabaseDesign);

  // Formatting and Template States
  const [template, setTemplate] = useState<'academic' | 'executive' | 'technical' | 'minimal'>('academic');
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans' | 'mono' | 'georgia'>('serif');
  const [fontSize, setFontSize] = useState<'compact' | 'standard' | 'large'>('standard');
  const [lineSpacing, setLineSpacing] = useState<'single' | 'relaxed' | 'double'>('relaxed');
  const [accentColor, setAccentColor] = useState<'indigo' | 'slate' | 'teal' | 'crimson' | 'ocean'>('indigo');
  const [showCover, setShowCover] = useState<boolean>(true);
  const [alignment, setAlignment] = useState<'justify' | 'left'>('justify');
  const [numberedSections, setNumberedSections] = useState<boolean>(true);

  // Cover Page Customizer States
  const [universityName, setUniversityName] = useState('UNIVERSIDAD NACIONAL DE INGENIERÍA');
  const [facultyName, setFacultyName] = useState('FACULTAD DE INGENIERÍA DE SISTEMAS');
  const [authorName, setAuthorName] = useState('Grupo de Ingeniería de Software');
  const [showConfig, setShowConfig] = useState<boolean>(true);

  // Advanced PDF & Print Customizer States
  const [marginSize, setMarginSize] = useState<'normal' | 'compact' | 'wide'>('normal');
  const [chapterPageBreaks, setChapterPageBreaks] = useState<boolean>(true);
  const [includeHeaders, setIncludeHeaders] = useState<boolean>(true);
  const [watermarkText, setWatermarkText] = useState<string>('SEPS INFORME');
  const [customFooterText, setCustomFooterText] = useState<string>('Reporte Técnico de Ingeniería de Software');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [rfSearchQuery, setRfSearchQuery] = useState<string>('');

  const filteredFunctionalRequirements = functionalRequirements.filter(rf => {
    const query = rfSearchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      rf.code.toLowerCase().includes(query) ||
      rf.desc.toLowerCase().includes(query) ||
      (rf.priority && rf.priority.toLowerCase().includes(query))
    );
  });

  // Generate virtual SQL block
  const generateSqlScript = (): string => {
    if (dbDesign.length === 0) return '-- No se han modelado tablas.';
    let sql = ``;
    dbDesign.forEach(table => {
      sql += `CREATE TABLE "${table.name}" (\n`;
      const colLines = table.columns.map(col => {
        let line = `  "${col.name}" ${col.type.toUpperCase()}`;
        if (col.isPk) line += ' PRIMARY KEY';
        if (!col.isPk && !col.isFk) line += ' NOT NULL';
        return line;
      });
      sql += colLines.join(',\n');
      sql += `\n);\n\n`;
    });

    dbDesign.forEach(table => {
      table.columns.forEach(col => {
        if (col.isFk && col.fkRef) {
          const parts = col.fkRef.split('.');
          if (parts.length === 2) {
            sql += `ALTER TABLE "${table.name}" ADD CONSTRAINT "fk_${table.name}_${col.name}"\n  FOREIGN KEY ("${col.name}") REFERENCES "${parts[0]}"("${parts[1]}") ON DELETE CASCADE;\n\n`;
          }
        }
      });
    });
    return sql;
  };

  const handlePrint = () => {
    setIsGeneratingPdf(true);
    setGenerationStep('Analizando estructura del documento de Ingeniería de Software...');
    
    setTimeout(() => {
      setGenerationStep('Optimizando saltos de página y prevención de viudas/huérfanas...');
      
      setTimeout(() => {
        setGenerationStep('Configurando márgenes de página y escala de fuente...');
        
        setTimeout(() => {
          setGenerationStep('Renderizando cabeceras dinámicas, pie de página y marcas de agua...');
          
          setTimeout(() => {
            setGenerationStep('Lanzando motor de impresión PDF integrado...');
            
            setTimeout(() => {
              setIsGeneratingPdf(false);
              window.print();
            }, 500);
          }, 500);
        }, 500);
      }, 500);
    }, 500);
  };

  const resetSettings = () => {
    setTemplate('academic');
    setFontFamily('serif');
    setFontSize('standard');
    setLineSpacing('relaxed');
    setAccentColor('indigo');
    setShowCover(true);
    setAlignment('justify');
    setNumberedSections(true);
    setUniversityName('UNIVERSIDAD NACIONAL DE INGENIERÍA');
    setFacultyName('FACULTAD DE INGENIERÍA DE SISTEMAS');
    setAuthorName('Grupo de Ingeniería de Software');
    setMarginSize('normal');
    setChapterPageBreaks(true);
    setIncludeHeaders(true);
    setWatermarkText('SEPS INFORME');
    setCustomFooterText('Reporte Técnico de Ingeniería de Software');
  };

  // Helper to handle chapter title numbering
  const renderChapterTitle = (num: string, text: string) => {
    return numberedSections ? `Capítulo ${num}. ${text}` : text;
  };

  // Helper to handle subsection numbering
  const renderSubTitle = (num: string, text: string) => {
    return numberedSections ? `${num} ${text}` : text;
  };

  // Get font styling
  const getFontClass = () => {
    switch (fontFamily) {
      case 'sans': return 'font-sans';
      case 'mono': return 'font-mono';
      case 'georgia': return 'font-serif'; // uses inline style for Georgia
      case 'serif':
      default:
        return 'font-serif';
    }
  };

  // Get general typography inline style if Georgia is selected
  const getFontInlineStyle = () => {
    if (fontFamily === 'georgia') {
      return { fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif' };
    }
    return undefined;
  };

  // Get paragraphs alignment and size
  const getBodyTextClass = () => {
    let classes = '';
    
    // Paragraph Alignment
    if (alignment === 'justify') {
      classes += ' text-justify';
    } else {
      classes += ' text-left';
    }

    // Font Size
    if (fontSize === 'compact') {
      classes += ' text-xs leading-normal';
    } else if (fontSize === 'large') {
      classes += ' text-base leading-loose';
    } else {
      classes += ' text-sm leading-relaxed';
    }

    // Indentation based on template
    if (template === 'academic') {
      classes += ' indent-8';
    } else {
      classes += ' indent-0';
    }

    return classes;
  };

  // Get line spacing classes for container
  const getLineSpacingClass = () => {
    switch (lineSpacing) {
      case 'single': return 'leading-normal space-y-4';
      case 'double': return 'leading-loose space-y-8';
      case 'relaxed':
      default:
        return 'leading-relaxed space-y-6';
    }
  };

  // Get accent color values
  const getAccentColorClass = () => {
    switch (accentColor) {
      case 'slate': return { text: 'text-slate-900', bg: 'bg-slate-900', border: 'border-slate-900', ring: 'ring-slate-900' };
      case 'teal': return { text: 'text-teal-700', bg: 'bg-teal-700', border: 'border-teal-700', ring: 'ring-teal-700' };
      case 'crimson': return { text: 'text-rose-800', bg: 'bg-rose-800', border: 'border-rose-800', ring: 'ring-rose-800' };
      case 'ocean': return { text: 'text-sky-700', bg: 'bg-sky-700', border: 'border-sky-700', ring: 'ring-sky-700' };
      case 'indigo':
      default:
        return { text: 'text-indigo-600', bg: 'bg-indigo-600', border: 'border-indigo-600', ring: 'ring-indigo-600' };
    }
  };

  const colors = getAccentColorClass();

  // Presets mapping based on template change
  const applyTemplatePreset = (selectedTemplate: 'academic' | 'executive' | 'technical' | 'minimal') => {
    setTemplate(selectedTemplate);
    if (selectedTemplate === 'academic') {
      setFontFamily('serif');
      setFontSize('standard');
      setLineSpacing('relaxed');
      setAlignment('justify');
      setNumberedSections(true);
      setShowCover(true);
    } else if (selectedTemplate === 'executive') {
      setFontFamily('sans');
      setFontSize('standard');
      setLineSpacing('relaxed');
      setAlignment('left');
      setNumberedSections(true);
      setShowCover(true);
      setAccentColor('indigo');
    } else if (selectedTemplate === 'technical') {
      setFontFamily('sans');
      setFontSize('compact');
      setLineSpacing('single');
      setAlignment('left');
      setNumberedSections(true);
      setShowCover(true);
      setAccentColor('slate');
    } else if (selectedTemplate === 'minimal') {
      setFontFamily('sans');
      setFontSize('compact');
      setLineSpacing('single');
      setAlignment('justify');
      setNumberedSections(false);
      setShowCover(false);
    }
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Exporter Controls Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 print:hidden">
        <div>
          <h2 className="text-sm font-bold text-slate-850 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-indigo-600" />
            Compilador de Informes & Diseñador de Formatos
          </h2>
          <p className="text-[11px] text-slate-400">
            Ajusta y estiliza la estructura académica, tipografía y diseño antes de exportar el documento definitivo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold text-[10px] transition-colors"
          >
            <Settings className="w-3.5 h-3.5 animate-spin-hover" />
            {showConfig ? 'Ocultar Opciones' : 'Mostrar Diseñador'}
          </button>

          <button
            onClick={handlePrint}
            className={`flex items-center gap-1.5 text-white font-bold text-[10px] px-3.5 py-1.5 rounded-lg transition-all shadow-sm ${colors.bg} hover:brightness-110`}
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir / Exportar PDF
          </button>
        </div>
      </div>

      {/* FORMATTING & CUSTOMIZATION TOOLBAR */}
      {showConfig && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4 print:hidden text-left shadow-xs transition-all duration-300">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span className="font-extrabold text-slate-800 text-xs">Ajustes del Formato Documental</span>
            </div>
            <button
              onClick={resetSettings}
              className="text-slate-400 hover:text-slate-600 font-bold text-[9px] flex items-center gap-0.5"
              title="Restaurar valores de fábrica"
            >
              <RotateCcw className="w-3 h-3" /> Restaurar
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            
            {/* Column 1: Templates presets */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Layers className="w-3 h-3 text-indigo-500" /> Estilo de Plantilla
              </label>
              <div className="space-y-1">
                {[
                  { id: 'academic', label: 'Tesis / Académico Tradicional', desc: 'Times, sangrías, formal' },
                  { id: 'executive', label: 'Informe Corporativo / Ejecutivo', desc: 'Sans, moderno, limpio' },
                  { id: 'technical', label: 'Manual Técnico de Sistemas', desc: 'Compacto, grillas, código' },
                  { id: 'minimal', label: 'Borrador Simple y Compacto', desc: 'Ahorro de tinta, sin portada' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => applyTemplatePreset(item.id as any)}
                    className={`w-full text-left p-2 rounded-lg border transition-all text-xs flex flex-col justify-between ${
                      template === item.id 
                        ? `${colors.border} bg-white ring-1 ${colors.ring} font-bold` 
                        : 'border-slate-200 bg-white hover:bg-slate-100/50 text-slate-700'
                    }`}
                  >
                    <span className="flex items-center justify-between w-full">
                      <span>{item.label}</span>
                      {template === item.id && <Check className={`w-3 h-3 ${colors.text}`} />}
                    </span>
                    <span className="text-[9px] text-slate-400 font-normal mt-0.5">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Column 2: Typography */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Type className="w-3 h-3 text-indigo-500" /> Familia Tipográfica
                </label>
                <div className="grid grid-cols-2 gap-1">
                  {[
                    { id: 'serif', label: 'Classic Serif' },
                    { id: 'sans', label: 'Modern Sans' },
                    { id: 'mono', label: 'Tech Mono' },
                    { id: 'georgia', label: 'Georgia Serif' }
                  ].map(font => (
                    <button
                      key={font.id}
                      onClick={() => setFontFamily(font.id as any)}
                      className={`py-1 px-2 text-center rounded border text-[11px] transition-all font-semibold ${
                        fontFamily === font.id 
                          ? 'bg-slate-900 border-slate-900 text-white' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {font.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tamaño de Letra del Cuerpo</label>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { id: 'compact', label: 'Compacto' },
                    { id: 'standard', label: 'Estándar' },
                    { id: 'large', label: 'Grande' }
                  ].map(sz => (
                    <button
                      key={sz.id}
                      onClick={() => setFontSize(sz.id as any)}
                      className={`py-1 text-center rounded border text-[10px] font-bold transition-all ${
                        fontSize === sz.id 
                          ? 'bg-slate-900 border-slate-900 text-white' 
                          : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      {sz.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Alineación del Texto</label>
                <div className="grid grid-cols-2 gap-1">
                  {[
                    { id: 'justify', label: 'Justificado' },
                    { id: 'left', label: 'Alinear Izquierda' }
                  ].map(al => (
                    <button
                      key={al.id}
                      onClick={() => setAlignment(al.id as any)}
                      className={`py-1 text-center rounded border text-[10px] font-bold transition-all ${
                        alignment === al.id 
                          ? 'bg-slate-900 border-slate-900 text-white' 
                          : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      {al.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Column 3: Accents & Spacing */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Palette className="w-3 h-3 text-indigo-500" /> Color de Acento
                </label>
                <div className="grid grid-cols-5 gap-1">
                  {[
                    { id: 'indigo', color: 'bg-indigo-600' },
                    { id: 'slate', color: 'bg-slate-900' },
                    { id: 'teal', color: 'bg-teal-600' },
                    { id: 'crimson', color: 'bg-rose-800' },
                    { id: 'ocean', color: 'bg-sky-700' }
                  ].map(col => (
                    <button
                      key={col.id}
                      onClick={() => setAccentColor(col.id as any)}
                      className={`h-6 rounded border transition-all relative flex items-center justify-center ${col.color} ${
                        accentColor === col.id ? 'ring-2 ring-offset-1 ring-slate-800 border-whiteScale' : 'border-slate-200'
                      }`}
                      title={col.id}
                    >
                      {accentColor === col.id && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Interlineado (Espaciado)</label>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { id: 'single', label: 'Sencillo' },
                    { id: 'relaxed', label: '1.5 líneas' },
                    { id: 'double', label: 'Doble' }
                  ].map(line => (
                    <button
                      key={line.id}
                      onClick={() => setLineSpacing(line.id as any)}
                      className={`py-1 text-center rounded border text-[10px] font-bold transition-all ${
                        lineSpacing === line.id 
                          ? 'bg-slate-900 border-slate-900 text-white' 
                          : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      {line.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-600 cursor-pointer" htmlFor="toggle-cover">
                    Mostrar Portada de Tesis
                  </label>
                  <input
                    type="checkbox"
                    id="toggle-cover"
                    checked={showCover}
                    onChange={(e) => setShowCover(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-600 cursor-pointer" htmlFor="toggle-num">
                    Numeración de Capítulos (1.1, etc)
                  </label>
                  <input
                    type="checkbox"
                    id="toggle-num"
                    checked={numberedSections}
                    onChange={(e) => setNumberedSections(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Column 4: Personalization Cover Page */}
            <div className="space-y-2 bg-white border border-slate-200 p-3 rounded-lg">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <FileSignature className="w-3 h-3 text-indigo-500" /> Datos de Carátula
              </label>
              
              <div className="space-y-1.5">
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Universidad / Institución</span>
                  <input
                    type="text"
                    value={universityName}
                    onChange={(e) => setUniversityName(e.target.value)}
                    className="w-full text-[10px] border border-slate-200 rounded px-2 py-1 font-sans focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Universidad..."
                  />
                </div>

                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Facultad / Escuela</span>
                  <input
                    type="text"
                    value={facultyName}
                    onChange={(e) => setFacultyName(e.target.value)}
                    className="w-full text-[10px] border border-slate-200 rounded px-2 py-1 font-sans focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Facultad..."
                  />
                </div>

                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Autor (Estudiante o Grupo)</span>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full text-[10px] border border-slate-200 rounded px-2 py-1 font-sans focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Autor..."
                  />
                </div>
              </div>
            </div>

            {/* Column 5: Advanced PDF & Print Settings */}
            <div className="space-y-2 bg-white border border-slate-200 p-3 rounded-lg flex flex-col justify-between">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Printer className="w-3.5 h-3.5 text-indigo-500" /> Configuración PDF
                </label>

                <div className="space-y-2 mt-1.5">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Márgenes de PDF</span>
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { id: 'compact', label: '1.5cm' },
                        { id: 'normal', label: '2.5cm' },
                        { id: 'wide', label: '3.5cm' }
                      ].map(margin => (
                        <button
                          key={margin.id}
                          type="button"
                          onClick={() => setMarginSize(margin.id as any)}
                          className={`py-1 text-center rounded border text-[9px] font-bold transition-all ${
                            marginSize === margin.id 
                              ? 'bg-indigo-600 border-indigo-600 text-white' 
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600'
                          }`}
                        >
                          {margin.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Marca de agua en fondo</span>
                    <input
                      type="text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      className="w-full text-[10px] border border-slate-200 rounded px-2 py-1 font-sans focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="Ninguna..."
                    />
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Pie de página repetido</span>
                    <input
                      type="text"
                      value={customFooterText}
                      onChange={(e) => setCustomFooterText(e.target.value)}
                      className="w-full text-[10px] border border-slate-200 rounded px-2 py-1 font-sans focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="Reporte SEPS..."
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-1.5 border-t border-slate-100 mt-2">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] font-bold text-slate-600 cursor-pointer" htmlFor="toggle-breaks">
                    Salto por Capítulo
                  </label>
                  <input
                    type="checkbox"
                    id="toggle-breaks"
                    checked={chapterPageBreaks}
                    onChange={(e) => setChapterPageBreaks(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-[9px] font-bold text-slate-600 cursor-pointer" htmlFor="toggle-headers">
                    Cabecera & Pie Pág.
                  </label>
                  <input
                    type="checkbox"
                    id="toggle-headers"
                    checked={includeHeaders}
                    onChange={(e) => setIncludeHeaders(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* DYNAMIC STYLES AND SPECIAL PRINT/PDF GENERATOR OVERLAYS */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: ${marginSize === 'compact' ? '15mm' : marginSize === 'wide' ? '35mm' : '25mm'};
          }
          body {
            background-color: white !important;
            color: black !important;
            font-size: ${fontSize === 'compact' ? '10px' : fontSize === 'large' ? '13px' : '11px'} !important;
          }
          .print-hidden {
            display: none !important;
          }
          .break-after-page {
            page-break-after: always !important;
            break-after: page !important;
          }
          .break-before-page {
            page-break-before: always !important;
            break-before: page !important;
          }
          .break-inside-avoid {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          
          /* Running headers and footers repeated on every page */
          .print-header-repeated {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 20px;
            display: flex !important;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #cbd5e1;
            font-family: sans-serif;
            font-size: 8px;
            color: #64748b;
            padding-bottom: 4px;
            pointer-events: none;
          }
          .print-footer-repeated {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 20px;
            display: flex !important;
            justify-content: space-between;
            align-items: center;
            border-top: 1px solid #cbd5e1;
            font-family: sans-serif;
            font-size: 8px;
            color: #64748b;
            padding-top: 4px;
            pointer-events: none;
          }
          
          /* Watermark repeated in center of each page */
          .print-watermark-repeated {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-30deg);
            font-size: 65px;
            font-weight: 900;
            color: rgba(148, 163, 184, 0.08) !important;
            font-family: sans-serif;
            z-index: -1000;
            pointer-events: none;
            white-space: nowrap;
            display: block !important;
          }

          /* Adjust padding on printable page to prevent overlapping with headers/footers */
          .printable-document {
            padding-top: ${includeHeaders ? '15mm' : '0'} !important;
            padding-bottom: ${includeHeaders ? '15mm' : '0'} !important;
            border: none !important;
            box-shadow: none !important;
            max-width: 100% !important;
            width: 100% !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
          }
          
          /* Ensure headings and table headers are clean and tables don't split half-way */
          h1, h2, h3 {
            break-after: avoid !important;
            page-break-after: avoid !important;
          }
          tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          pre {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      ` }} />

      {isGeneratingPdf && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[9999] flex flex-col items-center justify-center text-white font-sans print-hidden">
          <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl max-w-md w-full text-center space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-pulse"></div>
            
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-extrabold tracking-tight">Compilador PDF Avanzado SEPS</h3>
              <p className="text-xs text-slate-400 font-medium">Generando documento con especificaciones de tesis y diseño de sistemas</p>
            </div>

            <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800">
              <p className="text-xs font-mono text-indigo-300 animate-pulse">{generationStep}</p>
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed">
              El cuadro de diálogo de impresión nativa se abrirá de inmediato. Selecciona <strong>"Guardar como PDF"</strong> como destino para generar el informe completo de alta fidelidad.
            </p>
          </div>
        </div>
      )}

      {/* DOCUMENT PREVIEW BLOCK */}
      <div 
        className={`bg-white border border-slate-200 rounded-xl shadow-lg p-8 sm:p-14 max-w-4xl mx-auto ${getFontClass()} text-slate-900 ${getLineSpacingClass()} print:border-0 print:shadow-none print:p-0 printable-document relative`}
        style={getFontInlineStyle()}
      >
        {/* Printed dynamic elements (Only displayed on print via display rules) */}
        {includeHeaders && (
          <>
            <div className="hidden print-header-repeated">
              <span>{universityName} — {facultyName}</span>
              <span className="font-bold">{project.name}</span>
            </div>
            <div className="hidden print-footer-repeated">
              <span>{customFooterText}</span>
              <span>Metodología Ágil Scrum - SEPS Project Hub</span>
            </div>
          </>
        )}
        {watermarkText && (
          <div className="hidden print-watermark-repeated">
            {watermarkText}
          </div>
        )}
        
        {/* CARATULA (TITLE PAGE) - Hide conditionally */}
        {showCover && (
          <div className="min-h-[85vh] flex flex-col justify-between text-center border-b-4 border-slate-900 pb-16 pt-10 print:min-h-0 print:h-[265mm] print:border-b-0 print:pb-0 print:pt-0 break-after-page cover-page-break">
            <div>
              <h4 className="font-sans font-bold text-base tracking-widest text-slate-600 uppercase mb-2">{universityName}</h4>
              <h5 className="font-sans font-semibold text-xs tracking-wider text-slate-500 uppercase">{facultyName}</h5>
            </div>

            <div className="space-y-4 my-12">
              <div className={`w-20 h-1 mx-auto ${colors.bg}`}></div>
              <h1 className="font-sans font-extrabold text-2xl sm:text-3xl tracking-tight text-slate-900 uppercase">
                INFORME DE INGENIERÍA DE SOFTWARE
              </h1>
              <h2 className={`font-sans font-bold ${colors.text} text-lg sm:text-xl uppercase italic`}>
                Sistema: {project.name || 'Sin nombre'}
              </h2>
              <p className="font-sans text-xs text-slate-500">Desarrollado bajo la metodología ágil Scrum</p>
            </div>

            <div className="space-y-6 text-sm">
              <div>
                <p className="font-sans font-bold text-[10px] text-slate-500 uppercase tracking-widest">Entorno / Organización</p>
                <p className="font-sans font-medium text-slate-800">{project.organization || 'Mi Organización'}</p>
              </div>
              <div>
                <p className="font-sans font-bold text-[10px] text-slate-500 uppercase tracking-widest">Autor / Estudiante</p>
                <p className="font-sans font-medium text-slate-800">{authorName}</p>
              </div>
              <div>
                <p className="font-sans font-bold text-[10px] text-slate-500 uppercase tracking-widest">Fecha de Emisión</p>
                <p className="font-sans font-medium text-slate-800">{new Date(project.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
          </div>
        )}

        {/* INDEX OF CONTENT */}
        <div className={`space-y-6 pb-6 ${chapterPageBreaks ? 'break-after-page' : 'border-b border-slate-200'}`}>
          <h2 className="font-sans font-bold text-lg text-slate-900 uppercase border-b pb-2">Índice de Contenido</h2>
          <div className="font-sans text-xs space-y-3 text-slate-600">
            <div className="flex justify-between border-b border-dotted pb-1">
              <span className="font-bold">{renderChapterTitle('1', 'Descripción del proyecto')}</span>
              <span>Pág. 01</span>
            </div>
            <div className="flex justify-between border-b border-dotted pl-4 pb-1">
              <span>{renderSubTitle('1.1', 'Introducción y Contexto')}</span>
              <span>Pág. 01</span>
            </div>
            <div className="flex justify-between border-b border-dotted pl-4 pb-1">
              <span>{renderSubTitle('1.2', 'Planteamiento del Problema')}</span>
              <span>Pág. 01</span>
            </div>
            <div className="flex justify-between border-b border-dotted pl-4 pb-1">
              <span>{renderSubTitle('1.3', 'Objetivos Generales y Específicos')}</span>
              <span>Pág. 01</span>
            </div>
            <div className="flex justify-between border-b border-dotted pl-4 pb-1">
              <span>{renderSubTitle('1.4', 'Alcance y Limitaciones')}</span>
              <span>Pág. 02</span>
            </div>
            <div className="flex justify-between border-b border-dotted pl-4 pb-1">
              <span>{renderSubTitle('1.5', 'Wiki y Notas Técnicas de Diseño')}</span>
              <span>Pág. 02</span>
            </div>
            <div className="flex justify-between border-b border-dotted pl-4 pb-1">
              <span>{renderSubTitle('1.6', 'Repositorios de Código Fuente Enlazados (GitHub)')}</span>
              <span>Pág. 02</span>
            </div>
            <div className="flex justify-between border-b border-dotted pb-1">
              <span className="font-bold">{renderChapterTitle('2', 'Marco Teórico y Tecnológico')}</span>
              <span>Pág. 02</span>
            </div>
            <div className="flex justify-between border-b border-dotted pb-1">
              <span className="font-bold">{renderChapterTitle('3', 'Análisis de Requerimientos')}</span>
              <span>Pág. 03</span>
            </div>
            <div className="flex justify-between border-b border-dotted pb-1">
              <span className="font-bold">{renderChapterTitle('4', 'Diseño del Sistema')}</span>
              <span>Pág. 04</span>
            </div>
            <div className="flex justify-between border-b border-dotted pl-4 pb-1">
              <span>{renderSubTitle('4.1', 'Arquitectura General del Sistema')}</span>
              <span>Pág. 04</span>
            </div>
            <div className="flex justify-between border-b border-dotted pl-4 pb-1">
              <span>{renderSubTitle('4.5', 'Diseño Físico de Base de Datos PostgreSQL')}</span>
              <span>Pág. 05</span>
            </div>
            <div className="flex justify-between border-b border-dotted pb-1">
              <span className="font-bold">{renderChapterTitle('5', 'Implementación y Pruebas')}</span>
              <span>Pág. 06</span>
            </div>
            <div className="flex justify-between border-b border-dotted pb-1">
              <span className="font-bold">{renderChapterTitle('6', 'Conclusiones y Recomendaciones')}</span>
              <span>Pág. 07</span>
            </div>
          </div>
        </div>

        {/* CAPITULO 1 */}
        <div className={`space-y-6 pt-6 ${chapterPageBreaks ? 'break-before-page' : 'border-t border-slate-200 mt-6 pt-6'}`}>
          <h2 className={`font-sans font-extrabold text-xl text-slate-900 border-b-2 ${colors.border} pb-2 uppercase`}>
            {renderChapterTitle('1', 'Descripción del proyecto')}
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className={`font-sans font-bold text-sm ${colors.text} uppercase tracking-wide`}>
                {renderSubTitle('1.1', 'Introducción')}
              </h3>
              <p className={getBodyTextClass()}>
                {project.problemContext}
              </p>
              <p className={getBodyTextClass()}>
                {project.orgDescription}
              </p>
              <p className={getBodyTextClass()}>
                {project.identifiedNeed}
              </p>
            </div>

            <div>
              <h3 className={`font-sans font-bold text-sm ${colors.text} uppercase tracking-wide`}>
                {renderSubTitle('1.2', 'Problema')}
              </h3>
              <p className={getBodyTextClass()}>
                <strong>Situación Actual:</strong> {project.currentSituation}
              </p>
              <p className={getBodyTextClass()}>
                <strong>Problema Principal Identificado:</strong> {project.mainProblem}
              </p>
            </div>

            <div>
              <h3 className={`font-sans font-bold text-sm ${colors.text} uppercase tracking-wide`}>
                {renderSubTitle('1.3', 'Objetivos')}
              </h3>
              <p className={getBodyTextClass()}>
                <strong>Objetivo General:</strong> {project.generalObjective}
              </p>
              <div className="mt-2 pl-8">
                <strong>Objetivos Específicos:</strong>
                <ul className="list-disc pl-4 mt-1 space-y-1 text-slate-700">
                  {specificObjectives.map((obj, i) => (
                    <li key={i}>{obj}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <h3 className={`font-sans font-bold text-sm ${colors.text} uppercase tracking-wide`}>
                {renderSubTitle('1.4', 'Alcance')}
              </h3>
              <p className={getBodyTextClass()}>
                {project.scopeLimitations}
              </p>
            </div>

            <div>
              <h3 className={`font-sans font-bold text-sm ${colors.text} mb-2 uppercase tracking-wide`}>
                {renderSubTitle('1.5', 'Wiki / Notas Técnicas de Diseño')}
              </h3>
              <div className={`border rounded-lg p-4 font-sans text-xs text-justify leading-relaxed ${
                template === 'executive' ? 'bg-indigo-50/45 border-indigo-150' : 
                template === 'technical' ? 'bg-slate-50 border-slate-300 font-mono text-[11px]' : 
                'bg-slate-50 border-slate-150'
              }`}>
                <MarkdownPreview content={project.wikiNotes || ''} />
              </div>
            </div>

            <div>
              <h3 className={`font-sans font-bold text-sm ${colors.text} mb-2 uppercase tracking-wide`}>
                {renderSubTitle('1.6', 'Repositorios de Código Fuente Enlazados (GitHub)')}
              </h3>
              <p className={getBodyTextClass()}>
                Para garantizar el soporte del ciclo de desarrollo, la integración continua y la trazabilidad del código fuente, el proyecto se encuentra enlazado formalmente con los siguientes repositorios de la plataforma GitHub:
              </p>
              {(() => {
                try {
                  const repos = JSON.parse(project.githubRepos || '[]');
                  if (repos.length === 0) {
                    return <p className="italic text-slate-400 text-xs">No se han enlazado repositorios de GitHub en esta versión del documento.</p>;
                  }
                  return (
                    <div className={`border rounded-lg overflow-hidden mt-3 ${
                      template === 'technical' ? 'border-slate-400 font-mono' : 'border-slate-200'
                    }`}>
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className={`font-bold border-b ${
                            template === 'technical' ? 'bg-slate-800 text-white border-slate-400' : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            <th className="p-2.5 pl-4 w-1/3">Repositorio</th>
                            <th className="p-2.5">Descripción</th>
                            <th className="p-2.5 w-24">Lenguaje</th>
                            <th className="p-2.5 w-20 text-center">Estrellas</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {repos.map((repo: any) => (
                            <tr key={repo.id} className="bg-white">
                              <td className={`p-2.5 pl-4 font-semibold ${colors.text}`}>
                                <a href={repo.htmlUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                  {repo.fullName}
                                </a>
                              </td>
                              <td className="p-2.5 text-slate-600 text-[11px] leading-normal">{repo.description || 'Sin descripción disponible'}</td>
                              <td className="p-2.5 text-slate-600 font-mono text-[11px]">{repo.language || 'N/A'}</td>
                              <td className="p-2.5 text-slate-600 text-center font-mono">{repo.stars}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                } catch {
                  return <p className="italic text-slate-400 text-xs text-red-500">Error al procesar la lista de repositorios enlazados.</p>;
                }
              })()}
            </div>
          </div>
        </div>

        {/* CAPITULO 2 */}
        <div className={`space-y-6 pt-6 ${chapterPageBreaks ? 'break-before-page' : 'border-t border-slate-200 mt-6 pt-6'}`}>
          <h2 className={`font-sans font-extrabold text-xl text-slate-900 border-b-2 ${colors.border} pb-2 uppercase`}>
            {renderChapterTitle('2', 'Marco Teórico y Tecnológico')}
          </h2>
          
          <div className="space-y-4">
            <h3 className={`font-sans font-bold text-sm ${colors.text} uppercase tracking-wide`}>
              {renderSubTitle('2.1', 'Ingeniería de Software y Metodología Ágil')}
            </h3>
            <p className={getBodyTextClass()}>
              Para el desarrollo del presente sistema, se seleccionó el paradigma de desarrollo ágil mediante el framework <strong>Scrum</strong>. Esta decisión permite estructurar el ciclo de vida del software en entregables rápidos e iterativos, denominados Sprints, garantizando una adaptación continua a los cambios y una comunicación constante con el cliente para mitigar riesgos tempranamente.
            </p>

            <h3 className={`font-sans font-bold text-sm ${colors.text} uppercase tracking-wide`}>
              {renderSubTitle('2.7', 'Tecnologías Utilizadas')}
            </h3>
            <p className={getBodyTextClass()}>
              Las tecnologías seleccionadas para la materialización del proyecto comprenden los siguientes estándares de la industria moderna:
            </p>
            <ul className="list-disc pl-12 text-xs sm:text-sm space-y-1.5 text-slate-700">
              <li><strong>Lenguajes de programación enlazados:</strong> {project.languagesUsed}</li>
              <li><strong>Frameworks y plataformas de software:</strong> {project.frameworksUsed}</li>
              <li><strong>Gestor y modelo de base de datos relacional:</strong> {project.databasesUsed}</li>
            </ul>
          </div>
        </div>

        {/* CAPITULO 3 */}
        <div className={`space-y-6 pt-6 ${chapterPageBreaks ? 'break-before-page' : 'border-t border-slate-200 mt-6 pt-6'}`}>
          <h2 className={`font-sans font-extrabold text-xl text-slate-900 border-b-2 ${colors.border} pb-2 uppercase`}>
            {renderChapterTitle('3', 'Análisis de Requerimientos')}
          </h2>

          <div className="space-y-6">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <h3 className={`font-sans font-bold text-sm ${colors.text} uppercase tracking-wide`}>
                  {renderSubTitle('3.4', 'Requerimientos Funcionales')}
                </h3>
                {functionalRequirements.length > 0 && (
                  <div className="relative print-hidden flex items-center w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-2 text-slate-400" />
                    <input
                      type="text"
                      value={rfSearchQuery}
                      onChange={(e) => setRfSearchQuery(e.target.value)}
                      placeholder="Buscar por código o descripción..."
                      className="w-full pl-8 pr-7 py-1 text-[11px] border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50 hover:bg-slate-100/50 transition-colors"
                    />
                    {rfSearchQuery && (
                      <button 
                        onClick={() => setRfSearchQuery('')}
                        className="absolute right-2 text-[10px] text-slate-400 hover:text-slate-600 font-bold"
                        type="button"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className={`border rounded-lg overflow-hidden font-sans text-xs ${
                template === 'technical' ? 'border-slate-400' : 'border-slate-200'
              }`}>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`font-bold border-b ${
                      template === 'technical' ? 'bg-slate-800 text-white border-slate-400' : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      <th className="p-2 w-20">Código</th>
                      <th className="p-2">Descripción del Requerimiento</th>
                      <th className="p-2 w-24">Prioridad</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredFunctionalRequirements.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-4 text-center italic text-slate-400">
                          {functionalRequirements.length === 0 
                            ? "Sin requerimientos declarados." 
                            : "No se encontraron requerimientos que coincidan con la búsqueda."}
                        </td>
                      </tr>
                    ) : (
                      filteredFunctionalRequirements.map(rf => (
                        <tr key={rf.code} className="hover:bg-slate-50/50">
                          <td className={`p-2 font-mono font-bold ${colors.text}`}>{rf.code}</td>
                          <td className="p-2 text-slate-700">{rf.desc}</td>
                          <td className="p-2 text-slate-600 font-medium">{rf.priority}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className={`font-sans font-bold text-sm ${colors.text} mb-2 uppercase tracking-wide`}>
                {renderSubTitle('3.5', 'Requerimientos No Funcionales')}
              </h3>
              <div className={`border rounded-lg overflow-hidden font-sans text-xs ${
                template === 'technical' ? 'border-slate-400' : 'border-slate-200'
              }`}>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`font-bold border-b ${
                      template === 'technical' ? 'bg-slate-800 text-white border-slate-400' : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      <th className="p-2 w-20">Código</th>
                      <th className="p-2">Descripción del Requerimiento</th>
                      <th className="p-2 w-32">Categoría</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {nonFunctionalRequirements.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-4 text-center italic text-slate-400">Sin requerimientos no funcionales.</td>
                      </tr>
                    ) : (
                      nonFunctionalRequirements.map(rnf => (
                        <tr key={rnf.code} className="hover:bg-slate-50/50">
                          <td className={`p-2 font-mono font-bold ${colors.text}`}>{rnf.code}</td>
                          <td className="p-2 text-slate-700">{rnf.desc}</td>
                          <td className="p-2 text-slate-600 font-medium">{rnf.category}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className={`font-sans font-bold text-sm ${colors.text} uppercase tracking-wide`}>
                {renderSubTitle('3.7', 'Planificación de Iteraciones con Scrum')}
              </h3>
              <p className={getBodyTextClass()}>
                De acuerdo al backlog del producto, se planificaron las siguientes iteraciones (Sprints) para gestionar y dar seguimiento al desarrollo de las funcionalidades:
              </p>
              
              <div className="mt-3 space-y-3 font-sans">
                {iterations.map(iter => {
                  const iterTasks = tasks.filter(t => t.iterationId === iter.id);
                  return (
                    <div key={iter.id} className={`p-3 border rounded-lg text-xs space-y-1.5 ${
                      template === 'executive' ? 'bg-indigo-50/30 border-indigo-100' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>{iter.name} (Fechas: {iter.startDate} - {iter.endDate})</span>
                        <span className={`font-bold ${colors.text}`}>{iter.status}</span>
                      </div>
                      <p className="text-slate-600 italic">Meta: "{iter.goal || 'Sin meta declarada.'}"</p>
                      {iterTasks.length > 0 && (
                        <div className="pt-1.5 border-t border-slate-200/60 mt-1">
                          <strong className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Tareas del Sprint:</strong>
                          <ul className="list-disc pl-4 text-[11px] text-slate-700 space-y-0.5">
                            {iterTasks.map(task => (
                              <li key={task.id}>
                                <strong>[{task.status}]</strong> {task.title} (Asignado: {task.assignedTo || 'Sin asignar'}) {task.rfCode ? ` - Requisito: ${task.rfCode}` : ''}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* CAPITULO 4 */}
        <div className={`space-y-6 pt-6 ${chapterPageBreaks ? 'break-before-page' : 'border-t border-slate-200 mt-6 pt-6'}`}>
          <h2 className={`font-sans font-extrabold text-xl text-slate-900 border-b-2 ${colors.border} pb-2 uppercase`}>
            {renderChapterTitle('4', 'Diseño del Sistema')}
          </h2>

          <div className="space-y-4">
            <div>
              <h3 className={`font-sans font-bold text-sm ${colors.text} uppercase tracking-wide`}>
                {renderSubTitle('4.1', 'Arquitectura General')}
              </h3>
              <p className={getBodyTextClass()}>
                <strong>Estilo de Arquitectura Seleccionada:</strong> {project.architectureType}
              </p>
              <p className={getBodyTextClass()}>
                {project.architectureDescription}
              </p>
            </div>

            <div>
              <h3 className={`font-sans font-bold text-sm ${colors.text} uppercase tracking-wide`}>
                {renderSubTitle('4.5', 'Diseño Físico de Base de Datos (PostgreSQL DDL)')}
              </h3>
              <p className={getBodyTextClass()}>
                A continuación se muestra el script de base de datos generado en lenguaje de definición de datos (DDL) para crear las tablas físicas relacionales en PostgreSQL, incluyendo las llaves primarias, foráneas y restricciones lógicas:
              </p>
              
              <pre className={`font-mono text-[10.5px] p-4 rounded-lg overflow-x-auto leading-relaxed border select-all ${
                template === 'technical' 
                  ? 'bg-slate-950 text-emerald-400 border-slate-800' 
                  : 'bg-slate-50 text-slate-800 border-slate-200'
              }`}>
                {generateSqlScript()}
              </pre>
            </div>

            <div>
              <h3 className={`font-sans font-bold text-sm ${colors.text} mb-2 uppercase tracking-wide`}>
                {renderSubTitle('4.5.1', 'Diccionario de Datos Físico')}
              </h3>
              {dbDesign.map(table => (
                <div key={table.name} className="space-y-1.5 mb-4">
                  <h4 className={`font-mono text-xs font-bold ${colors.text}`}>Tabla física: {table.name}</h4>
                  <div className={`border rounded-lg overflow-hidden font-sans text-xs ${
                    template === 'technical' ? 'border-slate-400' : 'border-slate-200'
                  }`}>
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className={`font-bold border-b ${
                          template === 'technical' ? 'bg-slate-800 text-white border-slate-400' : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          <th className="p-1.5 pl-3">Campo</th>
                          <th className="p-1.5">Tipo de Dato</th>
                          <th className="p-1.5">Restricciones</th>
                          <th className="p-1.5 pr-3">Descripción / Uso</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-[11px]">
                        {table.columns.map(col => (
                          <tr key={col.name} className="hover:bg-slate-50/50">
                            <td className="p-1.5 pl-3 font-mono font-bold text-slate-800">{col.name}</td>
                            <td className="p-1.5 font-mono text-slate-600">{col.type}</td>
                            <td className="p-1.5">
                              {col.isPk ? (
                                <span className="bg-amber-50 text-amber-800 border border-amber-200 px-1 py-0.2 rounded font-mono font-bold text-[9px]">PK</span>
                              ) : col.isFk ? (
                                <span className="bg-indigo-50 text-indigo-800 border border-indigo-200 px-1 py-0.2 rounded font-mono text-[9px]">FK ➔ {col.fkRef}</span>
                              ) : (
                                <span className="text-slate-400">NOT NULL</span>
                              )}
                            </td>
                            <td className="p-1.5 italic text-slate-500 pr-3">
                              {col.isPk ? `Identificador clave primaria de la tabla ${table.name}.` : 
                               col.isFk ? `Clave foránea relacional referenciando a ${col.fkRef}.` : 
                               `Almacena el valor del atributo ${col.name}.`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CAPITULO 5 */}
        <div className={`space-y-6 pt-6 ${chapterPageBreaks ? 'break-before-page' : 'border-t border-slate-200 mt-6 pt-6'}`}>
          <h2 className={`font-sans font-extrabold text-xl text-slate-900 border-b-2 ${colors.border} pb-2 uppercase`}>
            {renderChapterTitle('5', 'Implementación y Pruebas')}
          </h2>

          <div className="space-y-4">
            <h3 className={`font-sans font-bold text-sm ${colors.text} uppercase tracking-wide`}>
              {renderSubTitle('5.2', 'Casos de Prueba Ejecutados y Evidencias')}
            </h3>
            <p className={getBodyTextClass()}>
              Para garantizar que el software se comporta de acuerdo a los requerimientos funcionales aprobados por el cliente, se definieron y ejecutaron los siguientes casos de prueba en la etapa de control de calidad (QA):
            </p>

            <div className={`border rounded-lg overflow-hidden font-sans text-xs ${
              template === 'technical' ? 'border-slate-400' : 'border-slate-200'
            }`}>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`font-bold border-b ${
                    template === 'technical' ? 'bg-slate-800 text-white border-slate-400' : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    <th className="p-2 w-16 pl-3">Caso</th>
                    <th className="p-2">Nombre / Acción</th>
                    <th className="p-2">Pasos y Resultado Esperado</th>
                    <th className="p-2 w-24">Estado</th>
                    <th className="p-2 w-32 pr-3">Requisito</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {testCases.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center italic text-slate-400">No se han registrado casos de prueba todavía.</td>
                    </tr>
                  ) : (
                    testCases.map(test => (
                      <tr key={test.id} className="hover:bg-slate-50/50">
                        <td className={`p-2 pl-3 font-mono font-bold ${colors.text}`}>{test.code}</td>
                        <td className="p-2">
                          <span className="font-bold block text-slate-800">{test.name}</span>
                          <span className="text-[10px] text-slate-500 block leading-normal">{test.description}</span>
                        </td>
                        <td className="p-2 text-slate-600">
                          <span className="block"><strong>Pasos:</strong> {test.steps}</span>
                          <span className="block mt-0.5"><strong>Esperado:</strong> {test.expectedResult}</span>
                          {test.evidenceNotes && (
                            <span className="block text-slate-500 text-[10px] bg-slate-100/50 px-1.5 py-0.5 rounded mt-1">
                              <strong>Evidencia:</strong> {test.evidenceNotes}
                            </span>
                          )}
                        </td>
                        <td className="p-2 font-bold">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold inline-block ${
                            test.status === 'Passed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            test.status === 'Failed' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                            'bg-slate-50 text-slate-500 border border-slate-200'
                          }`}>
                            {test.status === 'Passed' ? 'Aprobado' : test.status === 'Failed' ? 'Fallido' : 'Pendiente'}
                          </span>
                        </td>
                        <td className="p-2 font-mono text-slate-500 pr-3 text-[10px]">{test.rfCode || 'General'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* CAPITULO 6 */}
        <div className={`space-y-6 pt-6 ${chapterPageBreaks ? 'break-before-page' : 'border-t border-slate-200 mt-6 pt-6'}`}>
          <h2 className={`font-sans font-extrabold text-xl text-slate-900 border-b-2 ${colors.border} pb-2 uppercase`}>
            {renderChapterTitle('6', 'Conclusiones y Recomendaciones')}
          </h2>

          <div className="space-y-4">
            <div>
              <h3 className={`font-sans font-bold text-sm ${colors.text} uppercase tracking-wide`}>
                {renderSubTitle('6.1', 'Conclusiones')}
              </h3>
              <p className={getBodyTextClass()}>
                {project.conclusions}
              </p>
            </div>

            <div>
              <h3 className={`font-sans font-bold text-sm ${colors.text} uppercase tracking-wide`}>
                {renderSubTitle('6.2', 'Recomendaciones')}
              </h3>
              <p className={getBodyTextClass()}>
                {project.recommendations}
              </p>
            </div>

            <div>
              <h3 className={`font-sans font-bold text-sm ${colors.text} uppercase tracking-wide`}>
                {renderSubTitle('6.3', 'Mejoras Futuras')}
              </h3>
              <p className={getBodyTextClass()}>
                {project.futureImprovements}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
