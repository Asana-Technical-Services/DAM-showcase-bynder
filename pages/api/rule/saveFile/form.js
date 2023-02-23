const constants = require('../../../../constants');

const handler = (req, res) => {
  res.status(200).json(
    {
      template: 'form_metadata_v0',
      title: 'Add Save File Action',
      metadata: {
        on_submit_callback: `${constants.vercelUrl}/api/rule/saveFile/submit`,
        fields: [
          {
            name: 'Save the attached Bynder asset to the Bynder workspace Assets folder.',
            type: 'static_text',
            id: 'static_text',
          },
        ],
      },
    },
  );
};

module.exports = handler;
