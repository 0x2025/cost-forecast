# ADR: Parser and Evaluator Architecture

**Status**: Accepted  
**Date**: 2025-11-25  
**Authors**: CostForecast Engineering Team

## Context

The CostForecast DSL requires a robust compilation and evaluation system that can:
- Parse complex mathematical expressions with Excel-like syntax
- Support comparison operators for conditional logic
- Handle deferred execution for dynamic inputs
- Process recursive expressions and nested function calls
- Maintain clear separation between compilation and evaluation phases

## Decision

We implement a **two-phase compilation model** with **deferred lambda-based evaluation**.

### Architecture Overview

```
DSL Source → Tree-sitter Parse → AST → AstTranslator → DependencyGraph → GraphEvaluator → Results
```

## Key Design Decisions

### 1. Deferred Execution via Lambda Functions

**Decision**: Store calculations as lambda functions (`Func<IEvaluationContext, object>`) that are created during compilation but executed during evaluation.

**Rationale**:
- **Dynamic Input Resolution**: Inputs are only available at evaluation time, not compilation time
- **Multiple Evaluations**: Same compiled graph can be evaluated with different input sets
- **Context Propagation**: Lambda closures capture dependencies while still accepting runtime context

**Implementation**:
```csharp
// During compilation (AstTranslator.cs)
Func<IEvaluationContext, object> calc = ctx => {
    var left = leftCalc(ctx);   // Deferred execution of left operand
    var right = rightCalc(ctx);  // Deferred execution of right operand
    return left + right;
};

// During evaluation (GraphEvaluator.cs)
results[node.Name] = formula.Calculation(contextWrapper);
```

**Benefits**:
- Clean separation of concerns (compilation vs evaluation)
- Memory efficient (calculations stored as code, not data)
- Enables lazy evaluation and short-circuit logic

### 2. Recursive Expression Handling

**Decision**: Use recursive descent pattern in `ParseExpression` method with tuple returns `(Func<IEvaluationContext, object>, List<GraphNode>)`.

**Rationale**:
- **Natural AST Traversal**: Recursion mirrors the tree structure of expressions
- **Dependency Tracking**: Return both calculation lambda AND dependencies for graph construction
- **Composability**: Outer expressions consume inner expressions' lambdas

**Implementation Pattern**:
```csharp
private (Func<IEvaluationContext, object>, List<GraphNode>) ParseExpression(
    TSNode node, 
    Dictionary<string, GraphNode> scope, 
    DependencyGraph graph)
{
    if (node.Kind == "binary_expression")
    {
        // Recursively parse left and right
        var (leftCalc, leftDeps) = ParseExpression(leftNode, scope, graph);
        var (rightCalc, rightDeps) = ParseExpression(rightNode, scope, graph);
        
        // Combine into new lambda
        Func<IEvaluationContext, object> calc = ctx => {
            var l = ConvertToDouble(leftCalc(ctx));
            var r = ConvertToDouble(rightCalc(ctx));
            return l + r;
        };
        
        // Merge dependencies
        var deps = new List<GraphNode>();
        deps.AddRange(leftDeps);
        deps.AddRange(rightDeps);
        
        return (calc, deps);
    }
    // ... handle other node types
}
```

**Examples of Recursion**:
- `x + y * z` → Parse `+` → Recursively parse `x` and `y * z` → Recursively parse `y` and `z`
- `If(a > b, c * 2, d / 3)` → Parse `If` → Parse `a > b` → Parse `a` and `b` → Parse `c * 2` → etc.

### 3. Operator Handling

**Decision**: Implement operators in C# switch expressions within lambda closures, with specific handling for arithmetic vs comparison operators.

#### 3.1 Arithmetic Operators

