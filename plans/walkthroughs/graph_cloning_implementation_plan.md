# Refactor: Graph Cloning for Range Expansion

## Overview

Refactor to implement cleaner architecture: `compiled_graph + input_data = evaluated_graph`

**Current Issues:**
- Expansion logic duplicated in evaluator (stores data) and serializer (generates nodes)
- Graph structure during serialization differs from evaluation
- No single source of truth for what actually executed

**New Approach:**
1. `compiled_graph` remains immutable (can be reused)
2. Clone compiled_graph → `evaluated_graph` before evaluation
3. During evaluation, add actual Range item nodes to `evaluated_graph`
4. Return `evaluated_graph` (immutable after evaluation)
5. Serializer has no special Range logic - just serialize what's in the graph

## Proposed Changes

### 1. Add Graph Cloning to DependencyGraph

**File**: `CostForecast.Engine/Core/DependencyGraph.cs`

Add method to clone the graph:
```csharp
public DependencyGraph Clone()
{
    var cloned = new DependencyGraph();
    
    // Clone all nodes
    var nodeMap = new Dictionary<GraphNode, GraphNode>();
    foreach (var node in _nodes.Values)
    {
        GraphNode clonedNode = node switch
        {
            ConstantNode c => new ConstantNode(c.Name, c.Value),
            InputNode i => new InputNode(i.Name, i.Key),
            FormulaNode f => new FormulaNode(f.Name, f.Calculation),
            RangeNode r => new RangeNode(r.Name, r.SourceCalculation, r.TargetCalculation),
            ParamNode p => new ParamNode(p.Name, p.DefaultValue),
            _ => throw new NotSupportedException($"Cannot clone {node.GetType().Name}")
        };
        
        nodeMap[node] = clonedNode;
        cloned.AddNode(clonedNode);
    }
    
    // Clone dependencies
    foreach (var (original, cloned) in nodeMap)
    {
        foreach (var dep in original.Dependencies)
        {
            cloned.AddDependency(nodeMap[dep]);
        }
    }
    
    return cloned;
}
```

### 2. Update GraphEvaluator to Return Evaluated Graph

**File**: `CostForecast.Engine/Evaluator/GraphEvaluator.cs`

Change signature to return both results and evaluated graph:
```csharp
public (Dictionary<string, object> Results, DependencyGraph EvaluatedGraph) 
    Evaluate(DependencyGraph compiledGraph, CalculationContext context)
{
    // Clone the compiled graph
    var evaluatedGraph = compiledGraph.Clone();
    var results = new Dictionary<string, object>();
    var executionOrder = evaluatedGraph.GetExecutionOrder();
    
    // ... existing evaluation logic ...
}
```

### 3. Create Range Item Nodes During Evaluation

**File**: `CostForecast.Engine/Evaluator/GraphEvaluator.cs`

When evaluating RangeNode, create and add item nodes:
```csharp
else if (node is RangeNode rangeNode)
{
    var sourceVal = rangeNode.SourceCalculation(contextWrapper);
    var resultsList = new List<double>();
    
    // ... iteration logic ...
    
    int index = 0;
    foreach (var item in items)
    {
        var childCtx = new ChildEvaluationContext(contextWrapper);
        
        // Populate context from item
        // ... existing logic ...
        
        var resultObj = rangeNode.TargetCalculation(childCtx);
        var resultVal = ConvertToDouble(resultObj);
        resultsList.Add(resultVal);
        
        // Create item node and add to graph
        var itemNodeName = $"{node.Name}({index + 1})";
        var itemNode = new FormulaNode(itemNodeName, _ => resultVal);
        evaluatedGraph.AddNode(itemNode);
        
        // Add edge from source to item
        var sourceDep = rangeNode.Dependencies.FirstOrDefault();
        if (sourceDep != null)
        {
            itemNode.AddDependency(sourceDep);
        }
        
        // Add edges from item to params
        foreach (var paramDep in GetParamDependencies(childCtx))
        {
            itemNode.AddDependency(paramDep);
        }
        
        index++;
    }
    
    results[node.Name] = resultsList.ToArray();
}
```

### 4. Simplify GraphSerializer

**File**: `CostForecast.Engine/Evaluator/GraphSerializer.cs`

Remove all special Range expansion logic:
```csharp
public static GraphDto SerializeGraph(DependencyGraph graph)
{
    var graphDto = new GraphDto();
    var allNodes = graph.GetAllNodes();

    // Create node DTOs - NO special Range handling
    foreach (var node in allNodes)
    {
        var nodeDto = new GraphNodeDto
        {
            Id = node.Name,
            Label = node.Name
        };

        if (node is ConstantNode constantNode)
        {
            nodeDto.Type = "constant";
            nodeDto.Metadata = new Dictionary<string, object>
            {
                { "value", constantNode.Value }
            };
        }
        else if (node is InputNode inputNode)
        {
            nodeDto.Type = "input";
            // ...
        }
        else if (node is RangeNode)
        {
            nodeDto.Type = "range";
        }
        else if (node is FormulaNode)
        {
            nodeDto.Type = "formula";
        }
        // ...
        
        graphDto.Nodes.Add(nodeDto);
    }

    // Create edges - standard logic for all nodes
    foreach (var node in allNodes)
    {
        foreach (var dependency in node.Dependencies)
        {
            graphDto.Edges.Add(new GraphEdgeDto
            {
                Source = node.Name,
                Target = dependency.Name
            });
        }
    }

    return graphDto;
}
```

### 5. Update API to Use Evaluated Graph

**File**: `CostForecast.Api/Controllers/ForecastController.cs`

```csharp
[HttpPost("calculate")]
public IActionResult Calculate([FromBody] CalculateRequest request)
{
    var compiler = new DslCompiler();
    var compiledGraph = compiler.Compile(request.Source);
    
    var context = new CalculationContext();
    context.AddInputProvider(new NamedInputProvider(request.Inputs));
    
    var evaluator = new GraphEvaluator();
    var (results, evaluatedGraph) = evaluator.Evaluate(compiledGraph, context);
    
    // Serialize the evaluated graph (contains item nodes)
    var graphDto = GraphSerializer.SerializeGraph(evaluatedGraph);
    
    return Ok(new {
        Results = results,
        Graph = graphDto
    });
}
```

### 6. Remove ExpansionData from RangeNode

**File**: `CostForecast.Engine/Core/RangeNode.cs`

Remove `ExpansionData` and `RangeItemExpansion` - no longer needed:
```csharp
public class RangeNode : GraphNode
{
    public Func<IEvaluationContext, object> SourceCalculation { get; set; }
    public Func<IEvaluationContext, object> TargetCalculation { get; set; }
    
    // Remove: ExpansionData property
    // Remove: RangeItemExpansion nested class
}
```

## Verification

1. Update tests to expect `(results, graph)` tuple from evaluator
2. Verify evaluated graph contains item nodes
3. Verify serialized graph matches evaluated graph structure
4. Ensure compiled graph remains unchanged after evaluation

## Benefits

✅ Single source of truth - graph structure = what executed
✅ Simpler serializer - no special case logic
✅ Cleaner separation - compilation vs evaluation
✅ Can inspect evaluated graph directly
✅ Compiled graph is reusable
