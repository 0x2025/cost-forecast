using System;
using System.Collections.Generic;
using System.Linq;
using CostForecast.Engine.Core;
using TreeSitter;

namespace CostForecast.Engine.Compiler;

public class AstTranslator
{
    private readonly string _source;

    public AstTranslator(string source)
    {
        _source = source;
    }

    private string GetText(Node node)
    {
        try 
        {
            return _source.Substring(node.StartByte, node.EndByte - node.StartByte);
        } 
        catch (Exception ex) 
        {
            Console.WriteLine($"GetText failed: {ex.Message}. Node Kind: {node.Kind}, Start: {node.StartByte}, End: {node.EndByte}");
            throw;
        }
    }

    public DependencyGraph Translate(Node root)
    {
        var graph = new DependencyGraph();
        var nodes = new Dictionary<string, GraphNode>();
        var assignments = new Dictionary<string, Node>();

        // Pass 1: Identify all defined variables and create nodes
        for (int i = 0; i < root.ChildCount; i++)
        {
            var child = root.Child(i);
            if (child.Kind == "statement")
            {
                var stmt = child.Child(0);
                if (stmt.Kind == "assignment")
                {
                    var name = GetText(stmt.ChildByFieldName("name"));
                    Console.WriteLine($"Pass 1: Found assignment to '{name}'");
                    
                    var valueNode = stmt.ChildByFieldName("value"); // expression
                    var content = valueNode.Child(0);
                    
                    GraphNode node;
                    if (content.Kind == "number")
                    {
                        node = new ConstantNode(name, double.Parse(GetText(content)));
                    }
                    else if (content.Kind == "string")
                    {
                        var text = GetText(content);
                        var val = text.Substring(1, text.Length - 2);
                        node = new ConstantNode(name, val);
                    }
                    else
                    {
                        // Placeholder calculation, will be replaced
                        node = new FormulaNode(name, _ => null); 
                    }
                    
                    if (!nodes.ContainsKey(name))
                    {
                        nodes[name] = node;
                        graph.AddNode(node);
                        assignments[name] = content; // Store the content node for Pass 2
                    }
                }
            }
        }

        Console.WriteLine($"Pass 1 Complete. Nodes: {string.Join(", ", nodes.Keys)}");

        // Pass 2: Parse expressions and link dependencies
        foreach (var kvp in assignments)
        {
            var name = kvp.Key;
            Console.WriteLine($"Pass 2: Processing '{name}'");
            var contentNode = kvp.Value;
            var graphNode = nodes[name];

            if (graphNode is FormulaNode formulaNode)
            {
                // Parse the expression to build the calculation delegate and find dependencies
                var (calc, deps) = ParseExpression(contentNode, nodes, graph);
                
                formulaNode.Calculation = calc;
                foreach (var dep in deps)
                {
                    formulaNode.AddDependency(dep);
                }
            }
        }

        return graph;
    }

