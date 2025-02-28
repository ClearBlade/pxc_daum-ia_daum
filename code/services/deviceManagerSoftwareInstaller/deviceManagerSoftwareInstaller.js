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

function deviceManagerSoftwareInstaller(req, resp) {

  function retrieveScheduledUpdates() {
    return ClearBladeAsync.Collection('device_software_installed').fetch(
      ClearBladeAsync.Query().equalTo('status', "pending").lessThan('installation_date', new Date().toISOString()));
  }

  function retrieveFileVersionRow(softwareName, version) {
    return ClearBladeAsync.Collection('device_software_versions').fetch(
      ClearBladeAsync.Query().equalTo('name', softwareName).equalTo('version', version));
  }

  function handleScheduledUpdate() {

  }

  function installSoftwareOnEdge(assetId, softwareName, version) {
    //Copy file from sandbox to outbox --> This method will need custom sync
    // or
    //Read file from bucket and Publish file contents on message relay
    //
  }

  function performSoftwareInstall(asset, payload, fileRow) {
    return Promise.resolve();
  }

  function scheduleSoftwareInstall(assetId, payload) {
    var id = newUUID();
    var now = new Date().toISOString();
    //Create row in device_software_installed
    //Create row in device_software_install_status
    return Promise.all([
      ClearBladeAsync.Collection('device_software_installed').create({
        "id": id,
        "install_request_date": now,
        "installation_date": payload.install_timestamp,
        "user_id": payload.userId,
        "asset_id": assetId,
        "software_descriptor": payload.softwareName,
        "version": payload.version,
        "status": "pending"
      }),

      ClearBladeAsync.Collection('device_software_install_status').create({
        "id": id,
        "timestamp": now,
        "status": "pending",
        "description": "Installation has been scheduled for " + payload.install_timestamp
      })
    ]);
  }

  function handleMessageTrigger(payload) {
    // {
    //   "softwareName": "Firmware",
    //   "version": "1.0.1",
    //   "install_timestamp": "2025-02-28T17:25:00.000Z",
    //   "userId": "test@test.com",
    //   "assets": [
    //     "sim2",
    //     "sim1"
    //   ]
    // }
    
    //A message was published from the portal. Determine whether or not to send to the edge now or schedule the update
    if (payload.install_timestamp) {
      var now = new Date().getTime();

      //Retrieve the software version file details
      console.debug("Retrieving file version row");
      retrieveFileVersionRow(payload.softwareName, payload.version)
      .then(function(fileVersionRows) { 
        console.debug("File version rows");
        console.debug(fileVersionRows);

        console.log("payload.install_timestamp: " + payload.install_timestamp);
        console.log("payload.install_timestamp.getTime(): " + new Date(payload.install_timestamp).getTime());
        console.log("now: " + now);

        if ((new Date(payload.install_timestamp).getTime()) > now) {
          //Schedule the install for the future
          console.debug("Scheduling software installs");
          return Promise.all(payload.assets.map(function(asset) {
            scheduleSoftwareInstall(asset, payload);
          }));
        } else {
          //Install on the devices now
          console.debug("Sending install to edges");
          return Promise.all(payload.assets.map(function(asset) {
              performSoftwareInstall(asset, payload, fileVersionRows[0] );
          }));
        }
      })
      .then(function() {
        resp.success("Messaging trigger processed");
      })
      .catch(function(error) {
        console.error("Error handling message trigger: " + JSON.stringify(error));
        resp.error(JSON.stringify(error));
      });
    }
  }

  function handleTimer() {
    //The timer expired, see if there are any installs that are ready to be scheduled
    //console.debug("Processing scheduled installs");
    retrieveScheduledUpdates()
    .then(function(rows) {
      console.debug("Scheduled updates to perform");
      console.debug(rows);

      return Promise.resolve();

      // return Promise.all(rows.map(function(row) {
      //   handleScheduledUpdate(row);
      // }))
    })
    .then(function(results){
      resp.success("Timer processed");
    })
    .catch(function(error){
      resp.error("Error encountered processing scheduled updates");
    })
  }

  if (req.params.trigger) {
    if (req.params.topic && req.params.body) {
      handleMessageTrigger(JSON.parse(req.params.body));
    } else {
      handleTimer();
    }
  }
}
