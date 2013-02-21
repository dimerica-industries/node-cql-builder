var type = require('./type');

var Identifier = exports.Identifier = type('Identifier',
{
	value: type.primitive(String),

	format: function()
	{
		if (!this.value)
		{
			return '';
		}

		return '"' + this.value.replace(/"/g, '""') + '"';
	}
});

var TableName = exports.TableName = type('TableName',
{
	keyspace: Identifier,
	table: Identifier,

	format: function()
	{
		var ks = (this.keyspace || '').toString();
		return (ks ? ks + '.' : '') +  this.table;
	}
});

var StringConst = exports.StringConst = type('StringConst',
{
	value: type.primitive(String),

	format: function()
	{
		return "'" + String(this.value).replace(/'/g, "''") + "'";
	}
});


var IntConst = exports.IntConst = type('IntConst',
{
	value: function(value)
	{
		var t = typeof value;

		if ((t === 'number' || t === 'string') && /^-?\d+$/.test(String(value)))
		{
			return String(value);
		}

		throw new TypeError("Must be an integer value");
	}
});

var FloatConst = exports.FloatConst = type('FloatConst',
{
	value: function(value)
	{
		var t = typeof value;

		if ((t === 'number' || t === 'string') && /^-?\d+?\.\d*$/.test(String(value)))
		{
			return String(value);
		}

		throw new TypeError("Must be an integer value");
	}
});

var NumberConst = exports.NumberConst = type.union('NumberConst', IntConst, FloatConst);

var UUIDConst = exports.UUIDConst = type('UUIDConst',
{
	value: function(value)
	{
		if (typeof value === 'string' && (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i).test(value))
		{
			return value;
		}

		throw new TypeError("Must be UUID value");
	}
});

var BooleanConst = exports.BooleanConst = type('BooleanConst',
{
	value: type.primitive(Boolean)
});

var Q = exports.Q = type('Q',
{
	value: type.literal("?")
});

var FinalTerm = exports.FinalTerm = type.union('FinalTerm', NumberConst, UUIDConst, StringConst, BooleanConst);
var Term = exports.Term = type.union('Term', Q, FinalTerm);
var IntTerm = exports.IntTerm = type.union('IntTerm', IntConst, Q);

var FinalTermPair = exports.FinalTermPair = type('FinalTermPair',
{
	key: FinalTerm,
	value: FinalTerm,

	format: "{{key}}: {{value}}"
});

var MapLiteral = exports.MapLiteral = type.collection('MapLiteral', FinalTermPair, '{}');
var SetLiteral = exports.SetLiteral = type.collection('SetLiteral', FinalTerm, '{}');
var ListLiteral = exports.ListLiteral = type.collection('ListLiteral', FinalTerm, '[]');

var CollectionLiteral = exports.CollectionLiteral = type.union('CollectionLiteral', MapLiteral, SetLiteral, ListLiteral);

var Value = exports.Value = type.union('Value', NumberConst, BooleanConst, StringConst, Identifier);

var Property = exports.Property = type('Property',
{
	key: Identifier,
	value: type.union(Value, MapLiteral),

	format: "{{key}} = {{value}}"
});

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
	type.literal('varint') 
);

var ListType = exports.ListType = type('ListType',
{
	value: NativeType,
	format: 'list<{{value}}>'
});

var SetType = exports.SetType = type('SetType',
{
	value: NativeType,
	format: 'set<{{value}}>'
});

var MapType = exports.MapType = type('MapType',
{
	keyType: NativeType,
	valueType: NativeType,

	format: 'map<{{keyType}}, {{valueType}}>'
});

var CollectionType = exports.CollectionType = type.union('CollectionType', ListType, SetType, MapType);

var Type = exports.Type = type.union('Type', NativeType, CollectionType, StringConst);

