using System.Collections.Generic;

namespace CostForecast.Engine.Core;

public abstract class GraphNode
{
    public string Name { get; }
    public List<GraphNode> Dependencies { get; } = new();

    protected GraphNode(string name)
    {
        Name = name;
    }

    public override bool Equals(object? obj)
    {
        if (obj is not GraphNode other) return false;
        if (ReferenceEquals(this, other)) return true;

        if (Name != other.Name) return false;
        if (Dependencies.Count != other.Dependencies.Count) return false;

        for (int i = 0; i < Dependencies.Count; i++)
        {
            if (!Dependencies[i].Equals(other.Dependencies[i])) return false;
        }

        return true;
    }

    public override int GetHashCode()
    {
        // Only use Name for HashCode to ensure consistency even if Dependencies change (though they shouldn't in HashCode usually)
        // But since Equals checks Dependencies, HashCode technically should too?
        // But Dependencies is mutable. Mutable keys are bad.
        // Best practice: HashCode should rely on immutable fields.
        // If we use GraphNode in Dictionary, we must be careful.
        // DependencyGraph uses Name as key (string), so GraphNode's HashCode isn't used for lookup there.
        // But inDegree uses GraphNode as key.
        // If we change Dependencies, HashCode changes -> Dictionary breaks.
        // So HashCode MUST NOT depend on Dependencies if we mutate them after adding to Dictionary.
        // We do mutate Dependencies (AddDependency).
        // So HashCode must rely only on Name.
        return Name.GetHashCode();
    }
}

public class ConstantNode : GraphNode
{
    public object Value { get; }

    public ConstantNode(string name, object value) : base(name)
    {
        Value = value;
    }

    public override bool Equals(object? obj)
    {
        if (!base.Equals(obj)) return false;
        if (obj is not ConstantNode other) return false;
        return Value.Equals(other.Value);
    }

    public override int GetHashCode()
    {
        return base.GetHashCode();
    }
}

public class InputNode : GraphNode
{
    public string Key { get; }

    public InputNode(string name, string key) : base(name)
    {
        Key = key;
    }

    public override bool Equals(object? obj)
    {
        if (!base.Equals(obj)) return false;
        if (obj is not InputNode other) return false;
        return Key == other.Key;
    }

    public override int GetHashCode()
    {
        return base.GetHashCode();
    }
}

public class ParamNode : GraphNode
{
    public Func<IEvaluationContext, object> Calculation { get; set; }

    public ParamNode(string name, Func<IEvaluationContext, object> calculation) : base(name)
    {
        Calculation = calculation;
    }

    public override bool Equals(object? obj)
    {
        return base.Equals(obj) && obj is ParamNode;
    }

    public override int GetHashCode()
    {
        return base.GetHashCode();
    }
}

public class FormulaNode : GraphNode
{
    public Func<IEvaluationContext, object> Calculation { get; set; }
    public string? Expression { get; set; }

    public FormulaNode(string name, Func<IEvaluationContext, object> calculation, string? expression = null) : base(name)
    {
        Calculation = calculation;
        Expression = expression;
    }

    public void AddDependency(GraphNode node)
    {
        Dependencies.Add(node);
    }

    public override bool Equals(object? obj)
    {
        return base.Equals(obj) && obj is FormulaNode;
    }

    public override int GetHashCode()
    {
        return base.GetHashCode();
    }
}
