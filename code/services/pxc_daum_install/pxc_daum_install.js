/**
 * @typedef {{prefix: string, entity_id: string, component_id: string, mfe_settings: Record<string, unknown>}} InstallParams
 * @param {CbServer.BasicReq & {params: InstallParams}} req
 * @param {CbServer.Resp} resp
 */

//This service is called every time a component is created through the UI (added to an asset type).
//It can interacts with IPM/IA resources to create entities such as collection rows, publish messages to IA services, 
// add data to IA collections, etc.
function pxc_daum_install(req, resp) {
  const params = req.params;
  const mfe_settings = params.mfe_settings;

  console.debug(params);

  //component install behavior here. Initialize an instance of the component for use
  resp.success('Success');
}