using System;
using System.Text.Json;

namespace CostForecast.Engine.Core;

/// <summary>
/// Utility class for type conversions across the engine.
/// </summary>
public static class TypeConverter
{
    /// <summary>
    /// Converts a value to double, handling various types including JsonElement from API deserialization.
    /// Returns 0.0 for null values.
    /// Throws exceptions for invalid conversions (arrays, unsupported types).
    /// </summary>
    /// <param name="value">The value to convert</param>
    /// <returns>The converted double value</returns>
    /// <exception cref="ArgumentException">When attempting to convert arrays/collections directly</exception>
    /// <exception cref="Exception">When JsonElement type cannot be converted to number</exception>
    public static double ToDouble(object value)
    {
        if (value == null)
            return 0.0;

        // Handle JsonElement from API deserialization
        if (value is JsonElement jsonElement)
        {
            return jsonElement.ValueKind switch
            {
                JsonValueKind.Number => jsonElement.GetDouble(),
                JsonValueKind.String => double.TryParse(jsonElement.GetString(), out var d) 
                    ? d 
                    : throw new Exception($"Cannot convert string '{jsonElement.GetString()}' to number"),
                JsonValueKind.True => 1.0,
                JsonValueKind.False => 0.0,
                JsonValueKind.Null => 0.0,
                _ => throw new Exception($"Cannot convert JsonElement of type {jsonElement.ValueKind} to number")
            };
        }

        // Handle primitive types
        if (value is double dbl) return dbl;
        if (value is int i) return i;
        if (value is long l) return l;
        if (value is float f) return f;
        if (value is decimal dec) return (double)dec;
        
        // Reject arrays/collections (must use aggregation functions)
        if (value is Array || value is System.Collections.IEnumerable && !(value is string))
        {
            throw new ArgumentException("Cannot convert array/collection to number directly. Use aggregation functions like SUM, AVERAGE, etc.");
        }
        
        // Fallback to Convert for other IConvertible types
        return Convert.ToDouble(value);
    }
}
