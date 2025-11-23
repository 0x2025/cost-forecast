using System.Collections.Generic;

namespace CostForecast.Engine.Core;

public interface IInputProvider
{
    object GetValue(string key);
}

public class NamedInputProvider : IInputProvider
{
    private readonly Dictionary<string, object> _inputs;

    public NamedInputProvider(Dictionary<string, object> inputs)
    {
        _inputs = inputs;
    }

    public object GetValue(string key)
    {
        return _inputs.TryGetValue(key, out var value) ? value : null;
    }
}

public class GridInputProvider : IInputProvider
{
    private readonly Dictionary<string, object> _cells;

    public GridInputProvider(Dictionary<string, object> cells)
    {
        _cells = cells;
    }

    public object GetValue(string key)
    {
        // In a real implementation, this would parse "A1", "B2" to coordinates.
        // For PoC, we assume the key matches the cell address exactly.
        return _cells.TryGetValue(key, out var value) ? value : null;
    }
}
