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
                var rawValue = context.GetInputValue(input.Key);
                results[node.Name] = ProcessInput(input.Key, rawValue);
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
                
                // 1. Identify the Volatile Subgraph (nodes that need to be cloned per item)
                // These are nodes in the TargetDependencies closure that are ParamNodes or depend on them.
                var volatileNodes = GetVolatileSubgraph(rangeNode.TargetDependencies);

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
                            paramDeps.Add(kvp.Key);
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
                    
                    // Evaluate target expression for this item (final result)
                    var resultObj = rangeNode.TargetCalculation(childCtx);
                    var resultValue = Convert.ToDouble(resultObj);
                    resultsList.Add(resultValue);
                    
                    // --- Subgraph Expansion ---
                    
                    // Map original nodes to cloned nodes for this iteration
                    var nodeMap = new Dictionary<GraphNode, GraphNode>();
                    
                    // Clone all volatile nodes
                    foreach (var original in volatileNodes)
                    {
                        var clonedName = $"{original.Name}({index + 1})";
                        
                        GraphNode cloned = original switch
                        {
                            ParamNode p => new ParamNode(clonedName, p.Calculation),
                            FormulaNode f => new FormulaNode(clonedName, f.Calculation, f.Expression),
                            RangeNode r => new RangeNode(clonedName, r.SourceCalculation, r.TargetCalculation, r.Expression),
                            RangeItemNode ri => new RangeItemNode(clonedName, ri.Index, ri.Result, ri.ItemValues), // Nested ranges
                            _ => throw new NotSupportedException($"Unexpected volatile node type: {original.GetType().Name}")
                        };
                        
                        nodeMap[original] = cloned;
                        
                        // Only add if not already in graph (for nested ranges, nodes might already exist)
                        if (evaluatedGraph.GetNode(clonedName) == null)
                        {
                            evaluatedGraph.AddNode(cloned);
                        }
                        else
                        {
                            // Use the existing node instead
                            cloned = evaluatedGraph.GetNode(clonedName)!;
                            nodeMap[original] = cloned;
                        }
                        
                        // Calculate and store value for the cloned node
                        if (original is ParamNode originalParamNode)
                        {
                             results[clonedName] = originalParamNode.Calculation(childCtx);
                        }
                        else if (original is FormulaNode originalFormulaNode)
                        {
                             results[clonedName] = originalFormulaNode.Calculation(childCtx);
                        }
                    }
                    
                    // Rewire dependencies for cloned nodes
                    foreach (var original in volatileNodes)
                    {
                        var cloned = nodeMap[original];
                        foreach (var dep in original.Dependencies)
                        {
                            if (volatileNodes.Contains(dep))
                            {
                                // Dependency is also volatile -> point to its clone
                                cloned.Dependencies.Add(nodeMap[dep]);
                            }
                            else
                            {
                                // Dependency is global/static -> point to original
                                cloned.Dependencies.Add(dep);
                            }
                        }
                    }

                    // Create RangeItemNode
                    var itemNodeName = $"{node.Name}({index + 1})";
                    
                    // Capture item values for metadata
                    var currentItemValues = new Dictionary<string, object>();
                    foreach (var key in paramDeps)
                    {
                        currentItemValues[key] = childCtx.Get(key);
                    }

                    var itemNode = new RangeItemNode(itemNodeName, index, resultValue, currentItemValues);
                    evaluatedGraph.AddNode(itemNode);
                    itemNodes.Add(itemNode);
                    
                    // Link ItemNode to the Roots of the cloned subgraph
                    // The "Roots" are the clones of the RangeNode's TargetDependencies
                    foreach (var targetDep in rangeNode.TargetDependencies)
                    {
                        if (volatileNodes.Contains(targetDep))
                        {
                            itemNode.Dependencies.Add(nodeMap[targetDep]);
                        }
                        else
                        {
                            itemNode.Dependencies.Add(targetDep);
                        }
                    }
                    
                    index++;
                }
                
                // Store result array
                results[node.Name] = resultsList.ToArray();
                
                // Clear original dependencies
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

    private object ProcessInput(string key, object val)
    {
        if (val == null) return 0.0;
        
        // Handle JsonElement (from API) - extract the actual value
        if (val is System.Text.Json.JsonElement jsonElement)
        {
            if (jsonElement.ValueKind == System.Text.Json.JsonValueKind.String)
            {
                // Extract string from JsonElement and process it
                val = jsonElement.GetString();
            }
            else
            {
                // For non-string JsonElements, use ConvertToDouble
                return ConvertToDouble(val);
            }
        }
        
        // If it's a string, check if it's JSON or numeric
        if (val is string s)
        {
            if (string.IsNullOrWhiteSpace(s)) return 0.0;
            
            // Try to parse as JSON if it starts with [ or {
            s = s.Trim();
            if (s.StartsWith("[") || s.StartsWith("{"))
            {
                try
                {
                    // Parse as JSON
                    var jsonDoc = System.Text.Json.JsonDocument.Parse(s);
                    var root = jsonDoc.RootElement;
                    
                    if (root.ValueKind == System.Text.Json.JsonValueKind.Array)
                    {
                        // Convert JsonElement array to List of Dictionaries
                        var list = new List<object>();
                        foreach (var item in root.EnumerateArray())
                        {
                            if (item.ValueKind == System.Text.Json.JsonValueKind.Object)
                            {
                                var dict = new Dictionary<string, object>();
                                foreach (var prop in item.EnumerateObject())
                                {
                                    if (prop.Value.ValueKind == System.Text.Json.JsonValueKind.Number)
                                        dict[prop.Name] = prop.Value.GetDouble();
                                    else if (prop.Value.ValueKind == System.Text.Json.JsonValueKind.String)
                                        dict[prop.Name] = prop.Value.GetString();
                                    else if (prop.Value.ValueKind == System.Text.Json.JsonValueKind.True)
                                        dict[prop.Name] = true;
                                    else if (prop.Value.ValueKind == System.Text.Json.JsonValueKind.False)
                                        dict[prop.Name] = false;
                                    else
                                        dict[prop.Name] = prop.Value;
                                }
                                list.Add(dict);
                            }
                            else if (item.ValueKind == System.Text.Json.JsonValueKind.Number)
                            {
                                list.Add(item.GetDouble());
                            }
                            else
                            {
                                list.Add(item);
                            }
                        }
                        return list.ToArray();
                    }
                    else if (root.ValueKind == System.Text.Json.JsonValueKind.Object)
                    {
                        var dict = new Dictionary<string, object>();
                        foreach (var prop in root.EnumerateObject())
                        {
                            if (prop.Value.ValueKind == System.Text.Json.JsonValueKind.Number)
                                dict[prop.Name] = prop.Value.GetDouble();
                            else if (prop.Value.ValueKind == System.Text.Json.JsonValueKind.String)
                                dict[prop.Name] = prop.Value.GetString();
                            else
                                dict[prop.Name] = prop.Value;
                        }
                        return dict;
                    }
                }
                catch (System.Text.Json.JsonException)
                {
                    // If JSON parsing fails, fall through to number parsing
                }
            }
            
            // Try to parse as number
            if (!double.TryParse(s, out var d))
            {
                throw new System.Exception($"Input '{key}' has invalid value: '{s}'. Expected a number or valid JSON.");
            }
            return d;
        }
        
        // Allow arrays to pass through for Range
        if (val is System.Array || (val is System.Collections.IEnumerable && !(val is string)))
        {
            return val;
        }

        return ConvertToDouble(val);
    }

    private static double ConvertToDouble(object value)
    {
        if (value == null)
            return 0.0;

        // Handle JsonElement from API deserialization
        if (value is System.Text.Json.JsonElement jsonElement)
        {
            return jsonElement.ValueKind switch
            {
                System.Text.Json.JsonValueKind.Number => jsonElement.GetDouble(),
                System.Text.Json.JsonValueKind.String => double.TryParse(jsonElement.GetString(), out var d) ? d : throw new System.Exception($"Cannot convert string '{jsonElement.GetString()}' to number"),
                System.Text.Json.JsonValueKind.True => 1.0,
                System.Text.Json.JsonValueKind.False => 0.0,
                System.Text.Json.JsonValueKind.Null => 0.0,
                _ => throw new System.Exception($"Cannot convert JsonElement of type {jsonElement.ValueKind} to number")
            };
        }

        // Handle primitive types from tests
        if (value is double dbl) return dbl;
        if (value is int i) return i;
        if (value is long l) return l;
        if (value is float f) return f;
        if (value is decimal dec) return (double)dec;
        
        if (value is System.Array || value is System.Collections.IEnumerable && !(value is string))
        {
            throw new System.ArgumentException("Cannot convert array/collection to number directly. Use aggregation functions like SUM, AVERAGE, etc.");
        }
        
        // Fallback to Convert for other IConvertible types
        return System.Convert.ToDouble(value);
    }

    /// <summary>
    /// Identifies the subgraph of nodes that are "volatile" (depend on ParamNodes or are ParamNodes).
    /// These nodes need to be cloned for each range item.
    /// </summary>
    private HashSet<GraphNode> GetVolatileSubgraph(List<GraphNode> roots)
    {
        var volatileNodes = new HashSet<GraphNode>();
        var visited = new HashSet<GraphNode>();
        
        void TraverseAndMark(GraphNode node)
        {
            if (visited.Contains(node)) return;
            visited.Add(node);
            
            // If this node is a ParamNode, it's volatile
            if (node is ParamNode)
            {
                volatileNodes.Add(node);
            }
            
            // Recursively check dependencies
            foreach (var dep in node.Dependencies)
            {
                TraverseAndMark(dep);
                
                // If any dependency is volatile, this node is also volatile
                if (volatileNodes.Contains(dep))
                {
                    volatileNodes.Add(node);
                }
            }
        }
        
        // Traverse from each root
        foreach (var root in roots)
        {
            TraverseAndMark(root);
        }
        
        return volatileNodes;
    }
}
