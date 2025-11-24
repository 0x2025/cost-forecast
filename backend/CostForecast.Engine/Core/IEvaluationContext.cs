namespace CostForecast.Engine.Core;

public interface IEvaluationContext
{
    object Get(string name);
    void Set(string name, object value);
    bool ContainsKey(string name);
}
