"use strict"

const assert = require('assert');
const oracledb = require('oracledb');
const through = require('through2');

const OracleResultSetStream = require("../OracleResultSetStream");

const dbconfig = {
    dev_quart: {
        user: "developer",
        password: "essadev2",
        connectString: "localhost:35002/zedidb1.world"
    }
}


const errorHandler = function(err) {
    throw err;
}

describe("OracleResultSetStream", function() {
    let result = [];

    before(function(done) {
        let orastream = new OracleResultSetStream({
            sql: "select * from (select company_id, shortname from developer.company order by company_id) where rownum <= 3"
        });

        let t = through.obj(function(row, encoding, callback) {
            result.push(row);
            callback(null, row);
        });

        oracledb.getConnection(dbconfig.dev_quart, function(err, connection) {
            if (err) {
                errorHandler(err);
                return;
            }

            orastream.execute({dbconnection: connection}, function(err) {
                if (err) throw err;

                orastream
                    .on("error", errorHandler)
                    .pipe(t)
                    .on("error", errorHandler)
                    .on("finish", function() {
                        console.log("Done!");
                        done();
                    });
            });
        });
    });

    it("should have return 3 rows", function() {
        assert.equal(result.length, 3);
    });
})
