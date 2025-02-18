/**
 * @typedef {{prefix: string, entity_id: string, component_id: string, mfe_settings: Record<string, unknown>}} InstallParams
 * @param {CbServer.BasicReq & {params: InstallParams}} req
 * @param {CbServer.Resp} resp
 */

//This service is called if a component is deleted through the UI (removed from an asset type), and if after deletion 
// no other instances of that component would be present in the system. It is called as a developer and should 
// clean up anything that was created by the corresponding _setup call.
function pxc_daum_teardown(req, resp) {
  const params = req.params;

  console.debug(params);

  //component teardown behavior here. Undo any setup done in the setup service
  resp.success('Success');
}