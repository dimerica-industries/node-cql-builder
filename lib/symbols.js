var type = require('./type');

var UnquotedIdentifier = exports.UnquotedIdentifier = type('UnquotedIdentifier', {
    value: function(v) {
        if (typeof v === 'string' && /^[a-zA-Z0-9_]*$/.test(v)) {
            return v;
        }

        throw new Error("identifier must match /^[a-zA-Z0-9_]*$/");
    }
});

var Identifier = exports.Identifier = type('Identifier', {
    value: type.primitive(String),
})
.format(function() {
    if (!this.value) {
        return '';
    }

    return '"' + this.value.replace(/"/g, '""') + '"';
});

var TableName = exports.TableName = type('TableName', {
    keyspace: Identifier,
    table: Identifier
})
.format(function() {
    var ks = (this.keyspace || '').toString();
    return (ks ? ks + '.' : '') + this.table;
});

var StringConst = exports.StringConst = type('StringConst', {
    string: type.primitive(String)
})
.format(function() {
    return "'" + String(this.string).replace(/'/g, "''") + "'";
});

var IntConst = exports.IntConst = type('IntConst', {
    int: function(value) {
        var t = typeof value;

        if ((t === 'number' || t === 'string') && /^-?\d+$/.test(String(value))) {
            return String(value);
        }

        throw new TypeError("Must be an integer value");
    }
});

var FloatConst = exports.FloatConst = type('FloatConst', {
    float: function(value) {
        var t = typeof value;

        if ((t === 'number' || t === 'string') && /^-?\d+?\.\d*$/.test(String(value))) {
            return String(value);
        }

        throw new TypeError("Must be an integer value");
    }
});

var NumberConst = exports.NumberConst = type.union('NumberConst', IntConst, FloatConst);

var UUIDConst = exports.UUIDConst = type('UUIDConst', {
    uuid: function(value) {
        if (typeof value === 'string' && (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i).test(value)) {
            return value;
        }

        throw new TypeError("Must be UUID value");
    }
});

var BooleanConst = exports.BooleanConst = type('BooleanConst', {
    bool: type.primitive(Boolean)
});

var HexConst = exports.HexConst = type('HexConst', {
    hex: function(value) {
        if (typeof value === 'string' && (/^0[xX][0-9a-fA-F]+$/.test(value))) {
            return value;
        }

        throw new TypeError("Must be a hex value");
    }
});

var Constant = exports.Constant = type.union('Constant', NumberConst, UUIDConst, StringConst, BooleanConst, HexConst);

var Variable = exports.Variable = type('Variable', {
    variable: type.literal("?")
});

var Func = exports.Func = type('Function', {
    fn: UnquotedIdentifier
});

var FunctionTerm = exports.FunctionTerm = type('FunctionTerm', {
    fn: Func,
    args: null
})
.format("{{fn}}({{?args}}{{args}}{{?}})");

var Term = exports.Term = type.union('Term', Constant, Variable, FunctionTerm);

FunctionTerm.setField('args', type.collection(Term));

var IntTerm = exports.IntTerm = type.union('IntTerm', IntConst, Variable);

var MapTerms = exports.MapTerms = type('MapTerms', {
    key: Term,
    value: Term
})
.format("{{key}}: {{value}}");

var MapLiteral = exports.MapLiteral = type('MapLiteral', {
    map: type.collection('MapLiteral', MapTerms, '{}')
});

var SetLiteral = exports.SetLiteral = type('SetLiteral', {
    set: type.collection('SetLiteral', Term, '{}')
});

var ListLiteral = exports.ListLiteral = type('ListLiteral', {
    list: type.collection('ListLiteral', Term, '[]')
});

var CollectionLiteral = exports.CollectionLiteral = type.union('CollectionLiteral', MapLiteral, ListLiteral, SetLiteral);

Term.__add_type__(CollectionLiteral);

var Property = exports.Property = type('Property', {
    key: Identifier,
    value: type.union(Constant, Identifier, MapLiteral)
})
.format("{{key}} = {{value}}");

var Properties = exports.Properties = type.collection('Properties', Property, '', ' AND ');

var NativeType = exports.NativeType = type.union('NativeType',
    type.literal('ascii'),
    type.literal('bigint'),
    type.literal('blob'),
    type.literal('boolean'),
    type.literal('counter'),
    type.literal('decimal'),
    type.literal('double'),
    type.literal('float'),
    type.literal('inet'),
    type.literal('int'),
    type.literal('text'),
    type.literal('timestamp'),
    type.literal('timeuuid'),
    type.literal('uuid'),
    type.literal('varchar'),
    type.literal('varint'));

var ListType = exports.ListType = type('ListType', {
    value: NativeType
})
.format('list<{{value}}>');

var SetType = exports.SetType = type('SetType', {
    value: NativeType
})
.format('set<{{value}}>');

var MapType = exports.MapType = type('MapType', {
    keyType: NativeType,
    valueType: NativeType
})
.format('map<{{keyType}}, {{valueType}}>');

var CollectionType = exports.CollectionType = type.union('CollectionType', ListType, SetType, MapType);

var Type = exports.Type = type.union('Type', NativeType, CollectionType, StringConst);
