var util = require('util');

exports.extend = function(a)
{
	var rest = [].slice.call(arguments, 1);

	for (var i in rest)
	{
		for (var j in rest[i])
		{
			a[j] = rest[i][j];
		}
	}

	return a;
};

exports.isArgs = function(val)
{
	return Object.prototype.toString.call(val) == '[object Arguments]';
};

exports.identity = function(v)
{
	return v;
};

exports.extend(exports, util);
