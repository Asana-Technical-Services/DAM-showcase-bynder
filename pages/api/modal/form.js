/* eslint-disable no-console */
/* eslint-disable max-len */
/**
 * API for the AppComponent modal form dropdown field.
 * Retrieves the existing attachments for the Asana Task
 */
const axios = require('axios');
const constants = require('../../../constants');

const PROJECT_DAM_ASSETS_REVIEW_CF_TEAM_MARKETING = process.env.ASANA_PROJECT_DAM_ASSETS_REVIEW_CF_TEAM_MARKETING;
const PROJECT_DAM_ASSETS_REVIEW_CF_TEAM_SALES = process.env.ASANA_PROJECT_DAM_ASSETS_REVIEW_CF_TEAM_SALES;
const PROJECT_DAM_ASSETS_REVIEW_CF_TEAM_DESIGN = process.env.ASANA_PROJECT_DAM_ASSETS_REVIEW_CF_TEAM_DESIGN;

async function getAttachmentsForTask(taskGid) {
  const taskResult = await axios.get(`${constants.asanaApiUrl}/attachments`, {
    params: {
      parent: taskGid,
    },
    headers: constants.asanaRequestHeaders,
  });
  const attachments = taskResult && taskResult.data;

  // Retrieve file id and title
  const files = [];
  attachments.data.forEach((file) => {
    files.push({
      id: file.gid,
      label: file.name,
    });
  });

  return files;
}

const handler = async (req, res) => {
  // Check query and return if task GID not found
  const { query } = req;
  const taskID = query.task;
  if (!taskID) {
    res.status(200).json({
      // "error": "No resource matched that input",
    });
    return;
  }

  // Get available attachments for the desired task
  const files = await getAttachmentsForTask(taskID).catch((error) => {
    console.log(error);
    throw new Error(error);
  });

  // Create AppComponent form metadata
  const form = {
    template: 'form_metadata_v0',
    metadata: {
      title: 'Review new file',
      on_submit_callback: 'https://dam-showcase-andrew-git-dam-showcase-update-andrew-asana.vercel.app/api/modal/submit',
      submit_button_text: 'Submit',
      fields: [
        {
          type: 'single_line_text',
          id: 'single_line_text_full_width_1',
          name: 'File name',
          value: '',
          is_required: true,
          placeholder: '',
          width: 'full',
        },
        {
          type: 'single_line_text',
          id: 'single_line_text_full_width_2',
          name: 'File description',
          value: '',
          is_required: true,
          placeholder: 'Enter a short but effective description for the asset',
          width: 'full',
        },
        {
          type: 'dropdown',
          id: 'dropdown_half_width_1',
          name: 'Select a file',
          is_required: true,
          options: files,
          width: 'half',
        },
        {
          type: 'dropdown',
          id: 'dropdown_half_width_2',
          name: 'Team for review',
          is_required: true,
          // TODO: Implement dynamic pull of teams for custom field
          options: [
            {
              id: PROJECT_DAM_ASSETS_REVIEW_CF_TEAM_MARKETING,
              label: 'Marketing',
            },
            {
              id: PROJECT_DAM_ASSETS_REVIEW_CF_TEAM_SALES,
              label: 'Sales',
            },
            {
              id: PROJECT_DAM_ASSETS_REVIEW_CF_TEAM_DESIGN,
              label: 'Design',
            },
          ],
          width: 'half',
        },
      ],
    },
  };

  res.status(200).json(form);
};

module.exports = handler;
