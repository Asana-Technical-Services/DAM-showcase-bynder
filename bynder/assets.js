// const axios = require('axios');
const constants = require('../pages/api/constants');

// eslint-disable-next-line no-unused-vars
const bynderConfig = {
  headers: constants.bynderRequestHeaders,
};

// eslint-disable-next-line no-empty-function
async function getUploadEndpoint() {
}

exports.getUploadEndpoint = getUploadEndpoint;
