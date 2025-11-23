using System;
using System.Runtime.InteropServices;
using CostForecast.Engine.Core;
using TreeSitter;

namespace CostForecast.Engine.Compiler;

public class DslCompiler
{
    [DllImport("libtree-sitter-costforecast", CallingConvention = CallingConvention.Cdecl)]
    private static extern IntPtr tree_sitter_costforecast();

    private readonly Parser _parser;

    public DslCompiler()
    {
        _parser = new Parser();
        var language = new Language(tree_sitter_costforecast());
        _parser.Language = language;
    }

    public DependencyGraph Compile(string source)
    {
        var tree = _parser.Parse(source);
        var root = tree.Root;

        if (root.HasError)
        {
            throw new ArgumentException("Syntax error in DSL source.");
        }

        var translator = new AstTranslator(source);
        return translator.Translate(root);
    }
}
