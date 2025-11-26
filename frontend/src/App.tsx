import { useState, useMemo, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { api, type CalculationResponse } from './api';
import { useTreeSitter, treeSitterPlugin, myHighlightStyle, dslAutocomplete, extractInputDeclarations } from './useTreeSitter';
import { syntaxHighlighting } from '@codemirror/language';
import { InputGrid, type InputRow } from './InputGrid';
import { GraphVisualization } from './GraphVisualization';
import { ChartsTab } from './components/charts/ChartsTab';
import { HelpPanel } from './components/HelpPanel';
import { AIGenerator } from './components/AIGenerator';
import { formatNumber, parseFormattedNumber } from './utils/formatting';

const STORAGE_KEY_SOURCE = 'costforecast_source';
const STORAGE_KEY_INPUTS = 'costforecast_inputs';
const STORAGE_KEY_RESULT = 'costforecast_result';

const DEFAULT_SOURCE = `
qty: Param
price: Param
row_total = qty * price

items = Input("items")
tax_rate = Input("tax_rate")

item_totals = Range(items, row_total)

subtotal = SUM(item_totals)
tax = subtotal * tax_rate
grand_total = subtotal + tax`;

const DEFAULT_INPUTS: InputRow[] = [
  { key: 'tax_rate', value: '0.1' },
  { key: 'items', value: '[{"qty": 2, "price": 10}, {"qty": 5, "price": 20}, {"qty": 1, "price": 100}]' }
];

const STORAGE_KEY_SCENARIOS = 'costforecast_scenarios';

interface Scenario {
  id: string;
  name: string;
  source: string;
  inputs: InputRow[];
  timestamp: number;
}

function App() {
  const [source, setSource] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_SOURCE) || DEFAULT_SOURCE;
  });

  // Initialize with saved or default rows
  const [inputs, setInputs] = useState<InputRow[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_INPUTS);
    try {
      return saved ? JSON.parse(saved) : DEFAULT_INPUTS;
    } catch {
      return DEFAULT_INPUTS;
    }
  });

  const [scenarios, setScenarios] = useState<Scenario[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SCENARIOS);
    try {
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [result, setResult] = useState<CalculationResponse | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_RESULT);
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'results' | 'graph' | 'charts'>('results');
  const [showScenarios, setShowScenarios] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showAI, setShowAI] = useState(false);

  const { parser } = useTreeSitter();

  const extensions = useMemo(() => {
    return [
      treeSitterPlugin(parser),
      syntaxHighlighting(myHighlightStyle),
      dslAutocomplete(parser)
    ];
  }, [parser]);

  // Persist source
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SOURCE, source);
  }, [source]);

  // Persist inputs
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_INPUTS, JSON.stringify(inputs));
  }, [inputs]);

  // Persist scenarios
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SCENARIOS, JSON.stringify(scenarios));
  }, [scenarios]);

  // Persist calculation results
  useEffect(() => {
    if (result) {
      localStorage.setItem(STORAGE_KEY_RESULT, JSON.stringify(result));
    } else {
      localStorage.removeItem(STORAGE_KEY_RESULT);
    }
  }, [result]);

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset code and inputs to default? This cannot be undone.')) {
      setSource(DEFAULT_SOURCE);
      setInputs(DEFAULT_INPUTS);
      setResult(null);
      localStorage.removeItem(STORAGE_KEY_SOURCE);
      localStorage.removeItem(STORAGE_KEY_INPUTS);
      localStorage.removeItem(STORAGE_KEY_RESULT);
    }
  };

  const handleSaveScenario = () => {
    const name = prompt('Enter a name for this scenario:');
    if (name) {
      const newScenario: Scenario = {
        id: Date.now().toString(),
        name,
        source,
        inputs,
        timestamp: Date.now()
      };
      setScenarios(prev => [...prev, newScenario]);
    }
  };

  const handleLoadScenario = (scenario: Scenario) => {
    if (window.confirm(`Load scenario "${scenario.name}"? Unsaved changes to current editor will be lost.`)) {
      setSource(scenario.source);
      setInputs(scenario.inputs);
      setShowScenarios(false);
    }
  };

  const handleDeleteScenario = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this scenario?')) {
      setScenarios(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleDetectInputs = () => {
    // Extract Input() declarations from DSL
    const detectedKeys = extractInputDeclarations(parser, source);

    if (detectedKeys.size === 0) {
      // No inputs detected - silently return
      return;
    }

    // Create a map of existing inputs for quick lookup
    const existingInputsMap = new Map<string, string>();
    inputs.forEach(row => {
      if (row.key.trim()) {
        existingInputsMap.set(row.key, row.value);
      }
    });

    // Merge: add detected inputs, preserve existing values
    const mergedInputs: InputRow[] = [];

    // First, add all existing inputs (preserve order and manual entries)
    inputs.forEach(row => {
      if (row.key.trim()) {
        mergedInputs.push(row);
      }
    });

    // Then, add newly detected inputs that don't already exist
    detectedKeys.forEach(key => {
      if (!existingInputsMap.has(key)) {
        mergedInputs.push({ key, value: '' });
      }
    });

    setInputs(mergedInputs);
  };


  const handleCalculate = async () => {
    setLoading(true);
    try {
      // Convert InputRow[] to Record<string, any>
      const inputRecord: Record<string, any> = {};
      inputs.forEach(row => {
        if (row.key.trim()) {
          // Try to parse as number if possible, stripping commas first
          const rawValue = parseFormattedNumber(row.value);
          const num = parseFloat(rawValue);
          // If it parses as a valid number and the original wasn't empty/whitespace, use the number
          // Otherwise use the original value (it might be a JSON string or expression)
          inputRecord[row.key] = (isNaN(num) || rawValue.trim() === '') ? row.value : num;
        }
      });

      const data = await api.calculate(source, inputRecord);

      // Validate API response
      if (!data) {
        console.error('API returned null/undefined response');
        setResult({
          results: {},
          graph: null,
          errors: [{ message: 'API returned no data' }]
        });
        return;
      }

      // Ensure results object exists
      const safeResults = data.results || {};

      // Ensure errors array exists
      const safeErrors = Array.isArray(data.errors) ? data.errors : [];

      // Validate graph structure if present
      let safeGraph = data.graph;
      if (safeGraph) {
        // Ensure nodes and edges arrays exist
        if (!Array.isArray(safeGraph.nodes)) {
          console.warn('API response graph.nodes is not an array, setting to empty array');
          safeGraph = { ...safeGraph, nodes: [] };
        }
        if (!Array.isArray(safeGraph.edges)) {
          console.warn('API response graph.edges is not an array, setting to empty array');
          safeGraph = { ...safeGraph, edges: [] };
        }
      }

      setResult({
        results: safeResults,
        graph: safeGraph,
        errors: safeErrors
      });

      if (activeTab === 'results' && data.graph) {
        // Optional: auto-switch to graph if desired, but sticking to results is safer
      }
    } catch (e) {
      console.error('Exception during calculation:', e);
      setResult({
        results: {},
        graph: null,
        errors: [{ message: e instanceof Error ? e.message : 'Calculation failed' }]
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b-2 border-slate-900 h-16 flex items-center justify-between px-8 z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="font-serif font-semibold text-2xl text-slate-900 tracking-tight leading-none">Cost Forecast</h1>
              <p className="text-[9px] text-slate-500 uppercase tracking-[0.15em] font-medium mt-0.5">The cost modeling that you can trust</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowAI(!showAI)}
            className={`text-sm px-3 py-2 transition-colors flex items-center gap-2 font-medium rounded-md ${showAI ? 'bg-yellow-100 text-yellow-800' : 'text-slate-600 hover:bg-slate-100'}`}
            title="AI Assistant"
          >
            <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            AI Assist
          </button>

          <button
            onClick={() => setShowHelp(!showHelp)}
            className={`text-sm px-3 py-2 transition-colors flex items-center gap-2 font-medium rounded-md ${showHelp ? 'bg-blue-100 text-blue-800' : 'text-slate-600 hover:bg-slate-100'}`}
            title="DSL Guide"
          >
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Help
          </button>

          <div className="h-6 w-px bg-slate-300"></div>

          <button
            onClick={() => setShowScenarios(!showScenarios)}
            className={`text-sm px-4 py-2 transition-colors flex items-center gap-2 font-medium border ${showScenarios ? 'bg-slate-900 text-white border-slate-900' : 'text-slate-700 border-slate-300 hover:border-slate-900 hover:text-slate-900'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Scenarios
          </button>
          <div className="h-6 w-px bg-slate-300"></div>
          <button
            onClick={handleReset}
            className="text-xs text-slate-500 hover:text-red-600 transition-colors font-medium"
          >
            Reset
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Overlays */}
        {showHelp && <HelpPanel onClose={() => setShowHelp(false)} />}
        {showAI && <AIGenerator onClose={() => setShowAI(false)} />}

        {/* Scenarios Drawer */}
        {showScenarios && (
          <div className="absolute top-0 right-0 bottom-0 w-80 bg-white shadow-2xl z-20 border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-slate-900 flex justify-between items-center bg-white">
              <h3 className="font-serif font-semibold text-lg text-slate-900">Saved Scenarios</h3>
              <button onClick={() => setShowScenarios(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-3">
              {scenarios.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  No scenarios saved yet.
                </div>
              ) : (
                scenarios.map(scenario => (
                  <div
                    key={scenario.id}
                    onClick={() => handleLoadScenario(scenario)}
                    className="bg-white p-3 border border-slate-200 hover:border-slate-900 cursor-pointer group transition-all relative"
                  >
                    <div className="font-semibold text-slate-800">{scenario.name}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      {new Date(scenario.timestamp).toLocaleString()}
                    </div>
                    <button
                      onClick={(e) => handleDeleteScenario(scenario.id, e)}
                      className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                      title="Delete Scenario"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t border-slate-900 bg-white">
              <button
                onClick={handleSaveScenario}
                className="w-full py-2.5 bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors"
              >
                Save Current State
              </button>
            </div>
          </div>
        )}

        {/* Left Panel: Inputs & Editor */}
        <div className="w-[40%] flex flex-col border-r border-slate-200 bg-white z-0">
          {/* Inputs Section */}
          <div className="h-1/3 flex flex-col border-b border-slate-200">
            <div className="px-4 py-3 bg-white border-b border-slate-900 flex justify-between items-center">
              <h2 className="font-serif font-semibold text-base text-slate-900 tracking-tight flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
                Variables & Inputs
              </h2>
              <button
                onClick={handleDetectInputs}
                className="text-xs px-3 py-1.5 border border-slate-300 bg-white text-slate-700 hover:border-slate-900 hover:bg-slate-50 transition-all font-medium flex items-center gap-1.5 rounded"
                title="Auto-detect Input() from code"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Detect Inputs
              </button>
            </div>
            <div className="flex-1 overflow-hidden p-0">
              <InputGrid data={inputs} onChange={setInputs} />
            </div>
          </div>

          {/* Editor Section */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="px-4 py-3 bg-white border-b border-slate-900 flex justify-between items-center">
              <h2 className="font-serif font-semibold text-base text-slate-900 tracking-tight flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                Model Logic
              </h2>
              <button
                onClick={handleCalculate}
                disabled={loading}
                className="bg-slate-900 text-white text-xs font-semibold px-5 py-2 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 tracking-wide uppercase"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Run Model
                  </>
                )}
              </button>
            </div>
            <div className="flex-1 overflow-hidden relative">
              <CodeMirror
                value={source}
                height="100%"
                extensions={extensions}
                onChange={(val) => setSource(val)}
                theme="light"
                className="h-full text-sm"
              />
            </div>
          </div>
        </div>

        {/* Right Panel: Visualization & Results */}
        <div className="flex-1 flex flex-col bg-slate-50/50">
          {/* Tabs */}
          <div className="flex border-b-2 border-slate-900 bg-white px-6 gap-1">
            <button
              onClick={() => setActiveTab('results')}
              className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 -mb-[2px] ${activeTab === 'results'
                ? 'text-slate-900 border-slate-900'
                : 'text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300'
                }`}
            >
              Results
            </button>
            <button
              onClick={() => setActiveTab('graph')}
              className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 -mb-[2px] ${activeTab === 'graph'
                ? 'text-slate-900 border-slate-900'
                : 'text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300'
                }`}
            >
              Dependency Graph
            </button>
            <button
              onClick={() => setActiveTab('charts')}
              className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 -mb-[2px] ${activeTab === 'charts'
                ? 'text-slate-900 border-slate-900'
                : 'text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300'
                }`}
            >
              Charts & Analysis
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden bg-white p-6 relative">
            {activeTab === 'results' && (
              <div className="h-full overflow-auto animate-in fade-in duration-200">
                {result ? (
                  <div className="max-w-3xl mx-auto">
                    {result.errors && result.errors.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <h3 className="text-red-800 font-bold">Calculation Errors</h3>
                        </div>
                        <ul className="list-disc list-inside text-red-700 text-sm space-y-1 ml-1">
                          {result.errors.map((err, i) => (
                            <li key={i}>
                              {err.message}
                              {err.line && <span className="text-red-500 ml-2 font-mono text-xs bg-red-100 px-1 rounded">Line {err.line}</span>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {Object.keys(result.results).length > 0 && (
                      <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                        <table className="min-w-full divide-y divide-slate-200">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Variable Name</th>
                              <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Calculated Value</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-200">
                            {Object.entries(result.results).map(([key, value], idx) => (
                              <tr key={key} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-700">{key}</td>
                                <td className="px-6 py-4 text-sm text-slate-600 font-mono text-right max-w-md">
                                  <div className="truncate" title={typeof value === 'string' ? value : formatNumber(value)}>
                                    {formatNumber(value)}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <svg className="w-16 h-16 mb-4 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-lg font-medium text-slate-500">Ready to Calculate</p>
                    <p className="text-sm mt-2">Enter your model logic and inputs, then click "Run Model"</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'graph' && (
              <div className="h-full w-full animate-in fade-in duration-200">
                <GraphVisualization graphData={result?.graph || null} />
              </div>
            )}

            {activeTab === 'charts' && (
              <div className="h-full w-full animate-in fade-in duration-200">
                <ChartsTab
                  nodes={result?.graph?.nodes || []}
                  results={result?.results || {}}
                  onRefresh={handleCalculate}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
