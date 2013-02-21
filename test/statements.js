var assert = require('assert'),
	query = require('../index');

function eq(from, to)
{
	return assert.deepEqual(from.toString(), to);
}

describe('statements', function()
{
	it('create keyspace', function()
	{
		eq(query.CreateKeyspace()
			.keyspace('Excelsior')
			.options()
				.value()
					.key('replication')
					.value([
						{key: 'class', value: 'SimpleStrategy'},
						{key: 'replication_factor', value: 3}
					])
				.end()
			.end(),
		"CREATE KEYSPACE \"Excelsior\" WITH \"replication\" = {'class': 'SimpleStrategy', 'replication_factor': 3}");

		eq(query.CreateKeyspace()
			.keyspace('Excalibur')
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
		"CREATE KEYSPACE \"Excalibur\" WITH \"replication\" = {'class': 'NetworkTopologyStrategy', 'DC1': 1, 'DC2': 3} AND \"durable_writes\" = false");
	});

	it('use', function()
	{
		eq(query.Use().keyspace("myApp"), 'USE "myApp"');
	});

	it('alter keyspace', function()
	{
		eq(query.AlterKeyspace()
			.keyspace('Excelsior')
			.options()
				.value()
					.key('replication')
					.value([
						{key: 'class', value: 'SimpleStrategy'},
						{key: 'replication_factor', value: 4}
					])
				.end()
			.end(),
			"ALTER KEYSPACE \"Excelsior\" WITH \"replication\" = {'class': 'SimpleStrategy', 'replication_factor': 4}");
	});

	it('drop keyspace', function()
	{
		eq(query.DropKeyspace().keyspace("myApp"),
			"DROP KEYSPACE \"myApp\""
		);
	});

	it('create table', function()
	{
		eq(query.CreateTable()
			.table({table: "monkeySpecies"})
			.columns()
				.value({name: 'species', type: 'text'})
				.value({name: 'common_name', type: 'text'})
				.value({name: 'population', type: 'varint'})
				.value({name: 'average_size', type: 'int'})
			.end()
			.primaryKey({partitionKey: 'species'})
			.options()
				.value({key: 'comment', value: 'Important biological records'})
				.value({key: 'read_repair_chance', value: '1.0'})
			.end(),
			"CREATE TABLE \"monkeySpecies\" (\"species\" text, \"common_name\" text, \"population\" varint, \"average_size\" int, PRIMARY KEY (\"species\")) WITH \"comment\" = 'Important biological records' AND \"read_repair_chance\" = 1.0");
	});

	it('alter table', function()
	{
		eq(query.AlterTable()
			.table({table: 'addamsFamily'})
			.instruction({column: "lastKnownLocation", type: "uuid"}),
		"ALTER TABLE \"addamsFamily\" ALTER \"lastKnownLocation\" TYPE uuid");

		eq(query.AlterTable()
			.table({table: 'addamsFamily'})
			.instructionAlterInstructionAdd({column: "gravesite", type: "varchar"}),
		"ALTER TABLE \"addamsFamily\" ADD \"gravesite\" varchar");

		eq(query.AlterTable()
			.table({table: 'addamsFamily'})
			.instructionAlterInstructionWith().options()
				.value({key: 'comment', value: "A most excellent and useful column family"})
				.value({key: 'read_repair_chance', value: '0.2'})
			.end().end(),
		"ALTER TABLE \"addamsFamily\" WITH \"comment\" = 'A most excellent and useful column family' AND \"read_repair_chance\" = 0.2");
	});
});
