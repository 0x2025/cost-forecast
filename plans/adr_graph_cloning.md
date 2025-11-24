# ADR: Graph Cloning for Runtime Expansion

**Status**: Accepted  
**Date**: 2025-11-23  
**Decision Makers**: Development Team

## Context and Problem Statement

When implementing Range graph expansion, we need to decide how to represent the runtime-expanded graph structure. The challenge is balancing between:
- Keeping compiled graphs reusable and immutable
- Showing actual runtime execution in the graph
- Avoiding duplication of expansion logic
- Maintaining a single source of truth

### The Core Principle

**`compiled_graph + input_data = evaluated_graph`**

This formula represents our fundamental architecture: the compiled graph is a template that, when combined with specific input data, produces an evaluated graph showing the actual execution.

## Decision

Implement a **graph cloning architecture** where:

1. **Compiled Graph**: Immutable, reusable template created by the compiler
2. **Evaluated Graph**: Cloned from compiled graph, then mutated during evaluation to add runtime nodes
3. **Serialization**: Serializes the evaluated graph directly (no special expansion logic)

### Architecture Flow

```
DSL Source
    ↓
  Compile
    ↓
Compiled Graph (immutable, reusable)
    ↓
  Clone + Evaluate (with input_data)
    ↓
Evaluated Graph (immutable after evaluation, contains runtime nodes)
    ↓
  Serialize
    ↓
Graph DTO (sent to API)
```

## Implementation Details

### 1. Graph Cloning

**DependencyGraph.Clone()**: Creates a deep copy of the graph including all nodes and dependencies.

```csharp
public DependencyGraph Clone()
{
    var cloned = new DependencyGraph();
    var nodeMap = new Dictionary<GraphNode, GraphNode>();
    
    // Clone nodes
    foreach (var node in _nodes.Values)
    {
        var clonedNode = CloneNode(node);
        nodeMap[node] = clonedNode;
        cloned.AddNode(clonedNode);
    }
    
    // Clone dependencies
    foreach (var (original, clonedNode) in nodeMap)
    {
        foreach (var dep in original.Dependencies)
        {
            clonedNode.AddDependency(nodeMap[dep]);
        }
    }
    
    return cloned;
}
```

### 2. Evaluation Returns Evaluated Graph

**GraphEvaluator.Evaluate()**: Returns both calculation results and the mutated graph.

```csharp
public (Dictionary<string, object> Results, DependencyGraph EvaluatedGraph) 
    Evaluate(DependencyGraph compiledGraph, CalculationContext context)
{
    // Clone compiled graph (keep original immutable)
    var evaluatedGraph = compiledGraph.Clone();
    var results = new Dictionary<string, object>();
    
    // Evaluate and mutate evaluatedGraph during Range execution
    // ...
    
    return (results, evaluatedGraph);
}
```

### 3. Range Item Nodes Added During Evaluation

When evaluating a RangeNode:
- Create actual FormulaNode instances for each item (`result(1)`, `result(2)`, ...)
- Add these nodes to `evaluatedGraph`
- Connect them with proper edges (source → item, item → params)

**Result**: The evaluated graph contains the actual runtime structure.

### 4. Simplified Serialization

**GraphSerializer.SerializeGraph()**: No special Range logic needed.

```csharp
public static GraphDto SerializeGraph(DependencyGraph graph)
{
    // Simply serialize what's in the graph
    // No expansion logic, no special cases
    // Just iterate nodes and edges
}
```

## Rationale

### Why Clone Instead of Mutate Original?

**Rejected Alternative**: Mutate the compiled graph directly during evaluation.

**Problems**:
- ❌ Compiled graph becomes stateful
- ❌ Can't reuse compiled graph for different inputs
- ❌ Must recompile for each calculation

**Cloning solves this**:
- ✅ Compiled graph stays immutable and reusable
- ✅ Each evaluation gets its own graph instance
- ✅ Compiled graph is a pure template

### Why Add Nodes During Evaluation?

**Rejected Alternative**: Store expansion data in RangeNode, generate nodes during serialization.

