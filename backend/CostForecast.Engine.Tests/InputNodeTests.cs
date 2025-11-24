using System.Collections.Generic;
using CostForecast.Engine.Compiler;
using CostForecast.Engine.Core;
using CostForecast.Engine.Evaluator;
using FluentAssertions;
using Xunit;

namespace CostForecast.Engine.Tests;

public class InputNodeTests
{
    [Fact]
    public void Should_Create_Direct_InputNode_For_Declaration_Syntax()
    {
        var compiler = new DslCompiler();
        var source = @"
            market_price: Input(""market_price"")
        ";

        var graph = compiler.Compile(source);

        var node = graph.GetNode("market_price");
        node.Should().NotBeNull();
        node.Should().BeOfType<InputNode>()
            .Which.Key.Should().Be("market_price");
            
        // Verify it is NOT a FormulaNode
        node.Should().NotBeOfType<FormulaNode>();
    }

    [Fact]
    public void Should_Evaluate_Direct_InputNode_Correctly()
    {
        var compiler = new DslCompiler();
        var source = @"
            price: Input(""price"")
            total = price * 10
        ";

        var graph = compiler.Compile(source);
        
        var context = new CalculationContext();
        var inputs = new Dictionary<string, object> { { "price", 50.0 } };
        context.AddInputProvider(new NamedInputProvider(inputs));

        var evaluator = new GraphEvaluator();
        var (results, _) = evaluator.Evaluate(graph, context);

        results["price"].Should().Be(50.0);
        results["total"].Should().Be(500.0);
    }

    [Fact]
    public void Should_Handle_Json_Input_With_Direct_InputNode()
    {
        var compiler = new DslCompiler();
        var source = @"
            data: Input(""data"")
        ";

        var graph = compiler.Compile(source);
        
        var context = new CalculationContext();
        // Simulate JSON string input
        var inputs = new Dictionary<string, object> { { "data", "[1, 2, 3]" } };
        context.AddInputProvider(new NamedInputProvider(inputs));

        var evaluator = new GraphEvaluator();
        var (results, _) = evaluator.Evaluate(graph, context);

        results["data"].Should().BeOfType<object[]>()
            .Which.Should().HaveCount(3)
            .And.BeEquivalentTo(new object[] { 1.0, 2.0, 3.0 });
    }
}
