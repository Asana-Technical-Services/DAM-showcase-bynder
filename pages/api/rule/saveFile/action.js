/* eslint-disable no-console */
/**
 * API for the AppComponent triggered rule action.
 */
const axios = require('axios');
const constants = require('../../constants');
const asanaUtils = require('../../../../utils/asana');

const handler = async (req, res) => {
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

  // Get the task data to determine task type and fetch custom fields
  const asanaConfig = {
    headers: constants.asanaRequestHeaders,
  };
  const tasksResponse = await axios.get(`${constants.asanaApiUrl}/tasks/${targetObj}? \
    opt_fields=resource_subtype,custom_fields.name,custom_fields.display_value`, asanaConfig);
  const taskData = tasksResponse && tasksResponse.data && tasksResponse.data.data;
  const isApprovalTask = taskData && taskData.resource_subtype === 'approval';

  // Get the custom field value save path for the Bynder Asset URL
  const saveFilePath = asanaUtils.getCustomFieldValueByName(taskData, 'Bynder Asset URL');

  // Return if this isn't an approval task or the save file path is missing
  if (!isApprovalTask || !saveFilePath || saveFilePath.length <= 0) {
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
  // 1. Get the closest Amazon S3 upload endpoint
  const endpointResponse = await axios.get(`${constants.bynderApiUrl}/upload/endpoint`, bynderConfig);
  const endpointUrl = endpointResponse && endpointResponse.data;
  console.log(endpointUrl);

  // 2. Initialize the upload
  const assetName = asanaUtils.getCustomFieldValueByName(taskData, 'Bynder Asset Name');
  const formData = { filename: assetName };
  const initResponse = await axios.post(`${constants.bynderApiUrl}/upload/init`, formData, bynderConfig);
  const params = initResponse && initResponse.multipart_params;
  if (!params) {
    res.status(200).json({
      error: 'Failed to initialize upload to Amazon S3 endpoint',
    });
    return;
  }

  // 3. Upload the file in chunks and register every uploaded chunk
  //   a. Get the Asana task attachment and download url
  const attachmentGid = asanaUtils.getCustomFieldValueByName(taskData, 'Bynder Asset Attachment GID');
  const attachmentResponse = await axios.get(`${constants.asanaApiUrl}/attachments/${attachmentGid}`, asanaConfig);
  const attachmentData = attachmentResponse && attachmentResponse.data;
  if (!attachmentData) {
    res.status(200).json({
      error: 'No attachment data found',
    });
    return;
  }
  const { downloadUrl } = attachmentData;

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
  const uploadResponse = await axios.post(endpointUrl, appendedParams, bynderConfig);
  console.log(`Received upload response as: ${JSON.stringify(uploadResponse)}`);

  //   e. Register the uploaded chunks
  const uploadId = initResponse.s3file && initResponse.s3file.uploadid;
  const targetId = initResponse.s3file && initResponse.s3file.targetid;
  const chunkNumber = 1;
  const filename = params.key;
  const uploadParams = { targetId, chunkNumber, filename };
  const registerResponse = await axios.post(`${constants.bynderApiUrl}/v4/upload/${uploadId}`, uploadParams, bynderConfig);
  console.log(`Received register response as: ${JSON.stringify(registerResponse)}`);

  //   f. Finalize the completely uploaded file
  const finalizeParams = {
    targetId,
    s3_filename: filename,
    chunks: 1,
    original_filename: assetName,
  };
  const finalizeResponse = await axios.post(`${constants.bynderApiUrl}/v4/upload/${uploadId}`, finalizeParams, bynderConfig);
  console.log(`Received finalize response as: ${JSON.stringify(finalizeResponse)}`);

  //   g. Poll the state of the finalized files
  const importId = finalizeResponse.data && finalizeResponse.data.importId;
  // TODO: Implement loop to handle making requests
  // until itemsDone from the response matches items in query parameters
  const pollResponse = await axios.get(`${constants.bynderApiUrl}/v4/upload/poll?items=${importId}`);
  console.log(`Received poll response as: ${JSON.stringify(pollResponse)}`);

  //   h. Save as a new asset
  const assetDescription = asanaUtils.getCustomFieldValueByName(taskData, 'Bynder Asset Description');
  const saveParams = {
    brandId: 'EC8550AE-87AD-4700-B2E26D459F6933C4',
    name: assetName,
    description: assetDescription,
    tags: 'test-tag-1,test-tag-2', // TODO: Implement tag handling from Asana custom fields
  };
  const saveResponse = await axios.post(`${constants.bynderApiUrl}/v4/media/save/${importId}`, saveParams, bynderConfig);
  console.log(`Received save response as: ${JSON.stringify(saveResponse)}`);

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
