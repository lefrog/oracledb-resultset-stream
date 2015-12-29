"use strict"

const util = require('util');
const stream_mod = require('stream');
const oracledb = require('oracledb');

const OracleResultSetStream = function(options) {
    if (!(this instanceof OracleResultSetStream)) {
        return new OracleResultSetStream(options);
    }

    stream_mod.Readable.call(this, {
        objectMode: true
    });

    this._dbconnection = options.dbconnection;
    this._sql = options.sql;
    this._sqlArgs = options.sqlArgs || [];
    this._rowsBatch = options.rowsBatch || 100;

    this._fetchInProgress = false;
    this._keepPushing = false;
    this._resultset = null;
    this._rows = [];
}

util.inherits(OracleResultSetStream, stream_mod.Readable);

module.exports = OracleResultSetStream;

OracleResultSetStream.prototype.execute = function(options, callback) {
    if (arguments.length = 2) {
        if (options.dbconnection) {
            this._dbconnection = options.dbconnection;
        }
        if (options.sql) {
            this._sql = options.sql;
        }
        if (options.sqlArgs) {
            this._sqlArgs = options.sqlArgs;
        }
    } else {
        callback = options;
    }

    let self = this;
    self._dbconnection.execute(
        self._sql,
        self._sqlArgs,
        {
            resultSet: true
        },
        function(err, result) {
            if (err) {
                return callback(err);
            }

            self._resultset = result.resultSet;
            process.nextTick(() => {
                self._pushRows();
            });
            
            callback(null);
        });
}

OracleResultSetStream.prototype._read = function(size) {
    if (this._keepPushing) {
        return;
    }

    this._keepPushing = true;
    this._startPushing();
}

OracleResultSetStream.prototype._startPushing = function() {
    let self = this;
    process.nextTick(() => {
        self._pushRows();
    });
}

OracleResultSetStream.prototype._pushRows = function() {
    let self = this;
    if (self._rows.length == 0) {
        if (self._fetchInProgress) return;

        self._fetchInProgress = true;
        self._fetchRowsFromRS(function(err, rows) {
            self._fetchInProgress = false;
            if (err) {
                self.emit("error", err);
                return;
            }
            if (!rows) {
                self.push(null);
            } else {
                self._rows = rows;
                self._startPushing();
            }
        });
    } else {
        let i;
        for (i=0; i<this._rows.length && this._keepPushing; i++) {
            let row = this._rows[i];
            self._keepPushing = this.push(row);
        }
        this._rows = this._rows.splice(i);
        this._startPushing();
    }
}

OracleResultSetStream.prototype._fetchRowsFromRS = function(callback) {
    let self = this;
    self._resultset.getRows(self._rowsBatch, function(err, rows) {
        if (err) {
            return callback(err);
        } else if (rows.length == 0) { // no rows, or no more rows
            self._resultset.close(function(err) {
                self._resultset = null;
                return callback(err, null);
            });
        } else {
            return callback(null, rows);
        }
    });
}
