using System.Collections.Generic;
using System.Linq;
using CostForecast.Engine.Compiler;
using CostForecast.Engine.Core;
using CostForecast.Engine.Evaluator;
using FluentAssertions;
using Xunit;

namespace CostForecast.Engine.Tests;

public class RangeGraphExpansionTests
{
    private DependencyGraph Compile(string source)
    {
        var compiler = new DslCompiler();
        return compiler.Compile(source);
    }

    private double Evaluate(DependencyGraph graph, Dictionary<string, object> inputs)
    {
        var context = new CalculationContext();
        context.AddInputProvider(new NamedInputProvider(inputs));

        var evaluator = new GraphEvaluator();
        var (results, _) = evaluator.Evaluate(graph, context);

        return (double)results["total"];
    }

    [Fact]
    public void Should_Expand_Range_Into_Item_Nodes_In_Graph()
    {
        // Arrange
        var source = @"
items: Input(""items"")
qty: Param
price: Param
result = Range(items, qty * price)
total = SUM(result)
";
        var graph = Compile(source);
        
        var items = new[] { 
            new Dictionary<string, object> { { "qty", 2.0 }, { "price", 10.0 } },
            new Dictionary<string, object> { { "qty", 3.0 }, { "price", 15.0 } }
        };
        
        var inputs = new Dictionary<string, object> 
        { 
            { "items", items }
        };

        var context = new CalculationContext();
        context.AddInputProvider(new NamedInputProvider(inputs));
        var evaluator = new GraphEvaluator();
        var (_, evaluatedGraph) = evaluator.Evaluate(graph, context);

        // Act - Serialize the evaluated graph (contains runtime item nodes)
        var graphDto = GraphSerializer.SerializeGraph(evaluatedGraph);

        // Assert - Check that Range node exists
        var rangeNode = graphDto.Nodes.FirstOrDefault(n => n.Id == "result");
        rangeNode.Should().NotBeNull();
        rangeNode!.Type.Should().Be("range");

        // Assert - Check that item nodes were created
        var itemNodes = graphDto.Nodes.Where(n => n.Type == "range_item").ToList();
        itemNodes.Should().HaveCount(2);
        itemNodes[0].Id.Should().Be("result(1)");
        itemNodes[1].Id.Should().Be("result(2)");

        // Assert - Check item metadata
        itemNodes[0].Metadata.Should().ContainKey("result");
        itemNodes[0].Metadata!["result"].Should().Be(20.0); // 2 * 10
        itemNodes[1].Metadata!["result"].Should().Be(45.0); // 3 * 15

        // Assert - Check edges from items Input to item nodes
        var itemsToItem1Edge = graphDto.Edges.FirstOrDefault(e => e.Source == "items" && e.Target == "result(1)");
        itemsToItem1Edge.Should().NotBeNull();
        
        var itemsToItem2Edge = graphDto.Edges.FirstOrDefault(e => e.Source == "items" && e.Target == "result(2)");
        itemsToItem2Edge.Should().NotBeNull();

        // Assert - Check edges from items to params
        // Assert - Check edges from items to params (Data Flow: param -> item)
        var item1ToQtyEdge = graphDto.Edges.FirstOrDefault(e => e.Source == "qty" && e.Target == "result(1)");
        item1ToQtyEdge.Should().NotBeNull();
        
        var item1ToPriceEdge = graphDto.Edges.FirstOrDefault(e => e.Source == "price" && e.Target == "result(1)");
        item1ToPriceEdge.Should().NotBeNull();

        // Assert - Check edge from result Range to items input (Data Flow: items -> result)
        var rangeToItemsEdge = graphDto.Edges.FirstOrDefault(e => e.Source == "items" && e.Target == "result");
        rangeToItemsEdge.Should().NotBeNull();

        // Assert - Check edge from item nodes to result Range (Data Flow: item -> result)
        // This confirms the fix: RangeNode depends on its items
        var item1ToRangeEdge = graphDto.Edges.FirstOrDefault(e => e.Source == "result(1)" && e.Target == "result");
        item1ToRangeEdge.Should().NotBeNull();

        var item2ToRangeEdge = graphDto.Edges.FirstOrDefault(e => e.Source == "result(2)" && e.Target == "result");
        item2ToRangeEdge.Should().NotBeNull();
    }

    [Fact]
    public void Should_Not_Expand_Volatile_Range_Without_Evaluation()
    {
        // Arrange - Create a Range that hasn't been evaluated yet
        var source = @"
r: Param
items: Input(""items"")
result = Range(items, r * 2)
total = SUM(result)
";
        var graph = Compile(source);
        
        // Act - Serialize without evaluating
        var graphDto = GraphSerializer.SerializeGraph(graph);

        // Assert - Range node should exist but not be expanded
        var rangeNode = graphDto.Nodes.FirstOrDefault(n => n.Id == "result");
        rangeNode.Should().NotBeNull();
        rangeNode!.Type.Should().Be("range");

        // Assert - No item nodes should exist (since we haven't evaluated)
        var itemNodes = graphDto.Nodes.Where(n => n.Type == "range_item").ToList();
        itemNodes.Should().BeEmpty();
    }


    [Fact]
    public void Should_Generate_Graph_With_Item_Dependencies()
    {
        // Arrange
        var source = @"
qty: Param
price: Param
items: Input(""items"")
item_totals = Range(items, qty * price)
";
        var graph = Compile(source);
        
        var items = new[] { 
            new Dictionary<string, object> { { "qty", 2.0 }, { "price", 10.0 } },
            new Dictionary<string, object> { { "qty", 3.0 }, { "price", 15.0 } },
            new Dictionary<string, object> { { "qty", 4.0 }, { "price", 20.0 } }
        };
        
        var inputs = new Dictionary<string, object> 
        { 
            { "items", items }
        };

        var context = new CalculationContext();
        context.AddInputProvider(new NamedInputProvider(inputs));
        var evaluator = new GraphEvaluator();
        var (_, evaluatedGraph) = evaluator.Evaluate(graph, context);

        // Act
        var graphDto = GraphSerializer.SerializeGraph(evaluatedGraph);

        // Assert - Check Range Node
        var rangeNode = graphDto.Nodes.FirstOrDefault(n => n.Id == "item_totals");
        rangeNode.Should().NotBeNull();

        // Assert - Check 3 Item Nodes
        var itemNodes = graphDto.Nodes.Where(n => n.Type == "range_item").ToList();
        itemNodes.Should().HaveCount(3);
        
        // Assert - Check Dependencies for Item 1
        // item_totals(1) -> qty
        var item1ToQty = graphDto.Edges.FirstOrDefault(e => e.Source == "qty" && e.Target == "item_totals(1)");
        item1ToQty.Should().NotBeNull();
        
        // item_totals(1) -> price
        var item1ToPrice = graphDto.Edges.FirstOrDefault(e => e.Source == "price" && e.Target == "item_totals(1)");
        item1ToPrice.Should().NotBeNull();

        // Assert - Check Dependency from Item 1 to Range Node (The fix)
        // item_totals -> item_totals(1) (Visual: item_totals(1) -> item_totals)
        // Edge direction in DTO is Source -> Target. 
        // DependencyGraph: A depends on B means B -> A.
        // GraphSerializer: Source=Dependency, Target=Node.
        // So if RangeNode depends on ItemNode, Edge is ItemNode -> RangeNode.
        var item1ToRange = graphDto.Edges.FirstOrDefault(e => e.Source == "item_totals(1)" && e.Target == "item_totals");
        item1ToRange.Should().NotBeNull();
    }
}
