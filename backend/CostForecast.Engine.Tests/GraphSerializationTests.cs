using System.Collections.Generic;
using System.Linq;
using CostForecast.Engine.Compiler;
using CostForecast.Engine.Core;
using CostForecast.Engine.Evaluator;
using FluentAssertions;
using Xunit;

namespace CostForecast.Engine.Tests;

public class GraphSerializationTests
{
    [Fact]
    public void Should_Serialize_Simple_Constant_Node()
    {
        // Arrange
        var graph = new DependencyGraph();
        var node = new ConstantNode("x", 42);
        graph.AddNode(node);

        // Act
        var graphDto = GraphSerializer.SerializeGraph(graph);

        // Assert
        graphDto.Nodes.Should().HaveCount(1);
        graphDto.Nodes[0].Id.Should().Be("x");
        graphDto.Nodes[0].Type.Should().Be("constant");
        graphDto.Nodes[0].Label.Should().Be("x");
        graphDto.Nodes[0].Metadata.Should().ContainKey("value");
        graphDto.Nodes[0].Metadata!["value"].Should().Be(42);
        graphDto.Edges.Should().BeEmpty();
    }

    [Fact]
    public void Should_Serialize_Simple_Input_Node()
    {
        // Arrange
        var graph = new DependencyGraph();
        var node = new InputNode("inflation", "inflation_key");
        graph.AddNode(node);

        // Act
        var graphDto = GraphSerializer.SerializeGraph(graph);

        // Assert
        graphDto.Nodes.Should().HaveCount(1);
        graphDto.Nodes[0].Id.Should().Be("inflation");
        graphDto.Nodes[0].Type.Should().Be("input");
        graphDto.Nodes[0].Metadata.Should().ContainKey("key");
        graphDto.Nodes[0].Metadata!["key"].Should().Be("inflation_key");
    }

    [Fact]
    public void Should_Serialize_Simple_Formula_With_Dependencies()
    {
        // Arrange: a = 1, b = a * 2
        var graph = new DependencyGraph();
        var nodeA = new ConstantNode("A", 10.0);
        var nodeB = new FormulaNode("B", ctx => (double)ctx.Get("A") * 2);
        nodeB.AddDependency(nodeA);
        
        graph.AddNode(nodeA);
        graph.AddNode(nodeB);

        // Act
        var graphDto = GraphSerializer.SerializeGraph(graph);

        // Assert
        graphDto.Nodes.Should().HaveCount(2);
        graphDto.Edges.Should().HaveCount(1);
        
        var nodeADto = graphDto.Nodes.First(n => n.Id == "A");
        nodeADto.Type.Should().Be("constant");
        
        var nodeBDto = graphDto.Nodes.First(n => n.Id == "B");
        nodeBDto.Type.Should().Be("formula");
        
        var edge = graphDto.Edges[0];
        edge.Source.Should().Be("A");  // A flows into B
        edge.Target.Should().Be("B");
    }

    [Fact]
    public void Should_Serialize_Complex_Model_With_Multiple_Dependencies()
    {
        // Arrange: x = 10, y = x * 2, total = SUM(x, y)
        var compiler = new DslCompiler();
        var source = @"
            x = 10
            y = x * 2
            total = SUM(x, y)
        ";
        var graph = compiler.Compile(source);

        // Act
        var graphDto = GraphSerializer.SerializeGraph(graph);

        // Assert
        graphDto.Nodes.Should().HaveCount(3);
        graphDto.Nodes.Select(n => n.Id).Should().Contain(new[] { "x", "y", "total" });
        
        // y depends on x (x -> y)
        graphDto.Edges.Should().Contain(e => e.Source == "x" && e.Target == "y");
        
        // total depends on x and y (x -> total, y -> total)
        graphDto.Edges.Should().Contain(e => e.Source == "x" && e.Target == "total");
        graphDto.Edges.Should().Contain(e => e.Source == "y" && e.Target == "total");
    }

    [Fact]
    public void Should_Serialize_Graph_With_Input_Nodes()
    {
        // Arrange
        var compiler = new DslCompiler();
        var source = @"
            price = Input(""price"")
            tax_rate = Input(""tax_rate"")
            total = price * (1 + tax_rate)
        ";
        var graph = compiler.Compile(source);

        // Act
        var graphDto = GraphSerializer.SerializeGraph(graph);

        // Assert - Input nodes are created with $Input_ prefix
        graphDto.Nodes.Should().HaveCount(5); // price, tax_rate, total (formulas) + 2 input nodes
        
        var inputNodes = graphDto.Nodes.Where(n => n.Type == "input").ToList();
        inputNodes.Should().HaveCount(2);
        
        var formulaNodes = graphDto.Nodes.Where(n => n.Type == "formula").ToList();
        formulaNodes.Should().HaveCount(3); // price, tax_rate, total are all formulas
        
        // Verify input nodes exist with correct metadata
        graphDto.Nodes.Should().Contain(n => n.Type == "input" && n.Metadata != null && n.Metadata.ContainsKey("key"));
    }

