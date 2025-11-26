using System.Collections.Generic;
using CostForecast.Engine.Core;

namespace CostForecast.Engine.Evaluator;

/// <summary>
/// Pure engine component for executing multiple scenarios efficiently.
/// Runs the same compiled graph with different input sets.
/// </summary>
public class ScenarioRunner
{
    private readonly GraphEvaluator _evaluator;

    public ScenarioRunner()
    {
        _evaluator = new GraphEvaluator();
    }

    /// <summary>
    /// Executes multiple scenarios using the same compiled graph.
    /// This is efficient because the graph is compiled once and reused.
    /// </summary>
    /// <param name="compiledGraph">The immutable compiled graph (template)</param>
    /// <param name="scenarios">Dictionary mapping scenario names to their input sets</param>
    /// <returns>Results for each scenario</returns>
    public ScenarioResults ExecuteScenarios(
        DependencyGraph compiledGraph,
        Dictionary<string, Dictionary<string, object>> scenarios)
    {
        var results = new ScenarioResults();

        foreach (var (scenarioName, inputs) in scenarios)
        {
            // Create a new context for this scenario
            var context = new CalculationContext();
            context.AddInputProvider(new NamedInputProvider(inputs));

            // Evaluate the graph with this scenario's inputs
            var (scenarioResults, evaluatedGraph) = _evaluator.Evaluate(compiledGraph, context);

            // Store the results
            results.Results[scenarioName] = new ScenarioResult
            {
                Results = scenarioResults,
                EvaluatedGraph = evaluatedGraph
            };
        }

        return results;
    }
}

/// <summary>
/// Container for multiple scenario execution results
/// </summary>
public class ScenarioResults
{
    public Dictionary<string, ScenarioResult> Results { get; set; } = new();
}

/// <summary>
/// Result for a single scenario execution
/// </summary>
public class ScenarioResult
{
    public Dictionary<string, object> Results { get; set; } = new();
    public DependencyGraph? EvaluatedGraph { get; set; }
}
