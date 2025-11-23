using CostForecast.Engine.Core;
using FluentAssertions;
using Xunit;

namespace CostForecast.Engine.Tests;

public class GraphTests
{
    [Fact]
    public void Should_Sort_Topologically()
    {
        // Arrange
        var graph = new DependencyGraph();
        var a = new ConstantNode("A", 10);
        var b = new FormulaNode("B", _ => null);
        b.AddDependency(a); // B depends on A

        graph.AddNode(a);
        graph.AddNode(b);

        // Act
        var order = graph.GetExecutionOrder();

        // Assert
        order.Should().HaveCount(2);
        order[0].Name.Should().Be("A");
        order[1].Name.Should().Be("B");
    }

    [Fact]
    public void Should_Detect_Cycles()
    {
        // Arrange
        var graph = new DependencyGraph();
        var a = new FormulaNode("A", _ => null);
        var b = new FormulaNode("B", _ => null);
        
        a.AddDependency(b); // A -> B
        b.AddDependency(a); // B -> A

        graph.AddNode(a);
        graph.AddNode(b);

        // Act
        Action act = () => graph.GetExecutionOrder();

        // Assert
        act.Should().Throw<InvalidOperationException>()
           .WithMessage("*cycle*");
    }

    [Fact]
    public void Should_Compare_Nodes_Equality()
    {
        // Arrange
        var a1 = new ConstantNode("A", 10);
        var a2 = new ConstantNode("A", 10);

        var b1 = new FormulaNode("B", _ => null);
        b1.AddDependency(a1);

        var b2 = new FormulaNode("B", _ => null);
        b2.AddDependency(a2); // Depends on a node that is equal to a1

        // Act & Assert
        a1.Should().Be(a2); // Value equality
        b1.Should().Be(b2); // Dependency equality
        
        // Verify Not Equal
        var c = new ConstantNode("A", 20);
        a1.Should().NotBe(c);
    }
}
