import { useState, useMemo, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { api, type CalculationResponse } from './api';
import { useTreeSitter, treeSitterPlugin, myHighlightStyle } from './useTreeSitter';
import { syntaxHighlighting } from '@codemirror/language';
import { InputGrid, type InputRow } from './InputGrid';
import { GraphVisualization } from './GraphVisualization';

const STORAGE_KEY_SOURCE = 'costforecast_source';
const STORAGE_KEY_INPUTS = 'costforecast_inputs';

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

  const [result, setResult] = useState<CalculationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'results' | 'graph'>('results');

  const { parser } = useTreeSitter();

  const extensions = useMemo(() => {
    return [
      treeSitterPlugin(parser),
      syntaxHighlighting(myHighlightStyle)
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

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset code and inputs to default? This cannot be undone.')) {
      setSource(DEFAULT_SOURCE);
      setInputs(DEFAULT_INPUTS);
      localStorage.removeItem(STORAGE_KEY_SOURCE);
      localStorage.removeItem(STORAGE_KEY_INPUTS);
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
    }
  };

  const handleDeleteScenario = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this scenario?')) {
      setScenarios(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleCalculate = async () => {
    setLoading(true);
    try {
      // Convert InputRow[] to Record<string, any>
      const inputRecord: Record<string, any> = {};
      inputs.forEach(row => {
        if (row.key.trim()) {
          // Try to parse as number if possible
          const num = parseFloat(row.value);
          inputRecord[row.key] = isNaN(num) ? row.value : num;
        }
      });

      const data = await api.calculate(source, inputRecord);
      setResult(data);
    } catch (e) {
      setResult({
        results: {},
        graph: null,
        errors: [{ message: 'Calculation failed' }]
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar / Inputs */}
      <div className="w-1/3 bg-white border-r flex flex-col h-full">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Inputs</h2>
            <div className="flex gap-2">
              <button
                onClick={handleSaveScenario}
                className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
              >
                Save Scenario
              </button>
              <button
                onClick={handleReset}
                className="text-xs text-red-600 hover:text-red-800 underline"
              >
                Reset
              </button>
            </div>
          </div>
          <div className="h-64 overflow-hidden border rounded">
            <InputGrid data={inputs} onChange={setInputs} />
          </div>
          <button
            onClick={handleCalculate}
            disabled={loading}
            className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {loading ? 'Calculating...' : 'Calculate'}
          </button>
        </div>

        {/* Saved Scenarios List */}
        <div className="flex-1 p-4 overflow-auto bg-gray-50">
          <h3 className="font-bold text-gray-700 mb-2">Saved Scenarios</h3>
          {scenarios.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No saved scenarios.</p>
          ) : (
            <div className="space-y-2">
              {scenarios.map(scenario => (
                <div
                  key={scenario.id}
                  onClick={() => handleLoadScenario(scenario)}
                  className="bg-white p-3 rounded border hover:border-blue-400 cursor-pointer shadow-sm group relative"
                >
                  <div className="font-medium text-gray-800">{scenario.name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(scenario.timestamp).toLocaleString()}
                  </div>
                  <button
                    onClick={(e) => handleDeleteScenario(scenario.id, e)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete Scenario"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Editor */}
        <div className="h-1/2 p-4 border-b bg-gray-50">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Model Logic (DSL)</h2>
          <div className="border rounded overflow-hidden h-[calc(100%-3rem)] shadow-sm bg-white">
            <CodeMirror
              value={source}
              height="100%"
              extensions={extensions}
              onChange={(val) => setSource(val)}
              theme="light"
            />
          </div>
        </div>

        {/* Results & Graph - Tabbed */}
        <div className="h-1/2 p-4 bg-white flex flex-col">
          {/* Tab Headers */}
          <div className="flex border-b mb-4">
            <button
              onClick={() => setActiveTab('results')}
              className={`px-6 py-2 font-medium transition-colors ${activeTab === 'results'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
                }`}
            >
              Results
            </button>
            <button
              onClick={() => setActiveTab('graph')}
              className={`px-6 py-2 font-medium transition-colors ${activeTab === 'graph'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
                }`}
            >
              Graph
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-auto">
            {activeTab === 'results' && (
              <div>
                {result && (
                  <div>
                    {result.errors && result.errors.length > 0 && (
                      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                        <h3 className="text-red-700 font-bold">Errors</h3>
                        <ul className="list-disc list-inside text-red-600">
                          {result.errors.map((err, i) => (
                            <li key={i}>
                              {err.message}
                              {err.line && <span className="text-gray-500 text-sm ml-2">(Line: {err.line})</span>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {Object.keys(result.results).length > 0 && (
                      <div className="overflow-x-auto border rounded">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variable</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {Object.entries(result.results).map(([key, value]) => (
                              <tr key={key} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{key}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{String(value)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
                {!result && <p className="text-gray-500 italic">Run calculation to see results.</p>}
              </div>
            )}

            {activeTab === 'graph' && (
              <div className="h-full">
                <GraphVisualization graphData={result?.graph || null} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
