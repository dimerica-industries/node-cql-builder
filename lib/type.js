var util = require('./util'),
	dot = require('dot');

function template(format, varname)
{
	var settings = {};

	for (var i in dot.templateSettings)
	{
		settings[i] = dot.templateSettings[i];
	}

	settings.interpolate = /\{\{([^?][\s\S]+?\}?)\}\}/g;
	settings.varname = varname;

	var fn = dot.template(format, settings);
	fn.__template = true;

	return fn;
}

type.primitive = primitive;
type.union = union;
type.collection = collection;
type.literal = literal;

module.exports = type;

var i = 0;

function anonName(prefix)
{
	prefix = prefix || 'anonymous';
	return prefix + '_' + (i++);
}

function BaseType()
{

}

function type(name, spec)
{
	if (arguments.length === 1)
	{
		spec = name;
		name = anonName();
	}

	var specLength = 0,
		fields = {},
		attrNames = [];

	for (var i in spec)
	{
		if (!~['constructor', 'format', 'inspect'].indexOf(i))
		{
			fields[i] = spec[i];
			attrNames.push(i);
			specLength++;

			delete spec[i];
		}
	}

	function ctor()
	{
		var val;

		if (!(this instanceof ctor))
		{
			val = new ctor(arguments);
			return val;
		}

		var args = [].slice.call(util.isArgs(arguments[0]) ? arguments[0] : arguments);

		if (spec.hasOwnProperty('constructor'))
		{
			val = spec.constructor.apply(this, args);
			return val;
		}

		if ((specLength === 0 && args.length !== 0) || (args.length !== 1))
		{
			throw new Error("Invalid constructor length. Found " + args.length + ", expected " + (specLength ? 1 : 0));
		}

		if (specLength === 0)
		{
			return;
		}

		var arg = args[0],
			t;

		if (specLength === 1 && (
			arg === null ||
			((t = typeof arg) !== 'object') ||
			(typeof arg === 'object' && !arg.hasOwnProperty(attrNames[0])) 
		))
		{
			var tmp = {};
			tmp[attrNames[0]] = arg;

			arg = tmp;
		}

		if (specLength && (typeof arg !== 'object' || arg === null))
		{
			throw new Error("Expect constructor argument to be object with keys: " + attrNames.map(util.inspect).join(', ') + "." + util.inspect(arg) + " found instead");
		}

		for (var i in arg)
		{
			set(this, i, arg[i]);
		}
	}

	function get(obj, key)
	{
		return obj[key];
	}

	function set(obj, key, value)
	{
		var c = fields[key];

		if (!c)
		{
			throw new Error("Field " + key + " not found in spec for type " + name);
		}

		obj[key] = value instanceof c ? value : c.call(obj, value);
	}

	ctor.__type__ = name;
	ctor.__fields__ = fields;

	ctor.inspect = function()
	{
		return name;
	};

	ctor.prototype = util.extend(ctor.prototype,
	{
		inspect: function()
		{
			if (spec.inspect)
			{
				return spec.inspect.call(this);
			}

			var that = this;

			return name + '(' + 
				attrNames.map(function(n) { return util.inspect(get(that, n) || undefined); }).join(', ') + 
				')';
		},

		toString: function()
		{
			var g = get.bind(null, this);

			if (spec.format)
			{
				if (typeof spec.format !== 'function')
				{
					spec.format = template(spec.format, attrNames.join(', '));
				}

				if (spec.format.__template)
				{
					return spec.format.apply(this, attrNames.map(g));
				}

				return spec.format.call(this);
			}

			var val = g(attrNames[0]);
			return val === void 0 || val === null ? '' : String(val);
		}
	});

	return ctor;
}

function primitive(type)
{
	return function(value)
	{
		var t = typeof value;

		if (type === String && t === 'string' ||
			type === Number && t === 'number' ||
			type === Boolean && t === 'boolean')
		{
			return value;
		}

		throw new Error(util.inspect(value) + " must be instance of " + type);
	};
}

function union(name)
{
	var types = [].slice.call(arguments, 1);

	if (typeof name !== 'string')
	{
		types.unshift(name);
		name = anonName('union(' + types.map(function(t)
		{
			return t.__type__;
		})
		.join('|') + ')');
	}

	var t = type(name,
	{
		constructor: function()
		{
			var i;

			if (arguments.length === 1)
			{
				for (i in types)
				{
					if (arguments[0] instanceof types[i])
					{
						return arguments[0];
					}
				}
			}
		
			for (i in types)
			{
				try
				{
					var val = types[i].apply(null, arguments);
					return val;
				}
				catch(_) {}
			}

			throw new TypeError("No types matched arguments for union type " + name + " and arguments " + util.inspect(arguments));
		}
	});

	t.__union_types__ = types;

	for (var i in types)
	{
		t[types[i].__type__] = types[i];
	}

	return t;
}

function literal(value)
{
	return type('"' + value + '"',
	{
		constructor: function(val)
		{
			if (value !== val)
			{
				throw new TypeError("Must be " + value);
			}
		},

		format: function()
		{
			return value;
		}
	});
}

function collection(name, childType, surrounds, delim)
{
	if (typeof name !== 'string')
	{
		childType = name;
		surrounds = childType;
		delim = surrounds;
		name = anonName();
	}

	var vals = [];

	surrounds = surrounds === void 0 ? '' : surrounds;
	delim = delim === void 0 ? ', ' : delim;

	var t = type(name,
	{
		constructor: function()
		{
			var args = arguments.length == 1 && util.isArray(arguments[0]) ?
					arguments[0] :
					[].slice.call(arguments);

			vals = args.map(function(v)
			{
				if (v instanceof childType)
				{
					return v;
				}

				return childType(v);
			});
		},

		inspect: function()
		{
			return this.constructor.__type__ + '(' + 
				vals.map(function(v) { return v.inspect(); }).join(', ') + 
				')';
		},

		format: function()
		{
			return (surrounds[0] || '') + vals.join(delim) + (surrounds[1] || '');
		}
	});

	t.__collection_type__ = childType;

	return t;
}
