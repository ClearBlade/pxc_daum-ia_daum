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

function opcua_manageOPCUAAdapter(req, resp) {
  var ADAPTER_PROCESS_NAME = "[o]pc-ua-go-adapter";
  
  var opcuaAdapter = ClearBladeAsync.Adapter('opcua');

  setInterval(function() {
    console.log("checking if adapter is running");
    var results = null;
    try {
      results = child_process.execSync("ps -aux | grep " + ADAPTER_PROCESS_NAME, {});
    } catch (e) {
      console.log(e);
      if (e.status === 1) {
        log("adapter process not found, starting it");
        startAdapter();
        return;
      } else {
        resp.error("unexpected error from pgrep:  " + JSON.stringify(e));
      }
    }
    console.log(results);
    console.log("adapter already running");
  }, 5000);
  

  var startAdapter = function() {
    opcuaAdapter.control('start', [ClearBlade.edgeId()]).then(function (results) {
      console.log("adapter started");
      resp.success
    }).catch(function (e) {
      resp.error("failed to start adapter: " + e.message);
    });
  }
}
