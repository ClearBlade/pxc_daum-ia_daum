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

function opcua_readOPCUATags(req, resp) {
  const client = new MQTT.Client();
  const readBatchSize = 50;
  var existingTags = [];
  var intervalIDs = [];

  const TRIGGER_TOPIC = '$share/readOPCUATags/$trigger/data/+';

  function adapter_configPoll() {
    try {
      const database = ClearBladeAsync.Database();
      var edgeId = ClearBlade.edgeId();
      const rawQuery = "select * from adapter_config where edge_name='" + edgeId + "';";
      log(rawQuery);
      database.query(rawQuery)
        .then(function (res) {
          if (res.length > 0) {
            if (JSON.parse(res[0].adapter_settings).tags !== undefined) {
              var newTags = JSON.parse(res[0].adapter_settings).tags;
              log("updated newTags to: ", JSON.stringify(newTags));
              //check if there's a change
              if (!arraysEqual(existingTags, newTags)) {
                existingTags = newTags;
                var sortedTags = {};

                //convert tags to object array with poll rate as key, and each
                newTags.forEach(function(tag, ndx) {
                  if (tag.read_method.type === "polling") {
                    if (!sortedTags.hasOwnProperty(tag.read_method.rate)) {
                      sortedTags[tag.read_method.rate] = [tag.node_id,];
                    } else {
                      sortedTags[tag.read_method.rate].push(tag.node_id);
                    }
                  }
                })

                //clear each existing interval, if there are any
                if (intervalIDs.length > 0) {
                  for (var intervalID in intervalIDs) {
                    clearInterval(intervalID);
                  }
                }
                //for each object key, setInterval to key
                for (var key in sortedTags) {
                  //setInterval for each different poll rate
                  log("setting interval of: " + key + " for node Ids: " + sortedTags[key]);
                  intervalIDs.push(setInterval(opcuaPoll, key * 1000, sortedTags[key]));
                }
              } else {
                log("no changes to adapter_config tags");
              }
            } else {
              log("no tags in adapter settings");
            }
          } else {
            log("no response from database");
          }
        })
        .catch(function (rej) {
          log("failed to query database: ", rej, rej.message);
          resp.error(rej);
        });
    } catch (e) {
      log("exception: ", e.message);
      resp.error(e.stack);
    }
  }

  /**
   * Inspect the data trigger
   * Determine if the trigger needs to be handled
   */
  function handleTrigger(topic, msg) {
    const payload = JSON.parse(msg.payload);
    switch(payload.collectionName) {
      case 'adapter_config':
        console.debug("Trigger for adapter_config collection received. Configuring adapter polling.");
        adapter_configPoll();
        break;
    }
  }

  client.subscribe(TRIGGER_TOPIC, handleTrigger).catch(function(reason) {
    console.error('failed to subscribe to trigger topic:', reason);
    resp.error('failed to subscribe to trigger topic: ' + reason);
  });

  adapter_configPoll();

  function opcuaPoll(node_ids) {
    console.log("sending read requests to adapter...");
    // var size = 10; var arrayOfArrays = [];
    // for (var i=0; i<bigarray.length; i+=size) {
    //     arrayOfArrays.push(bigarray.slice(i,i+size));
    // }
    // console.log(arrayOfArrays);
    var batches = [];
    for (var x = 0; x < node_ids.length; x += readBatchSize) {
      batches.push(node_ids.slice(x, x + readBatchSize));
    }
    for (var x = 0; x < batches.length; x++) {
      client.publish(
        "opcua/read",
        JSON.stringify({
          node_ids: batches[x],
        })
      );
    }
    
  }

  function arraysEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;
    a.sort(dynamicSort(Object.keys(a[0])[0]));
    b.sort(dynamicSort(Object.keys(b[0])[0]));

    for (var i = 0; i < a.length; ++i) {
      if (!deepEqual(a, b)) return false;
    }
    return true;
  }

  function deepEqual(x, y) {
    return x && y && typeof x === "object" && typeof y === "object"
      ? Object.keys(x).length === Object.keys(y).length &&
          Object.keys(x).reduce(function (isEqual, key) {
            return isEqual && deepEqual(x[key], y[key]);
          }, true)
      : x === y;
  }

  function dynamicSort(property) {
    var sortOrder = 1;
    if (property[0] === "-") {
      sortOrder = -1;
      property = property.substr(1);
    }
    return function (a, b) {
      var result =
        a[property] < b[property] ? -1 : a[property] > b[property] ? 1 : 0;
      return result * sortOrder;
    };
  }
}
