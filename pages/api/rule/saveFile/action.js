/* eslint-disable no-console */
/**
 * API for the AppComponent triggered rule action.
 */
const axios = require('axios');
const FormData = require('form-data');
const constants = require('../../constants');
const asanaUtils = require('../../../../utils/asana');

// Helper function to convert javascript objects to form data for axios requests
function getFormData(object) {
  return Object.keys(object).reduce((formData, key) => {
    formData.append(key, object[key]);
    return formData;
  }, new FormData());
}

const handler = async (req, res) => {
  console.log('[DEBUG] Running handler for action route.');
  const { data } = req.body;
  if (!data) {
    res.status(200).json({
      error: 'Missing data in request body',
    });
    return;
  }

  let dataParsed;
  try {
    dataParsed = JSON.parse(data);
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }

  const targetObj = dataParsed.target_object;
  console.log(`[DEBUG] Got target object for trigger as: ${targetObj}`);

  // Get the task data to determine task type and fetch custom fields
  const asanaConfig = {
    headers: constants.asanaRequestHeaders,
  };
  const tasksResponse = await axios.get(`${constants.asanaApiUrl}/tasks/${targetObj}? \
    opt_fields=resource_subtype,custom_fields.name,custom_fields.display_value`, asanaConfig);
  const taskData = tasksResponse && tasksResponse.data && tasksResponse.data.data;
  const isApprovalTask = taskData && taskData.resource_subtype === 'approval';

  // Get the custom field value save path for the Bynder Asset URL
  // const saveFilePath = asanaUtils.getCustomFieldValueByName(taskData, 'Bynder Asset URL');

  // Return if this isn't an approval task or the save file path is missing
  // if (!isApprovalTask || !saveFilePath || saveFilePath.length <= 0) {
  if (!isApprovalTask) {
    res.status(200).json({
      error: 'Missing correct task data for save file',
    });
    return;
  }

  /**
   * Bynder File upload process
   */
  // TODO: Add these steps into a separate module
  const bynderConfig = {
    headers: constants.bynderRequestHeaders,
  };
  const newFormData = new FormData();
  const appendedHeaders = Object.assign(
    constants.bynderMultiPartRequestHeaders,
    newFormData.getHeaders(),
  );
  const bynderMultiPartConfig = {
    headers: appendedHeaders,
  };

  // 1. Get the closest Amazon S3 upload endpoint
  const endpointResponse = await axios.get(`${constants.bynderApiUrl}/upload/endpoint`, bynderConfig);
  const endpointUrl = endpointResponse && endpointResponse.data;
  console.log(`[DEBUG] Got endpoint url as: ${endpointUrl}`);

  // 2. Initialize the upload
  const assetName = asanaUtils.getCustomFieldValueByName(taskData, 'Bynder Asset Name');
  const formData = getFormData({ filename: assetName });
  const initResponse = await axios.post(`${constants.bynderApiUrl}/upload/init`, formData, bynderMultiPartConfig);
  const params = initResponse && initResponse.data && initResponse.data.multipart_params;
  console.log(`[DEBUG] Got params as: ${JSON.stringify(params)}`);

  if (!params) {
    res.status(200).json({
      error: 'Failed to initialize upload to Amazon S3 endpoint',
    });
    return;
  }

  // 3. Upload the file in chunks and register every uploaded chunk
  //   a. Get the Asana task attachment and download url
  const attachmentGid = asanaUtils.getCustomFieldValueByName(taskData, 'Bynder Asset Attachment GID');
  // TODO: Handle if attachment gid is missing

  const attachmentResponse = await axios.get(`${constants.asanaApiUrl}/attachments/${attachmentGid}`, asanaConfig);
  const attachmentData = attachmentResponse
    && attachmentResponse.data
    && attachmentResponse.data.data;
  if (!attachmentData) {
    res.status(200).json({
      error: 'No attachment data found',
    });
    return;
  }
  const downloadUrl = attachmentData.download_url;

  //   b. Download the file using Axios
  const imageResponse = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
  // const fileSize = imageResponse
  // && imageResponse.headers && imageResponse.headers['content-length'];
  const imageData = imageResponse && imageResponse.data;

  //   c. TODO: Separate file into buffer and separate into chunks if > 5MB
  //      File sizes larger than 5GB need to be chunked

  //   d. Call Bynder API to upload chunks
  const appendedParams = params;
  appendedParams.name = assetName;
  appendedParams.chunk = 1;
  appendedParams.chunks = 1;
  appendedParams.Filename = params.key;
  appendedParams.file = imageData;
  const appendedParamsFormData = getFormData(appendedParams);
  const uploadResponse = await axios.post(endpointUrl, appendedParamsFormData, {
    headers: {
      'content-length': appendedParamsFormData.getLengthSync(),
    },
  });
  console.log(`Received upload response as: ${JSON.stringify(uploadResponse.data)}`);

  //   e. Register the uploaded chunks
  const uploadId = initResponse.data.s3file && initResponse.data.s3file.uploadid;
  const targetid = initResponse.data.s3file && initResponse.data.s3file.targetid;
  const chunkNumber = 1;
  const filename = params.key;
  const uploadParams = { chunkNumber, targetid, filename };
  const registerResponse = await axios.post(
    `${constants.bynderApiUrl}/v4/upload/${uploadId}`,
    getFormData(uploadParams),
    bynderMultiPartConfig,
  );
  console.log(`Received register response as: ${JSON.stringify(registerResponse.data)}`);

  //   f. Finalize the completely uploaded file
  const finalizeParams = {
    targetid,
    s3_filename: filename,
    chunks: 1,
    original_filename: assetName,
  };
  const finalizeResponse = await axios.post(
    `${constants.bynderApiUrl}/v4/upload/${uploadId}`,
    getFormData(finalizeParams),
    bynderMultiPartConfig,
  );
  // TODO: Check that the response contains a success value of true
  console.log(`Received finalize response as: ${JSON.stringify(finalizeResponse.data)}`);

  //   g. Poll the state of the finalized files
  const importId = finalizeResponse.data && finalizeResponse.data.importId;
  console.log(`Received importId as: ${importId}`);

  // TODO: Implement loop to handle making requests
  // until itemsDone from the response matches items in query parameters
  // const pollResponse = await axios.get(`${constants.bynderApiUrl}/v4/upload/poll?items=${importId}`, bynderConfig);

  // const pollResponse = await fetch('https://asanasandbox2.bynder.com/api/v4/upload/poll?items=' + importId, {
  //   method: 'GET',
  //   headers: {
  //     Authorization: constants.bynderRequestHeaders.Authorization,
  //   },
  // });
  async function pollItems() {
    const config = {
      headers: {
        Authorization: constants.bynderRequestHeaders.Authorization,
      },
      params: { items: importId },
    };
    const pollResponse = await axios.get(`${constants.bynderApiUrl}/v4/upload/poll/`, config);
    console.log(`Received poll response as: ${JSON.stringify(pollResponse.data)}`);
    return pollResponse;
  }
  let finishedProcessing = false;
  let pollResponse;
  (async () => {
    while (!finishedProcessing) {
      pollResponse = await pollItems();
      finishedProcessing = pollResponse.itemsFailed
      || pollResponse.itemsRejected
      || pollResponse.itemsDone;
      await new Promise(r => setTimeout(r, 500));
    }
  })();
  console.log(`Finished poll processing, current data is: ${pollResponse}`);
  return;
  //   h. Save as a new asset
  const assetDescription = asanaUtils.getCustomFieldValueByName(taskData, 'Bynder Asset Description');
  const saveParams = {
    brandId: 'EC8550AE-87AD-4700-B2E26D459F6933C4',
    name: assetName,
    description: assetDescription,
    tags: 'test-tag-1,test-tag-2', // TODO: Implement tag handling from Asana custom fields
  };
  const saveResponse = await axios.post(
    `${constants.bynderApiUrl}/v4/media/save/${importId}`,
    getFormData(saveParams),
    bynderMultiPartConfig,
  );
  console.log(`Received save response as: ${JSON.stringify(saveResponse.data)}`);

  res.status(200).json({
    action_result: 'ok',
    error: 'That resource no longer exists',
    resources_created: [
      {
        error: 'No resource matched that input',
        resource_name: 'Build the Thing',
        resource_url: 'https://example.atlassian.net/browse/CP-1',
      },
    ],
  });
};
module.exports = handler;
