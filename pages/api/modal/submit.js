/* eslint-disable no-console */
/**
 * API for the AppComponent modal form submit action.
 */
const axios = require('axios');
const constants = require('../constants');

const PROJECT_DAM_ASSETS_REVIEW = process.env.ASANA_PROJECT_DAM_ASSETS_REVIEW;
const PROJECT_DAM_ASSETS_REVIEW_CF_TEAM = process.env.ASANA_PROJECT_DAM_ASSETS_REVIEW_CF_TEAM;

const handler = async (req, res) => {
  // Retrieve data and return if empty. Parse JSON otherwise
  const { data } = req.body;
  if (!data) {
    res.status(200).json({
      error: 'No data',
    });
    return;
  }
  const dataParsed = JSON.parse(data);

  // Retrieve selected data from AppComponent Modal: attachment ID, team ID
  const { values } = dataParsed;
  const fileID = values.dropdown_half_width_1;
  const teamID = values.dropdown_half_width_2;
  if (!fileID || !teamID) {
    res.status(200).json({
      error: 'No file or team ID',
    });
    return;
  }

  // Fetch attachment data from Asana for selected attachment ID
  console.log(`Planning to make a request at: ${constants.asanaApiUrl}/attachments/${fileID}`);
  const attachmentData = await axios.get(`${constants.asanaApiUrl}/attachments/${fileID}`, {
    headers: constants.asanaRequestHeaders,
  });
  if (!attachmentData) {
    res.status(200).json({
      error: 'No attachment found',
    });
    return;
  }

  console.log(`Got attachment data as: ${attachmentData}`);

  // Extract parent task
  const taskData = attachmentData.data && attachmentData.data.parent;

  if (taskData && taskData.resource_type === 'task') {
    // Update task: set as approval task
    await axios.put(`${constants.asanaApiUrl}/tasks/${taskData.gid}`, {
      data: {
        resource_subtype: 'approval',
      },
    }, {
      headers: constants.asanaRequestHeaders,
    });
    // Update task: add task to project "DAM Assets Review"
    await axios.post(`${constants.asanaApiUrl}/tasks/${taskData.gid}/addProject`, {
      data: {
        project: PROJECT_DAM_ASSETS_REVIEW,
      },
    }, {
      headers: constants.asanaRequestHeaders,
    }).catch((err) => {
      console.log(err);
    });
    // Update task: fill team custom field
    const customFields = {};
    customFields[PROJECT_DAM_ASSETS_REVIEW_CF_TEAM] = teamID;
    await axios.put(`${constants.asanaApiUrl}/tasks/${taskData.gid}`, {
      data: {
        custom_fields: customFields,
      },
    }, {
      headers: constants.asanaRequestHeaders,
    });
    // Return resource to App Component
    res.status(200).json({
      resource_name: '1236',
      resource_url: `${constants.vercelUrl}/dam/asset/1236`,
    });
  } else {
    res.status(200).json({
      error: "Couldn't find the task",
    });
  }
};

module.exports = handler;
