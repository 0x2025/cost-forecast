using System.Collections.Generic;

namespace CostForecast.Engine.Core;

public class RangeItemNode : GraphNode
{
    public int Index { get; }
    public object Result { get; }
    public Dictionary<string, object> ItemValues { get; }

    public RangeItemNode(string name, int index, object result, Dictionary<string, object> itemValues) : base(name)
    {
        Index = index;
        Result = result;
        ItemValues = itemValues;
    }

    public override bool Equals(object? obj)
    {
        if (!base.Equals(obj)) return false;
        if (obj is not RangeItemNode other) return false;
        return Index == other.Index && Result.Equals(other.Result);
    }

    public override int GetHashCode()
    {
        return base.GetHashCode();
    }
}
