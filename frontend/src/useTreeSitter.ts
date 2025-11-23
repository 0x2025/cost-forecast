import { useEffect, useState } from 'react';
import Parser from 'web-tree-sitter';
import { EditorView, Decoration, type DecorationSet, ViewPlugin, ViewUpdate } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import { tags } from '@lezer/highlight';
import { HighlightStyle } from '@codemirror/language';

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
