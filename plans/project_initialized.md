# Implementation Plan - Project Initialization

## Goal
Initialize the repository structure for the CostForecast PoC, setting up the Frontend (React/Vite/Tailwind) and Backend (ASP.NET Core/Engine/Tests) skeletons with TDD approach for engine development.


## Proposed Changes

### Root Directory
#### [NEW] [.gitignore](file:///Users/arthur/CostForecast/.gitignore)
- Standard .gitignore for Node.js and .NET.

#### [NEW] [README.md](file:///Users/arthur/CostForecast/README.md)
- Project overview and setup instructions.

### Frontend (`/frontend`)
#### [NEW] Vite Project Structure
- **Stack**: React, TypeScript, Vite, **TailwindCSS**.
- **Dependencies**: `react`, `react-dom`, `react-router-dom`.
- **Dev Dependencies**: `typescript`, `vite`, `@types/node`, `tailwindcss`, `postcss`, `autoprefixer`.
- **Directories**:
    - `src/components`: Reusable UI components.
    - `src/pages`: Route components.
    - `src/styles`: Tailwind directives.

### Backend (`/backend`)
#### [NEW] Solution Structure (`CostForecast.sln`)
1.  **Project: `CostForecast.Engine` (Class Library)**
    -   **Role**: Core logic (Graph, Tree-sitter transformer, Compiler, Evaluator).
    -   **Structure**:
        -   `Core/`: Graph nodes, Domain models.
        -   `Compiler/`: Tree-sitter parsing and AST transformation.
        -   `Evaluator/`: Calculation logic.
        -   `Facade/`: Public API for the Engine to ensure encapsulation.
2.  **Project: `CostForecast.Api` (ASP.NET Core Web API)**
    -   **Role**: HTTP Interface.
    -   **Dependencies**: `CostForecast.Engine`.
    -   **Structure**:
        -   `Controllers/`: API Endpoints.
        -   `Models/`: DTOs.
        -   `Services/`: Application services (orchestration).
3.  **Project: `CostForecast.Engine.Tests` (xUnit Test Project)**
    -   **Role**: Unit tests for the Engine (TDD).
    -   **Dependencies**: `CostForecast.Engine`, `xunit`, `FluentAssertions`, `NSubstitute` (for mocking).

## Verification Plan

### Automated Tests
- **Frontend**: Run `npm install` and `npm run dev` to verify the dev server starts.
- **Backend**:
    -   Run `dotnet test` to verify the test project runs and passes (initially 0 tests or dummy test).
    -   Run `dotnet run --project backend/CostForecast.Api` to verify the API starts.

### Manual Verification
- Open `http://localhost:5173` to see the React app with Tailwind styles.
- Open `http://localhost:5000/swagger` to see the API documentation.
