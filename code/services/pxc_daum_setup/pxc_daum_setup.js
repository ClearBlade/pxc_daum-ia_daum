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

  function applyPermissionsToRole(roleId) {
      return ClearBladeAsync.Role(roleId).setPermissions([
        {
          "type": "service",
          "name": "checkEdgeDeviceStatus",
          "level": ClearBladeAsync.Permissions.READ
        },
        {
          "type": "service",
          "name": "createOpcuaMap",
          "level": ClearBladeAsync.Permissions.READ
        },
        {
          "type": "dashboard",
          "name": "opcua_mapper",
          "level": ClearBladeAsync.Permissions.READ
        }
      ])
  }

  //Add execute permissions to editor and administrator roles for checkEdgeDeviceStatus and createOpcuaMap
  //Add opcua portal permissions to editor and administrator roles
  ClearBladeAsync.Roles().read(ClearBladeAsync.Query().equalTo("name", "Administrator").or(ClearBladeAsync.Query().equalTo("name", "Editor")))
  .then(function(data) {
    return Promise.all(data
      .map(function (role) {
        console.debug("Applying permissions for role " + role.name);
        return applyPermissionsToRole(role.role_id);
      }));
  })
  .then(function (results) {
    console.debug(results);
    resp.success('Success');
  })
  .catch(function (error) {
    console.error("Error applying permissions to roles: " + JSON.stringify(error));
    resp.error("Error applying permissions to roles: " + JSON.stringify(error));
  });
}