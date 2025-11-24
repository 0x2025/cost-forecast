using System.Collections.Generic;
using CostForecast.Engine.Compiler;
using CostForecast.Engine.Core;
using CostForecast.Engine.Evaluator;
using FluentAssertions;
using Xunit;

namespace CostForecast.Engine.Tests;

public class ComplexScenarioTests
{
    private DependencyGraph Compile(string source)
    {
        var compiler = new DslCompiler();
        return compiler.Compile(source);
    }

    [Fact]
    public void Should_Calculate_GrandTotal_With_Range_And_Params()
    {
        // Arrange
        var source = @"
qty: Param
price: Param
row_total = qty * price

items = Input(""items"")
tax_rate = Input(""tax_rate"")

subtotal = SUM(Range(items, row_total))
tax = subtotal * tax_rate
grand_total = subtotal + tax
";
        var graph = Compile(source);

        var items = new[] { 
            new Dictionary<string, object> { { "qty", 2.0 }, { "price", 10.0 } }, // 20
            new Dictionary<string, object> { { "qty", 3.0 }, { "price", 15.0 } }  // 45
        };
        // Subtotal = 65

        var inputs = new Dictionary<string, object> 
        { 
            { "items", items },
            { "tax_rate", 0.1 }
        };

        var context = new CalculationContext();
        context.AddInputProvider(new NamedInputProvider(inputs));
        var evaluator = new GraphEvaluator();

        // Act
        var (results, _) = evaluator.Evaluate(graph, context);

        // Assert
        results.Should().ContainKey("grand_total");
        
        double subtotal = 65.0;
        double tax = 6.5;
        double expectedGrandTotal = 71.5;

        ((double)results["subtotal"]).Should().Be(subtotal);
        ((double)results["tax"]).Should().Be(tax);
        ((double)results["grand_total"]).Should().Be(expectedGrandTotal);
    }
}
