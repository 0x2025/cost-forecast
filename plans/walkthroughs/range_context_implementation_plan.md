# Graph Visualization Feature Implementation Plan

## Overview

This feature will enable the CostForecast application to return computation graph data from the API and visualize it in the frontend using React Flow. This will allow users to trace how models are calculated by seeing the dependency relationships between variables.

## User Review Required

> [!IMPORTANT]
> **Graph Structure Design**: The graph will represent the dependency structure of the DSL model, showing nodes (variables, inputs, constants, formulas) and edges (dependencies). Each node will include:
> - Node ID (variable name)
> - Node type (Input, Constant, Formula)
> - Label for display
> - Additional metadata (e.g., value for constants, key for inputs)

> [!IMPORTANT]
> **UI Layout**: The graph visualization will be displayed as a **tabbed view** alongside results. This provides a clean, organized interface where users can switch between viewing results (table) and the computation graph.

## Proposed Changes

### Backend - Graph Serialization

#### [NEW] [GraphDto.cs](file:///Users/arthur/CostForecast/backend/CostForecast.Api/Models/GraphDto.cs)

Create data transfer objects for graph serialization:
- `GraphDto`: Container for nodes and edges
- `GraphNodeDto`: Represents a node with id, type, label, and metadata
- `GraphEdgeDto`: Represents a dependency edge with source and target

#### [MODIFY] [GraphEvaluator.cs](file:///Users/arthur/CostForecast/backend/CostForecast.Engine/Evaluator/GraphEvaluator.cs)

Add a new method `BuildGraphDto` that:
- Traverses the `DependencyGraph`
- Creates node DTOs for each graph node (Constant, Input, Formula)
- Creates edge DTOs for each dependency relationship
- Returns a serializable graph structure

#### [MODIFY] [ForecastController.cs](file:///Users/arthur/CostForecast/backend/CostForecast.Api/Controllers/ForecastController.cs)

Update the `Calculate` endpoint to:
- Call the new graph serialization method
- Populate the `Graph` property in the response

#### [NEW] [GraphSerializationTests.cs](file:///Users/arthur/CostForecast/backend/CostForecast.Engine.Tests/GraphSerializationTests.cs)

### [Range Implementation]
#### [MODIFY] [AstTranslator.cs](file:///Users/arthur/CostForecast/backend/CostForecast.Engine/Compiler/AstTranslator.cs)
- Implement `Range` function handling in `ParseExpression`
- Add logic to iterate over input arrays and apply parameterized formulas
#### [MODIFY] [GraphEvaluator.cs](file:///Users/arthur/CostForecast/backend/CostForecast.Engine/Evaluator/GraphEvaluator.cs)
- Ensure `CalculationContext` correctly handles array values and Param binding

---

### Frontend - React Flow Integration

#### [MODIFY] [package.json](file:///Users/arthur/CostForecast/frontend/package.json)

Add React Flow dependencies:
- `@xyflow/react` (latest version of React Flow)
- `@xyflow/react/dist/style.css` for styling

#### [NEW] [GraphVisualization.tsx](file:///Users/arthur/CostForecast/frontend/src/GraphVisualization.tsx)

Create a React component that:
- Receives graph data (nodes and edges)
- Transforms the data into React Flow format
- Renders the graph with automatic layout (using dagre or built-in layout)
- Provides node styling based on node type (Input, Constant, Formula)
- Supports interactive features (pan, zoom, click to highlight)

#### [MODIFY] [api.ts](file:///Users/arthur/CostForecast/frontend/src/api.ts)

Update the `CalculationResponse` interface to define the graph structure:
```typescript
interface GraphNode {
  id: string;
  type: string;
  label: string;
  metadata?: any;
}

interface GraphEdge {
  source: string;
  target: string;
}

interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
```

#### [MODIFY] [App.tsx](file:///Users/arthur/CostForecast/frontend/src/App.tsx)

Integrate the graph visualization:
- Import and render `GraphVisualization` component
- Add a new section for graph display (below results or as a tab)
- Pass the graph data from the API response to the component
- Handle the case when graph is null (before calculation)

## Verification Plan

### Automated Tests

**Backend Tests:**
```bash
# Run from backend directory
dotnet test
```

Add comprehensive test cases in `GraphEvaluatorTests.cs`:
- **All Node Types**: Test `ConstantNode`, `InputNode`, `FormulaNode`, `ReferenceNode`, `ParamNode`
- **Simple Model**: `a = 1`, `b = a * 2` - verify 2 nodes, 1 edge
- **Complex Formulas**: Nested functions like `SUM(x, y * 2)`, `IF` conditions
- **Range Operations**: `Range(A1:A10, price * 0.9)` - verify expanded dependencies
- **Input Bindings**: Multiple inputs with different keys
- **Error Handling**: Invalid DSL syntax, circular dependencies
- **Edge Cases**: Empty graph, single node, disconnected nodes

**Frontend Tests:**
- Manual testing via browser development server

### Manual Verification

1. **Simple Model Test:**
   - Input DSL: `x = 10`, `y = x * 2`, `total = SUM(x, y)`
   - Verify graph shows 3 nodes and 2 edges
   - Verify nodes are correctly labeled
   - Verify edges show: total → x, total → y, y → x

2. **Complex Model Test:**
   ### Range Implementation [COMPLETED]
- **Goal**: Support `Range(source, target)` where `target` depends on a `Param`.
- **Approach**:
    - Use `IEvaluationContext` interface for all calculations.
    - Implement `ChildEvaluationContext` to support scoped variable overrides (for `Param`).
    - `Range` iterates source array, creates a child context for each item, injects the `Param` value, and executes the dependent subgraph.
    - `Param` nodes return 0.0 if not found in the current context (graceful fallback for global scope).
    - Aggregation functions (`SUM`, etc.) flatten array inputs.
3. **Tab Interaction:**
   - Switch between Results and Graph tabs
   - Verify graph renders correctly after switching
   - Test responsive behavior

4. **Graph Interaction:**
   - Pan and zoom functionality
   - Click nodes to highlight dependencies
   - Verify automatic layout is readable

5. **Error Handling:**
   - Graph is null before first calculation - show placeholder message
   - Syntax errors in DSL - verify graph not rendered, errors shown
   - Empty model - verify empty graph state