    private (Func<Dictionary<string, object>, object>, List<GraphNode>) ParseExpression(Node node, Dictionary<string, GraphNode> scope, DependencyGraph graph)
    {
        // Recursive parsing
        string kind;
        try
        {
            kind = node.Kind;
        }
        catch
        {
            // In case of invalid node, we can't proceed.
            throw new Exception("Invalid AST node encountered.");
        }

        if (kind == "identifier")
        {
            var name = GetText(node);
            if (scope.TryGetValue(name, out var dep))
            {
                return (ctx => ctx[name], new List<GraphNode> { dep });
            }
            throw new Exception($"Undefined variable: {name}");
        }
        else if (kind == "binary_expression")
        {
            // Use NamedChild for robustness
            if (node.NamedChildCount < 3) throw new Exception("Binary expression must have 3 named children.");
            
            var leftNode = node.NamedChild(0);
            var opNode = node.NamedChild(1);
            var rightNode = node.NamedChild(2);
            
            var op = GetText(opNode); 

            var (leftCalc, leftDeps) = ParseExpression(leftNode, scope, graph);
            var (rightCalc, rightDeps) = ParseExpression(rightNode, scope, graph);

            var deps = new List<GraphNode>();
            deps.AddRange(leftDeps);
            deps.AddRange(rightDeps);

            Func<Dictionary<string, object>, object> calc = ctx =>
            {
                var l = Convert.ToDouble(leftCalc(ctx));
                var r = Convert.ToDouble(rightCalc(ctx));
                return op switch
                {
                    "+" => l + r,
                    "-" => l - r,
                    "*" => l * r,
                    "/" => l / r,
                    "^" => Math.Pow(l, r),
                    _ => throw new NotImplementedException($"Operator {op}")
                };
            };

            return (calc, deps);
        }
        else if (kind == "function_call")
        {
            // Handle SUM, etc.
            if (node.NamedChildCount < 1) throw new Exception("Function call must have at least 1 named child (the function name).");
            
            var funcNode = node.NamedChild(0);
            var funcName = GetText(funcNode).Trim();
            
            if (funcName == "Input")
            {
                 if (node.NamedChildCount < 2) throw new Exception("Input requires 1 argument.");
                 var argNode = node.NamedChild(1);
                 
                 // Unwrap expression wrapper if present
                 while (argNode.Kind == "expression" || argNode.Kind == "parenthesized_expression")
                 {
                     argNode = argNode.NamedChild(0);
                 }

                 if (argNode.Kind == "string")
                 {
                     var text = GetText(argNode);
                     var key = text.Substring(1, text.Length - 2);
                     var inputNodeName = $"$Input_{key}";
                     
                     if (!scope.ContainsKey(inputNodeName))
                     {
                         var inputNode = new InputNode(inputNodeName, key);
                         scope[inputNodeName] = inputNode;
                         graph.AddNode(inputNode);
                     }
                     var dep = scope[inputNodeName];
                     return (ctx => ctx[inputNodeName], new List<GraphNode> { dep });
                 }
                 else 
                 {
                     throw new Exception($"Input argument must be a string literal. Found: {argNode.Kind}");
                 }
            }
            
            var args = new List<(Func<Dictionary<string, object>, object>, List<GraphNode>)>();
            // Iterate named children starting from 1 (0 is function name)
            for(int i=1; i<node.NamedChildCount; i++) {
                var c = node.NamedChild(i);
                args.Add(ParseExpression(c, scope, graph));
            }
            
            var deps = new List<GraphNode>();
            foreach(var a in args) deps.AddRange(a.Item2);
            
            Func<Dictionary<string, object>, object> calc = ctx => {
                // Execute args
                var values = new List<double>();
                foreach(var a in args) values.Add(Convert.ToDouble(a.Item1(ctx)));
                
                if (funcName == "SUM") return values.Sum();
                // ... others
                return 0;
            };
            
            return (calc, deps);
        }
        else if (kind == "number")
        {
            var val = double.Parse(GetText(node));
            return (_ => val, new List<GraphNode>());
        }
        else if (kind == "parenthesized_expression")
        {
            // parenthesized_expression: '(' expression ')'
            // The parentheses are anonymous nodes, so the only named child is the expression.
            if (node.NamedChildCount < 1) throw new Exception("Parenthesized expression must have 1 named child.");
            return ParseExpression(node.NamedChild(0), scope, graph);
        }
        else if (kind == "unary_expression")
        {
            // unary_expression: operator expression
            if (node.NamedChildCount < 2) throw new Exception("Unary expression must have 2 named children.");
            
            var opNode = node.NamedChild(0);
            var exprNode = node.NamedChild(1);
            
            var op = GetText(opNode);
            var (calc, deps) = ParseExpression(exprNode, scope, graph);
            
            Func<Dictionary<string, object>, object> newCalc = ctx =>
            {
                var val = Convert.ToDouble(calc(ctx));
                return op switch
                {
                    "+" => val,
                    "-" => -val,
                    _ => throw new NotImplementedException($"Unary operator {op}")
                };
            };
            
            return (newCalc, deps);
        }
        else if (kind == "string")
        {
            // string: "..."
            var text = GetText(node);
            // Remove quotes
            var val = text.Substring(1, text.Length - 2);
            return (_ => val, new List<GraphNode>());
        }
        else if (kind == "expression")
        {
            // Unwrap expression node
            // Ensure we return the dependencies from the child!
            var (c, d) = ParseExpression(node.NamedChild(0), scope, graph);
            // Console.WriteLine($"Expression unwrapped. Child deps: {d.Count}");
            return (c, d);
        }
        else
        {
            throw new NotSupportedException($"Unsupported AST node encountered: {kind}");
        }
        
        return (_ => 0, new List<GraphNode>());
    }
}
