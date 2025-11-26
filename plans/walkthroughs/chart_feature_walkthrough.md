# Chart Feature Walkthrough

This document outlines the newly implemented Chart Feature for the CostForecast application. It allows users to visualize their cost model data using various chart patterns.

## Feature Overview

The Chart Feature introduces a new "Charts" tab in the application, providing a dashboard for creating and managing charts.

### Key Components

*   **Charts Tab:** The main dashboard where all created charts are displayed.
*   **Chart Builder:** A wizard-style interface for creating new charts.
*   **Chart Types:**
    *   **Compare Values:** Compare multiple nodes using Bar or Pie charts.
    *   **Show Breakdown:** Visualize range items (e.g., employees, servers) using Bar or Line charts.
    *   **Show Key Number (KPI):** Highlight a single important metric.

## Verification Plan

Since this feature involves visual components, manual verification is recommended.

### 1. Verify "Compare Values" Pattern

1.  **Action:** Click "Create Chart" -> Select "Compare Values".
2.  **Configuration:** Select 2-3 nodes from the list (e.g., "Total Cost", "Revenue"). Select "Bar Chart".
3.  **Preview:** Verify the chart appears in the preview step.
4.  **Save:** Click "Add to Dashboard".
5.  **Result:** The new chart should appear on the dashboard.

### 2. Verify "Show Breakdown" Pattern

1.  **Action:** Click "Create Chart" -> Select "Show Breakdown".
2.  **Configuration:** Select a range group (e.g., "employees"). Select "Bar Chart".
3.  **Preview:** Verify the chart shows bars for each item in the range.
4.  **Save:** Click "Add to Dashboard".
5.  **Result:** The chart should be added to the dashboard.

### 3. Verify "KPI" Pattern

1.  **Action:** Click "Create Chart" -> Select "Show Key Number".
2.  **Configuration:** Select a single node (e.g., "Profit"). Choose "Currency" format.
3.  **Preview:** Verify the number is displayed correctly with formatting.
4.  **Save:** Click "Add to Dashboard".
5.  **Result:** The KPI card should be added to the dashboard.

### 4. Verify Persistence

1.  **Action:** Refresh the browser page.
2.  **Result:** All created charts should remain on the dashboard.

### 5. Verify Data Refresh

1.  **Action:** Change an input value in the "Inputs" grid.
2.  **Action:** Click "Calculate".
3.  **Action:** Go to "Charts" tab and click "Refresh Data".
4.  **Result:** The charts should update to reflect the new calculation results.

## Implementation Details

*   **Library:** `recharts` is used for rendering charts.
*   **State Management:** Chart configurations are stored in `localStorage`.
*   **Data Extraction:** Utility functions in `src/components/charts/utils` handle data transformation from the graph results.

## Code Review Findings

*   **Data Flow:** The `ChartsTab` correctly passes `nodes` and `results` to `ChartBuilder` and `ChartCard`.
*   **Type Safety:** All components use TypeScript interfaces for props and state.
*   **Error Handling:** `try-catch` blocks are used for `localStorage` operations.
*   **Responsiveness:** The dashboard uses a responsive grid layout (`grid-cols-1 md:grid-cols-2 xl:grid-cols-3`).