    [Fact]
    public void Should_Serialize_Graph_With_Nested_Functions()
    {
        // Arrange
        var compiler = new DslCompiler();
        var source = @"
            a = 5
            b = 10
            c = 20
            result = SUM(a, MAX(b, c))
        ";
        var graph = compiler.Compile(source);

        // Act
        var graphDto = GraphSerializer.SerializeGraph(graph);

        // Assert
        graphDto.Nodes.Should().HaveCount(4);
        graphDto.Nodes.Select(n => n.Type).Should().Contain("constant");
        graphDto.Nodes.Select(n => n.Type).Should().Contain("formula");
        
        // result depends on a, b, c (a -> result, b -> result, c -> result)
        graphDto.Edges.Should().Contain(e => e.Source == "a" && e.Target == "result");
        graphDto.Edges.Should().Contain(e => e.Source == "b" && e.Target == "result");
        graphDto.Edges.Should().Contain(e => e.Source == "c" && e.Target == "result");
    }

    [Fact]
    public void Should_Serialize_Graph_With_Const_Function()
    {
        // Arrange
        var compiler = new DslCompiler();
        var source = @"
            pi = Const(3.14159)
            radius = Input(""radius"")
            area = pi * radius * radius
        ";
        var graph = compiler.Compile(source);

        // Act
        var graphDto = GraphSerializer.SerializeGraph(graph);

        // Assert - pi is constant, radius and area are formulas, plus input node
        graphDto.Nodes.Should().HaveCount(4);
        
        // pi is wrapped in a formula (even though it's created with Const)
        var piNode = graphDto.Nodes.First(n => n.Id == "pi");
        piNode.Should().NotBeNull();
        
        // radius is a formula that wraps Input()
        var radiusNode = graphDto.Nodes.First(n => n.Id == "radius");
        radiusNode.Type.Should().Be("formula");
        
        // There should be an input node with $Input_ prefix
        graphDto.Nodes.Should().Contain(n => n.Type == "input");
    }

    [Fact]
    public void Should_Serialize_Graph_With_IF_Conditions()
    {
        // Arrange
        var compiler = new DslCompiler();
        var source = @"
            discount = Input(""discount"")
            price = 100
            final_price = IF(discount > 0, price * (1 - discount), price)
        ";
        var graph = compiler.Compile(source);

        // Act
        var graphDto = GraphSerializer.SerializeGraph(graph);

        // Assert - discount is formula, price is constant, final_price is formula, plus input node
        graphDto.Nodes.Should().HaveCount(4);
        
        // Verify we have the right types
        graphDto.Nodes.Should().Contain(n => n.Id == "price" && n.Type == "constant");
        graphDto.Nodes.Should().Contain(n => n.Id == "discount" && n.Type == "formula");
        graphDto.Nodes.Should().Contain(n => n.Id == "final_price" && n.Type == "formula");
        graphDto.Nodes.Should().Contain(n => n.Type == "input");
    }

    [Fact]
    public void Should_Serialize_Empty_Graph()
    {
        // Arrange
        var graph = new DependencyGraph();

        // Act
        var graphDto = GraphSerializer.SerializeGraph(graph);

        // Assert
        graphDto.Nodes.Should().BeEmpty();
        graphDto.Edges.Should().BeEmpty();
    }

    [Fact]
    public void Should_Serialize_Single_Node_Without_Dependencies()
    {
        // Arrange
        var graph = new DependencyGraph();
        var node = new ConstantNode("standalone", 999);
        graph.AddNode(node);

        // Act
        var graphDto = GraphSerializer.SerializeGraph(graph);

        // Assert
        graphDto.Nodes.Should().HaveCount(1);
        graphDto.Edges.Should().BeEmpty();
    }

    [Fact]
    public void Should_Handle_All_Node_Types()
    {
        // Arrange: Test ConstantNode, InputNode, FormulaNode
        var compiler = new DslCompiler();
        var source = @"
            const_val = 42
            input_val = Input(""test_input"")
            formula_val = const_val + input_val
        ";
        var graph = compiler.Compile(source);

        // Act
        var graphDto = GraphSerializer.SerializeGraph(graph);

        // Assert - const_val is constant, input_val and formula_val are formulas, plus input node
        graphDto.Nodes.Should().HaveCountGreaterThanOrEqualTo(3);
        graphDto.Nodes.Should().Contain(n => n.Type == "constant");
        graphDto.Nodes.Should().Contain(n => n.Type == "input");
        graphDto.Nodes.Should().Contain(n => n.Type == "formula");
    }

    [Fact]
    public void Should_Preserve_Node_Metadata()
    {
        // Arrange
        var graph = new DependencyGraph();
        var constant = new ConstantNode("test_const", "hello");
        var input = new InputNode("test_input", "my_key");
        graph.AddNode(constant);
        graph.AddNode(input);

        // Act
        var graphDto = GraphSerializer.SerializeGraph(graph);

        // Assert
        var constantDto = graphDto.Nodes.First(n => n.Id == "test_const");
        constantDto.Metadata.Should().NotBeNull();
        constantDto.Metadata!["value"].Should().Be("hello");
        
        var inputDto = graphDto.Nodes.First(n => n.Id == "test_input");
        inputDto.Metadata.Should().NotBeNull();
        inputDto.Metadata!["key"].Should().Be("my_key");
    }
}
