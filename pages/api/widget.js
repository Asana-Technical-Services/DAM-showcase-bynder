/* eslint-disable no-console */
/**
 * API for the AppComponent widget function.
 * Returns the AppComponent metadata for a specific asset.
 */

const axios = require('axios');
const prettyBytes = require('pretty-bytes');
const constants = require('./constants');

const handler = async (req, res) => {
  // TODO: validate input
  const { data } = req.body;
  if (!data) {
    res.status(200).json({});
    return;
  }
  // Retrieve item GID
  let dataParsed;
  try {
    dataParsed = JSON.parse(data);
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }

  // Get the Bynder asset to access fields for resource metadata
  const id = dataParsed && dataParsed.value;
  const responseData = await axios.get(`${constants.bynderApiUrl}/v4/media/${id}`, {
    headers: constants.bynderRequestHeaders,
  });

  if (!responseData) {
    res.status(200).json({
      error: 'No asset data found',
    });
    return;
  }

  const assetData = responseData && responseData.data;
  const name = assetData && assetData.name;
  const description = assetData && assetData.description;
  const dateModified = assetData && assetData.dateModified;
  const userCreated = assetData && assetData.userCreated;
  const isPublic = assetData && assetData.isPublic;
  const fileSize = assetData && assetData.fileSize;

  const privacyColorText = isPublic ? 'blue' : 'red';
  const privacyText = isPublic ? 'Public' : 'Private';
  const fileSizeText = prettyBytes.prettyBytes(fileSize);

  const metadata = {
    template: 'summary_with_details_v0',
    metadata: {
      title: `Bynder Asset <${name}>`,
      subtitle: description,
      footer: {
        footer_type: 'updated',
        last_updated_at: dateModified,
      },
      fields: [
        {
          name: 'Privacy',
          type: 'pill',
          text: privacyText,
          color: privacyColorText,
        },
        {
          name: 'File Size',
          type: 'text_with_icon',
          text: fileSizeText,
        },
        {
          name: 'Created By',
          type: 'text_with_icon',
          text: userCreated,
        },
        {
          name: 'Last Modified',
          type: dateModified,
          text: userCreated,
        },
      ],
    },
  };
  res.status(200).json(metadata);
};

module.exports = handler;
