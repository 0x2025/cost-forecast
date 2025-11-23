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
    [Fact]
    public void Should_Throw_When_Input_Missing_And_Used_In_Calculation()
    {
        // Arrange
        var compiler = new CostForecast.Engine.Compiler.DslCompiler();
        var source = "x = 10 * Input(\"inflation\")";
        var graph = compiler.Compile(source);

        var context = new CalculationContext();
        // Provide invalid input (empty string or non-numeric)
        var inputs = new Dictionary<string, object> { { "inflation", "invalid_number" } };
        context.AddInputProvider(new NamedInputProvider(inputs));

        var evaluator = new GraphEvaluator();

        // Act
        Action act = () => evaluator.Evaluate(graph, context);

        // Assert
        act.Should().Throw<System.Exception>()
           .WithMessage("*Input 'inflation' has invalid value*"); 
    }

    [Fact]
    public void Should_Evaluate_Const_Function()
    {
        var compiler = new CostForecast.Engine.Compiler.DslCompiler();
        var source = "x = Const(42)";
        var graph = compiler.Compile(source);

        var evaluator = new GraphEvaluator();
        var results = evaluator.Evaluate(graph, new CalculationContext());

        results["x"].Should().Be(42);
    }

    [Fact]
    public void Should_Evaluate_Complex_Expression_With_Input_And_SUM()
    {
        // TDD Test: x = 10, y = x * 2 = 20, inflation = 5, total = SUM(10, 20) + 5 = 35
        var compiler = new CostForecast.Engine.Compiler.DslCompiler();
        var source = @"
            x = 10
            y = x * 2
            inflation = Input(""inflation"")
            total = SUM(x, y) + inflation
        ";
        
        var graph = compiler.Compile(source);

        var context = new CalculationContext();
        var inputs = new Dictionary<string, object> { { "inflation", 5 } };
        context.AddInputProvider(new NamedInputProvider(inputs));

        var evaluator = new GraphEvaluator();
        var results = evaluator.Evaluate(graph, context);

        // Assert all values
        results["x"].Should().Be(10);
        results["y"].Should().Be(20); // 10 * 2
        results["inflation"].Should().Be(5);
        results["total"].Should().Be(35); // SUM(10, 20) + 5 = 30 + 5 = 35
    }

    [Fact]
    public void Should_Evaluate_Expression_With_JsonElement_Inputs()
    {
        // This test simulates how inputs come from the API (as JsonElement)
        var compiler = new CostForecast.Engine.Compiler.DslCompiler();
        var source = @"
            x = 10
            y = x * 2
            inflation = Input(""inflation"")
            total = SUM(x, y) + inflation
        ";
        
        var graph = compiler.Compile(source);

        // Simulate API deserialization by creating JsonElement from JSON string
        var jsonString = "{\"inflation\": 5}";
        var jsonDoc = System.Text.Json.JsonDocument.Parse(jsonString);
        var inputs = new Dictionary<string, object>();
        
        foreach (var prop in jsonDoc.RootElement.EnumerateObject())
        {
            inputs[prop.Name] = prop.Value; // This creates a JsonElement object
        }

        var context = new CalculationContext();
        context.AddInputProvider(new NamedInputProvider(inputs));

        var evaluator = new GraphEvaluator();
        var results = evaluator.Evaluate(graph, context);

        // Assert all values - should work exactly like primitive inputs
        results["x"].Should().Be(10.0);
        results["y"].Should().Be(20.0); // 10 * 2
        results["inflation"].Should().Be(5.0);
        results["total"].Should().Be(35.0); // SUM(10, 20) + 5 = 30 + 5 = 35
    }
}
