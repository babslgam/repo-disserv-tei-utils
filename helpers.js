const axios = require('axios');

const config = require('./config.js');
const cache = require('./cache.js');
const resource = require('./resource.js');
const parser = require('./parse.js');


const relevantProps = {
  type: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
  binaryUpdateDate: 'https://vocabs.acdh.oeaw.ac.at/schema#hasBinaryUpdatedDate',
  format: 'https://vocabs.acdh.oeaw.ac.at/schema#hasFormat',
};


function parseMetadata(metadata) {
  const md = {};
  Object.keys(relevantProps).forEach((k) => {
    md[k] = (metadata[relevantProps[k]]) ? metadata[relevantProps[k]][0].value : undefined;
  });
  return md;
}

async function getMetaData(archeResourceId) {
  const response = {};
  const resUri = `${config.repoApi}/${archeResourceId}`;
  try {
    const repoResponse = await axios.get(`${resUri}/metadata`, {
      headers: {
        accept: 'application/json',
        'X-METADATA-READ-MODE': 'resource',
      },
    });
    response.result = parseMetadata(repoResponse.data[resUri]);
  } catch (error) {
    response.status = 'error';
    response.message = `Repo response: ${error.response.statusText}`;
  }
  return response;
}


async function validateRequest(archeResourceId) {
  const validationResult = {
    response: {},
    binaryUpdateDate: null,
  };

  const metadataResponse = await getMetaData(archeResourceId);
  if (metadataResponse.status === 'error') {
    validationResult.response = metadataResponse;
  } else if (metadataResponse.result.type !== 'https://vocabs.acdh.oeaw.ac.at/schema#Resource') {
    validationResult.response.status = 'error';
    validationResult.response.message = 'resource has wrong type';
  } else if (metadataResponse.result.format !== 'text/xml') {
    validationResult.response.status = 'error';
    validationResult.response.message = 'resource has wrong format';
  } else {
    validationResult.binaryUpdateDate = metadataResponse.result.binaryUpdateDate;
    validationResult.response = cache.check(archeResourceId, validationResult.binaryUpdateDate);
  }
  return validationResult;
}

async function importResource(archeResourceId) {
  const result = {};
  const db = resource.init(archeResourceId);
  try {
    const response = await axios.get(`${config.repoApi}/${archeResourceId}`);
    const nodes = await parser.parse(response.data);
    resource.insertNodes(db, nodes);
    result.message = 'Import done';
    /*parser.parse(response.data).then((nodes) => {
      resource.insertNodes(db, nodes);
      result.message = 'Import done';
    });*/
  } catch (error) {
    console.error(error);
  }
  return result;
}

module.exports = {
  parseMetadata,
  validateRequest,
  importResource,
};
