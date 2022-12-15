/* eslint-disable import/no-import-module-exports */
/* eslint-disable no-console */
/**
 * API for the AppComponent widget function.
 * Returns the AppComponent metadata for a specific asset.
 */
import { filesize } from 'filesize';

const axios = require('axios');
const constants = require('./constants');

const handler = async (req, res) => {
  // TODO: validate input
  const { query } = req;
  if (!query) {
    res.status(200).json({
      error: 'Missing data in request',
    });
    return;
  }

  // Get the Bynder asset to access fields for resource metadata
  const idMatch = query.resource_url && query.resource_url.match(/.*mediaId=(.*)/);
  const id = (idMatch || [])[1];
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
  const fileSizeText = filesize(fileSize);

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
