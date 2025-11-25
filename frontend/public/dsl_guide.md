# CostForecast DSL Guide

Welcome to the CostForecast Domain Specific Language (DSL). This guide will help you write cost models and understand how to use the AI assistant.

## Core Concepts

The DSL is designed to be simple, declarative, and Excel-like. It focuses on defining **Inputs**, **Calculations**, and **Ranges** (loops).

### 1. Variables & Assignments
You can assign values or expressions to variables using `=`.
```javascript
revenue = 1000
cost = 500
profit = revenue - cost
```

### 2. Inputs
Use `Input("Name")` to define parameters that can be adjusted in the UI.
```javascript
# Simple value
tax_rate = Input("tax_rate")

# List of objects (JSON)
items = Input("items") 
# e.g., [{"qty": 1, "price": 10}, {"qty": 2, "price": 20}]
```

### 3. Params
Use `Param` to define placeholders for properties that will exist inside a `Range` loop.
```javascript
qty: Param
price: Param
```

### 4. Arithmetic
Standard math operators are supported: `+`, `-`, `*`, `/`, `^` (power).
```javascript
area = width * height
```

### 5. Comments
Use `#` for single-line comments to explain your code.
```javascript
# This is a comment
tax = 0.1 # Inline comment
```

## Functions

### `Range(list, expression)`
Iterates over a `list` and evaluates the `expression` for each item. This is similar to a "Map" or "Projection" operation.

*   **list**: An array of objects (usually from an `Input`).
*   **expression**: The calculation to perform for each item.

**Example: Line Item Totals**
```javascript
# 1. Define Params matching the keys in your input list
qty: Param
price: Param

# 2. Define the calculation using those Params
row_total = qty * price

# 3. Get the list of items
items = Input("items")

# 4. Apply Range to calculate row_total for every item
item_totals = Range(items, row_total)
```

### `Sum(array)`
Calculates the sum of an array (e.g., the result of a `Range`).
```javascript
grand_total = Sum(item_totals)
```

### `If(condition, true_value, false_value)`
Conditional logic.
```javascript
discounted_price = If(qty > 100, 
    price * 0.9, 
    price
)
```

## AI Prompting Guide

When using the AI Assistant, try to be specific about:
1.  **Inputs**: What variables should be adjustable?
2.  **Logic**: How do costs change over time or based on volume?
3.  **Output**: What is the final metric you want to see?

**Example Prompt:**
> "Create a model for a SaaS business. We have 'Monthly Active Users' starting at 1000 and growing 10% month-over-month. We want to forecast this for 24 months. Each user costs $0.05 to serve. Calculate the total infrastructure cost."

**Generated Code:**
```javascript
# Inputs
months = Input("months") # [1, 2, ..., 24]
initial_users = Input("Initial Users") # 1000
growth_rate = Input("Growth Rate") # 1.10
cost_per_user = Input("Cost per User") # 0.05

# Params for the loop
month_index: Param

# Logic for a single month
users = initial_users * (growth_rate ^ (month_index - 1))
monthly_cost = users * cost_per_user

# Apply Range
# Note: Input "months" should be [{"month_index": 1}, {"month_index": 2}, ...]
forecast = Range(months, monthly_cost)

total_cost = Sum(forecast)
```
