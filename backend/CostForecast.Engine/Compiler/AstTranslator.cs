using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using CostForecast.Engine.Core;
using TreeSitter;
using System.Collections;

namespace CostForecast.Engine.Compiler;

public class AstTranslator
{
    private readonly string _source;
    private readonly HashSet<string> _params = new();

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
                    else if (IsRangeOperation(content))
                    {
                        // Create RangeNode placeholder - will be populated in Pass 2
                        Console.WriteLine($"  Detected Range operation for '{name}'");
                        node = new RangeNode(name, _ => null, _ => null);
                    }
                    else if (IsInputOperation(content))
                    {
                        // Create InputNode directly (same as declaration syntax)
                        Console.WriteLine($"  Detected Input operation for '{name}'");
                        
                        // Extract the key from Input("key") argument
                        // content is the function_call node
                        var unwrapped = content;
                        while (unwrapped.Kind == "expression")
                        {
                            unwrapped = unwrapped.NamedChild(0);
                        }
                        
                        string key = "";
                        if (unwrapped.Kind == "function_call" && unwrapped.NamedChildCount >= 2)
                        {
                            var argNode = unwrapped.NamedChild(1); // First argument
                            
                            // Unwrap expression wrapper if present
                            while (argNode.Kind == "expression" || argNode.Kind == "parenthesized_expression")
                            {
                                if (argNode.NamedChildCount > 0)
                                    argNode = argNode.NamedChild(0);
                                else
                                    break;
                            }
                            
                            if (argNode.Kind == "string")
                            {
                                var text = GetText(argNode);
                                key = text.Substring(1, text.Length - 2);
                            }
                            else if (argNode.Kind == "identifier")
                            {
                                key = GetText(argNode);
                            }
                        }
                        
                        node = new InputNode(name, key);
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

                else if (stmt.Kind == "declaration")
                {
                    var name = GetText(stmt.ChildByFieldName("name"));
                    var typeDefNode = stmt.ChildByFieldName("type");
                    var typeKind = typeDefNode.Child(0).Kind;
                    
                    Console.WriteLine($"Pass 1: Found declaration '{name}' of type '{typeKind}'");
                    
                    GraphNode node;
                    if (typeKind == "param_def")
                    {
                        // Param creates a ParamNode
                        // It will be bound during Range evaluation or other parameterized operations
                        node = new ParamNode(name, _ => null);
                        _params.Add(name);
                    }
                    else if (typeKind == "input_def")
                    {
                         // Parse the input definition to get the key
                         var defNode = typeDefNode.Child(0);
                         var sourceNode = defNode.ChildByFieldName("source");
                         string key = "";
                         if (sourceNode.Kind == "string")
                         {
                             var text = GetText(sourceNode);
                             key = text.Substring(1, text.Length - 2);
                         }
                         else if (sourceNode.Kind == "identifier")
                         {
                             key = GetText(sourceNode);
                         }
                         
                         node = new InputNode(name, key);
                    }
                    else
                    {
                        // For other declarations (Const, Reference), create placeholder formula
                        // These will be processed in Pass 2
                        node = new FormulaNode(name, _ => null);
                    }
                    
                    if (!nodes.ContainsKey(name))
                    {
                        nodes[name] = node;
                        graph.AddNode(node);
                        assignments[name] = typeDefNode; // Store the type_def node for Pass 2
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

            if (graphNode is RangeNode rangeNode)
            {
                // Capture the original expression
                rangeNode.Expression = GetText(contentNode);

                // Parse Range expression and populate sourceCalculation and targetCalculation
                var (sourceCalc, targetCalc, sourceDeps, targetDeps) = ParseRangeExpression(contentNode, nodes, graph);
                
                // Set the calculations
                rangeNode.SourceCalculation = sourceCalc;
                rangeNode.TargetCalculation = targetCalc;
                
                // Add dependencies (both source and target)
                foreach (var dep in sourceDeps) rangeNode.AddDependency(dep);
                foreach (var dep in targetDeps) rangeNode.AddDependency(dep);
                
                // Track target dependencies specifically for subgraph expansion
                foreach (var dep in targetDeps) rangeNode.TargetDependencies.Add(dep);
            }
            else if (graphNode is ParamNode paramNode)
            {
                // Param nodes look up their value from the context
                paramNode.Calculation = ctx => ctx.ContainsKey(name) ? ctx.Get(name) : 0.0;
            }

            else if (graphNode is InputNode)
            {
                // Input nodes are already fully defined in Pass 1
                continue;
            }
            else if (graphNode is FormulaNode formulaNode)
            {
                // Capture the original expression
                formulaNode.Expression = GetText(contentNode);

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

    private (Func<IEvaluationContext, object>, List<GraphNode>) ParseExpression(Node node, Dictionary<string, GraphNode> scope, DependencyGraph graph)
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
                // Check if the dependency is a volatile RangeNode
                if (dep is RangeNode rangeNode && IsVolatile(rangeNode))
                {
                    // Return function that re-evaluates Range in current context
                    return (ctx => ExecuteRange(rangeNode, ctx), new List<GraphNode> { dep });
                }
                // Check if the dependency is "volatile" (depends on a Param)
                // If so, we must re-evaluate it in the current context (e.g. inside a Range)
                // rather than using the cached value from the global context.
                else if (dep is FormulaNode fn && IsVolatile(fn))
                {
                    return (ctx => fn.Calculation(ctx), new List<GraphNode> { dep });
                }

                return (ctx => ctx.Get(name), new List<GraphNode> { dep });
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

            Func<IEvaluationContext, object> calc = ctx =>
            {
                var l = TypeConverter.ToDouble(leftCalc(ctx));
                var r = TypeConverter.ToDouble(rightCalc(ctx));
                return op switch
                {
                    // Arithmetic operators
                    "+" => l + r,
                    "-" => l - r,
                    "*" => l * r,
                    "/" => l / r,
                    "^" => Math.Pow(l, r),
                    
                    // Comparison operators (Excel-style, return 1.0 for true, 0.0 for false)
                    ">" => l > r ? 1.0 : 0.0,
                    "<" => l < r ? 1.0 : 0.0,
                    ">=" => l >= r ? 1.0 : 0.0,
                    "<=" => l <= r ? 1.0 : 0.0,
                    "=" => Math.Abs(l - r) < 1e-9 ? 1.0 : 0.0,  // Equality with reasonable floating point tolerance
                    "<>" => Math.Abs(l - r) >= 1e-9 ? 1.0 : 0.0, // Not equal (Excel-style)
                    
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
            var funcNameUpper = funcName.ToUpper();
            
            if (funcNameUpper == "INPUT")
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
                     

                     
                     // Runtime validation wrapper - simplified as GraphEvaluator handles processing now
                      System.Func<IEvaluationContext, object> inputCalc = ctx => 
                      {
                          return ctx.Get(inputNodeName);
                      };

                     return (inputCalc, new List<GraphNode> { dep });
                 }

                 else 
                 {
                     throw new Exception($"Input argument must be a string literal. Found: {argNode.Kind}");
                 }
            }
            else if (funcNameUpper == "CONST")
            {
                 if (node.NamedChildCount < 2) throw new Exception("Const requires 1 argument.");
                 var argNode = node.NamedChild(1);
                 return ParseExpression(argNode, scope, graph);
            }
            
            var args = new List<(Func<IEvaluationContext, object>, List<GraphNode>)>();
            // Iterate named children starting from 1 (0 is function name)
            for(int i=1; i<node.NamedChildCount; i++) {
                var c = node.NamedChild(i);
                args.Add(ParseExpression(c, scope, graph));
            }
            
            var deps = new List<GraphNode>();
            foreach(var a in args) deps.AddRange(a.Item2);
            
            Func<IEvaluationContext, object> calc = ctx => {
                // Execute args
                var rawValues = new List<object>();
                foreach(var a in args) rawValues.Add(a.Item1(ctx));
                
                // Flatten arrays for aggregation functions
                var flatValues = new List<double>();
                foreach(var val in rawValues)
                {
                    if (val is double[] arr)
                    {
                         foreach(var o in arr) flatValues.Add(TypeConverter.ToDouble(o));
                    }
                    else
                    {
                        flatValues.Add(TypeConverter.ToDouble(val));
                    }
                }
                
                var funcNameUpper = funcName.ToUpper();
                
                if (funcNameUpper == "SUM") return flatValues.Sum();
                if (funcNameUpper == "AVERAGE") return flatValues.Count > 0 ? flatValues.Average() : 0.0;
                if (funcNameUpper == "MAX") return flatValues.Count > 0 ? flatValues.Max() : 0.0;
                if (funcNameUpper == "MIN") return flatValues.Count > 0 ? flatValues.Min() : 0.0;
                
                if (funcNameUpper == "IF")
                {
                    // IF(condition, trueVal, falseVal)
                    // values[0] is condition (1.0 is true, 0.0 is false)
                    if (rawValues.Count < 3) return 0.0;
                    
                    var condition = TypeConverter.ToDouble(rawValues[0]);
                    return condition != 0.0 ? TypeConverter.ToDouble(rawValues[1]) : TypeConverter.ToDouble(rawValues[2]);
                }
                
                return 0.0;
            };
            
            if (funcNameUpper == "RANGE")
            {
                 if (node.NamedChildCount < 3) throw new Exception("Range requires 2 arguments: source and target.");
                 var sourceNode = node.NamedChild(1);
                 var targetNode = node.NamedChild(2);
                 
                 var (sourceCalc, sourceDeps) = ParseExpression(sourceNode, scope, graph);
                 // We parse the target expression to get its calculation logic.
                 // Crucially, we do NOT execute it yet. We will execute it repeatedly inside the loop.
                 var (targetCalc, targetDeps) = ParseExpression(targetNode, scope, graph);
                 
                 Func<IEvaluationContext, object> rangeCalc = ctx =>
                 {
                     var sourceVal = sourceCalc(ctx);
                     
                     var list = new List<double>();
                     
                     IEnumerable<object> items;
                     if (sourceVal is IEnumerable<object> e) items = e;
                     else if (sourceVal is System.Collections.IEnumerable en) items = en.Cast<object>();
                     else items = new[] { sourceVal }; // Single item treated as list
                     
                     foreach (var item in items)
                     {
                         // Create Child Context
                         var childCtx = new ChildEvaluationContext(ctx);
                         
                         // Populate context from item properties
                         if (item is IDictionary<string, object> dict)
                         {
                             foreach (var kvp in dict)
                             {
                                 childCtx.Set(kvp.Key, kvp.Value);
                             }
                         }
                         else if (item is JsonElement jsonElement && jsonElement.ValueKind == JsonValueKind.Object)
                         {
                             foreach (var prop in jsonElement.EnumerateObject())
                             {
                                 // We might need to convert JsonElement values to appropriate types
                                 // For now, let's keep them as is or convert numbers
                                 if (prop.Value.ValueKind == JsonValueKind.Number)
                                     childCtx.Set(prop.Name, prop.Value.GetDouble());
                                 else if (prop.Value.ValueKind == JsonValueKind.String)
                                     childCtx.Set(prop.Name, prop.Value.GetString());
                                 else
                                     childCtx.Set(prop.Name, prop.Value);
                             }
                         }
                         else
                         {
                             // Fallback for simple values (legacy support or single-param implicit binding?)
                             // If the user insists on "named object", maybe we shouldn't support this.
                             // But for backward compatibility with existing tests (if any rely on it), 
                             // we might need a strategy. However, the user explicitly said "no implicit binding".
                             // Let's throw or ignore. For now, let's try to be helpful and see if we can 
                             // support the "simple array" case by binding to a default param if there's only one?
                             // No, let's stick to the "Object Context" strict mode for now as requested.
                             // Actually, existing tests use simple arrays. We should probably break them 
                             // and fix them to use objects, to be consistent.
                         }
                         
                         // Evaluate target expression in this new context
                         var result = TypeConverter.ToDouble(targetCalc(childCtx));
                         list.Add(result);
                     }
                     
                     return list.ToArray();
                 };
                 
                 var allDeps = new List<GraphNode>(sourceDeps);
                 allDeps.AddRange(targetDeps);
                 return (rangeCalc, allDeps);
            }
            
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
            
            Func<IEvaluationContext, object> newCalc = ctx =>
            {
                var val = TypeConverter.ToDouble(calc(ctx));
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
        else if (kind == "type_def")
        {
            // Handle declarations like price: Param, value: Input("key"), etc.
            var typeKind = node.Child(0).Kind;
            
            if (typeKind == "param_def")
            {
                // Param is a placeholder that gets bound during Range operations
                // For now, it should just return 0 or throw if evaluated outside of Range context
                // In the context of Range, this will be replaced with actual values
                return (_ => 0.0, new List<GraphNode>());
            }
            else if (typeKind == "input_def")
            {
                // input_def has a source field
                var defNode = node.Child(0);
                var sourceNode = defNode.ChildByFieldName("source");
                
                if (sourceNode.Kind == "string")
                {
                    var text = GetText(sourceNode);
                    var key = text.Substring(1, text.Length - 2);
                    var inputNodeName = $"$Input_{key}";
                    
                    if (!scope.ContainsKey(inputNodeName))
                    {
                        var inputNode = new InputNode(inputNodeName, key);
                        scope[inputNodeName] = inputNode;
                        graph.AddNode(inputNode);
                    }
                    var dep = scope[inputNodeName];
                    
                    Func<IEvaluationContext, object> inputCalc = ctx => 
                    {
                        var val = ctx.Get(inputNodeName);
                        if (val == null) return 0.0;
                        
                        // Handle JsonElement (from API) - extract the actual value
                        if (val is JsonElement jsonElement)
                        {
                            if (jsonElement.ValueKind == JsonValueKind.String)
                            {
                                // Extract string from JsonElement and process it
                                val = jsonElement.GetString();
                            }
                            else
                            {
                                // For non-string JsonElements, use TypeConverter
                                return TypeConverter.ToDouble(val);
                            }
                        }
                        
                        // If it's a string, check if it's JSON or numeric
                        if (val is string s)
                        {
                            if (string.IsNullOrWhiteSpace(s)) return 0.0;
                            
                            // Try to parse as JSON if it starts with [ or {
                            s = s.Trim();
                            if (s.StartsWith("[") || s.StartsWith("{"))
                            {
                                try
                                {
                                    // Parse as JSON
                                    var jsonDoc = JsonDocument.Parse(s);
                                    var root = jsonDoc.RootElement;
                                    
                                    if (root.ValueKind == JsonValueKind.Array)
                                    {
                                        // Convert JsonElement array to List of Dictionaries
                                        var list = new List<object>();
                                        foreach (var item in root.EnumerateArray())
                                        {
                                            if (item.ValueKind == JsonValueKind.Object)
                                            {
                                                var dict = new Dictionary<string, object>();
                                                foreach (var prop in item.EnumerateObject())
                                                {
                                                    if (prop.Value.ValueKind == JsonValueKind.Number)
                                                        dict[prop.Name] = prop.Value.GetDouble();
                                                    else if (prop.Value.ValueKind == JsonValueKind.String)
                                                        dict[prop.Name] = prop.Value.GetString();
                                                    else if (prop.Value.ValueKind == JsonValueKind.True)
                                                        dict[prop.Name] = true;
                                                    else if (prop.Value.ValueKind == JsonValueKind.False)
                                                        dict[prop.Name] = false;
                                                    else
                                                        dict[prop.Name] = prop.Value;
                                                }
                                                list.Add(dict);
                                            }
                                            else if (item.ValueKind == JsonValueKind.Number)
                                            {
                                                list.Add(item.GetDouble());
                                            }
                                            else
                                            {
                                                list.Add(item);
                                            }
                                        }
                                        return list.ToArray();
                                    }
                                    else if (root.ValueKind == JsonValueKind.Object)
                                    {
                                        var dict = new Dictionary<string, object>();
                                        foreach (var prop in root.EnumerateObject())
                                        {
                                            if (prop.Value.ValueKind == JsonValueKind.Number)
                                                dict[prop.Name] = prop.Value.GetDouble();
                                            else if (prop.Value.ValueKind == JsonValueKind.String)
                                                dict[prop.Name] = prop.Value.GetString();
                                            else
                                                dict[prop.Name] = prop.Value;
                                        }
                                        return dict;
                                    }
                                }
                                catch (JsonException)
                                {
                                    // If JSON parsing fails, fall through to number parsing
                                }
                            }
                            
                            // Try to parse as number
                            if (!double.TryParse(s, out var d))
                            {
                                throw new Exception($"Input '{key}' has invalid value: '{s}'. Expected a number or valid JSON.");
                            }
                            return d;
                        }
                        
                        // Allow arrays to pass through for Range
                        if (val is Array || (val is System.Collections.IEnumerable && !(val is string)))
                        {
                            return val;
                        }

                        return TypeConverter.ToDouble(val);
                    };

                    return (inputCalc, new List<GraphNode> { dep });
                }
                else if (sourceNode.Kind == "identifier")
                {
                    // Grid input like Input(A1)
                    var cellRef = GetText(sourceNode);
                    var inputNodeName = $"$Input_{cellRef}";
                    
                    if (!scope.ContainsKey(inputNodeName))
                    {
                        var inputNode = new InputNode(inputNodeName, cellRef);
                        scope[inputNodeName] = inputNode;
                        graph.AddNode(inputNode);
                    }
                    var dep = scope[inputNodeName];
                    
                    return (ctx => ctx.Get(inputNodeName), new List<GraphNode> { dep });
                }
            }
            else if (typeKind == "const_def")
            {
                // const_def has a value field
                var defNode = node.Child(0);
                var valueNode = defNode.ChildByFieldName("value");
                return ParseExpression(valueNode, scope, graph);
            }
            else if (typeKind == "reference_def")
            {
                // reference_def has a target field
                var defNode = node.Child(0);
                var targetNode = defNode.ChildByFieldName("target");
                var targetName = GetText(targetNode);
                
                if (scope.TryGetValue(targetName, out var dep))
                {
                    return (ctx => ctx.Get(targetName), new List<GraphNode> { dep });
                }
                throw new Exception($"Reference to undefined variable: {targetName}");
            }
            
            throw new NotSupportedException($"Unsupported type_def: {typeKind}");
        }
        else
        {
            throw new NotSupportedException($"Unsupported AST node encountered: {kind}");
        }
        
        return (_ => 0, new List<GraphNode>());
    }

    private bool IsRangeOperation(Node node)
    {
        // Unwrap expression wrappers
        while (node.Kind == "expression")
        {
            if (node.NamedChildCount < 1) return false;
            node = node.NamedChild(0);
        }

        // Check if it's a function call to "Range"
        if (node.Kind == "function_call" && node.NamedChildCount >= 1)
        {
            var funcNode = node.NamedChild(0);
            var funcName = GetText(funcNode).Trim();
            return funcName.ToUpper() == "RANGE";
        }

        return false;
    }

    private bool IsInputOperation(Node node)
    {
        // Unwrap expression wrappers
        while (node.Kind == "expression")
        {
            if (node.NamedChildCount < 1) return false;
            node = node.NamedChild(0);
        }

        // Check if it's a function call to "Input"
        if (node.Kind == "function_call" && node.NamedChildCount >= 1)
        {
            var funcNode = node.NamedChild(0);
            var funcName = GetText(funcNode).Trim();
            return funcName.ToUpper() == "INPUT";
        }

        return false;
    }


    private (Func<IEvaluationContext, object>, Func<IEvaluationContext, object>, List<GraphNode>, List<GraphNode>) ParseRangeExpression(
        Node node, 
        Dictionary<string, GraphNode> scope, 
        DependencyGraph graph)
    {
        // Unwrap expression wrappers
        while (node.Kind == "expression")
        {
            if (node.NamedChildCount < 1) throw new Exception("Invalid expression node");
            node = node.NamedChild(0);
        }

        if (node.Kind != "function_call")
        {
            throw new Exception($"Expected function_call for Range, got {node.Kind}");
        }

        if (node.NamedChildCount < 3)
        {
            throw new Exception("Range requires 2 arguments: source and target.");
        }

        // Parse source and target expressions
        var sourceNode = node.NamedChild(1);
        var targetNode = node.NamedChild(2);

        var (sourceCalc, sourceDeps) = ParseExpression(sourceNode, scope, graph);
        var (targetCalc, targetDeps) = ParseExpression(targetNode, scope, graph);

        return (sourceCalc, targetCalc, sourceDeps, targetDeps);
    }

    private object ExecuteRange(RangeNode rangeNode, IEvaluationContext ctx)
    {
        // Execute Range iteration in the given context (for lazy/volatile evaluation)
        var sourceVal = rangeNode.SourceCalculation(ctx);
        var resultsList = new List<double>();
        
        // Convert source to enumerable
        IEnumerable<object> items;
        if (sourceVal is IEnumerable<object> e) items = e;
        else if (sourceVal is System.Collections.IEnumerable en) items = en.Cast<object>();
        else items = new[] { sourceVal };
        
        foreach (var item in items)
        {
            var childCtx = new ChildEvaluationContext(ctx);
            
            // Populate context from item properties
            if (item is IDictionary<string, object> dict)
            {
                foreach (var kvp in dict)
                {
                    childCtx.Set(kvp.Key, kvp.Value);
                }
            }
            else if (item is JsonElement jsonElement && jsonElement.ValueKind == JsonValueKind.Object)
            {
                foreach (var prop in jsonElement.EnumerateObject())
                {
                    object val;
                    if (prop.Value.ValueKind == JsonValueKind.Number)
                        val = prop.Value.GetDouble();
                    else if (prop.Value.ValueKind == JsonValueKind.String)
                        val = prop.Value.GetString();
                    else
                        val = prop.Value;
                        
                    childCtx.Set(prop.Name, val);
                }
            }
            
            // Evaluate target expression for this item
            var resultObj = rangeNode.TargetCalculation(childCtx);
            resultsList.Add(TypeConverter.ToDouble(resultObj));
        }
        
        return resultsList.ToArray();
    }

    private bool IsVolatile(GraphNode node)
    {
        // A node is volatile if it is a Param or depends on a Param
        if (node is ParamNode) return true;
        if (_params.Contains(node.Name)) return true;
        
        // RangeNodes that depend on params are volatile
        if (node is RangeNode) 
        {
            // Check if ANY dependency is volatile
            foreach (var dep in node.Dependencies)
            {
                if (IsVolatile(dep)) return true;
            }
        }
        
        // Traverse dependencies recursively to check if any depend on a Param
        // Since the graph is a DAG (checked during sort), recursion is safe
        foreach (var dep in node.Dependencies)
        {
            if (IsVolatile(dep)) return true;
        }
        return false;
    }
}
