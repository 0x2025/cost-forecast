# Chart Feature Implementation Plan

## Goal
Enable users to create visual charts from their evaluated cost models using a simple, guided interface with Recharts.

## User Review Required
> [!NOTE]
> We are using `recharts` as the charting library.
> Persistence will be handled via `localStorage` for now, linked to the model.

## Proposed Changes

### Frontend Dependencies
#### [NEW] `recharts`
- Install `recharts` package.

### Frontend Components (`src/components/charts/`)

#### [NEW] Data Utilities
- `src/components/charts/utils/chartDataExtractor.ts`: Logic to extract data from `GraphNode[]` based on chart config.
- `src/components/charts/utils/rangeDetector.ts`: Logic to identify range groups (e.g., `employee[1..n]`).

#### [NEW] Chart Display Components
- `src/components/charts/ChartDisplay/ChartCard.tsx`: Container with title and delete button.
- `src/components/charts/ChartDisplay/BarChart.tsx`: Recharts wrapper for Bar charts.
- `src/components/charts/ChartDisplay/PieChart.tsx`: Recharts wrapper for Pie charts.
- `src/components/charts/ChartDisplay/LineChart.tsx`: Recharts wrapper for Line charts.
- `src/components/charts/ChartDisplay/KPICard.tsx`: Simple display for single values.

#### [NEW] Chart Builder Wizard
- `src/components/charts/ChartBuilder/PatternSelector.tsx`: Step 1 - Choose "Compare", "Breakdown", or "KPI".
- `src/components/charts/ChartBuilder/CompareConfig.tsx`: Step 2 - Select nodes for comparison.
- `src/components/charts/ChartBuilder/BreakdownConfig.tsx`: Step 2 - Select range group.
- `src/components/charts/ChartBuilder/KPIConfig.tsx`: Step 2 - Select single node.
- `src/components/charts/ChartBuilder/PreviewStep.tsx`: Step 3 - Preview and confirm.
- `src/components/charts/ChartBuilder/ChartBuilder.tsx`: Main dialog orchestrating the steps.

#### [NEW] Dashboard
- `src/components/charts/ChartsTab.tsx`: Main tab view, grid layout of charts, "Create" button.

### App Integration
#### [MODIFY] `src/App.tsx`
- Add "Charts" tab to the main navigation.
- Pass `evaluatedGraph` to `ChartsTab`.

## Verification Plan
### Manual Verification
1. **Compare Values**: Select multiple cost nodes (e.g., `labor`, `material`) and create a Bar chart. Verify values match graph.
2. **Breakdown**: Select a range node (e.g., `employees`) and create a Bar chart. Verify all items are shown.
3. **KPI**: Select `total_cost` and create a KPI card. Verify formatting.
4. **Persistence**: Reload page and verify charts remain.
