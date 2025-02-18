/**
 * @typedef {{prefix: string, entity_id: string, component_id: string, mfe_settings: Record<string, unknown>}} InstallParams
 * @param {CbServer.BasicReq & {params: InstallParams}} req
 * @param {CbServer.Resp} resp
 */

function {{component_prefix}}_teardown(req, resp) {
  const params = req.params;
  //component teardown behavior here. Undo any setup done in the setup service
  resp.success('Success');
}