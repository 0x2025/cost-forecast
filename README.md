# CostForecast PoC

A hybrid web application for cost modeling, designed to bridge the gap between Excel's flexibility and software engineering's rigor.

## Architecture

- **Frontend**: React, TypeScript, Vite, TailwindCSS.
- **Backend**: ASP.NET Core Web API, C# .NET 8.
- **Engine**: Custom DSL Compiler and Evaluator (C#).

## Getting Started

### Prerequisites
- Node.js (v18+)
- .NET 8 SDK

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
dotnet restore
dotnet run --project CostForecast.Api
```
