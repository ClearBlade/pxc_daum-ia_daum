/**
 * Type: Micro Service
 * Description: A short-lived service which is expected to complete within a fixed period of time.
 * @param {CbServer.BasicReq} req
 * @param {string} req.systemKey
 * @param {string} req.systemSecret
 * @param {string} req.userEmail
 * @param {string} req.userid
 * @param {string} req.userToken
 * @param {boolean} req.isLogging
 * @param {[id: string]} req.params
 * @param {CbServer.Resp} resp
 */
function createOpcuaMap(req, resp) {
  const edge_id = req.params.edge_id;
  const mappings = req.params.mappings;

  const collection = ClearBladeAsync.Collection('tag_attribute_mapping');
  collection
    .upsert(
      { 
        "edge_id": edge_id, 
        "mappings": mappings
      }, 'edge_id')
    .then(function (data) {
      resp.success(data);
    })
    .catch(function (err) {
      resp.error(err.message)
    });
}
