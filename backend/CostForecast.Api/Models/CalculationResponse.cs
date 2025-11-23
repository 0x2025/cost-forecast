using System.Collections.Generic;

namespace CostForecast.Api.Models;

public class CalculationResponse
{
    public Dictionary<string, object> Results { get; set; } = new();
    public object? Graph { get; set; }
    public List<string> Errors { get; set; } = new();
}
