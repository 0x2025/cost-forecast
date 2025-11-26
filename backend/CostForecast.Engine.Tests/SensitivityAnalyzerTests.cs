using System.Collections.Generic;
using System.Linq;
using CostForecast.Engine.Compiler;
using CostForecast.Engine.Core;
using CostForecast.Engine.Evaluator;
using FluentAssertions;
using Xunit;

namespace CostForecast.Engine.Tests;

public class SensitivityAnalyzerTests
{
    private DependencyGraph Compile(string source)
    {
        var compiler = new DslCompiler();
        return compiler.Compile(source);
    }

    [Fact]
    public void Should_Analyze_Sensitivity_With_Single_Input()
    {
        // Arrange: Simple linear model where output = input * 2
        var source = @"
cost_per_unit = Input(""cost_per_unit"")
quantity = Input(""quantity"")
total_cost = cost_per_unit * quantity
";
        var graph = Compile(source);

        var baselineInputs = new Dictionary<string, object>
        {
            ["cost_per_unit"] = 10.0,
            ["quantity"] = 100.0
        };

        var analyzer = new SensitivityAnalyzer();
        var config = new SensitivityConfig { Steps = 5, RangePercent = 40 };

        // Act: Vary cost_per_unit and measure impact on total_cost
        var results = analyzer.Analyze(
            graph,
            baselineInputs,
            new List<string> { "cost_per_unit" },
            new List<string> { "total_cost" },
            config
        );

        // Assert
        results.Series.Should().HaveCount(1);
        var series = results.Series[0];
        series.InputName.Should().Be("cost_per_unit");
        series.OutputName.Should().Be("total_cost");
        series.Points.Should().HaveCount(5);

        // Verify the variation points
        // -40%, -20%, 0%, +20%, +40%
        series.Points[0].InputPercentChange.Should().BeApproximately(-40, 0.1);
        series.Points[2].InputPercentChange.Should().BeApproximately(0, 0.1);
        series.Points[4].InputPercentChange.Should().BeApproximately(40, 0.1);

        // Verify linear relationship: total_cost = cost_per_unit * quantity
        // When cost_per_unit = 6 (10 * 0.6), total_cost = 600
        series.Points[0].OutputValue.Should().BeApproximately(600, 1);
        // When cost_per_unit = 10 (baseline), total_cost = 1000
        series.Points[2].OutputValue.Should().BeApproximately(1000, 1);
        // When cost_per_unit = 14 (10 * 1.4), total_cost = 1400
        series.Points[4].OutputValue.Should().BeApproximately(1400, 1);
    }

    [Fact]
    public void Should_Detect_Key_Cost_Drivers()
    {
        // Arrange: Model with different sensitivities
        var source = @"
price = Input(""price"")
volume = Input(""volume"")
minor_fee = Input(""minor_fee"")

revenue = price * volume
total = revenue + minor_fee
";
        var graph = Compile(source);

        var baselineInputs = new Dictionary<string, object>
        {
            ["price"] = 100.0,
            ["volume"] = 1000.0,
            ["minor_fee"] = 50.0  // Much smaller impact than price/volume
        };

        var analyzer = new SensitivityAnalyzer();

        // Act
        var drivers = analyzer.DetectKeyCostDrivers(
            graph,
            baselineInputs,
            new List<string> { "total" },
            topN: 3
        );

        // Assert
        drivers.Should().HaveCount(3);
        
        // Volume and price should have high impact, minor_fee should have low impact
        var volumeDriver = drivers.FirstOrDefault(d => d.InputName == "volume");
        var priceDriver = drivers.FirstOrDefault(d => d.InputName == "price");
        var feeDriver = drivers.FirstOrDefault(d => d.InputName == "minor_fee");

        volumeDriver.Should().NotBeNull();
        priceDriver.Should().NotBeNull();
        feeDriver.Should().NotBeNull();

        // Both price and volume should have much higher impact than minor_fee
        volumeDriver!.ImpactScore.Should().BeGreaterThan(feeDriver!.ImpactScore * 10);
        priceDriver!.ImpactScore.Should().BeGreaterThan(feeDriver!.ImpactScore * 10);

        // Drivers should be sorted by impact (descending)
        for (int i = 0; i < drivers.Count - 1; i++)
        {
            drivers[i].ImpactScore.Should().BeGreaterThanOrEqualTo(drivers[i + 1].ImpactScore);
        }
    }

    [Fact]
    public void Should_Analyze_Multiple_Inputs_And_Outputs()
    {
        // Arrange
        var source = @"
cost_per_unit = Input(""cost_per_unit"")
quantity = Input(""quantity"")
markup_rate = Input(""markup_rate"")

total_cost = cost_per_unit * quantity
revenue = total_cost * (1 + markup_rate)
profit = revenue - total_cost
";
        var graph = Compile(source);

        var baselineInputs = new Dictionary<string, object>
        {
            ["cost_per_unit"] = 10.0,
            ["quantity"] = 100.0,
            ["markup_rate"] = 0.5
        };

        var analyzer = new SensitivityAnalyzer();
        var config = new SensitivityConfig { Steps = 3, RangePercent = 20 };

        // Act: Vary cost_per_unit and markup_rate, track total_cost and profit
        var results = analyzer.Analyze(
            graph,
            baselineInputs,
            new List<string> { "cost_per_unit", "markup_rate" },
            new List<string> { "total_cost", "profit" },
            config
        );

        // Assert
        // 2 inputs × 2 outputs = 4 series
        results.Series.Should().HaveCount(4);

        // Verify we have all combinations
        results.Series.Should().Contain(s => s.InputName == "cost_per_unit" && s.OutputName == "total_cost");
        results.Series.Should().Contain(s => s.InputName == "cost_per_unit" && s.OutputName == "profit");
        results.Series.Should().Contain(s => s.InputName == "markup_rate" && s.OutputName == "total_cost");
        results.Series.Should().Contain(s => s.InputName == "markup_rate" && s.OutputName == "profit");

        // Each series should have 3 points
        results.Series.ForEach(s => s.Points.Should().HaveCount(3));
    }


    [Fact]
    public void Should_Calculate_Correct_Percent_Changes()
    {
        // Arrange
        var source = @"
x = Input(""x"")
y = x * 2
";
        var graph = Compile(source);

        var baselineInputs = new Dictionary<string, object>
        {
            ["x"] = 100.0
        };

        var analyzer = new SensitivityAnalyzer();
        var config = new SensitivityConfig { Steps = 3, RangePercent = 50 };  // -50%, 0%, +50%

        // Act
        var results = analyzer.Analyze(
            graph,
            baselineInputs,
            new List<string> { "x" },
            new List<string> { "y" },
            config
        );

        // Assert
        var series = results.Series[0];
        series.Points.Should().HaveCount(3);

        // Point 0: x = 50 (−50%), y = 100 (−50%)
        series.Points[0].InputPercentChange.Should().BeApproximately(-50, 0.1);
        series.Points[0].OutputPercentChange.Should().BeApproximately(-50, 0.1);

        // Point 1: x = 100 (0%), y = 200 (0%)
        series.Points[1].InputPercentChange.Should().BeApproximately(0, 0.1);
        series.Points[1].OutputPercentChange.Should().BeApproximately(0, 0.1);

        // Point 2: x = 150 (+50%), y = 300 (+50%)
        series.Points[2].InputPercentChange.Should().BeApproximately(50, 0.1);
        series.Points[2].OutputPercentChange.Should().BeApproximately(50, 0.1);
    }
}
