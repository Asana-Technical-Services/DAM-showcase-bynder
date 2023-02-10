const axios = require('axios');
const FormData = require('form-data');
const constants = require('constants');

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
  // const assetName = asanaUtils.getCustomFieldValueByName(taskData, 'Bynder Asset Name');
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
  console.log(`Received upload response as: ${JSON.stringify(response.data)}`);
  const responseData = response && response.data;
  return responseData;
}

async function registerUploadedChunks(uploadId, targetId, filename) {
  const chunkNumber = 1;
  const uploadParams = { chunkNumber, targetId, filename };
  const response = await axios.post(`${constants.bynderApiUrl}/v4/upload/${uploadId}`,
    getFormData(uploadParams),
    multipartConfig,
  );
  console.log(`Received register response as: ${JSON.stringify(response.data)}`);
  const responseData = response && response.data;
  return responseData;
}

async function finalizeUploadedFile(uploadId, targetId, filename, assetName) {
  const params = {
    targetId,
    s3_filename: filename,
    chunks: 1,
    original_filename: assetName,
  };
  const response = await axios.post(
    `${constants.bynderApiUrl}/v4/upload/${uploadId}`,
    getFormData(params),
    multipartConfig,
  );
  // TODO: Check that the response contains a success value of true
  console.log(`Received finalize response as: ${JSON.stringify(response.data)}`);
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
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, DELAY));
    timeoutThreshold += 200;
  }
  return finishedProcessing;
}

async function saveNewAsset(importId, assetName, description) {
  const params = {
    brandId: 'EC8550AE-87AD-4700-B2E26D459F6933C4',
    name: assetName,
    description,
    tags: 'test-tag-1,test-tag-2', // TODO: Implement tag handling from Asana custom fields
  };
  const response = await axios.post(
    `${constants.bynderApiUrl}/v4/media/save/${importId}`,
    getFormData(params),
    multipartConfig,
  );
  console.log(`Received save response as: ${JSON.stringify(response.data)}`);
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
) {
  let success = false;
  let error = '';

  // a. Call Bynder API to upload chunks
  const uploadedChunkData = uploadChunks(endpointUrl, multipartParams, imageData, assetName);
  if (!uploadedChunkData) {
    error = `Failed to upload chunk data to <${endpointUrl}>`;
    return { success, error };
  }
  const uploadId = initializedData.s3_file && initializedData.s3_file.uploadid;
  const targetId = initializedData.s3_file && initializedData.s3_file.targetid;
  const filename = multipartParams.key;
  // b. Register the uploaded chunks
  const registeredChunkData = registerUploadedChunks(uploadId, targetId, filename);
  if (!registeredChunkData) {
    error = `Failed to register uploaded chunk data for file <${filename}>`;
    return { success, error };
  }
  // c. Finalize the completely uploaded file
  const finalizedData = finalizeUploadedFile(uploadId, targetId, filename);
  if (!registeredChunkData) {
    error = `Failed to finalize uploaded file <${filename}>`;
    return { success, error };
  }
  const importId = finalizedData && finalizedData.importId;
  // d. Poll the state of the finalized files
  const finishedProcessing = pollFinalizedFiles(importId);
  if (!finishedProcessing) {
    error = `Failed to successfully process and poll finalized items for import ID <${importId}>`;
    return { success, error };
  }
  // e. Save as a new asset
  const saveAssetData = saveNewAsset(importId, assetName, assetDescription);
  if (!saveAssetData) {
    error = `Failed to successfully save the asset <${assetName}> for import ID <${importId}>`;
    return { success, error };
  }
  success = true;
  return { success, error };
}

exports.getUploadEndpoint = getUploadEndpoint;
exports.initializeUpload = initializeUpload;
exports.uploadAsset = uploadAsset;
