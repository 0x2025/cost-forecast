using Xunit;
using FluentAssertions;
using CostForecast.Engine.Compiler;
using CostForecast.Engine.Evaluator;
using CostForecast.Engine.Core;
using System.Collections.Generic;
using System.Linq;

namespace CostForecast.Engine.Tests;

public class InputNodeRedundancyTests
{
    [Fact]
    public void Declaration_Syntax_Should_Create_Only_InputNode()
    {
        var compiler = new DslCompiler();
        var source = @"
            management_fee_rate: Input(""Management Fee Rate (%)"")
        ";

        var graph = compiler.Compile(source);
        var allNodes = graph.GetAllNodes().ToList();

        // Should only have ONE node: management_fee_rate
        allNodes.Should().HaveCount(1);
        
        var node = allNodes[0];
        node.Name.Should().Be("management_fee_rate");
        node.Should().BeOfType<InputNode>();
        
        // Should NOT have a $Input_ prefixed node
        var prefixedNode = graph.GetNode("$Input_Management Fee Rate (%)");
        prefixedNode.Should().BeNull();
    }
    
    [Fact]
    public void Assignment_Syntax_Should_Create_Only_InputNode()
    {
        var compiler = new DslCompiler();
        var source = @"
            x = Input(""inflation"")
        ";

        var graph = compiler.Compile(source);
        var allNodes = graph.GetAllNodes().ToList();

        // Should now have only ONE node: x (InputNode)
        allNodes.Should().HaveCount(1, "assignment syntax should now create InputNode directly");
        
        var xNode = graph.GetNode("x");
        xNode.Should().NotBeNull();
        xNode.Should().BeOfType<InputNode>();
        
        var inputNode = xNode as InputNode;
        inputNode!.Key.Should().Be("inflation");
        
        // Should NOT have $Input_ prefixed node
        var prefixedNode = graph.GetNode("$Input_inflation");
        prefixedNode.Should().BeNull("no wrapper node should be created");
    }
    
    [Fact]
    public void Assignment_And_Declaration_Should_Produce_Identical_Graphs()
    {
        var compiler = new DslCompiler();
        
        // Test assignment syntax
        var assignmentGraph = compiler.Compile(@"x = Input(""key"")");
        var assignmentNodes = assignmentGraph.GetAllNodes().ToList();
        
        // Test declaration syntax
        var declarationGraph = compiler.Compile(@"x: Input(""key"")");
        var declarationNodes = declarationGraph.GetAllNodes().ToList();
        
        // Both should have exactly 1 node
        assignmentNodes.Should().HaveCount(1);
        declarationNodes.Should().HaveCount(1);
        
        // Both should be InputNode with same name and key
        var assignmentNode = assignmentNodes[0];
        var declarationNode = declarationNodes[0];
        
        assignmentNode.Should().BeOfType<InputNode>();
        declarationNode.Should().BeOfType<InputNode>();
        
        assignmentNode.Name.Should().Be("x");
        declarationNode.Name.Should().Be("x");
        
        ((InputNode)assignmentNode).Key.Should().Be("key");
        ((InputNode)declarationNode).Key.Should().Be("key");
        
        // Should NOT have $Input_ prefixed nodes
        assignmentGraph.GetNode("$Input_key").Should().BeNull();
        declarationGraph.GetNode("$Input_key").Should().BeNull();
    }
    
    [Fact]
    public void Assignment_With_Input_Should_Work_In_Evaluation()
    {
        var compiler = new DslCompiler();
        var source = @"
            management_fee_rate = Input(""Management Fee Rate (%)"")
            total = management_fee_rate * 100
        ";

        var compiledGraph = compiler.Compile(source);
        
        // Compiled graph should have 2 nodes: management_fee_rate (InputNode) and total (FormulaNode)
        compiledGraph.GetAllNodes().Count().Should().Be(2, 
            "should have management_fee_rate and total only");
        
        var context = new CalculationContext();
        var inputs = new Dictionary<string, object> { { "Management Fee Rate (%)", 0.10 } };
        context.AddInputProvider(new NamedInputProvider(inputs));

        var evaluator = new GraphEvaluator();
        var (results, evaluatedGraph) = evaluator.Evaluate(compiledGraph, context);

        // Verify results work correctly
        results["management_fee_rate"].Should().Be(0.10);
        results["total"].Should().Be(10.0);
        
        // Evaluated graph should not have any $Input_ nodes
        var allNodes = evaluatedGraph.GetAllNodes().ToList();
        allNodes.Should().NotContain(n => n.Name.StartsWith("$Input_"));
    }
}
