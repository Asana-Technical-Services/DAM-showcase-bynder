/* eslint-disable no-console */
/**
 * API for the AppComponent attachment function.
 * Returns an asset url for the desired asset ID.
 */

const axios = require('axios');
const constants = require('./constants');

const handler = async (req, res) => {
  // Check body and return if empty
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

  // Get the Bynder id to generate the asset media link
  const id = dataParsed && dataParsed.value;
  const response = await axios.get(`${constants.bynderApiUrl}/v4/media/${id}`, {
    headers: constants.bynderRequestHeaders,
  });

  if (!response) {
    res.status(200).json({
      error: 'No asset data found',
    });
    return;
  }
  const name = response.data && response.data.name;
  const mediaLink = `https://asanasandbox2.bynder.com/media?mediaId=${id}`;

  // Return resource to App Component
  const resource = {
    resource_name: name,
    resource_url: mediaLink,
  };
  res.status(200).json(resource);
};

module.exports = handler;
