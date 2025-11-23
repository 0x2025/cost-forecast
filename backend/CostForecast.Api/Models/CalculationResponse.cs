using System.Collections.Generic;

namespace CostForecast.Api.Models;

public class CalculationResponse
{
    public Dictionary<string, object> Results { get; set; } = new();
    public object? Graph { get; set; }
    public List<CalculationError> Errors { get; set; } = new();
}

public class CalculationError
{
    public string Message { get; set; } = string.Empty;
    public int? Line { get; set; }
    public int? Column { get; set; }
}
