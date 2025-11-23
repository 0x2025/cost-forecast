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
    public ActionResult<CalculationResponse> Calculate([FromBody] CalculationRequest request)
    {
        var response = new CalculationResponse();

        try
        {
            var compiler = new DslCompiler();
            var graph = compiler.Compile(request.Source);

            var context = new CalculationContext();
            // Add inputs
            if (request.Inputs != null)
            {
                context.AddInputProvider(new NamedInputProvider(request.Inputs));
            }
            
            var evaluator = new GraphEvaluator();
            var results = evaluator.Evaluate(graph, context);

            // Serialize the graph structure
            var graphDto = GraphSerializer.SerializeGraph(graph);

            return Ok(new CalculationResponse
            {
                Results = results,
                Graph = graphDto
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new CalculationResponse
            {
                Errors = new List<CalculationError> 
                { 
                    new CalculationError { Message = ex.Message } 
                }
            });
        }
    }
}
