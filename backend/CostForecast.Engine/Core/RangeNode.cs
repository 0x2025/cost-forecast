using System.Collections.Generic;

namespace CostForecast.Engine.Core;

/// <summary>
/// Represents a Range operation node in the dependency graph.
/// Stores source and target calculations, and tracks expansion data after evaluation.
/// </summary>
public class RangeNode : GraphNode
{
    /// <summary>
    /// The calculation function for the source collection (e.g., items array)
    /// </summary>
    public Func<IEvaluationContext, object> SourceCalculation { get; set; }

    /// <summary>
    /// The calculation function applied to each item in the collection
    /// </summary>
    public Func<IEvaluationContext, object> TargetCalculation { get; set; }

    public RangeNode(
        string name, 
        Func<IEvaluationContext, object> sourceCalculation,
        Func<IEvaluationContext, object> targetCalculation) 
        : base(name)
    {
        SourceCalculation = sourceCalculation;
        TargetCalculation = targetCalculation;
    }

    public void AddDependency(GraphNode node)
    {
        Dependencies.Add(node);
    }

    public override bool Equals(object? obj)
    {
        return base.Equals(obj) && obj is RangeNode;
    }

    public override int GetHashCode()
    {
        return base.GetHashCode();
    }
}
