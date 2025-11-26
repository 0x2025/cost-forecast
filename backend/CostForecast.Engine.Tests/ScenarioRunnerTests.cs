using System.Collections.Generic;
using CostForecast.Engine.Compiler;
using CostForecast.Engine.Core;
using CostForecast.Engine.Evaluator;
using FluentAssertions;
using Xunit;

namespace CostForecast.Engine.Tests;

public class ScenarioRunnerTests
{
    private DependencyGraph Compile(string source)
    {
        var compiler = new DslCompiler();
        return compiler.Compile(source);
    }

    [Fact]
    public void Should_Execute_Multiple_Scenarios()
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

        var scenarios = new Dictionary<string, Dictionary<string, object>>
        {
            ["Baseline"] = new Dictionary<string, object>
            {
                ["items"] = new[]
                {
                    new Dictionary<string, object> { { "qty", 2.0 }, { "price", 10.0 } },
                    new Dictionary<string, object> { { "qty", 3.0 }, { "price", 15.0 } }
                },
                ["tax_rate"] = 0.1
            },
            ["High Tax"] = new Dictionary<string, object>
            {
                ["items"] = new[]
                {
                    new Dictionary<string, object> { { "qty", 2.0 }, { "price", 10.0 } },
                    new Dictionary<string, object> { { "qty", 3.0 }, { "price", 15.0 } }
                },
                ["tax_rate"] = 0.2
            },
            ["More Items"] = new Dictionary<string, object>
            {
                ["items"] = new[]
                {
                    new Dictionary<string, object> { { "qty", 2.0 }, { "price", 10.0 } },
                    new Dictionary<string, object> { { "qty", 3.0 }, { "price", 15.0 } },
                    new Dictionary<string, object> { { "qty", 1.0 }, { "price", 50.0 } }
                },
                ["tax_rate"] = 0.1
            }
        };

        var runner = new ScenarioRunner();

        // Act
        var results = runner.ExecuteScenarios(graph, scenarios);

        // Assert
        results.Results.Should().ContainKey("Baseline");
        results.Results.Should().ContainKey("High Tax");
        results.Results.Should().ContainKey("More Items");

        // Baseline: subtotal = 65, tax = 6.5, grand_total = 71.5
        var baselineResult = results.Results["Baseline"];
        ((double)baselineResult.Results["subtotal"]).Should().Be(65.0);
        ((double)baselineResult.Results["tax"]).Should().Be(6.5);
        ((double)baselineResult.Results["grand_total"]).Should().Be(71.5);

        // High Tax: subtotal = 65, tax = 13, grand_total = 78
        var highTaxResult = results.Results["High Tax"];
        ((double)highTaxResult.Results["subtotal"]).Should().Be(65.0);
        ((double)highTaxResult.Results["tax"]).Should().Be(13.0);
        ((double)highTaxResult.Results["grand_total"]).Should().Be(78.0);

        // More Items: subtotal = 115, tax = 11.5, grand_total = 126.5
        var moreItemsResult = results.Results["More Items"];
        ((double)moreItemsResult.Results["subtotal"]).Should().Be(115.0);
        ((double)moreItemsResult.Results["tax"]).Should().Be(11.5);
        ((double)moreItemsResult.Results["grand_total"]).Should().Be(126.5);
    }

    [Fact]
    public void Should_Execute_Single_Scenario()
    {
        // Arrange
        var source = @"
x = Input(""x"")
y = Input(""y"")
result = x + y
";
        var graph = Compile(source);

        var scenarios = new Dictionary<string, Dictionary<string, object>>
        {
            ["Test"] = new Dictionary<string, object>
            {
                ["x"] = 10.0,
                ["y"] = 20.0
            }
        };

        var runner = new ScenarioRunner();

        // Act
        var results = runner.ExecuteScenarios(graph, scenarios);

        // Assert
        results.Results.Should().ContainKey("Test");
        ((double)results.Results["Test"].Results["result"]).Should().Be(30.0);
    }

    [Fact]
    public void Should_Handle_Empty_Scenarios()
    {
        // Arrange
        var source = @"
x = Input(""x"")
result = x * 2
";
        var graph = Compile(source);
        var scenarios = new Dictionary<string, Dictionary<string, object>>();
        var runner = new ScenarioRunner();

        // Act
        var results = runner.ExecuteScenarios(graph, scenarios);

        // Assert
        results.Results.Should().BeEmpty();
    }
}
