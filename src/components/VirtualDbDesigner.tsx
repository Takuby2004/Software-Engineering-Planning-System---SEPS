import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Code, Database, Eye, FileText, Settings, Key, Link2 } from 'lucide-react';
import { DbTable, DbColumn } from '../types.ts';

interface VirtualDbDesignerProps {
  initialDesign: string;
  onSave: (designJson: string) => void;
}

export default function VirtualDbDesigner({ initialDesign, onSave }: VirtualDbDesignerProps) {
  const [tables, setTables] = useState<DbTable[]>([]);
  const [activeTab, setActiveTab] = useState<'der' | 'sql' | 'dict'>('der');
  
  // States for adding table/columns
  const [newTableName, setNewTableName] = useState('');
  const [editingTableIndex, setEditingTableIndex] = useState<number | null>(null);

  // States for new column form
  const [newColName, setNewColName] = useState('');
  const [newColType, setNewColType] = useState('varchar(100)');
  const [newColIsPk, setNewColIsPk] = useState(false);
  const [newColIsFk, setNewColIsFk] = useState(false);
  const [newColFkRef, setNewColFkRef] = useState('');

  useEffect(() => {
    try {
      if (initialDesign) {
        setTables(JSON.parse(initialDesign));
      } else {
        setTables([]);
      }
    } catch (e) {
      console.error('Error parsing initial database design:', e);
      setTables([]);
    }
  }, [initialDesign]);

  const saveChanges = (updatedTables: DbTable[]) => {
    setTables(updatedTables);
    onSave(JSON.stringify(updatedTables));
  };

  // ER Diagram layout and dragging states
  const [tablePositions, setTablePositions] = useState<Record<string, { x: number; y: number }>>({});
  const [draggingTable, setDraggingTable] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hoveredConnection, setHoveredConnection] = useState<number | null>(null);

  // Automatically arrange tables on initial load or change
  useEffect(() => {
    if (tables.length === 0) return;
    setTablePositions(prev => {
      const updated = { ...prev };
      let changed = false;
      tables.forEach((table, index) => {
        if (!updated[table.name]) {
          // Grid arrangement: 3 tables per row
          const col = index % 3;
          const row = Math.floor(index / 3);
          updated[table.name] = {
            x: col * 290 + 40,
            y: row * 240 + 40,
          };
          changed = true;
        }
      });
      return changed ? updated : prev;
    });
  }, [tables]);

  const resetLayout = () => {
    const updated: Record<string, { x: number; y: number }> = {};
    tables.forEach((table, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      updated[table.name] = {
        x: col * 290 + 40,
        y: row * 240 + 40,
      };
    });
    setTablePositions(updated);
  };

  const handleMouseDown = (tableName: string, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    const currentPos = tablePositions[tableName] || { x: 0, y: 0 };
    setDraggingTable(tableName);
    setDragOffset({
      x: e.clientX - currentPos.x,
      y: e.clientY - currentPos.y,
    });
  };

  const handleContainerMouseMove = (e: React.MouseEvent) => {
    if (!draggingTable) return;
    const newX = Math.max(10, Math.min(1500, e.clientX - dragOffset.x));
    const newY = Math.max(10, Math.min(1000, e.clientY - dragOffset.y));

    setTablePositions(prev => ({
      ...prev,
      [draggingTable]: { x: newX, y: newY },
    }));
  };

  const handleContainerMouseUp = () => {
    setDraggingTable(null);
  };

  interface Connection {
    fromTable: string;
    fromColumn: string;
    fromColIndex: number;
    toTable: string;
    toColumn: string;
    toColIndex: number;
  }

  const getConnections = (): Connection[] => {
    const list: Connection[] = [];
    tables.forEach((table) => {
      table.columns.forEach((col, colIdx) => {
        if (col.isFk && col.fkRef) {
          const parts = col.fkRef.split('.');
          if (parts.length === 2) {
            const targetTableName = parts[0];
            const targetColName = parts[1];
            
            // Find target table and column index
            const targetTableIdx = tables.findIndex(t => t.name === targetTableName);
            if (targetTableIdx !== -1) {
              const targetColIdx = tables[targetTableIdx].columns.findIndex(c => c.name === targetColName);
              list.push({
                fromTable: table.name,
                fromColumn: col.name,
                fromColIndex: colIdx,
                toTable: targetTableName,
                toColumn: targetColName,
                toColIndex: targetColIdx !== -1 ? targetColIdx : 0
              });
            }
          }
        }
      });
    });
    return list;
  };

  const getConnectorPoints = (
    posA: { x: number; y: number },
    idxA: number,
    posB: { x: number; y: number },
    idxB: number
  ) => {
    const tableWidth = 256;
    const headerHeight = 36;
    const rowHeight = 21; // Adjusted spacing for list rows
    
    // Middle of rows
    const yA = posA.y + headerHeight + (idxA * rowHeight) + 12;
    const yB = posB.y + headerHeight + (idxB * rowHeight) + 12;
    
    let xA = 0;
    let xB = 0;
    
    // Connect closest edges horizontally
    if (posA.x + tableWidth < posB.x) {
      xA = posA.x + tableWidth;
      xB = posB.x;
    } else if (posB.x + tableWidth < posA.x) {
      xA = posA.x;
      xB = posB.x + tableWidth;
    } else {
      if (posA.x < posB.x) {
        xA = posA.x + tableWidth;
        xB = posB.x;
      } else {
        xA = posA.x;
        xB = posB.x + tableWidth;
      }
    }
    
    return { xA, yA, xB, yB };
  };

  const handleAddTable = () => {
    if (!newTableName.trim()) return;
    const cleanName = newTableName.trim().toLowerCase().replace(/\s+/g, '_');
    if (tables.some(t => t.name === cleanName)) {
      alert('Ya existe una tabla con ese nombre.');
      return;
    }
    const updated = [...tables, { name: cleanName, columns: [] }];
    saveChanges(updated);
    setNewTableName('');
  };

  const handleDeleteTable = (index: number) => {
    if (!confirm('¿Estás seguro de eliminar esta tabla?')) return;
    const updated = tables.filter((_, i) => i !== index);
    saveChanges(updated);
    if (editingTableIndex === index) {
      setEditingTableIndex(null);
    }
  };

  const handleAddColumn = (tableIndex: number) => {
    if (!newColName.trim()) return;
    const cleanColName = newColName.trim().toLowerCase().replace(/\s+/g, '_');
    const table = tables[tableIndex];
    if (table.columns.some(c => c.name === cleanColName)) {
      alert('Ya existe una columna con ese nombre en esta tabla.');
      return;
    }

    const newColumn: DbColumn = {
      name: cleanColName,
      type: newColType,
      isPk: newColIsPk,
      isFk: newColIsFk,
      fkRef: newColIsFk ? newColFkRef : undefined,
    };

    const updatedTables = [...tables];
    updatedTables[tableIndex].columns.push(newColumn);
    saveChanges(updatedTables);

    // Reset column form
    setNewColName('');
    setNewColType('varchar(100)');
    setNewColIsPk(false);
    setNewColIsFk(false);
    setNewColFkRef('');
  };

  const handleDeleteColumn = (tableIndex: number, colIndex: number) => {
    const updatedTables = [...tables];
    updatedTables[tableIndex].columns = updatedTables[tableIndex].columns.filter((_, i) => i !== colIndex);
    saveChanges(updatedTables);
  };

  // SQL DDL Generator
  const generateSql = (): string => {
    if (tables.length === 0) return '-- No hay tablas definidas en el modelo todavía.';
    let sql = `-- SCRIPT DE CREACION FISICA - POSTGRESQL\n-- Generado automáticamente por SEPS Project Hub\n\n`;
    
    // Create Tables
    tables.forEach(table => {
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

    // Create Foreign Key Constraints
    let hasFks = false;
    tables.forEach(table => {
      table.columns.forEach(col => {
        if (col.isFk && col.fkRef) {
          const parts = col.fkRef.split('.');
          if (parts.length === 2) {
            hasFks = true;
            const refTable = parts[0];
            const refCol = parts[1];
            sql += `ALTER TABLE "${table.name}" \n  ADD CONSTRAINT "fk_${table.name}_${col.name}" \n  FOREIGN KEY ("col.name") REFERENCES "${refTable}"("${refCol}") ON DELETE CASCADE;\n\n`;
          }
        }
      });
    });

    if (!hasFks) {
      sql += `-- No se detectaron claves foráneas adicionales para referenciar.`;
    }

    return sql;
  };

  // Get list of potential FK targets (primary keys of other tables)
  const getFkTargets = (): string[] => {
    const targets: string[] = [];
    tables.forEach(table => {
      table.columns.forEach(col => {
        if (col.isPk) {
          targets.push(`${table.name}.${col.name}`);
        }
      });
    });
    return targets;
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Designer Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-sm font-bold text-slate-850 flex items-center gap-1.5">
            <Database className="w-4 h-4 text-indigo-600" />
            Modelador de Base de Datos Relacional (PostgreSQL)
          </h2>
          <p className="text-[11px] text-slate-400">
            Diseña tus tablas interactivamente para generar el Diagrama ER, Script SQL y el Diccionario de Datos.
          </p>
        </div>

        <div className="flex bg-slate-100 rounded-md p-0.5">
          <button
            onClick={() => setActiveTab('der')}
            className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
              activeTab === 'der' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Diagrama DER
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
              activeTab === 'sql' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            Script SQL
          </button>
          <button
            onClick={() => setActiveTab('dict')}
            className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
              activeTab === 'dict' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Diccionario de Datos
          </button>
        </div>
      </div>

      {/* Main Designer Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Side: Tables List & Editor Control */}
        <div className="lg:col-span-1 space-y-3">
          <div className="bg-white rounded-lg shadow-xs border border-slate-200 p-3">
            <h3 className="font-bold text-slate-800 text-xs mb-2 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-emerald-500" />
              Agregar Nueva Tabla
            </h3>
            <div className="space-y-1.5">
              <input
                type="text"
                className="w-full text-xs border border-slate-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Nombre de tabla (ej: clientes)"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTable()}
              />
              <button
                onClick={handleAddTable}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-1.5 rounded-md transition-colors"
              >
                Agregar Tabla
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-xs border border-slate-200 p-3">
            <h3 className="font-bold text-slate-800 text-xs mb-2">
              Tablas del Modelo ({tables.length})
            </h3>
            {tables.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic">No hay tablas creadas.</p>
            ) : (
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {tables.map((table, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-1.5 rounded-md text-xs cursor-pointer transition-colors ${
                      editingTableIndex === index ? 'bg-indigo-50 border border-indigo-100/50 text-indigo-900 font-bold' : 'hover:bg-slate-50 text-slate-600'
                    }`}
                    onClick={() => setEditingTableIndex(index)}
                  >
                    <span className="truncate flex items-center gap-1">
                      <Database className="w-3 h-3 text-indigo-400" />
                      {table.name}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTable(index);
                      }}
                      className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Tab View Container */}
        <div className="lg:col-span-3 space-y-4">
          {activeTab === 'der' && (
            <div className="space-y-4">
              {/* If editing a table, show the Column Editor */}
              {editingTableIndex !== null && tables[editingTableIndex] && (
                <div className="bg-slate-50 rounded-xl border border-indigo-100 p-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                    <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                      <Settings className="w-4 h-4 text-indigo-600" />
                      Campos de la Tabla: <span className="font-mono text-indigo-600 font-bold">"{tables[editingTableIndex].name}"</span>
                    </h4>
                    <button
                      onClick={() => setEditingTableIndex(null)}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                    >
                      Cerrar Editor
                    </button>
                  </div>

                  {/* Add Column Form */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nombre</label>
                      <input
                        type="text"
                        className="w-full text-xs border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                        placeholder="id, nombre, etc."
                        value={newColName}
                        onChange={(e) => setNewColName(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tipo de Dato</label>
                      <select
                        className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                        value={newColType}
                        onChange={(e) => setNewColType(e.target.value)}
                      >
                        <option value="serial">SERIAL</option>
                        <option value="integer">INTEGER</option>
                        <option value="varchar(100)">VARCHAR(100)</option>
                        <option value="varchar(255)">VARCHAR(255)</option>
                        <option value="text">TEXT</option>
                        <option value="boolean">BOOLEAN</option>
                        <option value="timestamp">TIMESTAMP</option>
                        <option value="numeric">NUMERIC</option>
                      </select>
                    </div>

                    <div className="flex gap-4 items-center h-9">
                      <label className="flex items-center gap-1 text-xs cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={newColIsPk}
                          onChange={(e) => {
                            setNewColIsPk(e.target.checked);
                            if (e.target.checked) setNewColIsFk(false);
                          }}
                        />
                        🔑 PK
                      </label>
                      <label className="flex items-center gap-1 text-xs cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={newColIsFk}
                          onChange={(e) => {
                            setNewColIsFk(e.target.checked);
                            if (e.target.checked) setNewColIsPk(false);
                          }}
                        />
                        🔗 FK
                      </label>
                    </div>

                    <div>
                      <button
                        onClick={() => handleAddColumn(editingTableIndex!)}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs py-2 rounded-lg transition-colors"
                      >
                        Añadir Campo
                      </button>
                    </div>
                  </div>

                  {/* FK Reference selector if FK checked */}
                  {newColIsFk && (
                    <div className="bg-amber-50/50 border border-amber-100 p-2.5 rounded-lg flex items-center gap-3">
                      <span className="text-xs text-amber-800 flex items-center gap-1">
                        <Link2 className="w-3.5 h-3.5" /> Referencia Clave Foránea:
                      </span>
                      <select
                        className="text-xs border border-slate-200 roundedpx-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        value={newColFkRef}
                        onChange={(e) => setNewColFkRef(e.target.value)}
                      >
                        <option value="">-- Selecciona campo destino PK --</option>
                        {getFkTargets().map(target => (
                          <option key={target} value={target}>{target}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Columns List */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                          <th className="p-2.5 pl-4">Columna</th>
                          <th className="p-2.5">Tipo</th>
                          <th className="p-2.5">Atributos</th>
                          <th className="p-2.5 text-right pr-4">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                        {tables[editingTableIndex].columns.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-4 text-center text-slate-400 italic">No hay columnas creadas todavía.</td>
                          </tr>
                        ) : (
                          tables[editingTableIndex].columns.map((col, colIdx) => (
                            <tr key={colIdx} className="hover:bg-slate-50">
                              <td className="p-2.5 pl-4 font-mono font-medium">{col.name}</td>
                              <td className="p-2.5 font-mono text-slate-500">{col.type}</td>
                              <td className="p-2.5 flex items-center gap-1.5 h-9">
                                {col.isPk && (
                                  <span className="bg-amber-50 text-amber-700 border border-amber-200 rounded-md px-1.5 py-0.5 text-[10px] font-bold flex items-center gap-0.5">
                                    <Key className="w-3 h-3" /> PK
                                  </span>
                                )}
                                {col.isFk && (
                                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md px-1.5 py-0.5 text-[10px] font-bold flex items-center gap-0.5">
                                    <Link2 className="w-3 h-3" /> FK ➔ {col.fkRef}
                                  </span>
                                )}
                                {!col.isPk && !col.isFk && <span className="text-slate-400 text-[10px]">NOT NULL</span>}
                              </td>
                              <td className="p-2.5 text-right pr-4">
                                <button
                                  onClick={() => handleDeleteColumn(editingTableIndex!, colIdx)}
                                  className="text-slate-400 hover:text-red-500 p-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Controls bar for the ER Diagram */}
              {tables.length > 0 && (
                <div className="flex items-center justify-between bg-slate-800/80 p-3 border border-slate-700/60 rounded-xl text-slate-200">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-indigo-400" />
                    <span className="text-[10px] text-slate-300 font-medium">
                      Arrastra los encabezados para organizar tu base de datos relacional. Se detectaron <strong className="text-indigo-400">{getConnections().length} relaciones</strong>.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={resetLayout}
                    className="px-3 py-1 text-[10px] font-bold bg-slate-900 hover:bg-slate-750 border border-slate-700 text-slate-200 hover:text-white rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                  >
                    Restaurar Distribución
                  </button>
                </div>
              )}

              {/* Graphical DER Panel (Interactive Canvas) */}
              <div 
                className="w-full h-[520px] overflow-auto border border-slate-800 bg-slate-950 rounded-xl relative select-none der-container scrollbar-thin scrollbar-thumb-slate-800"
                onMouseMove={handleContainerMouseMove}
                onMouseUp={handleContainerMouseUp}
                onMouseLeave={handleContainerMouseUp}
              >
                {tables.length === 0 ? (
                  <div className="absolute inset-0 flex flex-col justify-center items-center text-center text-slate-500 p-8 space-y-2">
                    <Database className="w-12 h-12 text-slate-600 animate-bounce" />
                    <h5 className="font-bold text-slate-300">Diagrama de Entidad Relación Vacío</h5>
                    <p className="text-xs max-w-sm">Usa la barra lateral izquierda para crear tablas e ingresar sus columnas correspondientes.</p>
                  </div>
                ) : (
                  <div className="w-[1600px] h-[1000px] relative bg-slate-950/80">
                    {/* Grid Blueprint Wallpaper */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1.5px,transparent_1.5px),linear-gradient(to_bottom,#1e293b_1.5px,transparent_1.5px)] bg-[size:28px_28px] opacity-25 pointer-events-none"></div>
                    
                    {/* SVG Connector layer */}
                    <svg className="absolute inset-0 pointer-events-none w-full h-full z-0">
                      <defs>
                        {/* Crow's Foot / N-side (FK) relation marker */}
                        <marker
                          id="crow-many"
                          markerWidth="12"
                          markerHeight="12"
                          refX="2"
                          refY="6"
                          orient="auto-start-reverse"
                        >
                          <path d="M 12 1 L 1 6 L 12 11" fill="none" stroke="#6366f1" strokeWidth="1.5" />
                          <line x1="8" y1="1" x2="8" y2="11" stroke="#6366f1" strokeWidth="1" />
                        </marker>
                        
                        {/* One-side (PK) relation marker */}
                        <marker
                          id="crow-one"
                          markerWidth="12"
                          markerHeight="12"
                          refX="10"
                          refY="6"
                          orient="auto-start-reverse"
                        >
                          <line x1="4" y1="1" x2="4" y2="11" stroke="#fbbf24" strokeWidth="2" />
                          <line x1="8" y1="1" x2="8" y2="11" stroke="#fbbf24" strokeWidth="2" />
                        </marker>
                      </defs>

                      {getConnections().map((c, idx) => {
                        const posA = tablePositions[c.fromTable] || { x: 40, y: 40 };
                        const posB = tablePositions[c.toTable] || { x: 40, y: 40 };

                        const { xA, yA, xB, yB } = getConnectorPoints(posA, c.fromColIndex, posB, c.toColIndex);

                        const dx = Math.abs(xB - xA);
                        const controlOffset = Math.max(60, dx * 0.45);

                        const cp1X = xA === posA.x + 256 ? xA + controlOffset : xA - controlOffset;
                        const cp2X = xB === posB.x + 256 ? xB + controlOffset : xB - controlOffset;

                        const pathData = `M ${xA} ${yA} C ${cp1X} ${yA}, ${cp2X} ${yB}, ${xB} ${yB}`;
                        const isHovered = hoveredConnection === idx;
                        const anyHovered = hoveredConnection !== null;

                        return (
                          <g key={idx}>
                            {/* Invisible fat line for easier hovering */}
                            <path
                              d={pathData}
                              fill="none"
                              stroke="transparent"
                              strokeWidth="12"
                              className="cursor-pointer pointer-events-auto"
                              onMouseEnter={() => setHoveredConnection(idx)}
                              onMouseLeave={() => setHoveredConnection(null)}
                            />
                            {/* Visual line */}
                            <path
                              d={pathData}
                              fill="none"
                              stroke={isHovered ? '#818cf8' : anyHovered ? '#1e293b' : '#6366f1'}
                              strokeWidth={isHovered ? 2.5 : 1.5}
                              markerStart="url(#crow-many)"
                              markerEnd="url(#crow-one)"
                              className="transition-all duration-150"
                            />
                          </g>
                        );
                      })}
                    </svg>

                    {/* Table boxes */}
                    {tables.map((table, tIdx) => {
                      const pos = tablePositions[table.name] || { x: 50 + tIdx * 280, y: 50 };
                      const isEditing = editingTableIndex === tIdx;

                      return (
                        <div
                          key={tIdx}
                          style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
                          className={`w-64 bg-slate-950 border rounded-xl shadow-2xl overflow-hidden absolute z-10 transition-shadow duration-150 ${
                            isEditing 
                              ? 'border-indigo-500 ring-2 ring-indigo-500/40 shadow-indigo-500/10' 
                              : 'border-slate-800 hover:border-slate-700 hover:shadow-slate-900/40'
                          }`}
                          onClick={() => setEditingTableIndex(tIdx)}
                        >
                          {/* Table Drag Handle Header */}
                          <div 
                            onMouseDown={(e) => handleMouseDown(table.name, e)}
                            className="bg-slate-900/90 px-3.5 py-2.5 border-b border-slate-800 flex items-center justify-between cursor-grab active:cursor-grabbing select-none hover:bg-slate-800/80 transition-colors"
                          >
                            <span className="font-mono text-xs font-extrabold text-indigo-400 flex items-center gap-1.5 truncate" title={table.name}>
                              <Database className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
                              {table.name}
                            </span>
                            <span className="text-[9px] font-mono font-bold bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
                              {table.columns.length} campos
                            </span>
                          </div>

                          {/* Columns Rows */}
                          <div className="p-1.5 space-y-0.5 bg-slate-950/40">
                            {table.columns.length === 0 ? (
                              <div className="text-center py-5 text-[10px] text-slate-600 italic">
                                Sin campos. Haz clic para agregar.
                              </div>
                            ) : (
                              table.columns.map((col, cIdx) => (
                                <div 
                                  key={cIdx} 
                                  className="flex items-center justify-between text-[11px] h-[21px] px-2 font-mono text-slate-300 hover:bg-slate-900/50 rounded transition-colors"
                                >
                                  <span className="flex items-center gap-1 truncate font-medium">
                                    {col.isPk && <Key className="w-3 h-3 text-amber-400 shrink-0" />}
                                    {col.isFk && <Link2 className="w-3 h-3 text-emerald-400 shrink-0" />}
                                    <span className={col.isPk ? 'text-amber-300 font-bold' : col.isFk ? 'text-emerald-300 font-medium' : 'text-slate-300'}>
                                      {col.name}
                                    </span>
                                  </span>
                                  <span className="text-slate-500 text-[9px] uppercase tracking-tight shrink-0 font-bold">{col.type}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'sql' && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-indigo-400 font-mono flex items-center gap-1.5">
                  <Code className="w-4 h-4" /> postgresql_schema.sql
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generateSql());
                    alert('Script copiado al portapapeles!');
                  }}
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg transition-colors font-semibold"
                >
                  Copiar Código
                </button>
              </div>
              <pre className="font-mono text-xs text-slate-300 p-4 bg-slate-950 overflow-x-auto max-h-96 leading-relaxed select-all">
                {generateSql()}
              </pre>
            </div>
          )}

          {activeTab === 'dict' && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-6">
              <h3 className="font-semibold text-slate-800 text-base border-b border-slate-100 pb-2">
                Diccionario de Datos del Proyecto (Estándar Académico)
              </h3>
              
              {tables.length === 0 ? (
                <p className="text-sm text-slate-400 italic text-center py-10">Crea tablas para generar el diccionario de datos.</p>
              ) : (
                <div className="space-y-6">
                  {tables.map((table, tIdx) => (
                    <div key={tIdx} className="space-y-2">
                      <h4 className="font-mono text-sm font-bold text-indigo-600 flex items-center gap-1.5">
                        <Database className="w-4 h-4" /> Tabla: {table.name}
                      </h4>
                      <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 font-bold text-slate-600 border-b border-slate-200">
                              <th className="p-2.5 w-1/4">Campo</th>
                              <th className="p-2.5 w-1/5">Tipo de Dato</th>
                              <th className="p-2.5 w-1/4">Restricciones (Constraints)</th>
                              <th className="p-2.5 w-1/3">Descripción del Campo</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 text-slate-700">
                            {table.columns.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="p-3 text-center text-slate-400 italic">No hay campos en esta tabla.</td>
                              </tr>
                            ) : (
                              table.columns.map((col, cIdx) => (
                                <tr key={cIdx}>
                                  <td className="p-2.5 font-mono font-bold text-indigo-900">{col.name}</td>
                                  <td className="p-2.5 font-mono text-slate-600">{col.type.toUpperCase()}</td>
                                  <td className="p-2.5 font-sans font-medium">
                                    {col.isPk && 'Primary Key (Clave Primaria)'}
                                    {col.isFk && `Foreign Key (Clave Foránea) referencias ${col.fkRef}`}
                                    {!col.isPk && !col.isFk && 'NOT NULL'}
                                  </td>
                                  <td className="p-2.5 font-sans italic text-slate-500">
                                    {col.isPk ? `Identificador único para la tabla ${table.name}.` : 
                                     col.isFk ? `Llave relacional asociada con la tabla "${col.fkRef?.split('.')[0]}".` : 
                                     `Almacena el valor de ${col.name} para cada registro.`}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
