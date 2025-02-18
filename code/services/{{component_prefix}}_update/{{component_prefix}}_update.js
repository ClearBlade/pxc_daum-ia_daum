/**
 * @typedef {{prefix: string, entity_id: string, component_id: string, mfe_settings: Record<string, unknown>}} InstallParams
 * @param {CbServer.BasicReq & {params: InstallParams}} req
 * @param {CbServer.Resp} resp
 */

function {{component_prefix}}_update(req, resp) {
  const params = req.params;
  //component update behavior here. Allow the user to update an instance of the component
  resp.success('Success');
}