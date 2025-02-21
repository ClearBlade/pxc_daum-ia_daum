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

  function removePermissionsFromRole(roleId) {
    return ClearBladeAsync.Role(roleId).setPermissions([
      {
        "type": "service",
        "name": "checkEdgeDeviceStatus",
        "level": 0
      },
      {
        "type": "service",
        "name": "createOpcuaMap",
        "level": 0
      },
      {
        "type": "dashboard",
        "name": "opcua_mapper",
        "level": 0
      }
    ])
}

  //Remove execute permissions from editor and administrator roles for checkEdgeDeviceStatus and createOpcuaMap
  //Remove opcua portal permissions from editor and administrator roles
  ClearBladeAsync.Roles().read(ClearBladeAsync.Query().equalTo("name", "Administrator").or(ClearBladeAsync.Query().equalTo("name", "Editor")))
  .then(function(data) {
    return Promise.all(data
      .map(function (role) {
        console.debug("Applying permissions for role " + role.name);
        return removePermissionsFromRole(role.role_id);
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