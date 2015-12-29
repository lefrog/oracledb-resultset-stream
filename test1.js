"use strict"

const oracledb = require('oracledb');
const through = require('through2');
const OracleResultSetStream = require("./OracleResultSetStream");
const DbRowParser = require('db-row-parser').DbRowParser;
const DbRowParserStream = require('db-row-parser').DbRowParserStream;

const dbconfig = {
    dev_quart: {
        user: "developer",
        password: "essadev2",
        connectString: "localhost:35002/zedidb1.world"
    }
}

let orastream = new OracleResultSetStream({
    sql: "select company_id, shortname from developer.company order by company_id",
    sqlArgs: [],
    rowsBatch: 100
});

let rowParser = new DbRowParser({
    properties: {
        id: 0,
        name: 1
    }
});

let rowParserStream = new DbRowParserStream({
    rowParser: rowParser
});

let t = through.obj(function(obj, encoding, cb) {
    cb(null, JSON.stringify(obj) + "\n");
});

const errorHandler = function(err) {
    console.error(err);
}

oracledb.getConnection(dbconfig.dev_quart, function(err, connection) {
    if (err) {
        errorHandler(err);
        return;
    }

    orastream.execute({
        dbconnection: connection
    }, function(err) {
        if (err) {
            console.error(err);
            return;
        }
        
        orastream
            .on("error", errorHandler)
            .pipe(rowParserStream)
            .on("error", errorHandler)
            .pipe(t)
            .on("error", errorHandler)
            .pipe(process.stdout)
            .on("finish", function() {
                console.log("done");
                connection.close(function(err) {
                    if (err) throw err;
                });
            });

        /*
        orastream.on("data", function(data) {
            console.dir(data);
        });
        orastream
            .pipe(rowParserStream)
            .pipe(t)
            .pipe(process.stdout);
        */
    });
});
