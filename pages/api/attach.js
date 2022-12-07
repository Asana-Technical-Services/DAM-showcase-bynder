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
  const dataParsed = JSON.parse(data);
  const item = dataParsed && dataParsed.value;

  // Return resource
  const resource = {
    resource_name: item,
    resource_url: `https://dam-showcase.vercel.app/dam/asset/${item}`,
  };
  res.status(200).json(resource);
};

module.exports = handler;
