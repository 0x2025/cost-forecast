# Implementation Plan - Backend Calculation Engine (TDD)

## Goal
Implement the core Calculation Engine in C# using Test-Driven Development (TDD). This includes the Graph data structure, Topological Sort, and basic Evaluation logic, independent of the Parser.

## User Review Required
> [!NOTE]
> **TDD Approach**: I will build the Engine "bottom-up" starting with the Graph and Evaluator.
> 1.  **Graph Core**: Nodes, Edges, Cycle Detection.
> 2.  **Evaluation**: Computing values from the Graph.
> 3.  **Parser Integration**: (Later) Converting DSL -> Graph.

## Proposed Changes

### Project: `CostForecast.Engine`

#### [NEW] Core Domain Models
- `Core/GraphNode.cs`: Base class for nodes (Input, Constant, Formula).
- `Core/DependencyGraph.cs`: Manages nodes and edges; performs topological sort.
- `Core/CalculationContext.cs`: Holds runtime values.
    - **Input Binding Strategy**: Use an `IInputProvider` interface to abstract data sources.
        - `NamedInputProvider`: Dictionary-based for named variables (`rate`, `inflation`).
        - `GridInputProvider`: Coordinate-based for cell references (`A1`, `B2`).
        - The `Input("key")` DSL function will query the provider.

#### [NEW] Evaluator
- `Evaluator/GraphEvaluator.cs`: Traverses the sorted graph and computes results.

### Project: `CostForecast.Engine.Tests`

#### [NEW] Unit Tests
- `GraphTests.cs`:
    - `Should_Detect_Cycles`: Verify circular dependency detection.
    - `Should_Sort_Topologically`: Verify execution order.
- `EvaluatorTests.cs`:
    - `Should_Evaluate_Constant`: `x = 5` -> 5.
    - `Should_Evaluate_Formula`: `x = 1, y = x + 1` -> 2.
    - `Should_Handle_Missing_Inputs`: Error handling.
    - `Should_Evaluate_Complex_Expression`: `1 + 2 * 3` -> 7 (Precedence).
    - `Should_Evaluate_Function_SUM`: `SUM(1, 2, 3)` -> 6.
    - `Should_Evaluate_Function_IF`: `IF(1 > 0, 10, 20)` -> 10.
    - `Should_Evaluate_Named_Input`: `rate: Input("rate")` with context `{"rate": 0.5}` -> 0.5.
    - `Should_Evaluate_Grid_Input`: `val: Input("A1")` with context `{"A1": 100}` -> 100.

## Verification Plan

### Automated Tests
- Run `dotnet test` continuously.
- Expect tests to fail first (Red), then pass (Green).

### Manual Verification
- None required for this stage (pure library logic).
