var util = require('./util'),
	statement = require('./statements'),
	symbol = require('./symbols'),
	type = require('./type');

function BaseBuilder()
{

}

function builder(spec)
{
	function ctor()
	{
		if (!(this instanceof ctor))
		{
			return new ctor(arguments);
		}

		var args = [].slice.call(util.isArgs(arguments[0]) ? arguments[0] : arguments);

		if (spec.hasOwnProperty('constructor'))
		{
			return spec.constructor.apply(this, args);
		}
	}

	util.inherits(ctor, BaseBuilder);

	var fields = {};

	for (var i in spec)
	{
		if (!~['build', 'constructor'].indexOf(i))
		{
			ctor.prototype[i] = fields[i] = spec[i];
		}
	}

	ctor.prototype.__build = function()
	{
		if (!spec.build)
		{
			throw new Error("Invalid spec - must create build method");
		}

		return spec.build.call(this);
	};

	ctor.prototype.inspect = function()
	{
		return 'Builder[' + Object.keys(fields).map(function(k)
		{
			return k + ': ' + util.inspect(fields[k]);
		}).join(', ') + ']';
	};

	ctor.prototype.toString = function()
	{
		var statement = this.__build();
		return statement.toString();
	};

	return ctor;
}

function setter(key, transform)
{
	var fn = function(value)
	{
		value = (transform || util.identity).call(this, value);
		this[key] = value;

		return this;
	};

	fn.inspect = function()
	{
		return 'setter(' + key + ', ' + util.inspect(transform) + ')';
	};

	return fn;
}

function pusher(key, transform)
{
	return function(value)
	{
		if (!this[key])
		{
			this[key] = [];
		}

		value = (transform || util.identity).call(this, value);
		this[key].push(value);

		return this;
	};
}

function proxy(value)
{
	return function()
	{
		this[value].apply(this, arguments);
	};
}

function builderFromType(t)
{
	var spec = {},
		fields = t.__fields__;

	function setterOrGetter(name)
	{
		var s = setter('__' + name + '__', fields[name]),
			bldr = builderFromType(fields[name])(),
			b = function()
			{
				this['__' + name + '__'] = bldr;
				return bldr;
			};

		return function()
		{
			return (arguments.length === 0 ? b : s).apply(this, arguments);
		};
	}

	if (t.__collection_type__)
	{
		spec.push = pusher('__values__', t.__collection_type__);
	}
	else
	{
		for (var i in fields)
		{
			spec[i] = setterOrGetter(i);
		}
	}

	spec.build = function()
	{
		var args;

		if (t.__collection_type__)
		{
			args = this.__values__;
		}
		else
		{
			args = {};

			for (var i in this)
			{
				if (/^__(.*)__$/.test(i))
				{
					args[i.substr(2, i.length - 4)] = this[i] instanceof BaseBuilder ?
						this[i].__build() :
						this[i];
				}
			}
		}

		return t(args);
	};

	return builder(spec);
}

var Use = builderFromType(statement.Use);
var CreateKeyspace = builderFromType(statement.CreateKeyspace);

var ks = CreateKeyspace();
console.log(ks.options().push({key: "32", value: "h3llo"}));
console.log(ks.toString());
