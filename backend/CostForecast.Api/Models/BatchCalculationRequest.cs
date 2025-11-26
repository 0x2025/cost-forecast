using System.Collections.Generic;

namespace CostForecast.Api.Models;

public class BatchCalculationRequest
{
    public string Source { get; set; } = string.Empty;
    
    /// <summary>
    /// Key = scenario name, Value = inputs for that scenario
    /// </summary>
    public Dictionary<string, Dictionary<string, object>> Scenarios { get; set; } = new();
}

public class BatchCalculationResponse
{
    /// <summary>
    /// Key = scenario name, Value = results for that scenario
    /// </summary>
    public Dictionary<string, ScenarioResult> Results { get; set; } = new();
    public List<CalculationError> Errors { get; set; } = new();
}

public class ScenarioResult
{
    public Dictionary<string, object> Results { get; set; } = new();
    
    /// <summary>
    /// Optional: include graph for debugging. null to reduce payload size.
    /// </summary>
    public object? Graph { get; set; }
}
