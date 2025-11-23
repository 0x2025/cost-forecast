using System.Collections.Generic;

namespace CostForecast.Api.Models;

public class CalculationRequest
{
    public string Source { get; set; } = string.Empty;
    public Dictionary<string, object> Inputs { get; set; } = new();
}
