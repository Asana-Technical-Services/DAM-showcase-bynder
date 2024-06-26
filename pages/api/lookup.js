/**
 * API for the AppComponent lookup/typeahead function.
 * Returns a set of assets from the DAM with  asset url for the desired task GID.
 */

const axios = require('axios');
const constants = require('../../constants');

async function convertAssetsToList(assets) {
  const assetsList = assets.reduce((result, currentValue) => {
    const iconUrl = currentValue.thumbnails && currentValue.thumbnails.mini;
    const { name, id } = currentValue;
    const data = {
      icon_url: iconUrl,
      title: name,
      value: id,
    };
    return result.concat(data);
  }, []);
  return assetsList;
}

/**
  * Call DAM API and retrieve assets that match the provided typeahead value
  */
const handler = async (req, res) => {
  const { query } = req;
  const lookupKey = query && query.query;

  // Retrieve the list of asset results based on the search query
  const lookupData = await axios.get(`${constants.bynderApiUrl}/v4/media?keyword=${lookupKey}`, {
    headers: constants.bynderRequestHeaders,
  });

  if (!lookupData) {
    res.status(200).json({
      error: 'No lookup data found',
    });
    return;
  }
  const assets = lookupData && lookupData.data;

  // Convert the Bynder assets list to the Asana items list
  const assetsList = await convertAssetsToList(assets);
  res.status(200).json({
    header: 'Choose one of the following assets:',
    items: assetsList,
  });
};

module.exports = handler;
