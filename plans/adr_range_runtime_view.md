# ADR: Range Runtime View with RangeNode

**Status**: Accepted  
**Date**: 2025-11-23  
**Decision Makers**: Development Team, SME Stakeholders

## Context and Problem Statement

The CostForecast DSL includes a `Range()` function that iterates over collections and applies calculations to each item. The current graph visualization hides this iteration detail, showing Range as a single formula node. SMEs need to see the expanded view showing individual item calculations to understand and validate the cost model.

**Example DSL**:
```dsl
items: Input("items")
qty: Param
price: Param
result = Range(items, qty * price)
total = SUM(result)
```

**Current Graph**: Shows `result` as a single node depending on `items`, `qty`, and `price`.

**Desired Graph**: Shows individual item nodes like `$Input_items(1)` and `$Input_items(2)`, each with its own calculation and dependencies.

## Decision Drivers

1. **SME Requirements**: Subject Matter Experts need to study the final model with real data to validate calculations
2. **Runtime Nature**: The number of items in a collection is unknown until evaluation time
3. **Simplicity**: Implementation should be maintainable and easy to understand
4. **API Clarity**: API consumers only need the expanded runtime graph, not compile-time abstractions

## Considered Options

### Option 1: Compile-time Graph Expansion
**Approach**: Expand Range at compile time by creating placeholder nodes for potential items.

**Pros**:
- Graph structure is fully known before evaluation
- No need to modify evaluation logic

**Cons**:
- Requires knowing collection size at compile time (impossible in our case)
- Would need dummy placeholder nodes that get filled later
- Complex to handle dynamic-sized collections

**Decision**: ❌ Rejected - Collection size is only known at runtime

### Option 2: Metadata Flags on FormulaNode
**Approach**: Add metadata flags to FormulaNode to mark Range operations, then expand during serialization.

**Pros**:
- Minimal changes to node hierarchy
- Reuses existing FormulaNode structure

**Cons**:
- Requires checking metadata/flags everywhere
- Less type-safe
- Mixes Range-specific logic with general formula logic
- Harder to identify Range nodes in code

**Decision**: ❌ Rejected - Not clean, requires flag checking

### Option 3: Dedicated RangeNode Type with Runtime Expansion
**Approach**: Create a `RangeNode` type that extends `GraphNode`. During evaluation, populate expansion data (item nodes and calculations). Serialize expanded graph after evaluation.

**Pros**:
- ✅ Type-safe identification: `node is RangeNode`
- ✅ Clean separation of concerns
- ✅ Expansion data stored directly in RangeNode
- ✅ SMEs only see runtime graph with real data
- ✅ Simple to understand and maintain

**Cons**:
- Requires new node type in class hierarchy
- Evaluation and serialization phases are coupled

**Decision**: ✅ **Accepted**

## Decision

We will implement **Option 3: Dedicated RangeNode Type with Runtime Expansion**.

### Implementation Components

1. **RangeNode.cs**: New node type extending `GraphNode`
   - Stores source calculation and target calculation
   - Tracks param dependencies
   - Holds expansion data after evaluation

2. **AstTranslator.cs**: Create `RangeNode` when parsing Range function calls

3. **GraphEvaluator.cs**: Special handling for `RangeNode`
   - Execute Range iteration
   - Track each item: index, values, calculated result
   - Store expansion data in RangeNode instance

4. **GraphSerializer.cs**: Detect `RangeNode` and expand
   - Generate item nodes: `$Input_items(1)`, `$Input_items(2)`, etc.
   - Create edges from items to param dependencies
   - Connect parent node to expanded items

5. **API Response**: Return only expanded runtime graph

## Consequences

### Positive
- SMEs can study the actual execution flow with real data
- Type-safe code using `node is RangeNode` checks
- Clean architecture with dedicated node type
- Single source of truth: one runtime graph showing real execution

### Negative
- Graph structure depends on evaluation (can't serialize graph without evaluating first)
- Adds new class to node hierarchy

### Neutral
- Evaluation must complete before graph serialization
- Graph size grows with collection size (expected and desired)

## Examples

### Input
```dsl
items: Input("items")
qty: Param
price: Param
result = Range(items, qty * price)
total = SUM(result)
```

With input: `items = [{"qty": 2, "price": 10}, {"qty": 3, "price": 5}]`

### Output Graph (Expanded Runtime View)
```json
{
  "nodes": [
    {"id": "items", "type": "formula"},
    {"id": "qty", "type": "formula"},
    {"id": "price", "type": "formula"},
    {"id": "result", "type": "range"},
    {"id": "total", "type": "formula"},
    {"id": "$Input_items(1)", "type": "range_item", "metadata": {"index": 0, "value": 20}},
    {"id": "$Input_items(2)", "type": "range_item", "metadata": {"index": 1, "value": 15}}
  ],
  "edges": [
    {"source": "result", "target": "items"},
    {"source": "items", "target": "$Input_items(1)"},
    {"source": "items", "target": "$Input_items(2)"},
    {"source": "$Input_items(1)", "target": "qty"},
    {"source": "$Input_items(1)", "target": "price"},
    {"source": "$Input_items(2)", "target": "qty"},
    {"source": "$Input_items(2)", "target": "price"},
    {"source": "total", "target": "result"}
  ]
}
```

## Related Decisions

- DSL Design: Use of `Param` type for iteration variables
- Graph Visualization: How frontend renders expanded nodes
- API Design: Evaluation-first approach for graph generation

## Updates

### 2025-11-26: Keep Engine Pure - Derive Display Metadata in Serializer

**Context**: The frontend's Chart Breakdown feature needed `rangeParentId` metadata to group `RangeItemNode`s. Initial implementation added a `ParentId` property to `RangeItemNode` and populated it during evaluation.

**Problem**: This violated separation of concerns by storing presentation-specific data in the core engine.

**Decision**: Derive `rangeParentId` from graph structure during serialization instead of storing it in `RangeItemNode`.

**Implementation**: 
In `GraphSerializer.cs`, when serializing a `RangeItemNode`, find its parent `RangeNode` by checking which `RangeNode` has this item as a dependency:

```csharp
var parentRangeNode = allNodes
    .OfType<RangeNode>()
    .FirstOrDefault(r => r.Dependencies.Contains(node));

if (parentRangeNode != null)
{
    nodeDto.Metadata["rangeParentId"] = parentRangeNode.Name;
}
```

**Rationale**:
- **Separation of Concerns**: Core engine (`RangeItemNode`) focuses on computation, serializer handles presentation
- **Single Source of Truth**: Parent-child relationship already exists in the graph dependency structure
- **Maintainability**: Display logic is centralized in the serializer where it belongs

**Impact**: `RangeItemNode` remains pure without presentation-specific properties. The relationship is derived on-demand during serialization.

## References

- [Implementation Plan](../walkthroughs/graph_cloning_implementation_plan.md)
- [Chart Breakdown Fix Walkthrough](../walkthroughs/chart_breakdown_range_parent_fix.md)
- User Feedback (2025-11-23): API should return runtime graph only, use node types instead of metadata
- User Feedback (2025-11-26): Keep display logic in serializer and keep the engine pure

