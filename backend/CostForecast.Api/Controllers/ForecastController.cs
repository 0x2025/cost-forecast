using System.Linq;
using Microsoft.AspNetCore.Mvc;
using CostForecast.Api.Models;
using CostForecast.Engine.Compiler;
using CostForecast.Engine.Evaluator;
using CostForecast.Engine.Core;

namespace CostForecast.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ForecastController : ControllerBase
{
    [HttpPost("calculate")]
    public IActionResult Calculate([FromBody] CalculationRequest request)
    {
        try
        {
            var compiler = new DslCompiler();
            var compiledGraph = compiler.Compile(request.Source);

            var context = new CalculationContext();
            // Add inputs
            context.AddInputProvider(new NamedInputProvider(request.Inputs));
            
            var evaluator = new GraphEvaluator();
            // compiled_graph + input_data = evaluated_graph
            var (results, evaluatedGraph) = evaluator.Evaluate(compiledGraph, context);

            // Serialize the evaluated graph (contains runtime nodes like Range items)
            // Pass results to include evaluated values in display names
            var graphDto = GraphSerializer.SerializeGraph(evaluatedGraph, results);

            return Ok(new
            {
                Results = results,
                Graph = graphDto
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
    }

    [HttpPost("calculate-batch")]
    public IActionResult CalculateBatch([FromBody] BatchCalculationRequest request)
    {
        try
        {
            var compiler = new DslCompiler();
            var compiledGraph = compiler.Compile(request.Source);

            var runner = new ScenarioRunner();
            var scenarioResults = runner.ExecuteScenarios(compiledGraph, request.Scenarios);

            var response = new BatchCalculationResponse();
            
            foreach (var (scenarioName, scenarioResult) in scenarioResults.Results)
            {
                // Optionally serialize graphs (set to null to reduce payload size)
                object? graphDto = null;
                // Uncomment to include graphs in response:
                // if (scenarioResult.EvaluatedGraph != null)
                // {
                //     graphDto = GraphSerializer.SerializeGraph(
                //         scenarioResult.EvaluatedGraph, 
                //         scenarioResult.Results
                //     );
                // }

                response.Results[scenarioName] = new Models.ScenarioResult
                {
                    Results = scenarioResult.Results,
                    Graph = graphDto
                };
            }

            return Ok(response);
        }
        catch (Exception ex)
        {
            return BadRequest(new { Errors = new[] { new CalculationError { Message = ex.Message } } });
        }
    }

    [HttpPost("sensitivity")]
    public IActionResult AnalyzeSensitivity([FromBody] SensitivityRequest request)
    {
        try
        {
            var compiler = new DslCompiler();
            var compiledGraph = compiler.Compile(request.Source);

            var analyzer = new SensitivityAnalyzer();
            var config = new Engine.Evaluator.SensitivityConfig
            {
                Steps = request.Steps,
                RangePercent = request.RangePercent
            };

            // If specific inputs are provided, do targeted sensitivity analysis
            if (request.InputsToVary.Count > 0)
            {
                var results = analyzer.Analyze(
                    compiledGraph,
                    request.BaselineInputs,
                    request.InputsToVary,
                    request.OutputMetrics,
                    config
                );

                var response = new SensitivityResponse
                {
                    Series = MapSeries(results.Series)
                };

                return Ok(response);
            }
            else
            {
                // Auto-detect key cost drivers
                var drivers = analyzer.DetectKeyCostDrivers(
                    compiledGraph,
                    request.BaselineInputs,
                    request.OutputMetrics,
                    topN: 10
                );

                var response = new SensitivityResponse
                {
                    KeyDrivers = MapDrivers(drivers)
                };

                return Ok(response);
            }
        }
        catch (Exception ex)
        {
            return BadRequest(new { Errors = new[] { new CalculationError { Message = ex.Message } } });
        }
    }

    private List<Models.SensitivitySeries> MapSeries(List<Engine.Evaluator.SensitivitySeries> engineSeries)
    {
        return engineSeries.Select(s => new Models.SensitivitySeries
        {
            InputName = s.InputName,
            OutputName = s.OutputName,
            Points = s.Points.Select(p => new Models.SensitivityPoint
            {
                InputValue = p.InputValue,
                InputPercentChange = p.InputPercentChange,
                OutputValue = p.OutputValue,
                OutputPercentChange = p.OutputPercentChange
            }).ToList()
        }).ToList();
    }

    private List<Models.CostDriver> MapDrivers(List<Engine.Evaluator.CostDriver> engineDrivers)
    {
        return engineDrivers.Select(d => new Models.CostDriver
        {
            InputName = d.InputName,
            ImpactScore = d.ImpactScore,
            OutputImpacts = new Dictionary<string, double>(d.OutputImpacts)
        }).ToList();
    }
}
