using System.Collections.Generic;
using CostForecast.Api.Controllers;
using CostForecast.Api.Models;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace CostForecast.Api.Tests;

public class ForecastControllerTests
{
    [Fact]
    public void Calculate_ShouldReturnResults_WhenDslIsValid()
    {
        // Arrange
        var controller = new ForecastController();
        var request = new CalculationRequest
        {
            Source = @"
                x = 10
                y = 20
                z = x + y
            "
        };

        // Act
        var result = controller.Calculate(request);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<CalculationResponse>().Subject;

        response.Errors.Should().BeEmpty();
        response.Results.Should().ContainKey("z").WhoseValue.Should().Be(30.0);
    }

    [Fact]
    public void Calculate_ShouldReturnResults_WhenInputsAreProvided()
    {
        // Arrange
        var controller = new ForecastController();
        var request = new CalculationRequest
        {
            Source = @"
                x = Input(""base"")
                y = x * 2
            ",
            Inputs = new Dictionary<string, object>
            {
                { "base", 50.0 }
            }
        };

        // Act
        var result = controller.Calculate(request);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<CalculationResponse>().Subject;

        response.Errors.Should().BeEmpty();
        response.Results.Should().ContainKey("y").WhoseValue.Should().Be(100.0);
    }

    [Fact]
    public void Calculate_ShouldReturnBadRequest_WhenDslIsInvalid()
    {
        // Arrange
        var controller = new ForecastController();
        var request = new CalculationRequest
        {
            Source = @"
                x = 10 +
            " // Syntax error
        };

        // Act
        var result = controller.Calculate(request);

        // Assert
        var badRequestResult = result.Result.Should().BeOfType<BadRequestObjectResult>().Subject;
        var response = badRequestResult.Value.Should().BeOfType<CalculationResponse>().Subject;

        response.Errors.Should().NotBeEmpty();
    }
}
