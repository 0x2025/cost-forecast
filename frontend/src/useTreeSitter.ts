import { useEffect, useState } from 'react';
import Parser from 'web-tree-sitter';
import { EditorView, Decoration, type DecorationSet, ViewPlugin, ViewUpdate } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import { tags } from '@lezer/highlight';
import { HighlightStyle } from '@codemirror/language';
import { autocompletion, type CompletionContext, type CompletionResult, type Completion } from '@codemirror/autocomplete';

// Define a simple highlight style
export const myHighlightStyle = HighlightStyle.define([
    { tag: tags.keyword, color: "#a0f" },
    { tag: tags.variableName, color: "#00f" },
    { tag: tags.number, color: "#164" },
    { tag: tags.string, color: "#a11" },
    { tag: tags.operator, color: "#555" },
    { tag: tags.comment, color: "#999", fontStyle: "italic" },
    { tag: tags.function(tags.variableName), color: "#d40" },
]);

export function useTreeSitter() {
    const [parser, setParser] = useState<Parser | null>(null);
    const [language, setLanguage] = useState<Parser.Language | null>(null);

    useEffect(() => {
        async function init() {
            try {
                await Parser.init({
                    locateFile: (scriptName: string) => {
                        return `/${scriptName}`;
                    },
                });
                const p = new Parser();
                const lang = await Parser.Language.load('/tree-sitter-costforecast.wasm');
                p.setLanguage(lang);
                setParser(p);
                setLanguage(lang);
            } catch (e) {
                console.error("Failed to init tree-sitter", e);
            }
        }
        init();
    }, []);

    return { parser, language };
}

export function treeSitterPlugin(parser: Parser | null) {
    if (!parser) return [];

    const plugin = ViewPlugin.fromClass(
        class {
            decorations: DecorationSet;
            tree: Parser.Tree | null = null;

            constructor(view: EditorView) {
                this.decorations = this.buildDecorations(view);
            }

            update(update: ViewUpdate) {
                if (update.docChanged || update.viewportChanged) {
                    this.decorations = this.buildDecorations(update.view);
                }
            }

            buildDecorations(view: EditorView) {
                if (!parser) return Decoration.none;

                const text = view.state.doc.toString();
                // Parse the text
                if (this.tree) this.tree.delete();
                this.tree = parser.parse(text);

                const builder = new RangeSetBuilder<Decoration>();

                // Traverse the tree and add decorations
                const cursor = this.tree.walk();

                let reachedRoot = false;
                while (!reachedRoot) {
                    // Apply highlighting based on node type
                    const nodeType = cursor.nodeType;
                    const from = cursor.startIndex;
                    const to = cursor.endIndex;

                    let mark: Decoration | null = null;

                    if (nodeType === 'number') {
                        mark = Decoration.mark({ class: "cm-number" }); // Or use tags if we map them
                    } else if (nodeType === 'string') {
                        mark = Decoration.mark({ class: "cm-string" });
                    } else if (nodeType === 'identifier') {
                        // Check parent to see if it's a function call
                        // cursor.currentNode is a property/getter in web-tree-sitter
                        const node = cursor.currentNode;
                        if (node.parent?.type === 'function_call' && node.parent?.child(0)?.id === node.id) {
                            mark = Decoration.mark({ class: "cm-function" });
                        } else {
                            mark = Decoration.mark({ class: "cm-variable" });
                        }
                    } else if (['+', '-', '*', '/', '^', '='].includes(nodeType)) {
                        mark = Decoration.mark({ class: "cm-operator" });
                    } else if (nodeType === 'comment') {
                        mark = Decoration.mark({ class: "cm-comment" });
                    } else if (nodeType === 'ERROR') {
                        const node = cursor.currentNode;
                        let msg = "Syntax Error";

                        // Check for missing children
                        let hasMissing = false;
                        for (let i = 0; i < node.childCount; i++) {
                            const child = node.child(i);
                            if (child?.isMissing) {
                                msg = `Syntax Error: Missing '${child.type}'`;
                                hasMissing = true;
                                break;
                            }
                        }

                        if (!hasMissing) {
                            if (node.childCount === 0) {
                                msg = `Syntax Error: Unexpected '${node.text}'`;
                            } else {
                                msg = `Syntax Error: Unexpected syntax near '${node.text}'`;
                            }
                        }

                        mark = Decoration.mark({ class: "cm-error", attributes: { title: msg } });
                    }

                    // If we have a mark and it's not empty
                    if (mark && to > from) {
                        builder.add(from, to, mark);
                    }

                    if (cursor.gotoFirstChild()) continue;
                    if (cursor.gotoNextSibling()) continue;

                    let retracing = true;
                    while (retracing) {
                        if (!cursor.gotoParent()) {
                            retracing = false;
                            reachedRoot = true;
                        } else {
                            if (cursor.gotoNextSibling()) {
                                retracing = false;
                            }
                        }
                    }
                }

                return builder.finish();
            }
        },
        {
            decorations: v => v.decorations
        }
    );

    return [plugin];
}

