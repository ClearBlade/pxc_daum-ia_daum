/**
 * @typedef {{prefix: string, entity_id: string, component_id: string, mfe_settings: Record<string, unknown>}} InstallParams
 * @param {CbServer.BasicReq & {params: InstallParams}} req
 * @param {CbServer.Resp} resp
 */

function {{component_prefix}}_setup(req, resp) {
  const params = req.params;
  //component setup behavior here initialize any external databases, bucket sets, etc.
  resp.success('Success');
}