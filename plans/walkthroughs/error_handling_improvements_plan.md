# Implementation Plan - Backend Compiler

## Goal
Implement the `DslCompiler` in `CostForecast.Engine` to parse DSL source code using Tree-sitter and transform the AST into a `DependencyGraph`.

## User Review Required
> [!IMPORTANT]
> **Tree-sitter Integration**: I will perform **Real Integration**.
> 1.  **Native Build**: Compile `language/src/parser.c` into a shared library.
>     - **Script**: Create `language/build_parser.sh` to automate this.
>     - **macOS**: `gcc -o libtree-sitter-costforecast.dylib -shared language/src/parser.c -I language/src`
>     - **Linux**: `gcc -o libtree-sitter-costforecast.so -shared language/src/parser.c -I language/src -fPIC`
> 2.  **Bindings**: Use `TreeSitter` NuGet package (or equivalent standard binding) and P/Invoke `tree_sitter_costforecast` to load the language.
> 3.  **No Mocking**: The compiler will use the actual parser.

# Implement Backend API

## Goal Description
Expose the CostForecast engine via a REST API to allow the frontend to compile and evaluate DSL code.

## Proposed Changes

### Backend (CostForecast.Api)

#### [NEW] [CalculationRequest.cs](file:///Users/arthur/CostForecast/backend/CostForecast.Api/Models/CalculationRequest.cs)
- `Source`: string (DSL code)
- `Inputs`: Dictionary<string, object> (Optional input values)

#### [NEW] [CalculationResponse.cs](file:///Users/arthur/CostForecast/backend/CostForecast.Api/Models/CalculationResponse.cs)
- `Results`: Dictionary<string, object>
- `Graph`: object (Optional, for visualization)
- `Errors`: List<string>

#### [NEW] [ForecastController.cs](file:///Users/arthur/CostForecast/backend/CostForecast.Api/Controllers/ForecastController.cs)
- `POST /api/forecast/calculate`: Accepts `CalculationRequest`, compiles the DSL, evaluates it, and returns `CalculationResponse`.

## Verification Plan

### Automated Tests
- Create `ForecastControllerTests` to verify the API endpoint logic.
- Test with valid DSL, invalid DSL (syntax errors), and runtime errors.

### Manual Verification
- Use `curl` or Postman to send requests to the running API.

## Proposed Changes

### Project: `CostForecast.Engine`

#### [NEW] Compiler
- `Compiler/DslCompiler.cs`: Main entry point. Loads native library, initializes Parser, parses source, and builds Graph.
- `Compiler/AstTranslator.cs`: Visits Tree-sitter AST nodes and creates corresponding `GraphNode`s.
    - **Assignments**: `identifier = expression` -> `FormulaNode` (or `ConstantNode` if literal).
    - **Binary Expressions**: `+, -, *, /, ^, =, <, >` -> Mapped to C# delegates.
    - **Functions**:
        - `SUM(a, b, ...)`: Aggregates values.
        - `MIN/MAX(a, b, ...)`: Finds min/max.
        - `IF(cond, trueVal, falseVal)`: Conditional logic.
        - `Range(start:end)`: Resolves to list of values (requires GridInputProvider support).
    - **Range Expressions**: `A1:A10` -> Handled as a list of keys for `Range` function.

### Project: `CostForecast.Engine.Tests`

#### [NEW] Compiler Tests
- `CompilerTests.cs`:
    - `Should_Compile_Constant_Assignment`: `x = 10` -> Graph with ConstantNode.
    - `Should_Compile_Formula_Reference`: `y = x` -> Graph with FormulaNode depending on x.
    - `Should_Compile_Arithmetic`: `z = x + y` -> FormulaNode with correct calculation logic.
    - `Should_Compile_Function_SUM`: `s = SUM(1, 2)` -> Result 3.
    - `Should_Compile_Function_IF`: `r = IF(1=1, 10, 20)` -> Result 10.
    - `Should_Compile_Complex_Scenario`: Full "Apartment Model" snippet.

## Verification Plan

### Automated Tests
- `dotnet test` to verify the compiler produces the correct Graph structure and that the Evaluator can execute it.
