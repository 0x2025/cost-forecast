using System.Collections.Generic;
using System.Linq;
using CostForecast.Engine.Core;
using CostForecast.Engine.Evaluator;
using FluentAssertions;
using Xunit;

namespace CostForecast.Engine.Tests;

public class RangeItemSerializationTests
{
    [Fact]
    public void Should_Include_RangeParentId_In_Metadata_For_RangeItemNodes()
    {
        // Arrange
        var graph = new DependencyGraph();
        
        // Template subgraph: template_calc = item.price * 2
        var templateNode = new FormulaNode("template_calc", ctx => {
            try {
                return (double)ctx.Get("price") * 2;
            } catch {
                return 0.0; 
            }
        });

        // RangeNode: result = Range(items, template_calc)
        var items = new List<object> 
        { 
            new Dictionary<string, object> { { "price", 10.0 } },
            new Dictionary<string, object> { { "price", 20.0 } }
        };
        
        var rangeNode = new RangeNode(
            "result", 
            ctx => items, 
            ctx => ctx.Get("template_calc")
        );
        
        rangeNode.TargetDependencies.Add(templateNode);
        rangeNode.AddDependency(templateNode);
        
        graph.AddNode(templateNode);
        graph.AddNode(rangeNode);

        var context = new CalculationContext();
        var evaluator = new GraphEvaluator();

        // Act
        var (results, evaluatedGraph) = evaluator.Evaluate(graph, context);
        var graphDto = GraphSerializer.SerializeGraph(evaluatedGraph, results);

        // Assert
        // Find the expanded range item nodes (e.g., result(1), result(2))
        var rangeItemNodes = graphDto.Nodes.Where(n => n.Type == "range_item").ToList();
        
        rangeItemNodes.Should().HaveCount(2);
        
        foreach (var node in rangeItemNodes)
        {
            node.Metadata.Should().ContainKey("rangeParentId", "Range items must link back to their parent Range node for the UI to group them");
            node.Metadata!["rangeParentId"].Should().Be("result");
        }
    }
}
