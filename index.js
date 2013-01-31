var builder = require('./lib/builder'),
	statements = require('./lib/statements');

for (var i in statements)
{
	exports[i] = builder.builderFromType(statements[i]);
}
