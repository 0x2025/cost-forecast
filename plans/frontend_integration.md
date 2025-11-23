# Implementation Plan - Frontend Integration

## Goal
Connect the React frontend to the Backend API to allow users to input DSL code, provide inputs, and view calculation results.

## Proposed Changes

### Backend (`CostForecast.Api`)

#### [MODIFY] [Program.cs](file:///Users/arthur/CostForecast/backend/CostForecast.Api/Program.cs)
- Add `AddControllers()` to services.
- Add `AddCors()` to allow requests from `http://localhost:5173` (Vite default).
- Use `MapControllers()` instead of minimal API.
- Remove weather forecast example.

### Frontend (`frontend`)

#### [NEW] [api.ts](file:///Users/arthur/CostForecast/frontend/src/api.ts)
- `calculate(source: string, inputs: Record<string, any>)`: Async function to call `POST /api/forecast/calculate`.

#### [MODIFY] [App.tsx](file:///Users/arthur/CostForecast/frontend/src/App.tsx)
- Implement the "Studio" layout as per architecture:
    - **DSL Editor (Logic Layer)**:
        - Use `CodeMirror` for the editor.
        - Integrate `Tree-sitter` (WASM) for real-time syntax highlighting and error feedback.
        - Implement basic autocomplete for variables.
    - **Input Grid (Data Layer)**:
        - Use `React Table` (or simple table for PoC) to manage inputs.
        - Allow users to define key-value pairs (e.g., `price_item`, `inflation`).
    - **Actions**: "Build Model" / "Calculate" button.
    - **Results**: Display results in a JSON viewer or simple table.
- Use `useState` to manage source code, inputs, and results.
- Call `api.calculate` on button click.

### Dependencies
- `npm install @codemirror/lang-javascript` (or similar for basic highlighting initially, then custom)
- `npm install @uiw/react-codemirror` (React wrapper)
- `npm install axios` (for API calls)

## Verification Plan

### Manual Verification
1.  Start Backend: `dotnet run --project backend/CostForecast.Api`
2.  Start Frontend: `npm run dev` in `frontend` directory.
3.  Open browser at `http://localhost:5173`.
4.  Enter DSL: `x = 10; y = x * 2`
5.  Click Calculate.
6.  Verify Result: `y: 20` is displayed.
