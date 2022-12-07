/**
 * API for the AppComponent lookup/typeahead function.
 * Returns a set of assets from the DAM with  asset url for the desired task GID.
 */
/**
 * TODO: so far this API returns two static files.
 * Call DAM API and retrieve assets that match the provided typeahead value
 */
const handler = (req, res) => {
  res.status(200).json(
    {
      header: 'Found the following assets',
      items: [
        {
          icon_url: 'https://www.freeiconspng.com/thumbs/ppt-icon/powerpoint-2013-icon-image-3.png',
          subtitle: 'Templates',
          title: 'Presentation Template - Sales',
          value: '1234',
        },
        {
          icon_url: 'https://www.freeiconspng.com/thumbs/ppt-icon/powerpoint-2013-icon-image-3.png',
          subtitle: 'Templates',
          title: 'Presentation Template - Marketing',
          value: '1235',
        },
      ],
    },
  );
};

module.exports = handler;
