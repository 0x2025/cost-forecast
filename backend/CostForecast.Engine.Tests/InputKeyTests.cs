using System.Collections.Generic;
using CostForecast.Engine.Compiler;
using CostForecast.Engine.Core;
using CostForecast.Engine.Evaluator;
using Xunit;

namespace CostForecast.Engine.Tests
{
    public class InputKeyTests
    {
        [Fact]
        public void CanHandleInputKeysWithSpaces()
        {
            // Arrange
            var source = @"
vacancy_rate = Input(""Vacancy Rate (%)"")
utility_cost = Input(""Utility Cost per Sq Ft"")
total = vacancy_rate + utility_cost
";
            var inputs = new Dictionary<string, object>
            {
                { "Vacancy Rate (%)", 0.05 },
                { "Utility Cost per Sq Ft", 0.25 }
            };

            var compiler = new DslCompiler();
            var graph = compiler.Compile(source);
            
            var context = new CalculationContext();
            context.AddInputProvider(new NamedInputProvider(inputs));
            
            var evaluator = new GraphEvaluator();

            // Act
            var (results, _) = evaluator.Evaluate(graph, context);

            // Assert
            Assert.Equal(0.30, results["total"]);
        }
    }
}
