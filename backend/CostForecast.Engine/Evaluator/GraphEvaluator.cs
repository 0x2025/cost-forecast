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
            else if (node is ParamNode paramNode)
            {
                // Param nodes are evaluated like FormulaNodes
                var contextWrapper = new RootEvaluationContext(results);
                results[node.Name] = paramNode.Calculation(contextWrapper);
            }
            else if (node is RangeNode rangeNode)
            {
                // Execute Range iteration and ADD item nodes to evaluated graph
                var contextWrapper = new RootEvaluationContext(results);
                var sourceVal = rangeNode.SourceCalculation(contextWrapper);
                
                var resultsList = new List<double>();
                var itemNodes = new List<GraphNode>();
                
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
                    itemNodes.Add(itemNode);
                    
                    // Add edges from item to params
                    // Add edges from item to params
                    foreach (var paramName in paramDeps)
                    {
                        // Instead of linking to the global Param node, we create a specific node for this item's parameter
                        // This ensures the graph shows the breakdown per item (e.g., qty(1), price(1))
                        var paramValue = childCtx.Get(paramName);
                        var paramNodeName = $"{paramName}({index + 1})";
                        
                        // Create a ConstantNode to represent this specific value
                        // We use ConstantNode because for this specific item iteration, it is a fixed value
                        var itemParamNode = new ConstantNode(paramNodeName, paramValue);
                        
                        // Add to graph if not already present (though names should be unique per item)
                        if (evaluatedGraph.GetNode(paramNodeName) == null)
                        {
                            evaluatedGraph.AddNode(itemParamNode);
                        }
                        
                        itemNode.Dependencies.Add(itemParamNode);
                    }
                    
                    index++;
                }
                
                // Store result array
                results[node.Name] = resultsList.ToArray();
                
                // Clear original dependencies (source and target template)
                // We only want to show the breakdown (item nodes) in the evaluated graph
                rangeNode.Dependencies.Clear();
                
                // Re-add item nodes as dependencies
                foreach (var itemNode in itemNodes)
                {
                    rangeNode.Dependencies.Add(itemNode);
                }
            }
            else if (node is FormulaNode formula)
            {
                // Wrap the results dictionary in a RootEvaluationContext
                // This allows the formula to access values via the IEvaluationContext interface
                var contextWrapper = new RootEvaluationContext(results);
                results[node.Name] = formula.Calculation(contextWrapper);
            }
        }

        PruneGraph(evaluatedGraph);

        return (results, evaluatedGraph);
    }

    private void PruneGraph(DependencyGraph graph)
    {
        var allNodes = graph.GetAllNodes().ToList();
        
        // Find roots: nodes that are likely final outputs
        // These are nodes that no other node depends on AND are not InputNode or "system" nodes
        var dependents = new Dictionary<GraphNode, List<GraphNode>>();
        
        // Initialize dependents list
        foreach (var node in allNodes)
        {
            dependents[node] = new List<GraphNode>();
        }

        // Build dependents map (Who depends on me?)
        foreach (var node in allNodes)
        {
            foreach (var dep in node.Dependencies)
            {
                if (dependents.ContainsKey(dep))
                {
                    dependents[dep].Add(node);
                }
            }
        }

        // Find Roots: nodes with no dependents, excluding InputNodes, system nodes, and Param declarations
        // Param declarations (qty, price) are templates and should not be considered roots
        var roots = allNodes.Where(n => 
            dependents[n].Count == 0 &&
            !(n is InputNode) &&
            !(n is ParamNode) &&
            !n.Name.StartsWith("$") &&
            !(n is FormulaNode fn && fn.Calculation != null && IsParamNode(n, allNodes))
        ).ToList();

        // Traverse from roots to find all reachable nodes
        var reachable = new HashSet<GraphNode>();
        var queue = new Queue<GraphNode>(roots);
        
        while (queue.Count > 0)
        {
            var node = queue.Dequeue();
            if (reachable.Contains(node)) continue;
            
            reachable.Add(node);
            
            foreach (var dep in node.Dependencies)
            {
                queue.Enqueue(dep);
            }
        }

        // Remove unreachable nodes
        foreach (var node in allNodes)
        {
            if (!reachable.Contains(node))
            {
                graph.RemoveNode(node.Name);
            }
        }
    }

    private bool IsParamNode(GraphNode node, List<GraphNode> allNodes)
    {
        // A node is considered a "template" node if it has been expanded or is an intermediate wrapper
        
        // 1. Param nodes that have been expanded (qty -> qty(1), qty(2))
        if (allNodes.Any(n => n.Name.StartsWith($"{node.Name}(") && n is ConstantNode))
        {
            return true;
        }
        
        // 2. Input wrapper nodes (e.g., "items" which wraps "$Input_items")
        // These are FormulaNodes that only depend on a single InputNode
        if (node is FormulaNode && node.Dependencies.Count == 1 && node.Dependencies[0] is InputNode)
        {
            return true;
        }
        
        return false;
    }
}
