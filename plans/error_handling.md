# Implementation Plan - Error Handling

## Goal
Improve the user experience by providing immediate feedback on syntax errors in the editor and detailed error messages from the backend.

## Proposed Changes

### Frontend (`frontend`)

#### [MODIFY] [useTreeSitter.ts](file:///Users/arthur/CostForecast/frontend/src/useTreeSitter.ts)
- Update `treeSitterPlugin` to detect `ERROR` nodes in the syntax tree.
- Add a red underline decoration (`.cm-error`) to these nodes.
- Add a tooltip or hover effect to show "Syntax Error".

#### [MODIFY] [index.css](file:///Users/arthur/CostForecast/frontend/src/index.css)
- Add `.cm-error` style (e.g., `text-decoration: underline wavy red`).

### Backend (`CostForecast.Engine`)

#### [MODIFY] [DslCompiler.cs](file:///Users/arthur/CostForecast/backend/CostForecast.Engine/Compiler/DslCompiler.cs)
- Update `Compile` method to catch exceptions and return structured error objects with line numbers if possible.
- *Note*: Tree-sitter parser errors are already available in the AST. We should expose them.

### Backend (`CostForecast.Api`)

#### [MODIFY] [CalculationResponse.cs](file:///Users/arthur/CostForecast/backend/CostForecast.Api/Models/CalculationResponse.cs)
- Change `Errors` from `List<string>` to `List<CalculationError>`.
- `CalculationError` class: `Message`, `Line`, `Column`.

#### [MODIFY] [ForecastController.cs](file:///Users/arthur/CostForecast/backend/CostForecast.Api/Controllers/ForecastController.cs)
- Map compiler errors to the new `CalculationError` format.

## Verification Plan

### Manual Verification
1.  **Frontend Syntax Error**: Type `x = * 10`. Verify red squiggle appears under `*`.
2.  **Backend Error**: Send invalid DSL via API. Verify response contains line number.
