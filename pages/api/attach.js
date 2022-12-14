/* eslint-disable no-console */
/**
 * API for the AppComponent attachment function.
 * Returns an asset url for the desired asset ID.
 */
/**
 * TODO: if preferred, return final url provided by DAM for specific asset ID
 */
const handler = (req, res) => {
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

  console.log(dataParsed);

  const name = dataParsed && dataParsed.title;
  const mediaLink = dataParsed && dataParsed.value;

  // Return resource
  const resource = {
    resource_name: name,
    resource_url: mediaLink,
  };
  res.status(200).json(resource);
};

module.exports = handler;
