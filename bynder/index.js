const axios = require('axios');
const FormData = require('form-data');
const constants = require('../constants');

const config = {
  headers: constants.bynderRequestHeaders,
};

const newFormData = new FormData();
const appendedHeaders = Object.assign(
  constants.bynderMultiPartRequestHeaders,
  newFormData.getHeaders(),
);
const multipartConfig = {
  headers: appendedHeaders,
};

// Helper function to convert javascript objects to form data for axios requests
function getFormData(object) {
  return Object.keys(object).reduce((formData, key) => {
    formData.append(key, object[key]);
    return formData;
  }, new FormData());
}

async function getUploadEndpoint() {
  const response = await axios.get(`${constants.bynderApiUrl}/upload/endpoint`, config);
  const endpointUrl = response && response.data;
  return endpointUrl;
}

async function initializeUpload(assetName) {
  const formData = getFormData({ filename: assetName });
  const response = await axios.post(`${constants.bynderApiUrl}/upload/init`, formData, multipartConfig);
  const responseData = response && response.data;
  return responseData;
}

async function uploadChunks(endpointUrl, multipartParams, imageData, assetName) {
  // Call Bynder API to upload chunks
  const params = multipartParams;
  params.name = assetName;
  params.chunk = 1;
  params.chunks = 1;
  params.Filename = multipartParams.key;
  params.file = imageData;
  const paramsFormData = getFormData(params);
  const response = await axios.post(endpointUrl, paramsFormData, {
    headers: {
      'content-length': paramsFormData.getLengthSync(),
    },
  });
  const responseData = response && response.data;
  return responseData;
}

async function registerUploadedChunks(uploadid, targetid, filename) {
  const chunkNumber = 1;
  const uploadParams = { chunkNumber, targetid, filename };
  const response = await axios.post(
    `${constants.bynderApiUrl}/v4/upload/${uploadid}`,
    getFormData(uploadParams),
    multipartConfig,
  );
  const responseData = response && response.data;
  return responseData;
}

async function finalizeUploadedFile(uploadid, targetid, filename, assetName) {
  const params = {
    targetid,
    s3_filename: filename,
    chunks: 1,
    original_filename: assetName,
  };
  const response = await axios.post(
    `${constants.bynderApiUrl}/v4/upload/${uploadid}`,
    getFormData(params),
    multipartConfig,
  );
  const responseData = response && response.data;
  return responseData;
}

async function pollFinalizedFiles(importId) {
  // Loop to handle making requests until one of the items arrays
  // from the response matches items in query parameters
  async function pollItems() {
    const pollResponse = await axios.get(`${constants.bynderApiUrl}/v4/upload/poll?items=${importId}`, config);
    return pollResponse && pollResponse.data;
  }
  const MAX_TIMEOUT = 40000;
  const DELAY = 200;
  let finishedProcessing = false;
  let pollData;
  let timeoutThreshold = 0;
  while (!finishedProcessing) {
    if (timeoutThreshold >= MAX_TIMEOUT) {
      break;
    }
    // eslint-disable-next-line no-await-in-loop
    pollData = await pollItems();
    finishedProcessing = (pollData.itemsFailed && pollData.itemsFailed.length)
      || (pollData.itemsRejected && pollData.itemsRejected.length)
      || (pollData.itemsDone && pollData.itemsDone.length);
    // eslint-disable-next-line no-await-in-loop, no-promise-executor-return
    await new Promise((r) => setTimeout(r, DELAY));
    timeoutThreshold += 200;
  }
  return finishedProcessing;
}

async function saveNewAsset(importId, assetName, description,tags='asana-upload') {
  const params = {
    brandId: 'EC8550AE-87AD-4700-B2E26D459F6933C4', // TODO: handle and get brandID of specific Bynder instance
    name: assetName,
    description,
    tags: tags, // TODO: Implement tag handling from Asana custom fields
  };
  const response = await axios.post(
    `${constants.bynderApiUrl}/v4/media/save/${importId}`,
    getFormData(params),
    multipartConfig,
  );
  const responseData = response && response.data;
  return responseData;
}

async function uploadAsset(
  endpointUrl,
  initializedData,
  multipartParams,
  imageData,
  assetName,
  assetDescription,
  tags='asana-upload'
) {
  let success = false;
  let error = '';

  // a. Call Bynder API to upload chunks
  const uploadedChunkData = await uploadChunks(endpointUrl, multipartParams, imageData, assetName);
  if (!uploadedChunkData) {
    error = `Failed to upload chunk data to <${endpointUrl}>`;
    return { success, error,importId:null  };
  }
  const uploadid = initializedData.s3file && initializedData.s3file.uploadid;
  const targetid = initializedData.s3file && initializedData.s3file.targetid;
  const filename = multipartParams.key;
  // b. Register the uploaded chunks
  const registeredChunkData = await registerUploadedChunks(uploadid, targetid, filename);
  if (!registeredChunkData) {
    error = `Failed to register uploaded chunk data for file <${filename}>`;
    return { success, error,importId:null  };
  }
  // c. Finalize the completely uploaded file
  const finalizedData = await finalizeUploadedFile(uploadid, targetid, filename, assetName);
  if (!finalizedData) {
    error = `Failed to finalize uploaded file <${filename}>`;
    return { success, error,importId:null };
  }
  const importId = finalizedData && finalizedData.importId;
  // d. Poll the state of the finalized files
  const finishedProcessing = await pollFinalizedFiles(importId);
  if (!finishedProcessing) {
    error = `Failed to successfully process and poll finalized items for import ID <${importId}>`;
    return { success, error,importId:null  };
  }
  // e. Save as a new asset
  const saveAssetData = await saveNewAsset(importId, assetName, assetDescription,tags);
  if (!saveAssetData) {
    error = `Failed to successfully save the asset <${assetName}> for import ID <${importId}>`;
    return { success, error,importId:null };
  }
  success = true;
  return { success, error, importId };
}

exports.getUploadEndpoint = getUploadEndpoint;
exports.initializeUpload = initializeUpload;
exports.uploadAsset = uploadAsset;
