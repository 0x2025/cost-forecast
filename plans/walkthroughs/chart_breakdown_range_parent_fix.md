# Fix Chart Breakdown Missing Range Node

## Problem
The Chart Breakdown UI was not showing Range nodes as selectable options, even though they were present in the DSL and the evaluated graph. This prevented users from creating breakdown charts for Range-based collections.

## Root Cause
The frontend's [`rangeDetector.ts`](file:///Users/arthur/CostForecast/frontend/src/components/charts/utils/rangeDetector.ts) relies on `rangeParentId` in the node metadata to identify and group `RangeItemNode`s by their parent `RangeNode`. However, the backend's [`GraphSerializer.cs`](file:///Users/arthur/CostForecast/backend/CostForecast.Engine/Evaluator/GraphSerializer.cs#L67-L84) was not including this metadata field when serializing `RangeItemNode`s.

## Architectural Decision
**Keep the engine pure**: Instead of adding a `ParentId` property to [`RangeItemNode`](file:///Users/arthur/CostForecast/backend/CostForecast.Engine/Core/RangeItemNode.cs), we derive the parent relationship from the graph structure during serialization. This separates computation logic (engine) from presentation logic (serializer).

## Changes Made

### Backend

#### [GraphSerializer.cs](file:///Users/arthur/CostForecast/backend/CostForecast.Engine/Evaluator/GraphSerializer.cs#L67-L84)
Updated `RangeItemNode` serialization to derive `rangeParentId` from graph dependencies:

```diff
 else if (node is RangeItemNode itemNode)
 {
     nodeDto.Type = "range_item";
     nodeDto.Metadata = new Dictionary<string, object>
     {
         { "index", itemNode.Index },
         { "result", itemNode.Result }
     };
+    
+    // Derive parent RangeNode from graph structure
+    var parentRangeNode = allNodes
+        .OfType<RangeNode>()
+        .FirstOrDefault(r => r.Dependencies.Contains(node));
+    
+    if (parentRangeNode != null)
+    {
+        nodeDto.Metadata["rangeParentId"] = parentRangeNode.Name;
+    }
 }
```

The serializer finds which `RangeNode` has this item as a dependency, maintaining the single source of truth in the graph structure.

## Testing

### RangeItem Serialization Test
[`RangeItemSerializationTests.cs`](file:///Users/arthur/CostForecast/backend/CostForecast.Engine.Tests/RangeItemSerializationTests.cs) verifies:
- Creates a graph with a `RangeNode` and evaluates it
- Serializes the evaluated graph
- Asserts that all `RangeItemNode`s contain `rangeParentId` in their metadata

### Test Results
- Reproduction test: ✅ **PASSED**
- All engine tests: ✅ **62/62 passed**

## Impact
The frontend's [`detectRangeGroups`](file:///Users/arthur/CostForecast/frontend/src/components/charts/utils/rangeDetector.ts#L13-L38) function can now properly identify and group `RangeItemNode`s by their parent, making Range nodes visible in the Chart Breakdown UI selector.

Users can now create breakdown charts for Range-based collections such as:
```
items = Input("items")
result = Range(items, item.price * item.quantity)
```

The `result` node will now appear in the Chart Breakdown options, allowing users to visualize individual item contributions.
