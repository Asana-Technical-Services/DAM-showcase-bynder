function getCustomFieldValueByName(taskData, customFieldName) {
  const customFields = taskData && taskData.custom_fields;
  const result = customFields.find((field) => field.name === customFieldName);
  return result.display_value;
}

function getCustomFieldValueByGid(taskData, customFieldGid) {
  const customFields = taskData && taskData.custom_fields;
  const result = customFields.find((field) => field.gid === customFieldGid);
  return result.display_value;
}

function getExternalAttachmentGid(attachmentData) {
  const result = attachmentData.find((attachment) => attachment.resource_subtype === 'external');
  return result.gid;
}

exports.getCustomFieldValueByGid = getCustomFieldValueByGid;
exports.getCustomFieldValueByName = getCustomFieldValueByName;
exports.getExternalAttachmentGid = getExternalAttachmentGid;
