var assert = require('assert'),
	statement = require('../lib/statements');

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
			eq(statement.CreateKeyspace(
			{
				keyspace: 'hello',
				options: [
					{key: 'replication', value: [{key: 'class', value: 'NetworkTopologyStrategy'}, {key: 'DC1', value: 1}, {key: 'DC2', value: 3}]}, 
					{key: 'durable_writes', value: false}
				]
			}), 
			"CREATE KEYSPACE \"hello\" WITH \"replication\" = {'class': 'NetworkTopologyStrategy', 'DC1': 1, 'DC2': 3} AND \"durable_writes\" = false");

		});
	});

	describe('create table', function()
	{
		it('should accept this', function()
		{
			var tbl = statement.CreateTable(
			{
				table:
				{
					table: 'this'
				},

				primaryKey:
				{
					partitionKey: ['id'],
					clusterKeys: ['created']
				},

//				columns:
//				[
//					{name: 'id', type: ['list', 'uuid']},
//					{name: 'id2', type: ['map', 'uuid', 'text']}
//				],
//
				options:
				[
					"COMPACT STORAGE",
					{key: 'compaction', value: {key: 'class', value: 'LeveledCompactionStrategy'}}
				]
			});

			console.log(tbl.toString());
		});
	});
});
