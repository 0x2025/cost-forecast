# ADR: Lazy Evaluation for Volatile Range Operations

**Status**: Accepted  
**Date**: 2025-11-23  
**Decision Makers**: Development Team

## Context and Problem Statement

When implementing RangeNode for graph visualization, we discovered that nested Range operations fail when inner Ranges depend on parameters that only become available in outer Range contexts.

### Failing Test Case

```dsl
r: Param
c: Param
rows = Input("rows")  // [{r: 1}, {r: 2}]
cols = Input("cols")  // [{c: 10}, {c: 20}]
inner = Range(cols, r + c)
outer = Range(rows, SUM(inner))
total = SUM(outer)
```

**Expected**: 66.0  
**Actual**: 60.0

### Root Cause Analysis

**Execution Flow (Topological Sort Order):**
1. `r` - Param formula (returns ctx.Get("r") or 0.0)
2. `c` - Param formula (returns ctx.Get("c") or 0.0)
3. `rows` - Input evaluation
4. `cols` - Input evaluation
5. `inner` - **RangeNode evaluation**
6. `outer` - RangeNode evaluation
7. `total` - SUM formula

**Problem at Step 5 (`inner = Range(cols, r + c)`):**

When GraphEvaluator processes `inner` in the topological order:
- Iterates over `cols = [{c:10}, {c:20}]`
- For each item, creates child context with `c` value
- Evaluates target expression `r + c`
- **Critical Issue**: `r` is not in the item, not in global context
  - `r` is a Param that would return 0.0 in this context
  - Result: `inner = [0+10, 0+20] = [10, 20]`
- Stores `results["inner"] = [10, 20]`

**What Should Happen:**

`inner` should be **re-evaluated** when referenced inside `outer`'s target expression `SUM(inner)` because:
- `inner` is **volatile** (depends on param `r` )
- When `outer` iterates with `r=1`, `inner` should evaluate as `[1+10, 1+20] = [11, 21]`, SUM=32
- When `outer` iterates with `r=2`, `inner` should evaluate as `[2+10, 2+20] = [12, 22]`, SUM=34
- Then `outer = [32, 34]`, total = 66

**This is a cross-reference problem**: `inner` Range references a param (`r`) that only becomes available in a later Range's (`outer`) context.

## Decision

Implement **lazy/volatile Range re-evaluation** similar to the existing volatile FormulaNode handling in ParseExpression.

### Solution Approach

1. **Mark RangeNodes as volatile** when they depend (directly or transitively) on Params
2. **Defer Range result caching** for volatile RangeNodes
3. **Re-evaluate volatile RangeNodes** when referenced within another Range's target expression
4. **Use child context** for re-evaluation to access params from parent Range

### Implementation Strategy

#### Option A: Store Calculation Function (Similar to FormulaNode)
- Add a calculation function to RangeNode that executes the Range when called
- Check IsVolatile when parsing identifier references
- Return calculation function instead of cached result for volatile Ranges

#### Option B: Lazy Evaluation Flag
- Add `IsVolatile` flag to RangeNode
- Store both cached result AND calculation logic
- Re-execute when referenced in volatile context

**Chosen**: Option A (consistent with existing FormulaNode volatile handling)

## Implementation Details

### 1. Extend IsVolatile Check to RangeNode

```csharp
private bool IsVolatile(GraphNode node)
{
    if (_params.Contains(node.Name)) return true;
    if (node is RangeNode) return true; // Ranges are always considered volatile for now
    
    foreach (var dep in node.Dependencies)
    {
        if (IsVolatile(dep)) return true;
    }
    return false;
}
```

### 2. Update ParseExpression Identifier Handling

**Code Location**: [AstTranslator.cs:L217-L232](file:///Users/arthur/CostForecast/backend/CostForecast.Engine/Compiler/AstTranslator.cs#L217-L232)

```csharp
if (kind == "identifier")
{
    var name = GetText(node);
    if (scope.TryGetValue(name, out var dep))
    {
        // Check if the dependency is a volatile RangeNode
        if (dep is RangeNode rangeNode && IsVolatile(rangeNode))
        {
            // Return function that re-evaluates Range in current context
            return (ctx => ExecuteRange(rangeNode, ctx), new List<GraphNode> { dep });
        }
        // Check if volatile (Param or depends on Param)
        else if (dep is FormulaNode fn && IsVolatile(fn))
        {
            return (ctx => fn.Calculation(ctx), new List<GraphNode> { dep });
        }
        
        return (ctx => ctx.Get(name), new List<GraphNode> { dep });
    }
    throw new Exception($"Undefined variable: {name}");
}
```

**Key Points**:
- When an identifier references a volatile RangeNode, we return a **lazy evaluation function** `ctx => ExecuteRange(rangeNode, ctx)`
- This function is called whenever the Range is referenced, with the **current context**
- For nested Ranges, the inner Range gets the outer's child context containing param values

### 3. Add ExecuteRange Helper Method

**Code Location**: [AstTranslator.cs:L859-L904](file:///Users/arthur/CostForecast/backend/CostForecast.Engine/Compiler/AstTranslator.cs#L859-L904)

```csharp
private object ExecuteRange(RangeNode rangeNode, IEvaluationContext ctx)
{
    var sourceVal = rangeNode.SourceCalculation(ctx);
    var resultsList = new List<double>();
    
    // Convert source to enumerable
    IEnumerable<object> items;
    if (sourceVal is IEnumerable<object> e) items = e;
    else if (sourceVal is System.Collections.IEnumerable en) items = en.Cast<object>();
    else items = new[] { sourceVal };
    
    foreach (var item in items)
    {
        var childCtx = new ChildEvaluationContext(ctx);
        
        // Populate context from item properties
        if (item is IDictionary<string, object> dict)
        {
            foreach (var kvp in dict)
            {
                childCtx.Set(kvp.Key, kvp.Value);
            }
        }
        // ... handle JsonElement ...
        
        var resultObj = rangeNode.TargetCalculation(childCtx);
        resultsList.Add(Convert.ToDouble(resultObj));
    }
    
    return resultsList.ToArray();
}
```

## Consequences

### Positive
- Nested Range operations work correctly
- Consistent with existing volatile FormulaNode handling
- Enables powerful cross-referencing patterns in DSL

### Negative
- Volatile Ranges are re-evaluated on every reference (performance impact)
- Expansion data is only populated for non-volatile Ranges cached in GraphEvaluator
- More complex execution model

### Mitigation
- Consider caching volatile Range results per-context if performance becomes an issue
- Document that graph expansion only shows non-volatile Ranges

## Alternative Considered

**Reject Nested Volatile Ranges**: Simply mark the test as unsupported and throw an error when detecting this pattern.

**Rejected because**: This pattern is useful for SMEs modeling complex scenarios (e.g., iterating products, then iterating regions within each product calculation).

## Related Decisions

- [Range Runtime View ADR](file:///Users/arthur/CostForecast/plans/adr_range_runtime_view.md)
- Volatile FormulaNode handling in AstTranslator

## Verification

Test case `Should_Handle_Nested_Ranges_With_Object_Context` should pass with expected result of 66.0.
