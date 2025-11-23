# Implementation Plan - Custom Syntax Highlighting

## Goal
Replace the placeholder JavaScript syntax highlighting with a custom Tree-sitter grammar running in the browser via WASM. This will provide accurate highlighting for the CostForecast DSL.

## Proposed Changes

### Language (`language`)

#### [NEW] Build Script
- Run `tree-sitter build-wasm` to generate `tree-sitter-costforecast.wasm`.
- Copy the WASM file to `frontend/public/`.

### Frontend (`frontend`)

#### [NEW] Dependencies
- `npm install web-tree-sitter`

#### [NEW] [TreeSitterHighlight.ts](file:///Users/arthur/CostForecast/frontend/src/TreeSitterHighlight.ts)
- Initialize `web-tree-sitter`.
- Load `tree-sitter-costforecast.wasm`.
- Create a CodeMirror `ViewPlugin` or `StreamLanguage` (or use a library like `codemirror-lang-tree-sitter` if available, but likely need custom implementation for raw Tree-sitter).
- *Alternative*: Use a simpler approach for PoC if `web-tree-sitter` integration with CodeMirror is too complex. We will try to use `codemirror-lang-tree-sitter` or similar if it exists, otherwise write a simple adapter that maps Tree-sitter nodes to CodeMirror tags.

#### [MODIFY] [App.tsx](file:///Users/arthur/CostForecast/frontend/src/App.tsx)
- Load the custom language extension instead of `javascript()`.

## Verification Plan

### Manual Verification
1.  Build WASM: `tree-sitter build-wasm`
2.  Copy to public: `cp tree-sitter-costforecast.wasm ../frontend/public/`
3.  Start Frontend: `npm run dev`
4.  Type DSL: `x = 10`
5.  Verify: `x` is highlighted as variable, `10` as number.
