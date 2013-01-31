var assert = require('assert'),
	query = require('../index');

function eq(from, to)
{
	return assert.deepEqual(from.toString(), to);
}

describe('statements', function()
{
	describe('create keyspace', function()
	{
		it('should accept object', function()
		{
			eq(query.CreateKeyspace()
				.keyspace('hello')
				.options()
					.value()
						.key('replication')
						.value([
							{key: 'class', value: 'NetworkTopologyStrategy'},
							{key: 'DC1', value: 1}, 
							{key: 'DC2', value: 3}
						])
					.end()
					.value({key: 'durable_writes', value: false})
				.end(),
			"CREATE KEYSPACE \"hello\" WITH \"replication\" = {'class': 'NetworkTopologyStrategy', 'DC1': 1, 'DC2': 3} AND \"durable_writes\" = false");

		});
	});
});
