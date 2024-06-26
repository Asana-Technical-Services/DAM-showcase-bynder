/* eslint-disable import/no-import-module-exports */
/* eslint-disable no-console */
/**
 * API for the AppComponent widget function.
 * Returns the AppComponent metadata for a specific asset.
 */
import { filesize } from 'filesize';

const axios = require('axios');
const constants = require('../../constants');

async function handleBynderAsset(resourceUrl) {
  // Get the Bynder asset to access fields for resource metadata
  const idMatch = resourceUrl && resourceUrl.match(/.*mediaId=(.*)/);
  const id = (idMatch || [])[1];
  const assetLink = `${constants.bynderApiUrl}/v4/media/${id}`;
  const response = await axios.get(assetLink, {
    headers: constants.bynderRequestHeaders,
  });

  const assetData = response && response.data;
  if (!assetData) {
    return {
      error: `No asset data found for link: ${assetLink}`,
    };
  }

  const {
    name,
    description,
    dateModified,
    userCreated,
    isPublic,
    fileSize,
    width,
    height,
  } = assetData;

  const privacyColorText = isPublic ? 'blue' : 'red';
  const privacyText = isPublic ? 'Public' : 'Private';
  const fileSizeText = filesize(fileSize);
  const dimensionsText = `${width}x${height}`;

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
          name: 'Created By',
          type: 'text_with_icon',
          text: userCreated,
        },
        {
          name: 'File Size',
          type: 'text_with_icon',
          text: fileSizeText,
        },
        {
          name: 'Dimensions',
          type: 'text_with_icon',
          text: dimensionsText,
        },
      ],
    },
  };
  return metadata;
}

async function handleAsanaAttachment(resourceUrl) {
  // Get the Bynder asset to access fields for resource metadata
  const idMatch = resourceUrl && resourceUrl.match(/.*asset_id=(.*)/);
  const id = (idMatch || [])[1];
  const attachmentLink = `${constants.asanaApiUrl}/attachments/${id}`;
  const response = await axios.get(attachmentLink, {
    headers: constants.asanaRequestHeaders,
  });

  const attachmentData = response && response.data && response.data.data;
  if (!attachmentData) {
    return {
      error: `No attachment data found for link: ${attachmentLink}`,
    };
  }

  const { name } = attachmentData;
  const createdAt = attachmentData.created_at;

  const metadata = {
    template: 'summary_with_details_v0',
    metadata: {
      title: `Asana Attachment for Review <${name}>`,
      footer: {
        footer_type: 'custom_text',
        text: 'Asana Attachment',
      },
      fields: [
        {
          name: 'Created At',
          type: 'text_with_icon',
          text: createdAt,
        },
      ],
    },
  };
  return metadata;
}

const handler = async (req, res) => {
  const { query } = req;
  if (!query) {
    res.status(200).json({
      error: 'Missing data in request',
    });
    return;
  }

  const resourceUrl = query.resource_url;
  const isBynderAsset = resourceUrl && resourceUrl.includes('.bynder.com');
  const isAsanaAttachment = resourceUrl && resourceUrl.includes('app.asana.com');

  if (!isBynderAsset && !isAsanaAttachment) {
    res.status(200).json({
      error: `Missing asset link from resource <${resourceUrl}>`,
    });
    return;
  }

  let metadata;
  if (isBynderAsset) {
    metadata = await handleBynderAsset(resourceUrl);
  } else {
    metadata = await handleAsanaAttachment(resourceUrl);
  }
  res.status(200).json(metadata);
};

module.exports = handler;
