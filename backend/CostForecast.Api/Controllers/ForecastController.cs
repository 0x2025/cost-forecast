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
}
