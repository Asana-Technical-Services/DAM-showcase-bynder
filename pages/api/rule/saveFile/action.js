/* eslint-disable no-console */
/**
 * API for the AppComponent triggered rule action.
 */
const axios = require('axios');
const constants = require('../../../../constants');
const asanaUtils = require('../../../../utils/asana');
const bynder = require('../../../../bynder');

const handler = async (req, res) => {
  const { data } = req.body;
  console.log(data)
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
  const tasksResponse = await axios.get(`${constants.asanaApiUrl}/tasks/${targetObj}?opt_fields=resource_subtype,custom_fields.name,custom_fields.display_value`, asanaConfig);
  const taskData = tasksResponse && tasksResponse.data && tasksResponse.data.data;
  const isApprovalTask = taskData && taskData.resource_subtype === 'approval';
  const assetName = asanaUtils.getCustomFieldValueByName(taskData, 'Bynder Asset Name');
  const attachmentGid = asanaUtils.getCustomFieldValueByName(taskData, 'Bynder Asset Attachment GID');
  const tags = taskData && taskData.custom_fields.filter(cf=>!!cf.display_value&&cf.display_value!="").map(cf =>cf.display_value).join(",");

  // Return if this isn't an approval task
  if (!assetName || !attachmentGid) {
    res.status(200).json({
      error: 'Missing correct task data for save file',
    });
    return;
  }

  /**
   * Bynder File upload process
   */
  // 1. Get the closest Amazon S3 upload endpoint
  const endpointUrl = await bynder.getUploadEndpoint();

  // 2. Initialize the upload
  const initializedData = await bynder.initializeUpload(assetName);
  if (!initializedData || !initializedData.multipart_params) {
    res.status(200).json({
      error: 'Failed to initialize upload to Amazon S3 endpoint',
    });
    return;
  }
  // 3. Upload the file in chunks and register every uploaded chunk
  //   a. Get the Asana task attachment and download url
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
  const imageData = imageResponse && imageResponse.data;

  //   c. Upload the asset
  const assetDescription = asanaUtils.getCustomFieldValueByName(taskData, 'Bynder Asset Description');
  const { success, error,importId } = await bynder.uploadAsset(
    endpointUrl,
    initializedData,
    initializedData.multipart_params,
    imageData,
    assetName,
    assetDescription,
    tags
  );
  if (!success) {
    res.status(200).json({ error });
    return;
  }

  res.status(200).json({
    action_result: 'ok',
    resources_created: [
      {
        resource_name: assetName,
        resource_url: "https://asanasandbox2.bynder.com/media/?mediaId="+String(importId),
      },
    ],
  });
};

module.exports = handler;