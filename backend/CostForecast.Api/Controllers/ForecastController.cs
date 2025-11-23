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
            if (request.Inputs != null && request.Inputs.Count > 0)
            {
                context.AddInputProvider(new NamedInputProvider(request.Inputs));
            }
            
            var evaluator = new GraphEvaluator();
            var results = evaluator.Evaluate(graph, context);

            response.Results = results;
            // Graph visualization serialization could be added here
        }
        catch (Exception ex)
        {
            response.Errors.Add(ex.Message);
            // Return 200 OK even with errors, but with error list populated? 
            // Or 400 Bad Request? 
            // Usually if it's a compilation/runtime error of the user code, 400 is appropriate.
            return BadRequest(response);
        }

        return Ok(response);
    }
}