// Built-in function completions
const builtInFunctions: Completion[] = [
    {
        label: "SUM",
        type: "function",
        apply: "SUM()",
        detail: "Aggregate function",
        info: "Sums all provided values or arrays. Example: SUM(a, b, c)"
    },
    {
        label: "AVERAGE",
        type: "function",
        apply: "AVERAGE()",
        detail: "Aggregate function",
        info: "Calculates the average of all provided values or arrays"
    },
    {
        label: "MIN",
        type: "function",
        apply: "MIN()",
        detail: "Aggregate function",
        info: "Returns the minimum value from all provided values or arrays"
    },
    {
        label: "MAX",
        type: "function",
        apply: "MAX()",
        detail: "Aggregate function",
        info: "Returns the maximum value from all provided values or arrays"
    },
    {
        label: "IF",
        type: "function",
        apply: "IF()",
        detail: "Conditional function",
        info: "Returns true_value if condition is true (non-zero), otherwise returns false_value"
    },
    {
        label: "Range",
        type: "function",
        apply: "Range()",
        detail: "Iteration function",
        info: "Applies an expression to each item in the source array. Example: Range(items, qty * price)"
    }
];

// Declaration type completions
const declarationTypes: Completion[] = [
    {
        label: "Input",
        type: "keyword",
        apply: 'Input("")',
        detail: "Declaration",
        info: "Binds to external input data using the specified key"
    },
    {
        label: "Param",
        type: "keyword",
        apply: "Param",
        detail: "Declaration",
        info: "Binds to implicit context parameter (used with Range)"
    },
    {
        label: "Const",
        type: "keyword",
        apply: "Const()",
        detail: "Declaration",
        info: "Defines a constant literal value"
    },
    {
        label: "Reference",
        type: "keyword",
        apply: "Reference()",
        detail: "Declaration",
        info: "Creates an alias to another variable"
    }
];

// Extract variable names from the parsed tree
function extractVariables(parser: Parser | null, text: string): Set<string> {
    const variables = new Set<string>();

    if (!parser) return variables;

    try {
        const tree = parser.parse(text);
        const cursor = tree.walk();

        let reachedRoot = false;
        while (!reachedRoot) {
            const node = cursor.currentNode;

            // Look for assignment and declaration statements
            if (node.type === 'assignment' || node.type === 'declaration') {
                const nameNode = node.childForFieldName('name');
                if (nameNode) {
                    const varName = text.substring(nameNode.startIndex, nameNode.endIndex);
                    if (varName) {
                        variables.add(varName);
                    }
                }
            }

            if (cursor.gotoFirstChild()) continue;
            if (cursor.gotoNextSibling()) continue;

            let retracing = true;
            while (retracing) {
                if (!cursor.gotoParent()) {
                    retracing = false;
                    reachedRoot = true;
                } else {
                    if (cursor.gotoNextSibling()) {
                        retracing = false;
                    }
                }
            }
        }

        tree.delete();
    } catch (e) {
        console.error("Error extracting variables:", e);
    }

    return variables;
}

