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
var PartitionKey = type.union(symbol.Identifier, type.collection('PartitionKey', symbol.Identifier, '()'));
var ClusterKeys = type.collection('ClusterKeys', symbol.Identifier, '');

var PrimaryKey = type('PrimaryKey',
{
	partitionKey: PartitionKey,
	clusterKeys: ClusterKeys,

	format: "PRIMARY KEY ({{partitionKey}}{{?clusterKeys}}, {{clusterKeys}}{{?}})"
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
	options: Options,
	format: "WITH {{options}}"
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

var OptionTimestamp = type('OptionTimestamp',
{
	timestamp: symbol.IntConst,
	format: "TIMESTAMP {{timestamp}}"
});

var OptionTTL = type('OptionTTL',
{
	ttl: symbol.IntConst,
	format: "TTL {{ttl}}"
});

var OptionWritetime = type('OptionWritetime',
{
	writetime: symbol.Identifier,
	format: "WRITETIME {{writetime}}"
});

var WriteOption = type.union('WriteOption', OptionTimestamp, OptionTTL);
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

var ModifyWhereEqual = type('ModifyWhereEqual',
{
	column: symbol.Identifier,
	value: symbol.Term,

	format: "{{column}} = {{value}}"
});

var ModifyWhereIn = type('ModifyWhereIn',
{
	column: symbol.Identifier,
	values: type.collection(symbol.Term),

	format: "{{column}} IN {{values}}"
});

var ModifyWhere = type.union('ModifyWhere', ModifyWhereEqual, ModifyWhereIn);

var UpdateAssignmentEquals = type('UpdateAssignmentEquals',
{
	column: symbol.Identifier,
	value: symbol.Term,

	format: "{{column}} = {{value}}"
});

var UpdateAssignmentAdd = type('UpdateAssignmentAdd',
{
	column: symbol.Identifier,
	value: type.union(symbol.IntTerm, symbol.SetLiteral, symbol.ListLiteral),

	format: "{{column}} = {{column}} + {{value}}"
});

var UpdateAssignmentSubtract = type('UpdateAssignmentSubtract',
{
	column: symbol.Identifier,
	value: type.union(symbol.IntTerm, symbol.SetLiteral, symbol.ListLiteral),

	format: "{{column}} = {{column}} - {{value}}"
});

var UpdateAssignmentAddMap = type('UpdateAssignmentAddMap',
{
	column: symbol.Identifier,
	value: symbol.MapLiteral,

	format: "{{column}} = {{column}} + {{value}}"
});

var UpdateAssignmentCollection = type('UpdateAssignmentCollection',
{
	column: symbol.Identifier,
	key: symbol.Term,
	value: symbol.Term,

	format: "{{column}}[{{key}}] = {{value}}"
});

var Update = exports.Update = type('Update',
{
	table: symbol.TableName,
	assignment: type.union(UpdateAssignmentEquals, UpdateAssignmentAdd, UpdateAssignmentSubtract, UpdateAssignmentAddMap, UpdateAssignmentCollection),
	where: ModifyWhere,
	options: type.collection(WriteOption),

	format: "UPDATE {{table}}{{?options}} USING {{options}}{{?}} SET {{assignment}} WHERE {{where}}"
});

var DeleteSelection = type('DeleteSelection',
{
	column: symbol.Identifier,
	key: symbol.Term,

	format: "{{column}}{{?key}}[{{key}}]{{?}}"
});

var Delete = exports.Delete = type('Delete',
{
	table: symbol.TableName,
	selection: type.collection(DeleteSelection),
	where: ModifyWhere,
	timestamp: OptionTimestamp,

	format: "DELETE{{?selection}} {{selection}}{{?}} FROM {{table}}{{?timestamp}} USING {{timestamp}}{{?} WHERE {{where}}"
});

var Batch = exports.Batch = type('Batch',
{
	modifications: type.collection(type.union(Insert, Update, Delete)),
	options: type.collection(OptionTimestamp),
	format: "BEGIN BATCH{{?options}} USING {{options}}{{?}} {{modifications}} APPLY BATCH"
});

var SelectedId = type.union(symbol.Identifier, OptionWritetime, OptionTTL);
var ColumnList = type.union(type.collection(SelectedId), type.literal('*'));
var SelectCount = type('SelectCount',
{
	format: "COUNT(*)"
});

var SelectClause = type.union(ColumnList, SelectCount);

var RelationTerm = type.union(
			type.literal('='),
			type.literal('<'),
			type.literal('>'),
			type.literal('<='),
			type.literal('>='));

var SelectDefaultRelation = type('SelectDefaultRelation',
{
	column: symbol.Identifier,
	relation: RelationTerm,
	value: symbol.Term,

	format: "{{column}} {{relation}} {{value}}"
});

var SelectInRelation = type('SelectInRelation',
{
	column: symbol.Identifier,
	values: type.collection(symbol.Term),

	format: "{{column}} IN {{values}}"
});

var SelectTokenValue = type('SelectTokenValue',
{
	value: symbol.Term,
	format: "TOKEN ({{value}})"
});

var SelectTokenRelation = type('SelectTokenRelation',
{
	column: symbol.Identifier,
	relation: RelationTerm,
	value: type.union(symbol.Term, SelectTokenValue),

	format: "TOKEN ({{column}}) {{relation}} {{value}}"
});

var SelectRelation = type.union(SelectDefaultRelation, SelectInRelation, SelectTokenRelation);

var SelectWhere = type.collection(SelectRelation);

var SelectOrdering = type('SelectOrdering',
{
	column: symbol.Identifier,
	direction: type.union(type.literal("ASC"), type.literal("DESC")),
	format: "{{column}}{{?direction}} {{direction}}{{?}}"
});

var Select = exports.Select = type('Select',
{
	table: symbol.TableName,
	clause: SelectClause,
	where: SelectWhere,
	limit: symbol.IntConst,
	order: type.collection(SelectOrdering),

	format: "SELECT {{clause}} FROM {{table}}{{?where}} WHERE {{where}}{{?}}{{?order}} ORDER BY {{order}}{{?}}{{?limit}} LIMIT {{limit}}{{?}"
});
