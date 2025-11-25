using System.Collections.Generic;
using System.Linq;
using CostForecast.Engine.Core;
using CostForecast.Engine.Evaluator;
using FluentAssertions;
using Xunit;

namespace CostForecast.Engine.Tests;

public class ReproductionTests
{
    [Fact]
    public void Should_Remove_Redundant_Template_Nodes_After_Range_Evaluation()
    {
        // Arrange
        var graph = new DependencyGraph();
        
        // Template subgraph:
        // template_calc = item.price * 2
        // This node is ONLY used by the RangeNode
        var templateNode = new FormulaNode("template_calc", ctx => {
            // Simulate item context access
            try {
                return (double)ctx.Get("price") * 2;
            } catch {
                return 0.0; // Return default if not in context (e.g. global eval)
            }
        });

        // Make templateNode volatile so it gets cloned
        var param = new ParamNode("dummy_param", ctx => 0);
        templateNode.AddDependency(param);
        graph.AddNode(param);
        
        // RangeNode:
        // result = Range(items, template_calc)
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
        // Add as explicit dependency so it gets evaluated before RangeNode (to avoid KeyNotFound)
        rangeNode.AddDependency(templateNode);
        
        graph.AddNode(templateNode);
        graph.AddNode(rangeNode);

        var context = new CalculationContext();
        var evaluator = new GraphEvaluator();

        // Act
        var (_, evaluatedGraph) = evaluator.Evaluate(graph, context);

        // Assert
        var allNodes = evaluatedGraph.GetAllNodes().Select(n => n.Name).ToList();
        
        // The template node should be removed because it's only used by the RangeNode
        // and has been expanded into result(1) and result(2)
        allNodes.Should().NotContain("template_calc", "Template node should be removed from evaluated graph");
        
        // Verify expansion happened
        allNodes.Should().Contain("result(1)");
        allNodes.Should().Contain("result(2)");
    }

    [Fact]
    public void Should_Keep_Template_Node_If_Referenced_By_Other_Node()
    {
        // Arrange
        var graph = new DependencyGraph();
        
        // Template subgraph:
        // template_calc = item.price * 2
        var templateNode = new FormulaNode("template_calc", ctx => {
            try {
                return (double)ctx.Get("price") * 2;
            } catch {
                return 0.0; 
            }
        });

        // Make templateNode volatile so it gets cloned
        var param = new ParamNode("dummy_param", ctx => 0);
        templateNode.AddDependency(param);
        graph.AddNode(param);
        
        // RangeNode: result = Range(items, template_calc)
        var items = new List<object> 
        { 
            new Dictionary<string, object> { { "price", 10.0 } }
        };
        
        var rangeNode = new RangeNode(
            "result", 
            ctx => items, 
            ctx => ctx.Get("template_calc")
        );
        
        rangeNode.TargetDependencies.Add(templateNode);
        rangeNode.AddDependency(templateNode); // Explicit dep for order
        
        // Other node referencing the template:
        // other_calc = template_calc + 100
        var otherNode = new FormulaNode("other_calc", ctx => (double)ctx.Get("template_calc") + 100);
        otherNode.AddDependency(templateNode);
        
        graph.AddNode(templateNode);
        graph.AddNode(rangeNode);
        graph.AddNode(otherNode);

        var context = new CalculationContext();
        var evaluator = new GraphEvaluator();

        // Act
        var (_, evaluatedGraph) = evaluator.Evaluate(graph, context);

        // Assert
        var allNodes = evaluatedGraph.GetAllNodes().Select(n => n.Name).ToList();
        
        // The template node should NOT be removed because it is referenced by 'other_calc'
        allNodes.Should().Contain("template_calc", "Template node should be kept because it is referenced by another node");
        allNodes.Should().Contain("other_calc");
        allNodes.Should().Contain("result(1)");
    }
}
