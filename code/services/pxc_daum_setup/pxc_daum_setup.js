/**
 * @typedef {{prefix: string, entity_id: string, component_id: string, mfe_settings: Record<string, unknown>}} InstallParams
 * @param {CbServer.BasicReq & {params: InstallParams}} req
 * @param {CbServer.Resp} resp
 */

//This service is called when a component is created through the UI (added to an asset type), and only called if 
//no other instances of that component exist yet in the system. It is called as a developer and creates new ClearBlade 
// resources if required. Most of the resources will be a part of the IPM itself, but you will need to use this in the event 
// you want to use secrets to create external dbs, bucket sets, etc., or to setup any other external entities.
function pxc_daum_setup(req, resp) {
  const params = req.params;

  console.debug(params);

  //component setup behavior here initialize any external databases, bucket sets, etc.
  resp.success('Success');
}