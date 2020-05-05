const Database = require('better-sqlite3');


let cachedb;

function init() {
  cachedb = Database(`${__dirname}/cache.db`);
  cachedb.exec(`CREATE TABLE IF NOT EXISTS resources (
        arche_id integer primary key,
        arche_binary_update_date date
        );`);
}

/*  function getNewId() {
      const stmt = cachedb.prepare('SELECT id FROM resources ORDER BY id DESC LIMIT 1;');
      const newId = (!stmt.get()) ? 1 : stmt.get().id += 1;
      return newId;
} */

function storeResource(archeResourceId, lastBinaryUpdateDate) {
  const stmt = cachedb.prepare('INSERT INTO resources VALUES(?,?)');
  stmt.run(archeResourceId, lastBinaryUpdateDate);
  //resource.init(id, archeResourceId);
}

function getResources() {
  const stmt = cachedb.prepare('SELECT * FROM resources');
  const resources = stmt.all();
  return resources;
}

function check(archeResourceId, binaryUpdateDate) {
  const response = {};
  const stmt = cachedb.prepare('SELECT * FROM resources where arche_id = ?').bind(archeResourceId);
  const resourceEntry = stmt.get();
  if (resourceEntry && resourceEntry.arche_binary_update_date === binaryUpdateDate) {
    response.message = 'Resource already stored and up to date';
  } else if (resourceEntry && resourceEntry.arche_binary_update_date !== binaryUpdateDate) {
    response.message = 'Resource outdated';
  } else {
    response.message = 'Resource not imported yet.';
  }
  return response;
}

module.exports = {
  init,
  check,
  storeResource,
  getResources,
};
