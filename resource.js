const Database = require('better-sqlite3');

const log4js = require('log4js');


const logger = log4js.getLogger();
logger.level = 'debug';


function insertNodes(db, nodes) {
  const insernodestmt = db.prepare('INSERT INTO nodes VALUES(?,?)');
  const insertMultiple = db.transaction((nds) => {
    nds.forEach((node) => {
      insernodestmt.run(node.id, JSON.stringify(node.element));
    });
  });
  insertMultiple(nodes);
  return 'Import finished';
}

function query(id, queryStmt, elementName, text) {
  const resourcedb = Database(`${__dirname}/${id}.db`);
  const stmt = resourcedb.prepare(queryStmt).bind(elementName, text);
  const result = stmt.all();
  return result;
}


function init(id) {
  const resourcedb = Database(`${__dirname}/${id}.db`, {verbose: logger.info.bind(logger)});
  resourcedb.exec(`CREATE TABLE IF NOT EXISTS nodes (
        id integer primary key,
        element text
        );`);
  return resourcedb;
}

module.exports = {
  init,
  insertNodes,
  query,
};
