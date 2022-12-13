/**
 * API for the AppComponent widget function.
 * Returns the AppComponent metadata for a specific asset.
 */

// Dummy dictionary for Widget metadata: approval, privacy status
const widgetComponents = {
  public: {
    name: 'Privacy',
    type: 'pill',
    text: 'Public',
    color: 'blue',
  },
  private: {
    name: 'Privacy',
    type: 'pill',
    text: 'Private',
    color: 'red',
  },
  notApproved: {
    name: 'Status',
    type: 'pill',
    text: 'Not Yet Approved',
    color: 'yellow',
  },
  approvalInProcess: {
    name: 'Status',
    type: 'pill',
    text: 'Approval In Process',
    color: 'purple',
  },
  approved: {
    name: 'Status',
    type: 'pill',
    text: 'Approved',
    color: 'green',
  },
};

const handler = (req, res) => {
  // TODO: validate input
  // TODO: this function returns 3 possible static files depending on input.
  // Should retrieve metadata from DAM

  let metadata = {};
  if (req.query.resource_url === 'https://dam-showcase-andrew-git-dam-showcase-update-andrew-asana.vercel.app/dam/asset/1234') {
    metadata = {
      template: 'summary_with_details_v0',
      metadata: {
        title: 'Presentation Template - Sales',
        subtitle: 'PowerPoint template for customer facing sales decks',
        subicon_url: 'https://www.freeiconspng.com/thumbs/ppt-icon/powerpoint-2013-icon-image-3.png',
        footer: {
          footer_type: 'updated',
          last_updated_at: '2012-10-28T02:06:58.147Z',
        },
        comment_count: 12,
        fields: [
          widgetComponents.public,
          widgetComponents.approved,
          {
            name: 'Latest Version',
            type: 'text_with_icon',
            text: '2022-09',
          },
          {
            name: 'Contact',
            type: 'text_with_icon',
            text: 'John Doe',
            icon_url: 'https://pbs.twimg.com/profile_images/1420161096569135107/KHdJ76A__400x400.jpg',
          },
        ],
      },
    };
  } else if (req.query.resource_url === 'https://dam-showcase-andrew-git-dam-showcase-update-andrew-asana.vercel.app/dam/asset/1235') {
    metadata = {
      template: 'summary_with_details_v0',
      metadata: {
        title: 'Presentation Template - Marketing',
        subtitle: 'PowerPoint template for customer marketing decks',
        subicon_url: 'https://www.freeiconspng.com/thumbs/ppt-icon/powerpoint-2013-icon-image-3.png',
        footer: {
          footer_type: 'updated',
          last_updated_at: '2012-10-28T02:06:58.147Z',
        },
        comment_count: 12,
        fields: [
          widgetComponents.public,
          widgetComponents.notApproved,
          {
            name: 'Latest Version',
            type: 'text_with_icon',
            text: '2022-10',
          },
          {
            name: 'Contact',
            type: 'text_with_icon',
            text: 'John Doe',
            icon_url: 'https://pbs.twimg.com/profile_images/1420161096569135107/KHdJ76A__400x400.jpg',
          },
        ],
      },
    };
  } else {
    metadata = {
      template: 'summary_with_details_v0',
      metadata: {
        title: 'Text File For Review',
        subtitle: 'Draft of text for approval',
        subicon_url: 'https://static.thenounproject.com/png/115686-200.png',
        footer: {
          footer_type: 'updated',
          last_updated_at: '2012-10-29T02:06:58.147Z',
        },
        comment_count: 3,
        fields: [
          widgetComponents.private,
          widgetComponents.approvalInProcess,
          {
            name: 'Latest Version',
            type: 'text_with_icon',
            text: '2022-10',
          },
          {
            name: 'Contact',
            type: 'text_with_icon',
            text: 'John Doe',
            icon_url: 'https://pbs.twimg.com/profile_images/1420161096569135107/KHdJ76A__400x400.jpg',
          },
        ],
      },
    };
  }

  res.status(200).json(metadata);
};

module.exports = handler;
