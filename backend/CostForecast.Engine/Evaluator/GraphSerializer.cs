using System.Collections.Generic;
using System.Linq;
using CostForecast.Engine.Core;

namespace CostForecast.Engine.Evaluator;

/// <summary>
/// Serializes a DependencyGraph into a GraphDto for API responses.
/// </summary>
public class GraphSerializer
{
    /// <summary>
    /// Converts a DependencyGraph into a serializable GraphDto.
    /// </summary>
    /// <summary>
    /// Converts a DependencyGraph into a serializable GraphDto.
    /// </summary>
    public static GraphDto SerializeGraph(DependencyGraph graph)
    {
        return SerializeGraph(graph, null);
    }
    
    /// <summary>
    /// Converts a DependencyGraph into a serializable GraphDto with evaluation results.
    /// </summary>
    /// <param name="graph">The dependency graph to serialize</param>
    /// <param name="results">Optional evaluation results to include in display names</param>
    public static GraphDto SerializeGraph(DependencyGraph graph, Dictionary<string, object>? results)
    {
        var graphDto = new GraphDto();
        var allNodes = graph.GetAllNodes();

        // Create node DTOs
        foreach (var node in allNodes)
        {
            var nodeDto = new GraphNodeDto
            {
                Id = node.Name,
                Label = node.Name
            };

            // Set type and metadata based on node type
            if (node is ConstantNode constantNode)
            {
                nodeDto.Type = "constant";
                nodeDto.Metadata = new Dictionary<string, object>
                {
                    { "value", constantNode.Value }
                };
            }
            else if (node is InputNode inputNode)
            {
                nodeDto.Type = "input";
                nodeDto.Metadata = new Dictionary<string, object>
                {
                    { "key", inputNode.Key }
                };
            }
            else if (node is RangeNode rangeNode)
            {
                nodeDto.Type = "range";
                if (!string.IsNullOrEmpty(rangeNode.Expression))
                {
                    nodeDto.Metadata = new Dictionary<string, object> { { "expression", rangeNode.Expression } };
                }
            }
            else if (node is RangeItemNode itemNode)
            {
                nodeDto.Type = "range_item";
                nodeDto.Metadata = new Dictionary<string, object>
                {
                    { "index", itemNode.Index },
                    { "result", itemNode.Result }
                };
                
                // Derive parent RangeNode from graph structure
                var parentRangeNode = allNodes
                    .OfType<RangeNode>()
                    .FirstOrDefault(r => r.Dependencies.Contains(node));
                
                if (parentRangeNode != null)
                {
                    nodeDto.Metadata["rangeParentId"] = parentRangeNode.Name;
                }
            }
            else if (node is ParamNode)
            {
                nodeDto.Type = "param";
                // Include value in metadata if available
                if (results != null && results.TryGetValue(node.Name, out var paramValue))
                {
                    nodeDto.Metadata = new Dictionary<string, object>
                    {
                        { "value", paramValue }
                    };
                }
            }
            else if (node is FormulaNode formulaNode)
            {
                nodeDto.Type = "formula";
                if (!string.IsNullOrEmpty(formulaNode.Expression))
                {
                    nodeDto.Metadata = new Dictionary<string, object> { { "expression", formulaNode.Expression } };
                }
            }
            else
            {
                // Handle other node types (Param, Reference, etc.)
                nodeDto.Type = node.GetType().Name.Replace("Node", "").ToLower();
            }
            
            // Generate display name based on node type and evaluation results
            nodeDto.DisplayName = GenerateDisplayName(node, results);

            graphDto.Nodes.Add(nodeDto);
        }

        // Create edge DTOs (dependencies)
        foreach (var node in allNodes)
        {
            foreach (var dependency in node.Dependencies)
            {
                graphDto.Edges.Add(new GraphEdgeDto
                {
                    Source = dependency.Name,
                    Target = node.Name
                });
            }
        }

        return graphDto;
    }
    
    private static string GenerateDisplayName(GraphNode node, Dictionary<string, object>? results)
    {
        var name = node.Name;
        object? value = null;
        var hasValue = results != null && results.TryGetValue(name, out value);
        
        return node switch
        {
            ConstantNode constantNode => $"{name} = {FormatValue(constantNode.Value)}",
            InputNode inputNode => hasValue 
                ? $"Input({inputNode.Key}) = {FormatValue(value!)}"
                : $"Input({inputNode.Key})",
            ParamNode => hasValue
                ? $"{name}: Param = {FormatValue(value!)}"
                : $"{name}: Param",
            RangeNode => hasValue 
                ? $"{name} = Range(...) → [{GetArrayLength(value!)} items]"
                : $"{name} = Range(...)",
            RangeItemNode itemNode => $"{name} = {FormatValue(itemNode.Result)}",
            FormulaNode => hasValue 
                ? $"{name} = {FormatValue(value!)}"
                : name,
            _ => name
        };
    }
    
    private static string FormatValue(object? value)
    {
        if (value == null) return "null";
        
        if (value is double d)
        {
            // Format numbers nicely
            return d % 1 == 0 ? d.ToString("F0") : d.ToString("F2");
        }
        
        if (value is Array arr)
        {
            return $"[{arr.Length} items]";
        }
        
        if (value is System.Collections.IEnumerable enumerable and not string)
        {
            var count = 0;
            foreach (var _ in enumerable) count++;
            return $"[{count} items]";
        }
        
        var str = value.ToString() ?? "null";
        return str.Length > 30 ? str.Substring(0, 27) + "..." : str;
    }
    
    private static int GetArrayLength(object? value)
    {
        if (value is Array arr) return arr.Length;
        if (value is System.Collections.IEnumerable enumerable and not string)
        {
            var count = 0;
            foreach (var _ in enumerable) count++;
            return count;
        }
        return 0;
    }
}
