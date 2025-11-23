using System.Collections.Generic;

namespace CostForecast.Api.Models;

/// <summary>
/// Data transfer object representing the computation graph structure.
/// </summary>
public class GraphDto
{
    public List<GraphNodeDto> Nodes { get; set; } = new();
    public List<GraphEdgeDto> Edges { get; set; } = new();
}

/// <summary>
/// Represents a node in the computation graph.
/// </summary>
public class GraphNodeDto
{
    /// <summary>
    /// Unique identifier for the node (typically the variable name).
    /// </summary>
    public string Id { get; set; } = string.Empty;
    
    /// <summary>
    /// Type of node: "constant", "input", "formula", "param", "reference".
    /// </summary>
    public string Type { get; set; } = string.Empty;
    
    /// <summary>
    /// Display label for the node.
    /// </summary>
    public string Label { get; set; } = string.Empty;
    
    /// <summary>
    /// Additional metadata specific to the node type.
    /// - For constants: { "value": <value> }
    /// - For inputs: { "key": <inputKey> }
    /// - For formulas: { "expression": <expr> } (optional)
    /// </summary>
    public Dictionary<string, object>? Metadata { get; set; }
}

/// <summary>
/// Represents a directed edge (dependency) in the computation graph.
/// </summary>
public class GraphEdgeDto
{
    /// <summary>
    /// Source node ID (the dependent node).
    /// </summary>
    public string Source { get; set; } = string.Empty;
    
    /// <summary>
    /// Target node ID (the dependency node).
    /// </summary>
    public string Target { get; set; } = string.Empty;
}
