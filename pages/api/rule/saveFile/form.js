// const constants = require('../../../../constants');

const handler = (req, res) => {
  res.status(200).json(
    {
      template: 'form_metadata_v0',
      title: 'Add Save File Action',
      metadata: {
        on_submit_callback: 'https://dam-showcase-andrew-git-dam-showcase-update-andrew-asana.vercel.app/api/rule/saveFile/submit',
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
