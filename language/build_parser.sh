#!/bin/bash

# Determine OS
OS="$(uname -s)"
SRC_DIR="src"
PARSER_SRC="$SRC_DIR/parser.c"

if [ "$OS" = "Darwin" ]; then
    echo "Building for macOS..."
    gcc -o libtree-sitter-costforecast.dylib -shared "$PARSER_SRC" -I "$SRC_DIR"
    echo "Created libtree-sitter-costforecast.dylib"
elif [ "$OS" = "Linux" ]; then
    echo "Building for Linux..."
    gcc -o libtree-sitter-costforecast.so -shared "$PARSER_SRC" -I "$SRC_DIR" -fPIC
    echo "Created libtree-sitter-costforecast.so"
else
    echo "Unsupported OS: $OS"
    exit 1
fi
