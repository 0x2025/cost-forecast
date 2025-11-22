# Domain Formula DSL — Concise Summary

**Version:** 0.1 • **Focus:** language only (no implementation) • **Style:** Excel-like brevity with explicit semantics.

---

## Objectives
- Concise like Excel, explicit like code.
- Named variables.
- Explicit data provenance: `Input`, `Const`, `Reference`.
- Extensibility for new operators and functions.
- Following declarations workflow.

---

## Building Blocks

### Assignment
```dsl
lhs = <expr>
```

### Declarations
```dsl
name: Input("key" | A3 | identifier)   # bind to external data (scalar or vector)
name: Param                            # bind to implicit context (parameter)
name: Const(<number | "string">)        # literal constant (scalar)
name: Reference(other_name)             # alias to another variable
```

### Comments
```dsl
# This is a comment
x = 1  # Inline comment
```
---

## Literals & Names
- **Numbers:** integers/decimals only (`42`, `0.5`, `.75`, `10.`). *No scientific notation.*
- **Strings:** double-quoted with escapes.
- **Identifiers:** any standard name (`snake_case`, `camelCase`, etc.).

---

## Expressions
- **Arithmetic:** `+  -  *  /  ^`  
  Precedence: `^` (right-assoc) > unary `+/-` > `* /` > `+ -`
- **Comparisons:** `=  <>  <  <=  >  >=` → numeric booleans (`1` true, `0` false)
- **Parentheses:** `( … )`
- **Functions (case-insensitive):**
  - `IF(cond, a, b)`
  - `AND(...), OR(...), NOT(...)`
  - `SUM(...)`, `AVERAGE(...)`, `MIN(...)`, `MAX(...)`
  - `Range(range, func)` — apply `func` to range (e.g., `Range(A1:A10, Discount)`) where A1:A10 is the input data
  - (Extensible: new functions can be added as normal calls)

---

### Cell-like references
- **Column letters:** assigned by declaration order (`A`, `B`, `C`, …).

---

## Examples

**Named inputs & constants**
```dsl
total_revenue = sale_revenue - marketing_cost
sale_revenue: Input("sales")
marketing_cost: Const(50)
```

**Range Operator: Bulk Processing**
Apply a discount logic to a list of prices.
```dsl
# Define the discount logic
discounted_price = price * 0.9
price: Param                     # Implicitly bound to each item in A1:A10

# Apply to a range of inputs
bulk_discounts = Range(A1:A10, discounted_price)
prices: Input("raw_prices")      # Binds to A1:A10
```

---

## Errors & Validation
- Unknown names or missing bindings.

---

## Extensibility
- New functions can be introduced as ordinary calls (e.g., `SUMIF(values, mask)`, `SCAN_ADD(init, vec)`), without changing core syntax.