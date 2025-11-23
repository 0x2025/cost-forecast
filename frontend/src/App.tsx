import { useState, useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { api, type CalculationResponse } from './api';
import { useTreeSitter, treeSitterPlugin, myHighlightStyle } from './useTreeSitter';
import { syntaxHighlighting } from '@codemirror/language';
import { InputGrid, type InputRow } from './InputGrid';
import { GraphVisualization } from './GraphVisualization';

function App() {
  const [source, setSource] = useState(`x = 10
y = x * 2
total = SUM(x, y)`);
  // Initialize with some default rows
  const [inputs, setInputs] = useState<InputRow[]>([
    { key: 'inflation', value: '1.05' }
  ]);
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
      <div className="w-1/3 bg-white border-r p-4 flex flex-col">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Inputs</h2>
        <div className="flex-1 mb-4 overflow-hidden">
          <InputGrid data={inputs} onChange={setInputs} />
        </div>
        <button
          onClick={handleCalculate}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
        >
          {loading ? 'Calculating...' : 'Calculate'}
        </button>
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
                    {result.errors.length > 0 && (
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
