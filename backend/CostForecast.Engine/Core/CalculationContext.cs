using System.Collections.Generic;

namespace CostForecast.Engine.Core;

public class CalculationContext
{
    private readonly List<IInputProvider> _inputProviders = new();

    public void AddInputProvider(IInputProvider provider)
    {
        _inputProviders.Add(provider);
    }

    public object GetInputValue(string key)
    {
        foreach (var provider in _inputProviders)
        {
            var value = provider.GetValue(key);
            if (value != null)
            {
                return value;
            }
        }
        return null; // Or throw exception? For now null.
    }
}
