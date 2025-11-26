using System.Collections.Generic;

namespace CostForecast.Api.Models;

public class SensitivityRequest
{
    public string Source { get; set; } = string.Empty;
    public Dictionary<string, object> BaselineInputs { get; set; } = new();
    public List<string> InputsToVary { get; set; } = new();
    public List<string> OutputMetrics { get; set; } = new();
    public int Steps { get; set; } = 5;
    public double RangePercent { get; set; } = 40;
}

public class SensitivityResponse
{
    /// <summary>
    /// Detailed sensitivity data for charting
    /// </summary>
    public List<SensitivitySeries> Series { get; set; } = new();
    
    /// <summary>
    /// Top cost drivers ranked by impact
    /// </summary>
    public List<CostDriver> KeyDrivers { get; set; } = new();
    
    public List<CalculationError> Errors { get; set; } = new();
}

public class SensitivitySeries
{
    public string InputName { get; set; } = string.Empty;
    public string OutputName { get; set; } = string.Empty;
    public List<SensitivityPoint> Points { get; set; } = new();
}

public class SensitivityPoint
{
    public double InputValue { get; set; }
    public double InputPercentChange { get; set; }
    public double OutputValue { get; set; }
    public double OutputPercentChange { get; set; }
}

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
