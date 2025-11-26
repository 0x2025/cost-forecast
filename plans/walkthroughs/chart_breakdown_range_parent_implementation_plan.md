# Fix Chart Breakdown Missing Range Node

## Goal Description
The `Range` node is used in the DSL and appears in the evaluated graph, but it is missing from the "Chart Breakdown" UI. The goal is to ensure it appears correctly.

## User Review Required
None anticipated yet.

## Proposed Changes
### Backend
- **Modify `RangeItemNode.cs`**: Add `ParentId` property to store the ID of the parent `RangeNode`.
- **Modify `GraphEvaluator.cs`**: When creating `RangeItemNode` during evaluation, pass the `RangeNode`'s name as the `ParentId`.
- **Modify `GraphSerializer.cs`**: In `SerializeGraph`, when processing `RangeItemNode`, add `rangeParentId` to the metadata using the new `ParentId` property.

## Verification Plan
### Automated Tests
- Create `ReproductionChartTests.cs` to:
    1. Define a graph with a `RangeNode`.
    2. Evaluate the graph.
    3. Serialize the graph.
    4. Assert that `RangeItemNode`s in the serialized output contain `rangeParentId` in their metadata.
### Manual Verification
- Run the app, input a DSL with `Range`, and check if the Chart Breakdown now shows the Range node.
