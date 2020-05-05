const queries = {
  distinctElements: 'select DISTINCT json_extract(nodes.element,\'$.name\') AS name,json_extract(nodes.element,\'$.text\') AS text, count(json_extract(nodes.element,\'$.name\')) as count from nodes where name LIKE ? AND text LIKE ? group by name, text',
};

module.exports = queries;
