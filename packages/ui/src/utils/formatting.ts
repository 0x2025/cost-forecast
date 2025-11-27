/**
 * Formats a value as a number with commas and optional decimal places.
 * If the value is not a valid number, it returns the original value as a string.
 * 
 * @param value The value to format
 * @param decimals Number of decimal places (default: 2 for non-integers, 0 for integers if they are exact)
 * @returns Formatted string
 */
export function formatNumber(value: any): string {
    if (value === null || value === undefined || value === '') {
        return '';
    }

    // specific check for arrays/objects to avoid formatting them as NaN or weird strings
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }

    const num = Number(value);

    if (isNaN(num)) {
        return String(value);
    }

    // Check if it's an integer
    if (Number.isInteger(num)) {
        return num.toLocaleString('en-US');
    }

    // For floats, default to 2 decimal places, but allow more if needed (up to 4)
    // using Intl.NumberFormat for better control
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4
    }).format(num);
}

/**
 * Strips formatting characters (commas) from a string to get a raw number string.
 * @param value The formatted string
 * @returns Raw number string
 */
export function parseFormattedNumber(value: string): string {
    if (!value) return '';
    return value.replace(/,/g, '');
}

/**
 * Formats a key (snake_case, camelCase) into a human-readable label.
 * Optionally accepts a dictionary of translations/overrides.
 * 
 * Example: "units_produced" -> "Units produced"
 * Example: "unitsProduced" -> "Units Produced"
 * Example: "EBITDA" -> "EBITDA"
 * 
 * @param key The key to format
 * @param translations Optional dictionary of key -> label
 * @returns Formatted label
 */
export function formatLabel(key: string, translations?: Record<string, string>): string {
    if (!key) return '';

    // Check translations first
    if (translations && translations[key]) {
        return translations[key];
    }

    // Replace underscores with spaces
    let label = key.replace(/_/g, ' ');

    // Insert space before capital letters (camelCase)
    label = label.replace(/([a-z])([A-Z])/g, '$1 $2');

    // Capitalize the first letter
    return label.charAt(0).toUpperCase() + label.slice(1);
}
