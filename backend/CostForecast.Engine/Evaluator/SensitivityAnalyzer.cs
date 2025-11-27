using System;
using System.Collections.Generic;
using System.Linq;
using CostForecast.Engine.Core;

namespace CostForecast.Engine.Evaluator;

/// <summary>
/// Pure engine component for sensitivity analysis.
/// Analyzes the impact of varying input parameters on output metrics.
/// </summary>
public class SensitivityAnalyzer
{
    private readonly GraphEvaluator _evaluator;

    public SensitivityAnalyzer()
    {
        _evaluator = new GraphEvaluator();
    }

    /// <summary>
    /// Performs sensitivity analysis by varying specified inputs and measuring their impact on outputs.
    /// </summary>
    /// <param name="compiledGraph">The immutable compiled graph</param>
    /// <param name="baselineInputs">The baseline input values</param>
    /// <param name="inputsToVary">List of input keys to vary</param>
    /// <param name="outputMetrics">List of output metric names to track</param>
    /// <param name="config">Configuration for sensitivity analysis</param>
    /// <returns>Sensitivity analysis results with series data</returns>
    public SensitivityResults Analyze(
        DependencyGraph compiledGraph,
        Dictionary<string, object> baselineInputs,
        List<string> inputsToVary,
        List<string> outputMetrics,
        SensitivityConfig config)
    {
        var results = new SensitivityResults();

        // Get baseline results
        var baselineContext = new CalculationContext();
        baselineContext.AddInputProvider(new NamedInputProvider(baselineInputs));
        var (baselineResults, _) = _evaluator.Evaluate(compiledGraph, baselineContext);

        // Store baseline values for outputs
        var baselineOutputValues = new Dictionary<string, double>();
        // If no output metrics specified, auto-detect all numeric outputs from baseline
        if (outputMetrics == null || outputMetrics.Count == 0)
        {
            outputMetrics = baselineResults
                .Where(kvp => TryConvertToDouble(kvp.Value).HasValue)
                .Select(kvp => kvp.Key)
                .ToList();
        }

        foreach (var outputMetric in outputMetrics)
        {
            if (baselineResults.ContainsKey(outputMetric))
            {
                var value = TryConvertToDouble(baselineResults[outputMetric]);
                if (value.HasValue)
                {
                    baselineOutputValues[outputMetric] = value.Value;
                }
            }
        }

        // For each input to vary
        foreach (var inputKey in inputsToVary)
        {
            if (!baselineInputs.ContainsKey(inputKey))
                continue;

            var baselineValue = TryConvertToDouble(baselineInputs[inputKey]);
            if (!baselineValue.HasValue)
                continue; // Can only vary numeric inputs

            // Generate variation points
            var variationPoints = GenerateVariationPoints(baselineValue.Value, config);

            // For each output metric
            foreach (var outputMetric in outputMetrics)
            {
                if (!baselineOutputValues.ContainsKey(outputMetric))
                    continue;

                var series = new SensitivitySeries
                {
                    InputName = inputKey,
                    OutputName = outputMetric
                };

                // Evaluate at each variation point
                foreach (var (inputValue, percentChange) in variationPoints)
                {
                    // Create modified inputs
                    var modifiedInputs = new Dictionary<string, object>(baselineInputs)
                    {
                        [inputKey] = inputValue
                    };

                    var context = new CalculationContext();
                    context.AddInputProvider(new NamedInputProvider(modifiedInputs));
                    var (scenarioResults, _) = _evaluator.Evaluate(compiledGraph, context);

                    if (scenarioResults.ContainsKey(outputMetric))
                    {
                        var outputValue = TryConvertToDouble(scenarioResults[outputMetric]);
                        if (outputValue.HasValue)
                        {
                            var outputPercentChange = baselineOutputValues[outputMetric] != 0
                                ? ((outputValue.Value - baselineOutputValues[outputMetric]) / baselineOutputValues[outputMetric]) * 100
                                : 0;

                            series.Points.Add(new SensitivityPoint
                            {
                                InputValue = inputValue,
                                InputPercentChange = percentChange,
                                OutputValue = outputValue.Value,
                                OutputPercentChange = outputPercentChange
                            });
                        }
                    }
                }

                results.Series.Add(series);
            }
        }

        return results;
    }

