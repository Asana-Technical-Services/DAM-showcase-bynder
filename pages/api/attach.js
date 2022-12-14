/* eslint-disable no-console */
/**
 * API for the AppComponent attachment function.
 * Returns an asset url for the desired asset ID.
 */

const axios = require('axios');
const constants = require('./constants');

/**
 * TODO: if preferred, return final url provided by DAM for specific asset ID
 */
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

  // Get the Bynder idHash to generate the asset media link
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
  const idHash = assetData && assetData.idHash;
  const name = assetData && assetData.name;
  const mediaLink = `https://asanasandbox2.bynder.com/l/${idHash}`;

  // Return resource
  const resource = {
    resource_name: name,
    resource_url: mediaLink,
  };
  res.status(200).json(resource);
};

module.exports = handler;
