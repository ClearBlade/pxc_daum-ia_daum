/**
 * @typedef {{prefix: string, entity_id: string, component_id: string, mfe_settings: Record<string, unknown>}} InstallParams
 * @param {CbServer.BasicReq & {params: InstallParams}} req
 * @param {CbServer.Resp} resp
 */

//This service is called in the event a user updates an existing instance of a component through the UI. It interacts with IPM/IA 
// resources to update any entities such as collection rows, etc.
function pxc_daum_update(req, resp) {
  const params = req.params;

  console.debug(params);

  //component update behavior here. Allow the user to update an instance of the component
  resp.success('Success');
}