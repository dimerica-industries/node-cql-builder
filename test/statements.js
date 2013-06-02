var assert = require('assert'),
    query = require('../index');

function eq(from, to) {
    return assert.deepEqual(from.toString(), to);
}

describe('statements', function() {
    it('create keyspace', function() {
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
        "CREATE KEYSPACE \"Excelsior\" WITH \"replication\" = {'class': 'SimpleStrategy', 'replication_factor': 3};");

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
        "CREATE KEYSPACE \"Excalibur\" WITH \"replication\" = {'class': 'NetworkTopologyStrategy', 'DC1': 1, 'DC2': 3} AND \"durable_writes\" = false;");
    });

    it('use', function() {
        eq(query.Use().keyspace("myApp"), 'USE "myApp";');
    });

    it('alter keyspace', function() {
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
            "ALTER KEYSPACE \"Excelsior\" WITH \"replication\" = {'class': 'SimpleStrategy', 'replication_factor': 4};");
    });

    it('drop keyspace', function() {
        eq(query.DropKeyspace().keyspace("myApp"),
            "DROP KEYSPACE \"myApp\";"
        );
    });

    it('create table', function() {
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
            "CREATE TABLE \"monkeySpecies\" (\"species\" text, \"common_name\" text, \"population\" varint, \"average_size\" int, PRIMARY KEY (\"species\")) WITH \"comment\" = 'Important biological records' AND \"read_repair_chance\" = 1.0;");
    });

    it('alter table', function() {
        eq(query.AlterTable()
            .table({table: 'addamsFamily'})
            .instruction({alter: "lastKnownLocation", type: "uuid"}),
        "ALTER TABLE \"addamsFamily\" ALTER \"lastKnownLocation\" TYPE uuid;");

        eq(query.AlterTable()
            .table({table: 'addamsFamily'})
            .instruction({add: "gravesite", type: "varchar"}),
        "ALTER TABLE \"addamsFamily\" ADD \"gravesite\" varchar;");

        eq(query.AlterTable()
            .table({table: 'addamsFamily'})
            .instruction({
                options: [
                    {key: 'comment', value: "A most excellent and useful column family"},
                    {key: 'read_repair_chance', value: '0.2'}
                ]
            }),
        "ALTER TABLE \"addamsFamily\" WITH \"comment\" = 'A most excellent and useful column family' AND \"read_repair_chance\" = 0.2;");
    });

    it('drop table', function() {
        eq(query.DropTable().table({table: "worldSeriesAttendees"}),
            "DROP TABLE \"worldSeriesAttendees\";");
    });

    it('truncate', function() {
        eq(query.Truncate().table({table: "superImportantData"}),
            "TRUNCATE \"superImportantData\";");
    });

    it('create index', function() {
        eq(query.CreateIndex()
            .index("userIndex")
            .table({table: "NerdMovies"})
            .column("user"),
        "CREATE INDEX \"userIndex\" ON \"NerdMovies\" (\"user\");");

        eq(query.CreateIndex()
            .table({table: "Mutants"})
            .column("abilityId"),
        "CREATE INDEX ON \"Mutants\" (\"abilityId\");");
    });

    it('drop index', function() {
        eq(query.DropIndex().index("userIndex"), "DROP INDEX \"userIndex\";");
    });

    it('insert', function() {
        eq(query.Insert()
            .table({table: "NerdMovies"})
            .columns("movie", "director", "main_actor", "year")
            .values("Serenity", "Joss Whedon", "Nathan Fillion", 2005)
            .options({ttl: 86400}),
            "INSERT INTO \"NerdMovies\" (\"movie\", \"director\", \"main_actor\", \"year\") VALUES ('Serenity', 'Joss Whedon', 'Nathan Fillion', 2005) USING TTL 86400;");
    });

    it('update', function() {
        eq(query.Update()
            .table({table: "NerdMovies"})
            .set(
                {column: 'director', value: 'Joss Whedon'},
                {column: 'main_actor', value: 'Nathan Fillion'},
                {column: 'year', value: 2005}
            )
            .where({column: 'movie', value: 'Serenity'})
            .options({ttl: 400}),
            "UPDATE \"NerdMovies\" USING TTL 400 SET \"director\" = 'Joss Whedon', \"main_actor\" = 'Nathan Fillion', \"year\" = 2005 WHERE \"movie\" = 'Serenity';");

        eq(query.Update()
            .table({table: "UserActions"})
            .set({column: 'total', add: 2})
            .where({column: 'user', value: 'B70DE1D0-9908-4AE3-BE34-5573E5B09F14'}, {column: 'action', value: 'click'}),
            "UPDATE \"UserActions\" SET \"total\" = \"total\" + 2 WHERE \"user\" = B70DE1D0-9908-4AE3-BE34-5573E5B09F14 AND \"action\" = 'click';");
    });

    it('delete', function() {
        eq(query.Delete()
            .table({table: "NerdMovies"})
            .timestamp(1240003134)
            .where({column: 'movie', value: 'Serenity'}),
            "DELETE FROM \"NerdMovies\" USING TIMESTAMP 1240003134 WHERE \"movie\" = 'Serenity';");
    });

    it('batch', function() {
        eq(query.Batch()
            .statements(
                query.Insert()
                    .table({table: 'users'})
                    .columns("userid", "password", "name")
                    .values('user2', 'ch@ngem3b', 'second user'),
                query.Update()
                    .table({table: 'users'})
                    .set({column: 'password', value: 'ps22dhds'})
                    .where({column: 'userid', value: 'user3'}),
                query.Insert()
                    .table({table: 'users'})
                    .columns('userid', 'password')
                    .values('user4', 'ch@ngem3c'),
                query.Delete()
                    .table({table: 'users'})
                    .columns({column: 'name'})
                    .where({column: 'userid', value:'user1'})
            ),
            "BEGIN BATCH INSERT INTO \"users\" (\"userid\", \"password\", \"name\") VALUES ('user2', 'ch@ngem3b', 'second user'); UPDATE \"users\" SET \"password\" = 'ps22dhds' WHERE \"userid\" = 'user3'; INSERT INTO \"users\" (\"userid\", \"password\") VALUES ('user4', 'ch@ngem3c'); DELETE \"name\" FROM \"users\" WHERE \"userid\" = 'user1'; APPLY BATCH;");
    });

    it('select', function() {
        eq(query.Select()
            .table({table: 'users'})
            .clause("name", "occupation")
            .where({column: 'userid', values: [199, 200, 207]}),
        "SELECT \"name\", \"occupation\" FROM \"users\" WHERE \"userid\" IN (199, 200, 207);");
        eq(query.Select()
            .table({table: 'events'})
            .clause("time", "value")
            .where(
                {column: 'event_type', relation: '=', value: 'myEvent'},
                {column: 'time', relation: '>', value: '2011-02-03'},
                {column: 'time', relation: '<=', value: '2012-01-01'}
            ),
        "SELECT \"time\", \"value\" FROM \"events\" WHERE \"event_type\" = 'myEvent' AND \"time\" > '2011-02-03' AND \"time\" <= '2012-01-01';");

        eq(query.Select()
            .table({table: 'users'})
            .clause("COUNT(*)"),
        "SELECT COUNT(*) FROM \"users\";");

        eq(query.Select()
            .table({table: 'posts'})
            .clause("*")
            .where(
                {tokenColumn: 'userid', relation: '>', tokenValue: 'tom'},
                {tokenColumn: 'userid', relation: '<', value: 'bob'}
            ),
        "SELECT * FROM \"posts\" WHERE TOKEN(\"userid\") > TOKEN('tom') AND TOKEN(\"userid\") < 'bob';");

        eq(query.Select()
            .table({table: 'myTable'})
            .clause("*")
            .where(
                {column: 't', relation: '=', value: {fn: 'now'}}
            ),
        "SELECT * FROM \"myTable\" WHERE \"t\" = now();");
    });
});