    /// <summary>
    /// Automatically detects key cost drivers by analyzing all numeric inputs.
    /// Returns the top N drivers ranked by their impact on the specified output metrics.
    /// </summary>
    /// <param name="compiledGraph">The immutable compiled graph</param>
    /// <param name="baselineInputs">The baseline input values</param>
    /// <param name="outputMetrics">List of output metric names to track</param>
    /// <param name="topN">Number of top drivers to return</param>
    /// <returns>List of cost drivers ranked by impact</returns>
    public List<CostDriver> DetectKeyCostDrivers(
        DependencyGraph compiledGraph,
        Dictionary<string, object> baselineInputs,
        List<string> outputMetrics,
        int topN = 5)
    {
        // Get baseline results using the provided inputs
        var baselineContext = new CalculationContext();
        baselineContext.AddInputProvider(new NamedInputProvider(baselineInputs));
        
        Dictionary<string, object> baselineResults;
        try
        {
            var (results, _) = _evaluator.Evaluate(compiledGraph, baselineContext);
            baselineResults = results;
        }
        catch
        {
            // If baseline evaluation fails (e.g., invalid inputs), return empty list
            return new List<CostDriver>();
        }

        // Store baseline values for outputs
        var baselineOutputValues = new Dictionary<string, double>();
        // If no output metrics specified, auto-detect all numeric outputs from baseline
        if (outputMetrics == null || outputMetrics.Count == 0)
        {
            outputMetrics = baselineResults
                .Where(kvp => TryConvertToDouble(kvp.Value).HasValue)
                .Select(kvp => kvp.Key)
                .ToList();
        }

        foreach (var outputMetric in outputMetrics)
        {
            if (baselineResults.ContainsKey(outputMetric))
            {
                var value = TryConvertToDouble(baselineResults[outputMetric]);
                if (value.HasValue)
                {
                    baselineOutputValues[outputMetric] = value.Value;
                }
            }
        }

        var drivers = new List<CostDriver>();

        // Analyze each numeric input from the provided baseline
        foreach (var (inputKey, inputValue) in baselineInputs)
        {
            var baselineValue = TryConvertToDouble(inputValue);
            if (!baselineValue.HasValue || baselineValue.Value == 0)
                continue;

            var driver = new CostDriver
            {
                InputName = inputKey,
                OutputImpacts = new Dictionary<string, double>()
            };

            // Vary the input by a standard amount (e.g., +20%)
            var variedValue = baselineValue.Value * 1.2;
            var modifiedInputs = new Dictionary<string, object>(baselineInputs)
            {
                [inputKey] = variedValue
            };

            var context = new CalculationContext();
            context.AddInputProvider(new NamedInputProvider(modifiedInputs));
            var (scenarioResults, _) = _evaluator.Evaluate(compiledGraph, context);

            // Calculate impact on each output
            double totalImpact = 0;
            foreach (var outputMetric in outputMetrics)
            {
                if (baselineOutputValues.ContainsKey(outputMetric) && scenarioResults.ContainsKey(outputMetric))
                {
                    var newOutputValue = TryConvertToDouble(scenarioResults[outputMetric]);
                    if (newOutputValue.HasValue)
                    {
                        var baselineOutput = baselineOutputValues[outputMetric];
                        if (baselineOutput != 0)
                        {
                            // Calculate elasticity: (% change in output) / (% change in input)
                            var outputPercentChange = ((newOutputValue.Value - baselineOutput) / baselineOutput) * 100;
                            var inputPercentChange = ((variedValue - baselineValue.Value) / baselineValue.Value) * 100;
                            
                            var impact = Math.Abs(outputPercentChange / inputPercentChange);
                            driver.OutputImpacts[outputMetric] = impact;
                            totalImpact += impact;
                        }
                    }
                }
            }

            // Overall impact score (normalized to 0-100)
            driver.ImpactScore = totalImpact;
            drivers.Add(driver);
        }

        // Sort by impact and return top N
        return drivers
            .OrderByDescending(d => d.ImpactScore)
            .Take(topN)
            .ToList();
    }

    /// <summary>
    /// Generates variation points for sensitivity analysis.
    /// Returns tuples of (actual value, percent change from baseline).
    /// </summary>
    private List<(double value, double percentChange)> GenerateVariationPoints(double baselineValue, SensitivityConfig config)
    {
        var points = new List<(double, double)>();
        
        // For n steps, we want to go from -range to +range
        // e.g., 5 steps: -40%, -20%, 0%, +20%, +40%
        // step size = (2 * range) / (steps - 1)
        var step = (2.0 * config.RangePercent) / (config.Steps - 1);

        for (int i = 0; i < config.Steps; i++)
        {
            var percentChange = -config.RangePercent + (i * step);
            var value = baselineValue * (1 + percentChange / 100);
            points.Add((value, percentChange));
        }

        return points;
    }

    /// <summary>
    /// Attempts to convert a value to double, returning null if conversion fails.
    /// Used for silently skipping invalid inputs during sensitivity analysis.
    /// </summary>
    private double? TryConvertToDouble(object value)
    {
        try
        {
            return TypeConverter.ToDouble(value);
        }
        catch
        {
            return null;
        }
    }
}

/// <summary>
/// Configuration for sensitivity analysis
/// </summary>
public class SensitivityConfig
{
    /// <summary>
    /// Number of variation points per input (default: 5)
    /// </summary>
    public int Steps { get; set; } = 5;

    /// <summary>
    /// Range of variation as percentage (default: 40 for ±40%)
    /// </summary>
    public double RangePercent { get; set; } = 40;
}

/// <summary>
/// Results from sensitivity analysis
/// </summary>
public class SensitivityResults
{
    public List<SensitivitySeries> Series { get; set; } = new();
}

/// <summary>
/// A single sensitivity series showing how one input affects one output
/// </summary>
public class SensitivitySeries
{
    public string InputName { get; set; } = string.Empty;
    public string OutputName { get; set; } = string.Empty;
    public List<SensitivityPoint> Points { get; set; } = new();
}

/// <summary>
/// A single data point in a sensitivity series
/// </summary>
public class SensitivityPoint
{
    public double InputValue { get; set; }
    public double InputPercentChange { get; set; }
    public double OutputValue { get; set; }
    public double OutputPercentChange { get; set; }
}

/// <summary>
/// A cost driver identified by sensitivity analysis
/// </summary>
public class CostDriver
{
    public string InputName { get; set; } = string.Empty;
    
    /// <summary>
    /// Overall impact score (higher = more influential)
    /// </summary>
    public double ImpactScore { get; set; }
    
    /// <summary>
    /// Impact on each output metric (key = output name, value = elasticity)
    /// </summary>
    public Dictionary<string, double> OutputImpacts { get; set; } = new();
}
