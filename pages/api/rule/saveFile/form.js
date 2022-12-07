const handler = (req, res) => {
  res.status(200).json(
    {
      template: 'form_metadata_v0',
      metadata: {
        on_submit_callback: 'https://dam-showcase.vercel.app/api/rule/saveFile/submit',
        fields: [
          {
            type: 'single_line_text',
            id: 'single_line_text_full_width',
            name: 'Folder',
            value: '',
            is_required: true,
            placeholder: 'Path where the file will be saved for review',
            width: 'full',
          },
        ],
      },
    },
  );
};

// module.exports = allowCors(handler)
module.exports = handler;
