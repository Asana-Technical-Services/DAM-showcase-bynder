/* eslint-disable no-console */
/**
 * API for the AppComponent rule action form submit action.
 */
const axios = require('axios');
const constants = require('../../constants');

const PROJECT_DAM_ASSETS_REVIEW_CF_PATH = process.env.ASANA_PROJECT_DAM_ASSETS_REVIEW_CF_PATH;

const handler = async (req, res) => {
// TODO: For now store the save file path in a text custom field on the task
  // Retrieve data and return if empty. Parse JSON otherwise
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

  // Retrieve selected data from AppComponent Modal: save file path ID
  const { values } = dataParsed;
  const projectGid = dataParsed.project;
  const saveFilePath = values && values.single_line_text_field_1;

  // TODO: Implement handling the save file path per project
  // that the rule is added. Consider either saving at the project
  // custom field level (requires being in a portfolio) or somewhere
  // else at the project level. This save file path needs to be set
  // per where this rule is configured per project.
  // This save file path most likely needs to be the Bynder instance specific
  // to the user's Bynder domain as well as the Bynder token.

  // // Get the task data to determine task type
  // const asanaConfig = {
  //   headers: constants.asanaRequestHeaders,
  // };
  // const response = await axios.get(`${constants.asanaApiUrl}/tasks/${taskGid}`, asanaConfig);
  // const taskData = response && response.data && response.data.data;
  // const isApprovalTask = taskData && taskData.resource_subtype === 'approval';

  // // Return if this isn't an approval task or the save file path is missing
  // if (!isApprovalTask || !saveFilePath || saveFilePath.length <= 0) {
  //   res.status(200).json({
  //     error: 'Missing correct task data for save file',
  //   });
  //   return;
  // }

  // // Update the trigger task's Bynder Asset URL custom field
  // const customFields = {};
  // customFields[PROJECT_DAM_ASSETS_REVIEW_CF_PATH] = saveFilePath;
  // await axios.put(`${constants.asanaApiUrl}/tasks/${taskGid}`, {
  //   data: {
  //     custom_fields: customFields,
  //   },
  // }, asanaConfig).catch((error) => {
  //   console.log(error);
  //   throw new Error(error);
  // });

  res.status(200).json({});
};
module.exports = handler;
