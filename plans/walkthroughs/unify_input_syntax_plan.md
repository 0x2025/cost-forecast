# Unify Input() Syntax Behavior

## Goal

Make `management_fee_rate = Input("key")` behave identically to `management_fee_rate: Input("key")` by creating only one InputNode instead of a FormulaNode wrapper plus a `$Input_` prefixed InputNode.

## Proposed Changes

### [`AstTranslator.cs`](file:///Users/arthur/CostForecast/backend/CostForecast.Engine/Compiler/AstTranslator.cs)

**Add Input detection helper method** (similar to `IsRangeOperation`):
- Create `IsInputOperation(Node node)` method to detect `Input()` function calls
- Checks if node is a function_call with function name "INPUT" (case-insensitive)

**Modify Pass 1 assignment handling** (lines 82-119):
- After checking for Range operations, add check for Input operations
- If detected, extract the input key from the function argument
- Create `InputNode` directly with the assignment name and extracted key
- Skip to Pass 2 (similar to how InputNode declarations are skipped)

## Verification Plan

### Existing Tests
Run existing test suite:
```bash
cd /Users/arthur/CostForecast/backend
dotnet test
```

### New Test
**Create test in `InputNodeRedundancyTests.cs`**:
```csharp
[Fact]
public void Assignment_And_Declaration_Should_Produce_Identical_Graphs()
{
    var compiler = new DslCompiler();
    
    // Test assignment syntax
    var assignmentGraph = compiler.Compile("x = Input(\"key\")");
    var assignmentNodes = assignmentGraph.GetAllNodes().ToList();
    
    // Test declaration syntax
    var declarationGraph = compiler.Compile("x: Input(\"key\")");
    var declarationNodes = declarationGraph.GetAllNodes().ToList();
    
    // Both should have exactly 1 node
    assignmentNodes.Should().HaveCount(1);
    declarationNodes.Should().HaveCount(1);
    
    // Both should be InputNode with same name and key
    var assignmentNode = assignmentNodes[0];
    var declarationNode = declarationNodes[0];
    
    assignmentNode.Should().BeOfType<InputNode>();
    declarationNode.Should().BeOfType<InputNode>();
    
    assignmentNode.Name.Should().Be("x");
    declarationNode.Name.Should().Be("x");
    
    ((InputNode)assignmentNode).Key.Should().Be("key");
    ((InputNode)declarationNode).Key.Should().Be("key");
    
    // Should NOT have $Input_ prefixed nodes
    assignmentGraph.GetNode("$Input_key").Should().BeNull();
}
```

Command to run:
```bash
cd /Users/arthur/CostForecast/backend
dotnet test --filter "Assignment_And_Declaration_Should_Produce_Identical_Graphs"
```
