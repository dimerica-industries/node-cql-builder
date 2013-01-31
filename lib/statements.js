var type = require('./type'),
	symbol = require('./symbols');

// <create-keyspace-stmt> ::= CREATE KEYSPACE <identifier> WITH <properties>
var CreateKeyspace = exports.CreateKeyspace = type('CreateKeyspace',
{
	keyspace: symbol.Identifier,
	options: symbol.Properties,

	format: "CREATE KEYSPACE {{keyspace}} WITH {{options}}"
});

// <use-stmt> ::= USE <identifier>
var Use = exports.Use = type('Use',
{
	keyspace: symbol.Identifier,
	format: "USE {{keyspace}}"
});

// <create-keyspace-stmt> ::= ALTER KEYSPACE <identifier> WITH <properties>
var AlterKeyspace = exports.AlterKeyspace = type('AlterKeyspace',
{
	keyspace: symbol.Identifier,
	options: symbol.Properties,

	format: "ALTER KEYSPACE {{keyspace}} WITH {{options}}"
});

// <drop-keyspace-stmt> ::= DROP KEYSPACE <identifier>
var DropKeyspace = exports.DropKeyspace = type('DropKeyspace',
{
	keyspace: symbol.Identifier,
	format: "DROP KEYSPACE {{keyspace}}"
});

//<partition-key> ::= <identifier>
//                  | '(' <identifier> (',' <identifier> )* ')'
var PartitionKey = type.collection('PartitionKey', symbol.Identifier, '()');
var ClusterKeys = type.collection('ClusterKeys', symbol.Identifier, '');

var PrimaryKey = type('PrimaryKey',
{
	partitionKey: PartitionKey,
	clusterKeys: ClusterKeys,

	format: "PRIMARY KEY ({{partitionKey}}, {{clusterKeys}})"
});

//<column-definition> ::= <identifier> <type> ( PRIMARY KEY )?
//                      | PRIMARY KEY '(' <partition-key> ( ',' <identifier> )* ')'

var ColumnDefinition = type('ColumnDefinition',
{
	name: symbol.Identifier,
	type: symbol.Type,

	format: "{{name}} {{type}}"
});

var ClusteringOrder = type('ClusteringOrder',
{
	format: 'CLUSTERING ORDER BY ()'
});

var CompactStorage = type('CompactStorage',
{
	value: type.literal("CompactStorage")
});

//clause('option', or(lit('COMPACT STORAGE'), clause('clustering-order'), symbol('property')));
var Option = type.union('Option', CompactStorage, ClusteringOrder, symbol.Property);
var ColumnDefinitions = type.collection('ColumnDefinitions', ColumnDefinition, '');
var Options = type.collection('Options', Option, '', ' AND ');

//<create-table-stmt> ::= CREATE (TABLE | COLUMNFAMILY) <tablename>
//                        '(' <definition> ( ',' <definition> )* ')'
//                        ( WITH <option> ( AND <option>)* )?
var CreateTable = exports.CreateTable = type('CreateTable',
{
	table: symbol.TableName,
	primaryKey: PrimaryKey,
	columns: ColumnDefinitions,
	options: Options,

	format: "CREATE TABLE {{table}} ({{columns}}, {{primaryKey}}){{?options}} WITH {{options}}{{?}}"
});

var AlterInstructionAlter = type('AlterInstructionAlter',
{
	column: symbol.Identifier,
	type: symbol.Type,

	format: "ALTER {{column}} TYPE {{type}}"
});

var AlterInstructionAdd = type('AlterInstructionAdd',
{
	column: symbol.Identifier,
	type: symbol.Type,

	format: "ADD {{column}} {{type}}"
});

var AlterInstructionWith = type('AlterInstructionWith',
{
	spec: ColumnDefinitions,
	format: "WITH {{spec}}"
});

var AlterInstruction = type.union(AlterInstructionAlter, AlterInstructionAdd, AlterInstructionWith);

var AlterTable = exports.AlterTable = type('AlterTable',
{
	table: symbol.TableName,
	instruction: AlterInstruction,

	format: "ALTER TABLE {{table}} {{instruction}}"
});

var DropTable = exports.DropTable = type('DropTable',
{
	table: symbol.TableName,

	format: "DROP TABLE {{table}}"
});

var Truncate = exports.Truncate = type('Truncate',
{
	table: symbol.TableName,
	format: "TRUNCATE {{tablename}}"
});

var CreateIndex = exports.CreateIndex = type('CreateIndex',
{
	index: symbol.Identifier,
	table: symbol.TableName,
	column: symbol.Identifier,

	format: "CREATE INDEX {{?index}}{{index}} {{?}}ON {{table}} ({{column}})"
});

var DropIndex = exports.DropIndex = type('DropIndex',
{
	index: symbol.Identifier,
	format: "DROP INDEX {{index}}"
});

var WriteTimestamp = type('WriteTimestamp',
{
	timestamp: symbol.IntConst,
	format: "TIMESTAMP {{timestamp}}"
});

var WriteTTL = type('WriteTTL',
{
	ttl: symbol.IntConst,
	format: "TTL {{ttl}}"
});

var WriteOption = type.union('WriteOption', WriteTimestamp, WriteTTL);
var TermOrLiteral = type.union('TermOrLiteral', symbol.Term, symbol.CollectionLiteral);
var Columns = type.collection('Columns', symbol.Identifier);

var Insert = exports.Insert = type('Insert',
{
	table: symbol.TableName,
	column: type.collection(symbol.Identifier),
	values: type.collection(TermOrLiteral),
	options: type.collection(WriteOption),

	format: "INSERT INTO {{table}} ({{columns}}) VALUES ({{values}}){{?options}} USING {{options}}{{?}}"
});

//});
//
////statement('update');
////statement('delete');
////statement('batch');
////statement('select');
