# Implementation Plan - Tree-sitter Grammar

## Goal
Implement the Tree-sitter grammar for the CostForecast DSL based on the specification in `dsl.md`. This will enable syntax highlighting, error reporting, and parsing for the backend.

## User Review Required
> [!NOTE]
> **Grammar Structure**: I will structure the grammar to strictly follow the `dsl.md` spec.
> - **Assignments**: `identifier = expression`
> - **Declarations**: `identifier : Type(args)`
> - **Expressions**: Arithmetic, Comparison, Function Calls, Ranges, Lookups.
> - **Inputs**: `Input(...)`
> - **Parameters**: `Param`
> - **Constants**: `Const(...)`
> - **References**: `Reference(...)`

## Proposed Changes

### Grammar Repository (`/language`)
I will initialize a new Tree-sitter project in a separate directory `language` at root.

#### [NEW] [grammar.js](file:///Users/arthur/CostForecast/tree-sitter-costforecast/grammar.js)
- Define the rules:
    - `source_file`: Repeat `statement`.
    - `statement`: `assignment` | `declaration` | `comment`.
    - `assignment`: `identifier = expression`.
    - `declaration`: `identifier : type_def`.
    - `type_def`: `Input(...)` | `Param` | `Const(...)` | `Reference(...)`.
    - `expression`: Binary ops, Function calls, Literals, Identifiers.
- Edge cases, precedence, etc. should be handled.
- Adding new operators should be as simple as adding a new rule or function.
#### [NEW] [package.json](file:///Users/arthur/CostForecast/language/package.json)
- Dependencies: `tree-sitter-cli`, `nan`.

### Integration
#### [NEW] [binding.gyp](file:///Users/arthur/CostForecast/language/binding.gyp)
- Node.js bindings configuration.

## Verification Plan

### Automated Tests
- **Corpus Tests**: Create `language/test/corpus/basic.txt` with example DSL code and expected AST.
- **Command**: `tree-sitter test`.

### Manual Verification
- Run `tree-sitter parse example.dsl` to see the CST output.
