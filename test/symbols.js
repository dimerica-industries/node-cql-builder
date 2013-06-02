var assert = require('assert'),
    symbol = require('../lib/symbols');

function eq(from, to) {
    return assert.deepEqual(from.toString(), to);
}

describe('symbols:', function() {
    describe('identifier', function() {
        it('should be quoted', function() {
            eq(symbol.Identifier("this"), '"this"');
        });

        it('should escape quotes', function() {
            eq(symbol.Identifier('this"thing'), '"this""thing"'); 
        });

        reject('identifier', 'object', 'null', 'undefined');
    });

    describe('tablename', function() {
        it('should optionally include keyspace', function() {
            eq(symbol.TableName({table: 'silly'}), '"silly"');
            eq(symbol.TableName({keyspace: 'wtf', table: 'silly'}), '"wtf"."silly"');
            eq(symbol.TableName({keyspace: '', table: 'silly'}), '"silly"');
        });

        it('should expect an object with key "table"', function() {
            throws('TableName', 'heyo');
        });
    });

    describe('string', function() {
        test_string_accept('StringConst')();
        test_string_reject('StringConst')();
    });

    describe('integer', function() {
        test_int_accept('IntConst')();
        test_int_reject('IntConst')();
    });

    describe('float', function() {
        test_float_accept('FloatConst')();
        test_float_reject('FloatConst')();
    });

    describe('number', function() {
        test_int_accept('NumberConst')();
        test_float_accept('NumberConst')();

        reject('number', 'null', 'undefined', 'boolean', 'object', 'string');
    });

    describe('uuid', function() {
        test_uuid_accept('UUIDConst')();
        reject('uuid', 'null', 'undefined', 'boolean', 'object', 'string', 'integer', 'float');
    });

    describe('term', function() {
        test_ft_accept('Term')();
        test_q_literal_accept('Term')();

        reject('term', 'null', 'undefined', 'object');
    });

    describe('int-term', function() {
        test_int_accept('IntTerm')();
        test_q_literal_accept('IntTerm')();

        reject('term', 'null', 'undefined', 'object', 'string', 'boolean', 'float');
    });

    describe('map-terms', function() {
        it('should accept key, value pair', function() {
            eq(symbol.MapTerms(
                {key: 'hello', value: 'goodbye'}), 
                "'hello': 'goodbye'");

            eq(symbol.MapTerms(
                {key: '123123', value: 'goodbye'}), 
                "123123: 'goodbye'");

            eq(symbol.MapTerms(
                {key: '123123', value: false}), 
                "123123: false");

            eq(symbol.MapTerms(
                {key: '123123', value: 'false'}), 
                "123123: 'false'");
        });
    });

    describe('map', function() {
        it('should accept an object', function() {
            eq(symbol.MapLiteral([{key: 3, value: 4}, {key: 'hello', value: 'goodbye'}]), "{3: 4, 'hello': 'goodbye'}");

            eq(symbol.CollectionLiteral([{key: 3, value: 4}, {key: 'hello', value: 'goodbye'}]), "{3: 4, 'hello': 'goodbye'}");
        });
    });

    describe('list', function() {
        it('should accept an array', function() {
            eq(symbol.ListLiteral([3, 4, 5, 6]), '[3, 4, 5, 6]');
            eq(symbol.CollectionLiteral([3, 4, 5, 6]), '[3, 4, 5, 6]');
        });
    });

    describe('set', function() {
        it('should accept an array', function() {
            var val = [3, 4, 5, 6];

            eq(symbol.SetLiteral(val), '{3, 4, 5, 6}');
            eq(symbol.CollectionLiteral({set: val}), '{3, 4, 5, 6}');
        });
    });

    describe('native type', function() {
        it('should accept types', function() {
            eq(symbol.NativeType('int'), 'int');
        });
    });
});

function test_string_accept(op) {
    return function() {
        it('should be single quoted', function() {
            eq(symbol[op]("string"), "'string'");
        });

        it('should escape quotes', function() {
            eq(symbol[op]("'string"), "'''string'");
        });
    };
}

function test_string_reject(op) {
    return function() {
        it('should reject non stringy types', function() {
            throws(op, null);
            throws(op, undefined);
            throws(op, true);
            throws(op, ['blagh']);
        });
    };
}

function test_int_accept(op) {
    return function() {
        it('should accept ints', function() {
            eq(symbol[op](42), '42');
        });

        it('should accept arbitrarily long string ints', function() {
            eq(symbol[op](
                '123123129203984923492323423423423234234234'), 
                '123123129203984923492323423423423234234234'
            );
        });
    };
}

function test_int_reject(op) {
    return function() {
        it('should reject floats', function() {
            throws(op, 45.3);
        });
    };
}

function test_float_accept(op) {
    return function() {
        it('should accept floats', function() {
            eq(symbol[op](42.2344234), '42.2344234');
        });

        it('should accept arbitrarily long string floats', function() {
            eq(symbol[op](
                '12312312920398492349232342342342.3234234234'), 
                '12312312920398492349232342342342.3234234234'
            );
        });
    };
}

function test_float_reject(op) {
    return function() {
        it('should reject non floats', function() {
            throws(op, 10);
            throws(op, null);
            throws(op, true);
            throws(op, 'hello');
        });
    };
}

function test_uuid_accept(op) {
    return function() {
        it('should accept uuid strings', function() {
            eq(symbol[op]('550e8400-e29b-41d4-a716-446655440000'), '550e8400-e29b-41d4-a716-446655440000');
        });
    };
}

function test_ft_accept(op) {
    return function() {
        test_string_accept(op)();
        test_int_accept(op)();
        test_float_accept(op)();
        test_uuid_accept(op)();

        it('should accept bools', function() {
            eq(symbol[op](true), 'true');
        });
    };
}

function test_q_literal_accept(op) {
    return function() {
        it('should accept string literal "?"', function() {
            eq(symbol[op]({variable: '?'}), '?');
        });
    };
}

function reject(op) {
    var rejectVals = {
        'null': [null],
        'undefined': [void 0],
        'object': [{something: 'dumb'}, {}],
        'boolean': [true, false],
        'string': ['wtf', 'this is a string'],
        'integer': [12389129381823],
        'float': [12312312.1323123]
    };

    var args = [].slice.call(arguments, 1);

    args.forEach(function(arg) {
        var vals = rejectVals[arg];

        it('should reject ' + arg, function() {
            for (var i in vals) {
                throws(op, vals[i]);
            }
        });
    });
}

function throws(op, val) {
    return assert.throws(function() {
        symbol[op](val);
    });
}

function nothrow(op, val) {
    return assert.doesNotThrow(function() {
        symbol[op](val);
    });
}

