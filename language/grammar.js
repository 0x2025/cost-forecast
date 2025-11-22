const escape_sequence = token.immediate(seq(
    '\\',
    choice(
        /[^xuU]/,
        /\d{2,3}/,
        /x[0-9a-fA-F]{2,}/,
        /u[0-9a-fA-F]{4}/,
        /U[0-9a-fA-F]{8}/
    )
));

module.exports = grammar({
    name: 'costforecast',

    extras: $ => [
        /\s/,
    ],

    rules: {
        source_file: $ => repeat($.statement),

        statement: $ => choice(
            $.assignment,
            $.declaration,
            $.comment
        ),

        comment: $ => token(seq('#', /.*/)),

        assignment: $ => seq(
            field('name', $.identifier),
            '=',
            field('value', $.expression)
        ),

        declaration: $ => seq(
            field('name', $.identifier),
            ':',
            field('type', $.type_def)
        ),

        type_def: $ => choice(
            $.input_def,
            $.param_def,
            $.const_def,
            $.reference_def
        ),

        input_def: $ => seq(
            'Input',
            '(',
            field('source', choice($.string, $.identifier)),
            ')'
        ),

        param_def: $ => 'Param',

        const_def: $ => seq(
            'Const',
            '(',
            field('value', choice($.number, $.string)),
            ')'
        ),

        reference_def: $ => seq(
            'Reference',
            '(',
            field('target', $.identifier),
            ')'
        ),

        expression: $ => choice(
            $.binary_expression,
            $.unary_expression,
            $.function_call,
            $.identifier,
            $.number,
            $.string,
            $.parenthesized_expression
        ),

        parenthesized_expression: $ => seq(
            '(',
            $.expression,
            ')'
        ),

        binary_expression: $ => choice(
            prec.left(1, seq($.expression, field('operator', alias(choice('+', '-'), $.binary_operator)), $.expression)),
            prec.left(2, seq($.expression, field('operator', alias(choice('*', '/'), $.binary_operator)), $.expression)),
            prec.right(3, seq($.expression, field('operator', alias('^', $.binary_operator)), $.expression)),
            prec.left(0, seq($.expression, field('operator', alias(choice('=', '<>', '<', '<=', '>', '>='), $.binary_operator)), $.expression)),
            prec.left(5, seq($.expression, field('operator', alias(':', $.binary_operator)), $.expression)) // Range operator
        ),

        unary_expression: $ => prec(4, seq(
            field('operator', alias(choice('+', '-'), $.unary_operator)),
            $.expression
        )),

        function_call: $ => seq(
            field('function', $.identifier),
            '(',
            optional(commaSep($.expression)),
            ')'
        ),

        identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,

        number: $ => choice(
            /\d+/,
            /\d*\.\d+/,
            /\d+\./
        ),

        string: $ => seq(
            '"',
            repeat(choice(
                token.immediate(prec(1, /[^"\\]+/)),
                escape_sequence
            )),
            '"'
        ),
    }
});

function commaSep(rule) {
    return seq(rule, repeat(seq(',', rule)));
}
