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
            else if (node is RangeNode)
            {
                nodeDto.Type = "range";
            }
            else if (node is RangeItemNode itemNode)
            {
                nodeDto.Type = "range_item";
                nodeDto.Metadata = new Dictionary<string, object>
                {
                    { "index", itemNode.Index },
                    { "result", itemNode.Result }
                    // Could also include itemValues if needed
                };
            }
            else if (node is FormulaNode)
            {
                nodeDto.Type = "formula";
            }
            else
            {
                // Handle other node types (Param, Reference, etc.)
                nodeDto.Type = node.GetType().Name.Replace("Node", "").ToLower();
            }

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
}
