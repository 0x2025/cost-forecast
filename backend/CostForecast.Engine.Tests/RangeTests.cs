using System.Collections.Generic;
using CostForecast.Engine.Compiler;
using CostForecast.Engine.Core;
using CostForecast.Engine.Evaluator;
using FluentAssertions;
using Xunit;

namespace CostForecast.Engine.Tests;

public class RangeTests
{
    private DependencyGraph Compile(string source)
    {
        var compiler = new DslCompiler();
        return compiler.Compile(source);
    }

    private double Evaluate(DependencyGraph graph, Dictionary<string, object> inputs)
    {
        var context = new CalculationContext();
        context.AddInputProvider(new NamedInputProvider(inputs));

        var evaluator = new GraphEvaluator();
        var (results, _) = evaluator.Evaluate(graph, context);

        return (double)results["total"];
    }

    [Fact]
    public void Should_Iterate_Over_Objects_Single_Property()
    {
        // Scenario: Simple iteration
        // items = [{ "p": 10 }, { "p": 20 }]
        // p: Param
        // result = Range(items, p * 2)
        // total = SUM(result) -> 20 + 40 = 60
        
        var source = @"
p: Param
items = Input(""items"")
discount = p * 2
result = Range(items, discount)
total = SUM(result)
";
        var graph = Compile(source);
        var inputs = new Dictionary<string, object> 
        { 
            { "items", new[] { 
                new Dictionary<string, object> { { "p", 10.0 } },
                new Dictionary<string, object> { { "p", 20.0 } }
            }}
        };

        var result = Evaluate(graph, inputs);
        result.Should().Be(60.0);
    }

    [Fact]
    public void Should_Handle_Multiple_Properties()
    {
        // Scenario: Objects with multiple properties
        // items = [{ "qty": 2, "price": 10 }, { "qty": 3, "price": 5 }]
        // qty: Param
        // price: Param
        // result = Range(items, qty * price)
        // total = SUM(result) -> (2*10) + (3*5) = 20 + 15 = 35
        
        var source = @"
qty: Param
price: Param
items = Input(""items"")
result = Range(items, qty * price)
total = SUM(result)
";
        var graph = Compile(source);
        var inputs = new Dictionary<string, object> 
        { 
            { "items", new[] { 
                new Dictionary<string, object> { { "qty", 2.0 }, { "price", 10.0 } },
                new Dictionary<string, object> { { "qty", 3.0 }, { "price", 5.0 } }
            }}
        };

        var result = Evaluate(graph, inputs);
        result.Should().Be(35.0);
    }

    [Fact]
    public void Should_Handle_Nested_Ranges_With_Object_Context()
    {
        // Scenario: Nested ranges
        // rows = [{ "r": 1 }, { "r": 2 }]
        // cols = [{ "c": 10 }, { "c": 20 }]
        // r: Param
        // c: Param
        // inner = Range(cols, r + c)
        // outer = Range(rows, SUM(inner))
        // total = SUM(outer)
        
        // Calc:
        // r=1: inner=[1+10, 1+20] = [11, 21]. SUM=32
        // r=2: inner=[2+10, 2+20] = [12, 22]. SUM=34
        // outer=[32, 34]
        // total=66
        
        var source = @"
r: Param
c: Param
rows = Input(""rows"")
cols = Input(""cols"")
inner = Range(cols, r + c)
outer = Range(rows, SUM(inner))
total = SUM(outer)
";
        var graph = Compile(source);
        
        var rows = new[] { 
            new Dictionary<string, object> { { "r", 1.0 } },
            new Dictionary<string, object> { { "r", 2.0 } }
        };
        var cols = new[] { 
            new Dictionary<string, object> { { "c", 10.0 } },
            new Dictionary<string, object> { { "c", 20.0 } }
        };
        
        var inputs = new Dictionary<string, object> 
        { 
            { "rows", rows },
            { "cols", cols }
        };

        var result = Evaluate(graph, inputs);
        result.Should().Be(66.0);
    }