**Problems**:
- ❌ Expansion logic duplicated (evaluator + serializer)
- ❌ Graph structure differs between evaluation and serialization
- ❌ No single source of truth
- ❌ Serializer has complex special-case logic

**Adding nodes during evaluation**:
- ✅ Single source of truth (the graph itself)
- ✅ Simpler serializer (just serialize what exists)
- ✅ Evaluated graph = serialized graph = what executed
- ✅ Can inspect evaluated graph directly for debugging

## Formula Breakdown

### `compiled_graph + input_data = evaluated_graph`

| Component | Characteristics | Lifecycle |
|-----------|----------------|-----------|
| **compiled_graph** | Immutable, reusable template | Created once by compiler, cached |
| **input_data** | Runtime values (e.g., items array) | Provided per API request |
| **evaluated_graph** | Cloned + mutated with runtime nodes | Created per evaluation, immutable after |

### Example

**DSL**:
```dsl
items: Input("items")
result = Range(items, qty * price)
```

**Compiled Graph** (template):
- Nodes: `items`, `qty`, `price`, `result` (Range)
- No item-specific nodes

**Input Data**:
```json
{
  "items": [
    {"qty": 2, "price": 10},
    {"qty": 3, "price": 15}
  ]
}
```

**Evaluated Graph** (after `compiled_graph + input_data`):
- Nodes: `items`, `qty`, `price`, `result`, **`result(1)`, `result(2)`**
- Edges: `items` → `result(1)`, `items` → `result(2)`, etc.

## Consequences

### Positive

✅ **Single Source of Truth**: The evaluated graph IS the execution record
✅ **Separation of Concerns**: Compilation separate from evaluation
✅ **Reusability**: Compiled graph can be cached and reused
✅ **Simplified Serializer**: No expansion logic, just serialize graph
✅ **Transparency**: Can inspect evaluated graph to see exactly what ran
✅ **Consistency**: Evaluated graph = serialized graph = UI visualization

### Negative

⚠️ **Memory**: Each evaluation creates a new graph instance
⚠️ **Cloning Cost**: Deep copy of all nodes and edges
⚠️ **Graph Mutation**: Evaluation mutates graph structure (adding nodes)

### Mitigation

- Memory/cloning cost is acceptable for typical DSL sizes (< 1000 nodes)
- Can add graph pooling/recycling if needed for high-throughput scenarios
- Mutation is contained within evaluation - evaluated graph is immutable after

## Alternatives Considered

### Alternative 1: Mutate Compiled Graph

**Rejected**: Breaks reusability, requires recompilation for each input.

### Alternative 2: Virtual Expansion in Serializer

**Rejected**: Current approach. Duplicates logic, no single source of truth.

### Alternative 3: Lazy Node Generation

Generate nodes on-demand during graph traversal.

**Rejected**: Complex, harder to inspect, no materialized graph to serialize.

## Related Decisions

- [Range Runtime View ADR](file:///Users/arthur/CostForecast/plans/adr_range_runtime_view.md)
- [Lazy Evaluation ADR](file:///Users/arthur/CostForecast/plans/adr_range_lazy_evaluation.md)
- [Two-Phase Compilation ADR](file:///Users/arthur/CostForecast/plans/adr_two_phase_compilation.md)

## Verification

The formula `compiled_graph + input_data = evaluated_graph` should be verifiable by:
1. Compiling a DSL once → `compiled_graph`
2. Evaluating with `input_data_1` → `evaluated_graph_1`
3. Evaluating same `compiled_graph` with `input_data_2` → `evaluated_graph_2`
4. Asserting: `compiled_graph` unchanged, `evaluated_graph_1 ≠ evaluated_graph_2`
5. Asserting: serialized graph matches evaluated graph structure

## Implementation Status

- [ ] Add DependencyGraph.Clone() method
- [ ] Update GraphEvaluator to return (results, graph) tuple
- [ ] Create item nodes during Range evaluation
- [ ] Simplify GraphSerializer (remove expansion logic)
- [ ] Update API to use evaluated graph
- [ ] Update all tests to expect new signature
- [ ] Remove ExpansionData from RangeNode
