using System.Collections.Generic;
using System.Linq;
using CostForecast.Engine.Core;

namespace CostForecast.Engine.Evaluator;

public class GraphEvaluator
{
    /// <summary>
    /// Evaluates a dependency graph with the provided input data.
    /// Implements: compiled_graph + input_data = evaluated_graph
    /// </summary>
    /// <param name="compiledGraph">The immutable compiled graph (template)</param>
    /// <param name="context">The calculation context with input data</param>
    /// <returns>Tuple of (calculation results, evaluated graph with runtime nodes)</returns>
    public (Dictionary<string, object> Results, DependencyGraph EvaluatedGraph) 
        Evaluate(DependencyGraph compiledGraph, CalculationContext context)
    {
        // Clone the compiled graph to keep it immutable
        var evaluatedGraph = compiledGraph.Clone();
        
        var results = new Dictionary<string, object>();
        var executionOrder = evaluatedGraph.GetExecutionOrder();

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
            else if (node is RangeNode rangeNode)
            {
                // Execute Range iteration and ADD item nodes to evaluated graph
                var contextWrapper = new RootEvaluationContext(results);
                var sourceVal = rangeNode.SourceCalculation(contextWrapper);
                
                var resultsList = new List<double>();
                
                // Convert source to enumerable
                IEnumerable<object> items;
                if (sourceVal is IEnumerable<object> e) items = e;
                else if (sourceVal is System.Collections.IEnumerable en) items = en.Cast<object>();
                else items = new[] { sourceVal };
                
                int index = 0;
                foreach (var item in items)
                {
                    // Create child context for this item
                    var childCtx = new ChildEvaluationContext(contextWrapper);
                    var paramDeps = new List<string>();
                    
                    // Populate context from item properties
                    if (item is IDictionary<string, object> dict)
                    {
                        foreach (var kvp in dict)
                        {
                            childCtx.Set(kvp.Key, kvp.Value);
                            paramDeps.Add(kvp.Key);  // Track which params were populated
                        }
                    }
                    else if (item is System.Text.Json.JsonElement jsonElement && jsonElement.ValueKind == System.Text.Json.JsonValueKind.Object)
                    {
                        foreach (var prop in jsonElement.EnumerateObject())
                        {
                            object val;
                            if (prop.Value.ValueKind == System.Text.Json.JsonValueKind.Number)
                                val = prop.Value.GetDouble();
                            else if (prop.Value.ValueKind == System.Text.Json.JsonValueKind.String)
                                val = prop.Value.GetString();
                            else
                                val = prop.Value;
                                
                            childCtx.Set(prop.Name, val);
                            paramDeps.Add(prop.Name);
                        }
                    }
                    
                    // Evaluate target expression for this item
                    var resultObj = rangeNode.TargetCalculation(childCtx);
                    var resultValue = Convert.ToDouble(resultObj);
                    resultsList.Add(resultValue);
                    
                    // Create item node and add to evaluated graph
                    var itemNodeName = $"{node.Name}({index + 1})";
                    
                    // Capture item values for metadata
                    var currentItemValues = new Dictionary<string, object>();
                    // We need to reconstruct item values from childCtx or pass them through
                    // Since childCtx is populated, we can't easily extract just the item values without tracking them
                    // But we tracked paramDeps, which are the keys.
                    foreach (var key in paramDeps)
                    {
                        currentItemValues[key] = childCtx.Get(key);
                    }

                    var itemNode = new RangeItemNode(itemNodeName, index, resultValue, currentItemValues);
                    evaluatedGraph.AddNode(itemNode);
                    
                    // Add dependency: RangeNode depends on RangeItemNode
                    // This creates the visual link: RangeItemNode -> RangeNode
                    rangeNode.Dependencies.Add(itemNode);
                    
                    // Add edge from source to item
                    var sourceDep = rangeNode.Dependencies.FirstOrDefault();
                    if (sourceDep != null)
                    {
                        itemNode.Dependencies.Add(sourceDep);
                    }
                    
                    // Add edges from item to params
                    foreach (var paramName in paramDeps)
                    {
                        var paramNode = evaluatedGraph.GetNode(paramName);
                        if (paramNode != null)
                        {
                            itemNode.Dependencies.Add(paramNode);
                        }
                    }
                    
                    index++;
                }
                
                // Store result array
                results[node.Name] = resultsList.ToArray();
            }
            else if (node is FormulaNode formula)
            {
                // Wrap the results dictionary in a RootEvaluationContext
                // This allows the formula to access values via the IEvaluationContext interface
                var contextWrapper = new RootEvaluationContext(results);
                results[node.Name] = formula.Calculation(contextWrapper);
            }
        }

        return (results, evaluatedGraph);
    }
}
