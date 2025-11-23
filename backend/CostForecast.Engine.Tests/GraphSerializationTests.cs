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
        var a = new ConstantNode("a", 1);
        var b = new FormulaNode("b", values => (int)values["a"] * 2);
        b.AddDependency(a);
        
        graph.AddNode(a);
        graph.AddNode(b);

        // Act
        var graphDto = GraphSerializer.SerializeGraph(graph);

        // Assert
        graphDto.Nodes.Should().HaveCount(2);
        graphDto.Edges.Should().HaveCount(1);
        
        var nodeA = graphDto.Nodes.First(n => n.Id == "a");
        nodeA.Type.Should().Be("constant");
        
        var nodeB = graphDto.Nodes.First(n => n.Id == "b");
        nodeB.Type.Should().Be("formula");
        
        var edge = graphDto.Edges[0];
        edge.Source.Should().Be("b");  // b depends on a
        edge.Target.Should().Be("a");   // so edge goes from b to a
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
        
        // y depends on x
        graphDto.Edges.Should().Contain(e => e.Source == "y" && e.Target == "x");
        
        // total depends on x and y
        graphDto.Edges.Should().Contain(e => e.Source == "total" && e.Target == "x");
        graphDto.Edges.Should().Contain(e => e.Source == "total" && e.Target == "y");
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
        
        // result depends on a, b, c
        graphDto.Edges.Should().Contain(e => e.Source == "result" && e.Target == "a");
        graphDto.Edges.Should().Contain(e => e.Source == "result" && e.Target == "b");
        graphDto.Edges.Should().Contain(e => e.Source == "result" && e.Target == "c");
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
