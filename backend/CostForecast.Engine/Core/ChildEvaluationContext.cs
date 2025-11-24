using System.Collections.Generic;

namespace CostForecast.Engine.Core;

public class ChildEvaluationContext : IEvaluationContext
{
    private readonly IEvaluationContext _parent;
    private readonly Dictionary<string, object> _local = new();

    public ChildEvaluationContext(IEvaluationContext parent)
    {
        _parent = parent;
    }

    public object Get(string name)
    {
        if (_local.TryGetValue(name, out var val))
        {
            return val;
        }
        return _parent.Get(name);
    }

    public void Set(string name, object value)
    {
        _local[name] = value;
    }

    public bool ContainsKey(string name)
    {
        return _local.ContainsKey(name) || _parent.ContainsKey(name);
    }
}
