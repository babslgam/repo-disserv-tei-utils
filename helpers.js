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

const validProps = {
  type: 'https://vocabs.acdh.oeaw.ac.at/schema#Resource',
  format: 'text/xml',
};


function parseMetadata(archeResourceId, metadata) {
  const md = {};
  md.resourceId = archeResourceId;
  Object.keys(relevantProps).forEach((k) => {
    md[k] = (metadata[relevantProps[k]]) ? metadata[relevantProps[k]][0].value : undefined;
  });
  return md;
}

async function getMetaDataHead(resUri) {
  let mdHdRes;
  try {
    mdHdRes = await axios.head(`${resUri}/metadata`);
  } catch (err) {
    mdHdRes = err.response;
  }
  return mdHdRes;
}

async function getMetaData(resUri) {
  let repoResponse;
  try {
    repoResponse = await axios.get(`${resUri}/metadata`, {
      headers: {
        accept: 'application/json',
        'X-METADATA-READ-MODE': 'resource',
      },
    });
  } catch (error) {
    repoResponse = error.response;
  }
  return repoResponse;
}

function processMetaDataResponse(archeResourceId, mdResp) {
  const parsedMetaData = parseMetadata(archeResourceId, mdResp);
  const customResp = {};
  if (parsedMetaData.type !== validProps.type) {
    customResp.status = 400;
    customResp.statusText = `Type is ${parsedMetaData.type}. Must be ${validProps.type}`;
  }
  else if (parsedMetaData.format !== validProps.format) {
    customResp.status = 400;
    customResp.statusText = `Format is ${parsedMetaData.format}. Must be ${validProps.format}`;
  } else {
    const cachedResource = cache.getResource(parsedMetaData.resourceId, parsedMetaData.binaryUpdateDate);
    if (cachedResource) {
      if (cachedResource.arche_binary_update_date === parsedMetaData.binaryUpdateDate) {
        customResp.status = 403;
        customResp.statusText = 'Resource is up to date';
      } else {
        customResp.status = 200;
        customResp.binaryUpdateDate = parsedMetaData.binaryUpdateDate;
        customResp.statusText = 'ready for import';
      }
    } else {
      customResp.status = 200;
      customResp.binaryUpdateDate = parsedMetaData.binaryUpdateDate;
      customResp.statusText = 'ready for import';
    }
  }
  return customResp;
}

async function validateRequest(archeResourceId) {
  let customResp = {};
  const resUri = `${config.repoApi}/${archeResourceId}`;
  try {
    const mdHdresponse = await getMetaDataHead(resUri);
    switch (mdHdresponse.status) {
      case 404:
        customResp.status = 400;
        customResp.statusText = 'Resource not found in repo';
        break;
      case 403:
        customResp.status = 400;
        customResp.statusText = 'Resource access in repo restricted';
        break;
      case 200:
        try {
          const mdResponse = await getMetaData(resUri);
          const processedMetaDataResponse = processMetaDataResponse(archeResourceId, mdResponse.data[resUri]);
          customResp = processedMetaDataResponse;
        } catch (err) {
          console.log(err);
        }
        break;
      default:
        break;
    }
  } catch (err) {
    customResp = err.response;
  }
  return customResp;
}


async function importResource(archeResourceId) {
  const result = {};
  const db = resource.init(archeResourceId);
  try {
    const response = await axios.get(`${config.repoApi}/${archeResourceId}`);
    const nodes = await parser.parse(response.data);
    resource.insertNodes(db, nodes);
    result.status = '200';
    result.statusText = 'Import done';
  } catch (error) {
    console.error(error);
  }
  return result;
}

module.exports = {
  parseMetadata,
  importResource,
  getMetaDataHead,
  validateRequest,
};
