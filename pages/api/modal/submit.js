/* eslint-disable max-len */
/* eslint-disable no-console */
/**
 * API for the AppComponent modal form submit action.
 */
const axios = require('axios');
const constants = require('../constants');

const PROJECT_DAM_ASSETS_REVIEW = process.env.ASANA_PROJECT_DAM_ASSETS_REVIEW;
const PROJECT_DAM_ASSETS_REVIEW_CF_TEAM = process.env.ASANA_PROJECT_DAM_ASSETS_REVIEW_CF_TEAM;
const PROJECT_DAM_ASSETS_REVIEW_CF_NAME = process.env.ASANA_PROJECT_DAM_ASSETS_REVIEW_CF_NAME;
const PROJECT_DAM_ASSETS_REVIEW_CF_DESCRIPTION = process.env.ASANA_PROJECT_DAM_ASSETS_REVIEW_CF_DESCRIPTION;

const handler = async (req, res) => {
  // Retrieve data and return if empty. Parse JSON otherwise
  const { data } = req.body;
  if (!data) {
    res.status(200).json({
      error: 'Missing data in request body',
    });
    return;
  }
  const dataParsed = JSON.parse(data);

  // Retrieve selected data from AppComponent Modal: attachment ID, team ID
  const { values } = dataParsed;
  const attachmentId = values.dropdown_half_width_1;
  const teamId = values.dropdown_half_width_2;
  const name = values.single_line_text_full_width_1;
  const description = values.single_line_text_full_width_2;

  if (!attachmentId || !teamId) {
    res.status(200).json({
      error: 'No file or team ID',
    });
    return;
  }

  // Fetch attachment data from Asana for selected attachment ID
  const responseData = await axios.get(`${constants.asanaApiUrl}/attachments/${attachmentId}`, {
    headers: constants.asanaRequestHeaders,
  });

  const attachmentData = responseData && responseData.data && responseData.data.data;
  if (!attachmentData) {
    res.status(200).json({
      error: 'No attachment found',
    });
    return;
  }

  // Extract parent task
  const taskData = attachmentData && attachmentData.parent;
  const attachmentName = attachmentData && attachmentData.name;
  const isTask = taskData && taskData.resource_type === 'task';

  if (!isTask) {
    res.status(200).json({
      error: "Couldn't find the task",
    });
    return;
  }

  // Update task: set as approval task
  const asanaConfig = {
    headers: constants.asanaRequestHeaders,
  };
  await axios.put(`${constants.asanaApiUrl}/tasks/${taskData.gid}`, {
    data: {
      resource_subtype: 'approval',
    },
  }, asanaConfig).catch((error) => {
    console.log(error);
    throw new Error(error);
  });

  // Update task: add task to project "DAM Assets Review"
  await axios.post(`${constants.asanaApiUrl}/tasks/${taskData.gid}/addProject`, {
    data: {
      project: PROJECT_DAM_ASSETS_REVIEW,
    },
  }, asanaConfig).catch((error) => {
    console.log(error);
    throw new Error(error);
  });

  // Update task: fill team custom field
  const customFields = {};
  customFields[PROJECT_DAM_ASSETS_REVIEW_CF_TEAM] = teamId;
  customFields[PROJECT_DAM_ASSETS_REVIEW_CF_NAME] = name;
  customFields[PROJECT_DAM_ASSETS_REVIEW_CF_DESCRIPTION] = description;
  await axios.put(`${constants.asanaApiUrl}/tasks/${taskData.gid}`, {
    data: {
      custom_fields: customFields,
    },
  }, asanaConfig).catch((error) => {
    console.log(error);
    throw new Error(error);
  });

  // Return resource to App Component
  res.status(200).json({
    resource_name: attachmentName,
    resource_url: `https://app.asana.com/app/asana/-/get_asset?asset_id=${attachmentId}`,
  });
};

module.exports = handler;