// Extract Input() declaration keys from the parsed tree
export function extractInputDeclarations(parser: Parser | null, text: string): Set<string> {
    const inputKeys = new Set<string>();

    if (!parser) {
        console.warn('extractInputDeclarations: parser is null');
        return inputKeys;
    }

    try {
        const tree = parser.parse(text);
        const cursor = tree.walk();

        let reachedRoot = false;
        while (!reachedRoot) {
            const node = cursor.currentNode;
            const nodeType = node.type;

            // Handle declaration syntax: var: Input("key")
            // The DSL grammar parses this as an "input_def" node
            if (nodeType === 'input_def') {
                // Look for the string argument within the input_def
                for (let i = 0; i < node.childCount; i++) {
                    const child = node.child(i);
                    if (child && child.type === 'string') {
                        // Extract string content (remove quotes)
                        let keyText = text.substring(child.startIndex, child.endIndex);
                        // Remove surrounding quotes
                        keyText = keyText.replace(/^["']|["']$/g, '');
                        if (keyText) {
                            inputKeys.add(keyText);
                            break;
                        }
                    }
                }
            }


            // Handle assignment syntax: var = Input("key")
            // The DSL grammar parses this as a "function_call" node
            // Tree structure: function_call -> expression -> string
            else if (nodeType === 'function_call') {
                const functionNameNode = node.child(0);
                const functionName = functionNameNode ? text.substring(functionNameNode.startIndex, functionNameNode.endIndex) : '';

                if (functionName === 'Input') {
                    // Look for expression children (the arguments to the function)
                    for (let i = 0; i < node.childCount; i++) {
                        const child = node.child(i);
                        if (child && child.type === 'expression') {
                            // Now look for string within the expression
                            for (let j = 0; j < child.childCount; j++) {
                                const grandchild = child.child(j);
                                if (grandchild && grandchild.type === 'string') {
                                    let keyText = text.substring(grandchild.startIndex, grandchild.endIndex);
                                    keyText = keyText.replace(/^["']|["']$/g, '');
                                    if (keyText) {
                                        inputKeys.add(keyText);
                                        break;
                                    }
                                }
                            }
                            break; // Found the expression, no need to continue
                        }
                    }
                }
            }

            // Continue traversing
            if (cursor.gotoFirstChild()) continue;
            if (cursor.gotoNextSibling()) continue;

            let retracing = true;
            while (retracing) {
                if (!cursor.gotoParent()) {
                    retracing = false;
                    reachedRoot = true;
                } else {
                    if (cursor.gotoNextSibling()) {
                        retracing = false;
                    }
                }
            }
        }

        tree.delete();
    } catch (e) {
        console.error("Error extracting input declarations:", e);
    }

    return inputKeys;
}




// Create autocomplete extension
export function dslAutocomplete(parser: Parser | null) {
    return autocompletion({
        override: [
            (context: CompletionContext): CompletionResult | null => {
                const word = context.matchBefore(/\w*/);
                if (!word) return null;

                // Don't autocomplete if the word is too short (except when explicitly triggered)
                if (word.from === word.to && !context.explicit) return null;

                const text = context.state.doc.toString();
                const pos = context.pos;

                // Check if we're after a colon (declaration context)
                const beforeCursor = text.substring(Math.max(0, pos - 50), pos);
                const isAfterColon = /:\s*\w*$/.test(beforeCursor);

                // Extract variables from the document
                const variables = extractVariables(parser, text);
                const variableCompletions: Completion[] = Array.from(variables).map(v => ({
                    label: v,
                    type: "variable",
                    detail: "Variable"
                }));

                let options: Completion[] = [];

                if (isAfterColon) {
                    // After colon, suggest declaration types
                    options = [...declarationTypes];
                } else {
                    // Otherwise, suggest functions and variables
                    options = [...builtInFunctions, ...variableCompletions];
                }

                return {
                    from: word.from,
                    options: options,
                    validFor: /^\w*$/
                };
            }
        ]
    });
}
