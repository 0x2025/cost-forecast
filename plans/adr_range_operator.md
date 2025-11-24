# ADR: Range Operator and Hierarchical Context Management

## Status
Accepted

## Context
The CostForecast DSL requires a way to perform iterative calculations over arrays of data. Specifically, we need a `Range` function that can take a source array and apply a formula to each element, producing a new array of results. This is similar to `MAP` or `LAMBDA` helper functions in Excel.

A key challenge is variable scoping. The formula applied to each element needs to reference the "current item" of the iteration. We introduced a `Param` variable type for this purpose. Furthermore, evaluating this formula repeatedly requires an efficient way to manage the evaluation context (variable state) without the performance overhead of deep cloning the entire global state for every iteration.

## Decision

We implemented a **Hierarchical Evaluation Context** system and a specific execution strategy for the `Range` operator.

### 1. Hierarchical Context System

Instead of passing a simple `Dictionary<string, object>` to every node calculation, we introduced an interface `IEvaluationContext`.

#### `IEvaluationContext` Interface
```csharp
public interface IEvaluationContext
{
    object Get(string name);
    void Set(string name, object value);
    bool ContainsKey(string name);
}
```

#### `RootEvaluationContext`
*   **Purpose**: Represents the global scope or the top-level evaluation state.
*   **Implementation**: Wraps the standard `Dictionary<string, object>` used by the `GraphEvaluator`.
*   **Usage**: Used when starting the evaluation of the dependency graph.

#### `ChildEvaluationContext`
*   **Purpose**: Represents a local scope, such as a single iteration within a `Range` loop.
*   **Implementation**:
    *   Holds a reference to a **parent** `IEvaluationContext`.
    *   Maintains its own local `Dictionary<string, object>` for variables defined or overridden in this scope (e.g., the `Param` variable).
*   **Lookup Logic (`Get`)**:
    1.  Checks the local dictionary.
    2.  If found, returns the local value.
    3.  If not found, delegates the call to the parent context.
*   **Benefits**:
    *   **Performance**: Avoids copying the entire global state. Only new/changed variables are stored locally.
    *   **Isolation**: Changes in the child context (like setting the `Param` value) do not affect the parent/global context.

### 2. Range Operator Implementation

The `Range(source, target)` function is implemented in `AstTranslator.cs` with the following logic:

#### Compilation Phase
1.  **Expression Parsing**: The compiler parses both `source` and `target` expressions.
2.  **No Implicit Binding**: Unlike the previous design, the compiler does *not* attempt to guess or bind a specific `Param` variable. The `target` expression is simply a formula that will be evaluated in a child context.

#### Execution Phase
The `Range` node's calculation delegate performs these steps:
1.  **Evaluate Source**: Calculates the `source` expression. This is expected to be a collection of objects (e.g., `IEnumerable<IDictionary<string, object>>` or `IEnumerable<JsonElement>`).
2.  **Iterate**: Loops through each item in the source collection.
3.  **Context Creation**: For each item, a new `ChildEvaluationContext` is created.
4.  **Context Population**: The properties of the current item are pushed into the `ChildEvaluationContext`.
    *   If the item is `{ "p": 10, "q": 20 }`, then `p` and `q` become available in the context.
5.  **Evaluate Target**: The `target` expression is evaluated using this populated child context.
    *   Variables like `p` (defined as `p: Param`) will resolve to the values set in the context (e.g., 10).
6.  **Collect Results**: The result of the `target` evaluation is added to a list.
7.  **Return**: The list of results is returned as an array.

### 3. Aggregation Functions
Functions like `SUM`, `AVERAGE`, `MIN`, and `MAX` were updated to handle array inputs. They now flatten any arrays or collections passed as arguments before performing the calculation. This allows them to seamlessly consume the output of a `Range` function.

## Consequences

### Positive
*   **Flexibility**: Supports iterating over complex objects with multiple properties.
*   **Simplicity**: Removes complex dependency analysis and "param hunting" from the compiler.
*   **Correctness**: Solves ambiguity issues in nested ranges. The data structure itself defines the variable scope.
*   **Alignment**: Matches the "Context" mental model where iteration pushes a new layer of state.

### Negative
*   **Strictness**: Requires the source data to be structured as objects (dictionaries) if named parameters are used. Simple arrays `[1, 2, 3]` are treated as single-item contexts (implementation detail: currently requires objects for named lookup).

## Example

**DSL:**
```
p: Param
base = 100
// inputs is [{ "p": 1 }, { "p": 2 }, { "p": 3 }]
results = Range(inputs, p * base)
total = SUM(results)
```

**Execution Flow:**
1.  `base` is 100 in Root Context.
2.  `Range` starts.
3.  **Iter 1**: Item `{p: 1}`. Child Context `{p: 1}` -> Parent `{base: 100}`. Calc: `1 * 100 = 100`.
4.  **Iter 2**: Item `{p: 2}`. Child Context `{p: 2}` -> Parent `{base: 100}`. Calc: `2 * 100 = 200`.
5.  **Iter 3**: Item `{p: 3}`. Child Context `{p: 3}` -> Parent `{base: 100}`. Calc: `3 * 100 = 300`.
6.  `Range` returns `[100, 200, 300]`.
7.  `SUM` flattens `[100, 200, 300]` and returns `600`.

## Future Work
*   Add support for `Map`, `Filter`, `Reduce` using the same context mechanism.
*   Consider syntax for "renaming" or "aliasing" context variables if collisions occur in nested ranges (though the inner context naturally shadows the outer).