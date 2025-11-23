# Implementation Plan - Input Grid

## Goal
Replace the raw JSON input area with an Excel-like grid component to allow users to easily enter and manage input variables.

## Proposed Changes

### Frontend (`frontend`)

#### [NEW] Dependencies
- `npm install @tanstack/react-table`

#### [NEW] [InputGrid.tsx](file:///Users/arthur/CostForecast/frontend/src/InputGrid.tsx)
- Use `useReactTable` hook.
- Define columns: `Key` and `Value`.
- Implement custom `TableCell` component for inline editing.
- Features:
    - Add new row button.
    - Delete row button.
    - Validation (Key must be unique).

#### [MODIFY] [App.tsx](file:///Users/arthur/CostForecast/frontend/src/App.tsx)
- Replace the JSON `<textarea>` with `<InputGrid />`.
- Maintain `inputs` state as a `Record<string, any>`.
- Convert `inputs` object to an array of `{ key, value }` for the table.
- Update `inputs` state when table data changes.

## Verification Plan

### Manual Verification
1.  Start Frontend: `npm run dev`
2.  Add a row: Key=`inflation`, Value=`1.05`.
3.  Click Calculate.
4.  Verify result uses the input value.
5.  Edit value to `1.10` and recalculate.
