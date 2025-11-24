using System.Collections.Generic;

namespace CostForecast.Engine.Core;

public class RootEvaluationContext : IEvaluationContext
{
    private readonly Dictionary<string, object> _values;

    public RootEvaluationContext(Dictionary<string, object> values)
    {
        _values = values;
    }

    public object Get(string name)
    {
        return _values[name];
    }

    public void Set(string name, object value)
    {
        _values[name] = value;
    }

    public bool ContainsKey(string name)
    {
        return _values.ContainsKey(name);
    }
}
