# ADR: Two-Phase Compilation for Range Detection

**Status**: Accepted  
**Date**: 2025-11-23  
**Decision Makers**: Development Team

## Context and Problem Statement

When compiling DSL into a DependencyGraph, we need to identify Range operations and create appropriate RangeNode instances. However, Range operations appear as function calls within expressions, which are only parsed in the second phase after all variables are declared.

### The Challenge

In the DSL compilation process:
1. **Pass 1**: Identify variables and create placeholder nodes
2. **Pass 2**: Parse expressions and populate calculation logic

The problem: We can't create a RangeNode with the correct type in Pass 1 if we can't parse expressions yet, but we also can't replace a node in the graph after it's been added (DependencyGraph doesn't support node replacement).

## Decision

Implement **early Range detection in Pass 1** by checking if an assignment's expression is a Range function call, even before fully parsing the expression.

### Solution Approach

**Pass 1 - Early Detection**:
```csharp
// In Pass 1, check if content is a Range operation
if (IsRangeOperation(content))
{
    // Create RangeNode placeholder - will be populated in Pass 2
    node = new RangeNode(name, _ => null, _ => null);
}
else
{
    // Create generic FormulaNode
    node = new FormulaNode(name, _ => null);
}
```

**IsRangeOperation Helper**:
```csharp
private bool IsRangeOperation(Node node)
{
    // Unwrap expression wrappers
    while (node.Kind == "expression")
    {
        if (node.NamedChildCount < 1) return false;
        node = node.NamedChild(0);
    }

    // Check if it's a function call to "Range"
    if (node.Kind == "function_call" && node.NamedChildCount >= 1)
    {
        var funcNode = node.NamedChild(0);
        var funcName = GetText(funcNode).Trim();
        return funcName == "Range";
    }

    return false;
}
```

**Pass 2 - Population**:
```csharp
if (graphNode is RangeNode rangeNode)
{
    // Parse Range expression and populate source/target calculations
    var (sourceCalc, targetCalc, deps) = ParseRangeExpression(contentNode, nodes, graph);
    
    // Set the calculations (RangeNode properties are settable for this reason)
    rangeNode.SourceCalculation = sourceCalc;
    rangeNode.TargetCalculation = targetCalc;
    
    // Add dependencies
    foreach (var dep in deps)
    {
        rangeNode.AddDependency(dep);
    }
}
```

## Alternatives Considered

### Alternative 1: Single-Pass Compilation

**Approach**: Parse everything in one pass, creating nodes as needed.

**Rejected because**:
- Forward references wouldn't work (`result = a + b` before `a` is declared)
- Circular references would be harder to detect
- Existing architecture relies on two phases

### Alternative 2: Node Replacement in Pass 2

**Approach**: Create generic FormulaNode in Pass 1, replace with RangeNode in Pass 2.

**Rejected because**:
- DependencyGraph doesn't support node removal/replacement
- Would require graph restructuring APIs
- Other nodes might already reference the old node

### Alternative 3: Delay Graph Addition Until Pass 2

**Approach**: Create nodes in Pass 1 but don't add to graph until Pass 2.

**Rejected because**:
- Would require tracking nodes separately
- Complicates dependency resolution
- Breaks existing architecture assumptions

## Implementation Details

### Code Locations

- **IsRangeOperation**: [AstTranslator.cs:L807-L822](file:///Users/arthur/CostForecast/backend/CostForecast.Engine/Compiler/AstTranslator.cs#L807-L822)
- **Pass 1 Detection**: [AstTranslator.cs:L101-L107](file:///Users/arthur/CostForecast/backend/CostForecast.Engine/Compiler/AstTranslator.cs#L101-L107)
- **Pass 2 Population**: [AstTranslator.cs:L163-L177](file:///Users/arthur/CostForecast/backend/CostForecast.Engine/Compiler/AstTranslator.cs#L163-L177)
- **ParseRangeExpression**: [AstTranslator.cs:L824-L857](file:///Users/arthur/CostForecast/backend/CostForecast.Engine/Compiler/AstTranslator.cs#L824-L857)

### Key Design Decisions

1. **Settable Properties**: RangeNode's `SourceCalculation` and `TargetCalculation` are settable (not readonly) to allow Pass 2 population
2. **Shallow AST Inspection**: `IsRangeOperation` only checks function name, doesn't validate arguments
3. **Null Placeholders**: Pass 1 creates RangeNode with `_ => null` placeholders that are replaced in Pass 2

## Consequences

### Positive

- ✅ Clean separation: detection vs. population
- ✅ No graph restructuring needed
- ✅ Maintains existing two-phase architecture
- ✅ Type-safe: RangeNode from the start, not cast in Pass 2

### Negative

- ⚠️ AST traversed twice (once for detection, once for parsing)
- ⚠️ RangeNode has mutable properties for Pass 2 population
- ⚠️ Tight coupling between IsRangeOperation and actual Range parsing

### Mitigation

- Performance impact is negligible (compilation happens once per DSL source)
- Mutable properties are only modified during compilation, not during evaluation
- Unit tests ensure IsRangeOperation and ParseRangeExpression stay in sync

## Related Decisions

- [Range Runtime View ADR](file:///Users/arthur/CostForecast/plans/adr_range_runtime_view.md)
- [Lazy Evaluation ADR](file:///Users/arthur/CostForecast/plans/adr_range_lazy_evaluation.md)

## Verification

The approach is verified by:
- All Range tests passing (7 tests)
- Graph serialization tests confirming RangeNode is created correctly
- No regressions in existing 46 tests
