using System.Collections.Generic;
using CostForecast.Engine.Core;

namespace CostForecast.Engine.Evaluator;

public class GraphEvaluator
{
    public Dictionary<string, object> Evaluate(DependencyGraph graph, CalculationContext context)
    {
        var results = new Dictionary<string, object>();
        var executionOrder = graph.GetExecutionOrder();

        foreach (var node in executionOrder)
        {
            if (node is ConstantNode constant)
            {
                results[node.Name] = constant.Value;
            }
            else if (node is InputNode input)
            {
                results[node.Name] = context.GetInputValue(input.Key);
            }
            else if (node is FormulaNode formula)
            {
                // Formula needs access to dependencies' values.
                // We can pass the 'results' dictionary to the calculation function.
                // But the calculation function expects Dictionary<string, object>.
                // So this works.
                results[node.Name] = formula.Calculation(results);
            }
        }

        return results;
    }
}