**Implementation** ([`AstTranslator.cs:288-295`](file:///Users/arthur/CostForecast/backend/CostForecast.Engine/Compiler/AstTranslator.cs#L288-L295)):
```csharp
return op switch
{
    "+" => l + r,
    "-" => l - r,
    "*" => l * r,
    "/" => l / r,
    "^" => Math.Pow(l, r),
    _ => throw new NotImplementedException($"Operator {op}")
};
```

**Precedence**: Handled by grammar (`grammar.js`), not evaluator
- Multiplication/Division: `prec.left(2, ...)`
- Addition/Subtraction: `prec.left(1, ...)`
- Exponentiation: `prec.right(3, ...)`

#### 3.2 Comparison Operators

**Implementation** ([`AstTranslator.cs:296-303`](file:///Users/arthur/CostForecast/backend/CostForecast.Engine/Compiler/AstTranslator.cs#L296-L303)):
```csharp
return op switch
{
    ">" => l > r ? 1.0 : 0.0,
    "<" => l < r ? 1.0 : 0.0,
    ">=" => l >= r ? 1.0 : 0.0,
    "<=" => l <= r ? 1.0 : 0.0,
    "=" => Math.Abs(l - r) < 1e-9 ? 1.0 : 0.0,    // Floating-point equality
    "<>" => Math.Abs(l - r) >= 1e-9 ? 1.0 : 0.0,  // Not equal
    _ => throw new NotImplementedException($"Operator {op}")
};
```

**Design Choices**:
- **Excel-Style Booleans**: Return `1.0` for true, `0.0` for false (compatible with IF function)
- **Floating-Point Tolerance**: Use `1e-9` tolerance for equality to handle `0.1 + 0.2 = 0.3`
- **Case Sensitivity**: Operators are symbols, always case-sensitive by nature

**Precedence**: Lowest precedence (`prec.left(0, ...)`) so comparisons bind loosely

### 4. Function Name Resolution

**Decision**: Use **case-insensitive** function name matching for all user-facing functions.

**Implementation**:
```csharp
var funcNameUpper = funcName.ToUpper();

if (funcNameUpper == "SUM") return flatValues.Sum();
if (funcNameUpper == "IF") { /* IF logic */ }
// etc.
```

**Rationale**:
- **User Convenience**: Users shouldn't have to remember exact casing (`If` vs `IF` vs `if`)
- **Excel Compatibility**: Excel functions are case-insensitive
- **Consistency**: Applies to all built-in functions (SUM, AVERAGE, MAX, MIN, IF, etc.)

**Exception**: Language keywords like `Input`, `Const`, `Param` are checked during parsing before lambda creation, so they remain case-sensitive in current implementation.

### 5. Two-Pass Compilation

**Decision**: Separate compilation into two distinct passes.

#### Pass 1: Graph Construction
- Create graph nodes for all declarations and assignments
- Identify node types (ConstantNode, InputNode, ParamNode, FormulaNode, RangeNode)
- Build initial dependency structure
- **Purpose**: Ensure all nodes exist before references are resolved

#### Pass 2: Lambda Creation
- Parse expressions recursively
- Create calculation lambdas
- Link dependencies between nodes
- **Purpose**: Resolve forward references and create executable graph

**Example**:
```javascript
x = y + 1    // y referenced before declaration
y = 10
```

- Pass 1: Create nodes for `x` and `y`
- Pass 2: `x`'s lambda can reference `y` node created in Pass 1

### 6. Context Hierarchy for Range Operations

**Decision**: Implement hierarchical evaluation context with child contexts for `Range` iteration.

**Implementation**:
```csharp
public class ChildEvaluationContext : IEvaluationContext
{
    private readonly IEvaluationContext _parent;
    private readonly Dictionary<string, object> _localValues;
    
    public object Get(string name)
    {
        // Check local scope first, then fall back to parent
        if (_localValues.TryGetValue(name, out var value))
            return value;
        return _parent.Get(name);
    }
}
```

**Use Case**: `Range(items, price * qty)`
- Parent context: Has global variables and `items` input
- Child context per iteration: Has current `price` and `qty` from iteration
- Fallback: Can still access global variables if not shadowed

## Consequences

### Positive

✅ **Clean Separation**: Compilation and evaluation are completely separate  
✅ **Reusable Graphs**: Same graph works with different inputs  
✅ **Type Safety**: C# type system catches operator misuse at compile time  
✅ **Performance**: Lambda compilation is one-time cost, evaluation is fast  
✅ **Extensibility**: Easy to add new operators or functions  
✅ **Excel Compatibility**: Matches Excel's operator behavior and precedence

### Negative

⚠️ **Memory Usage**: Lambdas capture closures, may use more memory than direct evaluation  
⚠️ **Debugging**: Lambda-based evaluation harder to debug than imperative code  
⚠️ **Error Messages**: Stack traces show lambda internals, not DSL source locations

### Mitigations

- Keep lambda bodies small and focused
- Use strategic debug logging at key evaluation points
- Implement comprehensive test coverage to catch issues early
- Consider adding source location tracking for better error messages (future)

## Alternatives Considered

### 1. Direct Interpretation (Rejected)

**Approach**: Evaluate expressions directly during AST traversal without creating intermediate graph.

**Rejected Because**:
- Can't support forward references
- Can't reuse compilation for multiple input sets
- Harder to optimize or analyze dependencies

### 2. Bytecode Compilation (Rejected)

**Approach**: Compile to custom bytecode, then interpret.

**Rejected Because**:
- Overly complex for current needs
- Harder to maintain and debug
- Lambda-based approach provides similar benefits with less code

### 3. Dynamic LINQ Expression Trees (Rejected)

**Approach**: Use .NET Expression API to build compilable expression trees.

**Rejected Because**:
- More verbose and complex
- Harder to handle special cases like Range iteration
- Lambda approach is more flexible and straightforward

## Related Decisions

- Grammar Design (see `language/grammar.js`)
- Type System (currently untyped, everything via `object`)
- Error Handling Strategy
- Input Provider Interface

## References

- [AstTranslator.cs](file:///Users/arthur/CostForecast/backend/CostForecast.Engine/Compiler/AstTranslator.cs) - Main compilation logic
- [GraphEvaluator.cs](file:///Users/arthur/CostForecast/backend/CostForecast.Engine/Evaluator/GraphEvaluator.cs) - Evaluation engine
- [IEvaluationContext.cs](file:///Users/arthur/CostForecast/backend/CostForecast.Engine/Core/IEvaluationContext.cs) - Context abstraction
- [grammar.js](file:///Users/arthur/CostForecast/language/grammar.js) - DSL grammar definition

## Revision History

| Date | Author | Changes |
|------|--------|---------|
| 2025-11-25 | Team | Initial ADR creation after IF statement fix |
