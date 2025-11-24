using System.Collections.Generic;
using CostForecast.Engine.Compiler;
using CostForecast.Engine.Core;
using CostForecast.Engine.Evaluator;
using FluentAssertions;
using Xunit;

namespace CostForecast.Engine.Tests;

public class CompilerTests
{
    [Fact]
    public void Should_Compile_Constant_Assignment()
    {
        var compiler = new DslCompiler();
        var graph = compiler.Compile("x = 10");

        var node = graph.GetNode("x");
        node.Should().NotBeNull();
        node.Should().BeOfType<ConstantNode>()
            .Which.Value.Should().Be(10.0);
    }

    [Fact]
    public void Should_Compile_Formula_Reference()
    {
        var compiler = new DslCompiler();
        var graph = compiler.Compile(@"
            x = 10
            y = x
        ");

        var x = graph.GetNode("x");
        var y = graph.GetNode("y");

        x.Should().NotBeNull().And.BeOfType<ConstantNode>();
        y.Should().NotBeNull().And.BeOfType<FormulaNode>();

        y.Dependencies.Should().ContainSingle()
            .Which.Should().BeSameAs(x);
    }

    [Fact]
    public void Should_Compile_Arithmetic()
    {
        var compiler = new DslCompiler();
        var graph = compiler.Compile(@"
            x = 10
            y = 20
            z = x + y * 2
        ");

        var x = graph.GetNode("x");
        var y = graph.GetNode("y");
        var z = graph.GetNode("z");

        x.Should().BeOfType<ConstantNode>();
        y.Should().BeOfType<ConstantNode>();
        z.Should().BeOfType<FormulaNode>();

        z.Dependencies.Should().HaveCount(2);
        z.Dependencies.Should().Contain(x);
        z.Dependencies.Should().Contain(y);
    }

    [Fact]
    public void Should_Compile_Function_SUM()
    {
        var compiler = new DslCompiler();
        var graph = compiler.Compile(@"
            x = 1
            y = 2
            z = SUM(x, y, 3)
        ");

        var x = graph.GetNode("x");
        var y = graph.GetNode("y");
        var z = graph.GetNode("z");

        x.Should().BeOfType<ConstantNode>();
        y.Should().BeOfType<ConstantNode>();
        z.Should().BeOfType<FormulaNode>();

        z.Dependencies.Should().HaveCount(2);
        z.Dependencies.Should().Contain(x);
        z.Dependencies.Should().Contain(y);
    }
    [Fact]
    public void Should_Compile_Precedence_And_Parentheses()
    {
        var compiler = new DslCompiler();
        var graph = compiler.Compile(@"
            x = 10
            y = 20
            z = (x + y) * 2
        ");

        var x = graph.GetNode("x");
        var y = graph.GetNode("y");
        var z = graph.GetNode("z");

        x.Should().BeOfType<ConstantNode>();
        y.Should().BeOfType<ConstantNode>();
        z.Should().BeOfType<FormulaNode>();

        z.Dependencies.Should().HaveCount(2);
        z.Dependencies.Should().Contain(x);
        z.Dependencies.Should().Contain(y);
    }

    [Fact]
    public void Should_Compile_Nested_Functions()
    {
        var compiler = new DslCompiler();
        var graph = compiler.Compile(@"
            x = 10
            y = 20
            z = SUM(x, SUM(y, 5))
        ");

        var x = graph.GetNode("x");
        var y = graph.GetNode("y");
        var z = graph.GetNode("z");

        x.Should().BeOfType<ConstantNode>();
        y.Should().BeOfType<ConstantNode>();
        z.Should().BeOfType<FormulaNode>();

        z.Dependencies.Should().HaveCount(2);
        z.Dependencies.Should().Contain(x);
        z.Dependencies.Should().Contain(y);
    }

    [Fact]
    public void Should_Compile_Unary_Expression()
    {
        var compiler = new DslCompiler();
        var graph = compiler.Compile(@"
            x = 10
            y = -x
            z = +y
        ");

        var x = graph.GetNode("x");
        var y = graph.GetNode("y");
        var z = graph.GetNode("z");

        x.Should().BeOfType<ConstantNode>();
        y.Should().BeOfType<FormulaNode>();
        z.Should().BeOfType<FormulaNode>();

        y.Dependencies.Should().ContainSingle()
            .Which.Should().BeSameAs(x);
            
        z.Dependencies.Should().ContainSingle()
            .Which.Should().BeSameAs(y);
    }

    [Fact]
    public void Should_Handle_Input_With_Same_Name_As_Variable()
    {
        var compiler = new DslCompiler();
        var source = @"
            inflation = Input(""inflation"")
            x = 10 * inflation
        ";

        var graph = compiler.Compile(source);

        Assert.NotNull(graph);
        // The variable 'inflation' is a FormulaNode
        var inflationVar = graph.GetNode("inflation");
        Assert.IsType<FormulaNode>(inflationVar);

        // The input node is created with $Input_ prefix
        var inputNode = graph.GetNode("$Input_inflation");
        Assert.IsType<InputNode>(inputNode);
        Assert.Equal("inflation", ((InputNode)inputNode).Key);
    }

    [Fact]
    public void Should_Compile_String_Assignment()
    {
        var compiler = new DslCompiler();
        var graph = compiler.Compile(@"
            s = ""hello""
        ");

        var node = graph.GetNode("s");
        node.Should().NotBeNull();
        node.Should().BeOfType<ConstantNode>()
            .Which.Value.Should().Be("hello");
    }

    [Fact]
    public void Should_Compile_Complex_Expression_With_Input_And_SUM()
    {
        // TDD Test: x = 10, y = x * 2, inflation = Input("inflation"), total = SUM(x, y) + inflation
        var compiler = new DslCompiler();
        var graph = compiler.Compile(@"
            x = 10
            y = x * 2
            inflation = Input(""inflation"")
            total = SUM(x, y) + inflation
        ");

        var x = graph.GetNode("x");
        var y = graph.GetNode("y");
        var inflation = graph.GetNode("inflation");
        var total = graph.GetNode("total");
        var inputNode = graph.GetNode("$Input_inflation");

        // Verify nodes exist and have correct types
        x.Should().NotBeNull().And.BeOfType<ConstantNode>()
            .Which.Value.Should().Be(10.0);
        
        y.Should().NotBeNull().And.BeOfType<FormulaNode>();
        y.Dependencies.Should().ContainSingle()
            .Which.Should().BeSameAs(x);

        inflation.Should().NotBeNull().And.BeOfType<FormulaNode>();
        inputNode.Should().NotBeNull().And.BeOfType<InputNode>()
            .Which.Key.Should().Be("inflation");

        total.Should().NotBeNull().And.BeOfType<FormulaNode>();
        total.Dependencies.Should().Contain(x);
        total.Dependencies.Should().Contain(y);
        total.Dependencies.Should().Contain(inflation);
    }

    [Fact]
    public void Should_Compile_Range_With_Param()
    {
        // TDD Test for bug: Range with Param variable throws "Undefined variable" error
        // Scenario:
        // price: Param
        // discounted = price * 0.9
        // prices: Input("prices")
        // results = Range(prices, discounted)
        // total = SUM(results)

        var source = @"
price: Param
discounted = price * 0.9
prices: Input(""prices"")
results = Range(prices, discounted)
total = SUM(results)
";
        var compiler = new DslCompiler();
        var graph = compiler.Compile(source);

        graph.Should().NotBeNull();
        graph.GetNode("discounted").Should().NotBeNull();
        graph.GetNode("price").Should().NotBeNull();
        graph.GetNode("results").Should().NotBeNull();
        graph.GetNode("total").Should().NotBeNull();

        // Check dependencies
        var discounted = graph.GetNode("discounted");
        var price = graph.GetNode("price");
        var results = graph.GetNode("results");
        var total = graph.GetNode("total");
        var prices = graph.GetNode("prices");

        discounted.Dependencies.Should().Contain(price);
        results.Dependencies.Should().Contain(prices);
        results.Dependencies.Should().Contain(discounted);
        total.Dependencies.Should().Contain(results);

        var context = new CalculationContext();
        var inputs = new Dictionary<string, object> { 
            { "prices", new[] { 
                new Dictionary<string, object> { { "price", 100.0 } },
                new Dictionary<string, object> { { "price", 200.0 } },
                new Dictionary<string, object> { { "price", 300.0 } }
            }} 
        };
        context.AddInputProvider(new NamedInputProvider(inputs));

        var evaluator = new GraphEvaluator();
        var (evalResults, _) = evaluator.Evaluate(graph, context);

        // Should not throw "Undefined variable: price"
        evalResults.Should().ContainKey("total");
        // Expected: (100*0.9 + 200*0.9 + 300*0.9) = 90 + 180 + 270 = 540
        evalResults["total"].Should().Be(540.0);
    }
}
