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
}
