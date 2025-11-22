# PoC System Architecture

## 1. System Overview
The CostForecast PoC is a **hybrid web application** designed to bridge the gap between Excel's flexibility and software engineering's rigor.
- **The Studio (Frontend)**: A React-based application where SMEs define logic (DSL), manage data (Grid), and run experiments.
- **The Engine (Backend)**: A high-performance C# service that compiles the DSL into a dependency graph, binds data, and executes scenarios. The result will a graph that SME can trace back to inputs and how formulae are calculated. 

## 2. Frontend Architecture ("The Studio")
**Tech Stack**: React, TypeScript, Vite, Tree-sitter, React Table, React Flow, Recharts.

### 2.1. DSL Editor (Logic Layer)
- **Component**: `CodeMirror` customized with a custom language mode.
- **Parser**: `Tree-sitter` (WASM) running in the browser.
- **Features**:
    - **Real-time Syntax Highlighting**: Powered by Tree-sitter grammar.
    - **Autocomplete/Intellisense**: Suggests variable names (`Input`, `Param`) defined in the scope.
    - **Error Feedback**: Immediate red squiggles for syntax errors before hitting the backend.

### 2.2. Input Grid (Data Layer)
- **Component**: `React Table` and other Tanstack components.
- **UX**: Provides an "Excel-like" experience (row number, cell addressing `A1`, `B2`). Capability to import data from Excel file.
- **Role**: Acts as the source of truth for `Input` bindings.

### 2.3. Scenario Manager & Dashboard
- **Scenario Manager**: A side panel to create "Experiments" (deltas from the Baseline). Adding parameters to the scenario. Scenario comparision as column based with the same parameters as first column, baseline scenario as the first column, experiment scenarios in the following columns.
    - *UI*: Sliders for numeric inputs, toggle switches for boolean logic.
- **Visualizer**: `React Flow` to render the calculation graph interactively.
    - *Feature*: Users click a node (e.g., `Total_Cost`) to trace its dependencies back to inputs.
- **Charts**: `Recharts` or `VisX` for comparing Baseline vs. Scenarios (ROI, Cost Breakdown). A chart builder where user can pick any node from calculation graph to create a chart.

## 3. Backend Architecture ("The Engine")
**Tech Stack**: C# .NET 8 (ASP.NET Core Web API).

### 3.1. The Compiler Pipeline
1.  **Ingest**: Receives DSL code and Input Data (JSON).
2.  **Parse**: Uses `Tree-sitter` C# bindings to generate a concrete syntax tree (CST).
3.  **AST Transformation**: Maps CST to our internal **Domain Object Model (DOM)** (e.g., `BinaryExpression`, `FunctionCall`, `RangeExpression`).
4.  **Graph Builder**:
    - Traverses the DOM.
    - Resolves references (`Reference`, `Param`).
    - Builds a **Directed Acyclic Graph (DAG)** where nodes are operations and edges are dependencies.
    - *Optimization*: Detects cycles and dead code.

### 3.2. The Evaluator

- **Execution Strategy**: Topological Sort of the DAG. Binding the input and combine with the graph to create a calculation graph. Resolve range to graph nodes for evaluating and tracing breakdown.
- **Scenario Context**: The graph structure is immutable (cached). Scenarios are just different "Contexts" (Input Maps) passed to the `Evaluate(Graph, Context)` method. This allows instant switching between scenarios without rebuilding the graph.
- The final calculation graph is a tree of graph nodes and persisted in the database.
### 3.3. The calculatio graph for tracing breakdown
Example:
total_cost = SUM(Range(A1:A100))
Where A1 and A100 have values 1 and 100.

The calculation graph will be:
total_cost -> Sum -> A1
                  -> A2
                  -> A3
                  ...
                  -> A100
And avoid: total_cost -> XXXX where XXXX is the final which cannot tracable.

So that SME can tracing the values how it was calculated and see each value that yield the final result. This is crucial for tracability of the calculation engine.

## 4. Data Flow
1.  **Authoring**: User types DSL in Editor. Browser (WASM) validates syntax.
2.  **Input**: User fills "Baseline" data in the Grid.
3.  **Compilation**: User clicks "Build Model". Backend compiles DSL -> Graph -> Binding Input -> Evaluating graph -> Persist Calculation Graph.
4.  **Experimentation**:
    - User creates "Scenario A" (e.g., `Inflation = 1.05`).
    - Frontend sends `Scenario A` inputs to Backend.
    - Backend runs `Evaluate(Graph, ScenarioA_Inputs)`.
    - Returns calculated metrics and calculation graph (e.g., `Total_Cost`).
5.  **Visualization**: Frontend updates Charts and Graph View with new values.


