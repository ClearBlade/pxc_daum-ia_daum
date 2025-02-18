/**
 * @typedef {{prefix: string, entity_id: string, component_id: string, mfe_settings: Record<string, unknown>}} InstallParams
 * @param {CbServer.BasicReq & {params: InstallParams}} req
 * @param {CbServer.Resp} resp
 */

function {{component_prefix}}_install(req, resp) {
  const params = req.params;
  const mfe_settings = params.mfe_settings;
  //component install behavior here. Initialize an instance of the component for use
  resp.success('Success');
}