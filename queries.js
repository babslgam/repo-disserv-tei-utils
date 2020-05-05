const queries = {
  elements: 'select json_extract(nodes.element,\'$.name\') AS name,json_extract(nodes.element,\'$.text\') AS text, json_extract(nodes.element,\'$.attributes\') AS attributes  from nodes where name LIKE ? AND (text LIKE ? or text is NULL) LIMIT 100',
  distinctElements: 'select json_extract(nodes.element,\'$.name\') AS name,json_extract(nodes.element,\'$.text\') AS text, json_extract(nodes.element,\'$.attributes\') AS attributes , count(json_extract(nodes.element,\'$.name\')) as count from nodes where name LIKE ? AND (text LIKE ? or text is NULL) group by name, text,attributes LIMIT 100',
};

module.exports = queries;
