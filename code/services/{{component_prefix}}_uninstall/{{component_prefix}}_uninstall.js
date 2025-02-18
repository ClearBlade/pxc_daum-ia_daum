/**
 * @typedef {{prefix: string, entity_id: string, component_id: string, mfe_settings: Record<string, unknown>}} InstallParams
 * @param {CbServer.BasicReq & {params: InstallParams}} req
 * @param {CbServer.Resp} resp
 */

function {{component_prefix}}_uninstall(req, resp) {
  const params = req.params;
  //component uninstall behavior here, undo any steps done in the install service
  resp.success('Success');
}