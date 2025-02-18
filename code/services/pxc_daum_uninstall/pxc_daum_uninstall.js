/**
 * @typedef {{prefix: string, entity_id: string, component_id: string, mfe_settings: Record<string, unknown>}} InstallParams
 * @param {CbServer.BasicReq & {params: InstallParams}} req
 * @param {CbServer.Resp} resp
 */

//This service is called everytime an existing instance of a component is deleted through the UI (removed from an asset type). 
// It should delete any entities created by the corresponding _install call.
function pxc_daum_uninstall(req, resp) {
  const params = req.params;

  console.debug(params);

  //component uninstall behavior here, undo any steps done in the install service
  resp.success('Success');
}