    [Fact]
    public void Should_Handle_Inline_Nested_Ranges()
    {
        // Scenario: Inline Nested ranges
        // r: Param
        // c: Param
        // rows = Input("rows")
        // cols = Input("cols")
        // outer = Range(rows, SUM(Range(cols, r + c)))
        // total = SUM(outer)
        
        var source = @"
r: Param
c: Param
rows = Input(""rows"")
cols = Input(""cols"")
outer = Range(rows, SUM(Range(cols, r + c)))
total = SUM(outer)
";
        var graph = Compile(source);
        
        var rows = new[] { 
            new Dictionary<string, object> { { "r", 1.0 } },
            new Dictionary<string, object> { { "r", 2.0 } }
        };
        var cols = new[] { 
            new Dictionary<string, object> { { "c", 10.0 } },
            new Dictionary<string, object> { { "c", 20.0 } }
        };
        
        var inputs = new Dictionary<string, object> 
        { 
            { "rows", rows },
            { "cols", cols }
        };

        var result = Evaluate(graph, inputs);
        result.Should().Be(66.0);
    }

    [Fact]
    public void Should_Handle_Shadowing()
    {
        // Scenario: Inner variable shadows outer variable
        // outer_items = [{ "x": 10 }]
        // inner_items = [{ "x": 5 }]
        // x: Param
        // inner = Range(inner_items, x) -> Should use inner x (5)
        // outer = Range(outer_items, SUM(inner) + x) -> Inner sum (5) + Outer x (10) = 15
        // total = SUM(outer) -> 15
        
        var source = @"
x: Param
outer_items = Input(""outer_items"")
inner_items = Input(""inner_items"")
inner = Range(inner_items, x)
outer = Range(outer_items, SUM(inner) + x)
total = SUM(outer)
";
        var graph = Compile(source);
        
        var outerItems = new[] { new Dictionary<string, object> { { "x", 10.0 } } };
        var innerItems = new[] { new Dictionary<string, object> { { "x", 5.0 } } };
        
        var inputs = new Dictionary<string, object> 
        { 
            { "outer_items", outerItems },
            { "inner_items", innerItems }
        };

        var result = Evaluate(graph, inputs);
        result.Should().Be(15.0);
    }

    [Fact]
    public void Should_Handle_Missing_Property_As_Zero()
    {
        // Scenario: Property missing in object
        // items = [{ "a": 10 }, { "b": 20 }] (second item missing "a")
        // a: Param
        // result = Range(items, a)
        // total = SUM(result) -> 10 + 0 = 10
        
        var source = @"
a: Param
items = Input(""items"")
result = Range(items, a)
total = SUM(result)
";
        var graph = Compile(source);
        var inputs = new Dictionary<string, object> 
        { 
            { "items", new[] { 
                new Dictionary<string, object> { { "a", 10.0 } },
                new Dictionary<string, object> { { "b", 20.0 } }
            }}
        };

        var result = Evaluate(graph, inputs);
        result.Should().Be(10.0);
    }

    [Fact]
    public void Should_Parse_JSON_String_Input()
    {
        // Scenario: Input provided as JSON string (from UI)
        // items = Input("items")
        // qty: Param
        // price: Param
        // result = Range(items, qty * price)
        // total = SUM(result)
        
        var source = @"
items = Input(""items"")
qty: Param
price: Param
result = Range(items, qty * price)
total = SUM(result)
";
        var graph = Compile(source);
        
        // Input provided as JSON string (simulating API input)
        var inputs = new Dictionary<string, object> 
        { 
            { "items", "[{ \"qty\": 2, \"price\": 10 }, { \"qty\": 3, \"price\": 5 }]" }
        };

        var result = Evaluate(graph, inputs);
        result.Should().Be(35.0); // (2*10) + (3*5) = 20 + 15 = 35
    }
}
