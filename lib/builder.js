var util = require('./util'),
	statement = require('./statements'),
	symbol = require('./symbols'),
	type = require('./type');

exports.builderFromType = builderFromType;

function inspectBuilder(instance)
{
	var fields = instance.constructor.__fields__;

	return 'Builder[' + Object.keys(fields).map(function(k)
	{
		return k + ': ' + util.inspect(fields[k]);
	}).join(', ') + ']';
}

function BaseBuilder()
{

}

function builder(spec)
{
	var fields = {};

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

		if (args.length)
		{

		}
	}

	util.inherits(ctor, BaseBuilder);


	for (var i in spec)
	{
		if (!~['build', 'constructor', 'inspect'].indexOf(i))
		{
			ctor.prototype[i] = fields[i] = spec[i];
		}
	}

	ctor.__fields__ = fields;

	ctor.prototype.__build = function()
	{
		if (!spec.build)
		{
			throw new Error("Invalid spec - must create build method");
		}

		return spec.build.call(this);
	};

	ctor.prototype.tap = function(fn)
	{
		fn = fn || function(that)
		{
			console.log(that, that.toString());
		};
		fn(this);

		return this;
	};

	ctor.prototype.inspect = function()
	{
		if (spec.hasOwnProperty('inspect'))
		{
			return spec.inspect.call(this);
		}

		return inspectBuilder(this);
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
		var fieldName = '__' + name + '__',
			s = setter(fieldName, fields[name]),
			bldr = builderFromType(fields[name]);

		var fn = function()
		{
			if (arguments.length === 0)
			{
				if (!(this[fieldName] instanceof BaseBuilder))
				{
					var that = this;

					this[fieldName] = bldr();
					this[fieldName].end = function()
					{
						return that;
					};
				}

				return this[fieldName];
			}

			return s.apply(this, arguments);
		};

		fn.inspect = function()
		{
			return util.inspect(fields[name]);
		};

		return fn;
	}

	if (t.__collection_type__)
	{
		var b = builderFromType(t.__collection_type__);

		spec.value = function()
		{
			if (!this.__values__)
			{
				this.__values__ = [];
			}

			if (arguments.length > 0)
			{
				var value = t.__collection_type__.apply(null, arguments);
				this.__values__.push(value);

				return this;
			}

			var instance = b(),
				that = this;

			this.__values__.push(instance);
			instance.end = function()
			{
				return that;
			};

			return instance;
		};
	}
	else
	{
		for (var i in fields)
		{
			spec[i] = setterOrGetter(i);
		}
	}

	spec.inspect = function()
	{
		return util.inspect(t) + inspectBuilder(this);
	};

	spec.build = function()
	{
		var args;

		if (t.__collection_type__)
		{
			args = (this.__values__ || []).map(function(v)
			{
				return v instanceof BaseBuilder ? v.__build() : v;
			});
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
