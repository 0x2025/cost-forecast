using System.Collections.Generic;
using CostForecast.Engine.Core;
using CostForecast.Engine.Evaluator;
using FluentAssertions;
using Xunit;

namespace CostForecast.Engine.Tests;

public class EvaluatorTests
{
    [Fact]
    public void Should_Evaluate_Constant()
    {
        // Arrange
        var graph = new DependencyGraph();
        var node = new ConstantNode("X", 5);
        graph.AddNode(node);

        var context = new CalculationContext();
        var evaluator = new GraphEvaluator();

        // Act
        var results = evaluator.Evaluate(graph, context);

        // Assert
        results["X"].Should().Be(5);
    }

    [Fact]
    public void Should_Evaluate_Formula()
    {
        // Arrange
        var graph = new DependencyGraph();
        var x = new ConstantNode("X", 1);
        // Y = X + 1
        var y = new FormulaNode("Y", values => (int)values["X"] + 1);
        y.AddDependency(x);

        graph.AddNode(x);
        graph.AddNode(y);

        var context = new CalculationContext();
        var evaluator = new GraphEvaluator();

        // Act
        var results = evaluator.Evaluate(graph, context);

        // Assert
        results["Y"].Should().Be(2);
    }

    [Fact]
    public void Should_Evaluate_Named_Input()
    {
        // Arrange
        var graph = new DependencyGraph();
        var rate = new InputNode("Rate", "rate");
        graph.AddNode(rate);

        var inputs = new Dictionary<string, object> { { "rate", 0.5 } };
        var provider = new NamedInputProvider(inputs);
        var context = new CalculationContext();
        context.AddInputProvider(provider);

        var evaluator = new GraphEvaluator();

        // Act
        var results = evaluator.Evaluate(graph, context);

        // Assert
        results["Rate"].Should().Be(0.5);
    }

    [Fact]
    public void Should_Evaluate_Grid_Input()
    {
        // Arrange
        var graph = new DependencyGraph();
        var cell = new InputNode("Val", "A1");
        graph.AddNode(cell);

        var cells = new Dictionary<string, object> { { "A1", 100 } };
        var provider = new GridInputProvider(cells);
        var context = new CalculationContext();
        context.AddInputProvider(provider);

        var evaluator = new GraphEvaluator();

        // Act
        var results = evaluator.Evaluate(graph, context);

        // Assert
        results["Val"].Should().Be(100);
    }

    [Fact]
    public void Should_Evaluate_Complex_Expression()
    {
        // 1 + 2 * 3 = 7
        var graph = new DependencyGraph();
        var a = new ConstantNode("A", 1);
        var b = new ConstantNode("B", 2);
        var c = new ConstantNode("C", 3);
        
        var result = new FormulaNode("Result", values => 
            (int)values["A"] + (int)values["B"] * (int)values["C"]);
        
        result.AddDependency(a);
        result.AddDependency(b);
        result.AddDependency(c);

        graph.AddNode(a);
        graph.AddNode(b);
        graph.AddNode(c);
        graph.AddNode(result);

        var evaluator = new GraphEvaluator();
        var results = evaluator.Evaluate(graph, new CalculationContext());

        results["Result"].Should().Be(7);
    }
}
