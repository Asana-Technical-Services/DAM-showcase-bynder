/* eslint-disable no-console */
/**
 * API for the AppComponent rule action form submit action.
 */
const handler = async (req, res) => {
// TODO: For now store the save file path in a text custom field on the task
  // Retrieve data and return if empty. Parse JSON otherwise
  const { data } = req.body;
  if (!data) {
    res.status(200).json({
      error: 'Missing data in request body',
    });
    return;
  }
  // TODO: Implement handling the save file path per project
  // that the rule is added. Consider either saving at the project
  // custom field level (requires being in a portfolio) or somewhere
  // else at the project level. This save file path needs to be set
  // per where this rule is configured per project.
  // This save file path most likely needs to be the Bynder instance specific
  // to the user's Bynder domain as well as the Bynder token.

  // let dataParsed;
  // try {
  //   dataParsed = JSON.parse(data);
  // } catch (error) {
  //   console.log(error);
  //   throw new Error(error);

  // Retrieve selected data from AppComponent Modal: save file path ID
  // const { values } = dataParsed;
  // const projectGid = dataParsed.project;
  // const saveFilePath = values && values.single_line_text_field_1;

  res.status(200).json({});
};
module.exports = handler;
