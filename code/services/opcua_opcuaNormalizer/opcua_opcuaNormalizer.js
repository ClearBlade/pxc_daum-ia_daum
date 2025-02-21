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

function opcua_opcuaNormalizer(req, resp) {
  const edgeID = ClearBlade.edgeId();
  const TRIGGER_TOPIC = '$share/tagmapping/$trigger/data/+';
  const TAGS_COLLECTION = ClearBladeAsync.Collection('tag_attribute_mapping');

  const OPC_UA_READ_TOPIC = "$share/opcua_adapter/opcua/read/response";
  
  // assetLocationAndStatus is the listener IA stream service
  // updates assets collection, apply last_updated, and forward to rules engine
  const OUTGOING_LOCATION_AND_STATUS_TOPIC = "_dbupdate/_monitor/_asset/<ASSET_ID>/locationAndStatus/_platform" 
  
  // assetHistory is the listener IA stream service
  // updates asset history
  const OUTGOING_HISTORY_TOPIC = "_history/_monitor/_asset/<ASSET_ID>/_platform";
  
  // live updates via IA UI and message relay
  const OUTGOING_LIVE_UPDATES_PLATFORM = "live/monitor/asset/<ASSET_ID>/locationAndStatus/_platform";
  
  // max time between publishing updates for attributes in IA if their value has not changed
  const MAX_DURATION_BETWEEN_UPDATES_IN_MINUTES = 5;
  
  const cbClient = new MQTT.Client();
  
  var tagToAssetMap = null;
  var assetTypes = null;
  var lastAssetValues = {};
  
  // get mappings for the specific edge this is running on
  function getAssetMap() {
    var query = ClearBladeAsync.Query();
    query.equalTo("edge_id", edgeID);

    return TAGS_COLLECTION.fetch(query).then(function (results) {
      if (results.DATA.length === 1) {
        tagToAssetMap = results.DATA[0].mappings;
        return;
      } else {
        console.error('unexpected number of mappings found: ', results.DATA.length);
      }
    }).catch(function (reason) {
      console.error('failed to fetch tag attribute mappings:', reason);
    });
  }
  
  function getAssetTypes() {
    var collection = ClearBladeAsync.Collection('asset_types');
    var query = ClearBladeAsync.Query();
    query.setPage(10000, 1);
    return collection.fetch(query).then(function (results) {
      // translate into a map keyed on asset type id then attributes
      var mappedAssetTypes = {};
      for (var x = 0; x < results.DATA.length; x++) {
        results.DATA[x].schema = JSON.parse(results.DATA[x].schema);
        mappedAssetTypes[results.DATA[x].id] = {};
        for (var y = 0; y < results.DATA[x].schema.length; y++) {
          mappedAssetTypes[results.DATA[x].id][results.DATA[x].schema[y].attribute_name] = {
            "type": results.DATA[x].schema[y].attribute_type
          };
        }
      }
      assetTypes = mappedAssetTypes;
      return;
    }).catch(function(reason) {
      console.error('failed to fetch asset types:', reason);
    });
  }
  
  /**
   * Inspect the data trigger
   * Determine if the trigger needs to be handled
   */
  function handleTrigger(topic, msg) {
    const payload = JSON.parse(msg.payload);
    switch(payload.collectionName) {
      case 'tag_attribute_mapping':
        console.debug("Trigger for tag_attribute_mapping collection received. Retrieving asset map.");
        getAssetMap();
        break;
      case 'asset_types':
        console.debug("Trigger for asset_types collection received. Retrieving asset_types.");
        getAssetTypes();
        break;
    }
  }

  // on message receive build IA messages, publish as array
  function processMessage(topic, msg) {
    try {
      msg = JSON.parse(msg.payload);
    } catch (e) {
      console.error("failed to parse json: " + e);
      return;
    }

    if (!msg.success) {
      console.error('opcua read failed: ' + msg.error_message);
      return;
    }
    
    var assetModelMessagesByAssetID = {};
    // loop through every node id returned by adapter
    for (var nodeID in msg.data) {
      // check if it has a mapping
      // if not noop
      if (tagToAssetMap[nodeID]) {
        const assetDetails = tagToAssetMap[nodeID];
        // if so, check is an asset model msg exists for this asset yet, if not create it
        if (!assetModelMessagesByAssetID.hasOwnProperty(assetDetails.asset_id)) {
          assetModelMessagesByAssetID[assetDetails.asset_id] = {
            id: assetDetails.asset_id,
            last_updated: msg.server_timestamp,
            'type': assetDetails.asset_type,
            custom_data: {}
          };
        }
                  
        // add attribute to asset model message, after checking attribute type and converting accordingly
        var convertedValue = null;
        var assetTypeAttributeDetails = null;
        try {
          assetTypeAttributeDetails = assetTypes[assetDetails.asset_type][assetDetails.attribute_id];
        } catch (e) {
          console.error("no asset details found for type and attribute, defaulting to number");
          assetTypeAttributeDetails = {
            "type": "number"
          };
        }
        
        switch (assetTypeAttributeDetails.type) {
          case "boolean":
            if (typeof msg.data[nodeID].value === "number") {
              convertedValue = (msg.data[nodeID].value === 1);
            } else {
              convertedValue = msg.data[nodeID].value;
            }
            break;
          case "number":
            convertedValue = msg.data[nodeID].value;
            break;
          default:
            console.error('unexpected attribute type (defaulting to number):', assetTypeAttributeDetails.type);
            convertedValue = msg.data[nodeID].value;
            break;
        }
        
        // check if this attribute has changed within the max duration, if not don't add it to custom data, otherwise add it
        if (!lastAssetValues[assetDetails.asset_id]) {
          lastAssetValues[assetDetails.asset_id] = {};
        }
        if (!lastAssetValues[assetDetails.asset_id][assetDetails.attribute_id]) {
          lastAssetValues[assetDetails.asset_id][assetDetails.attribute_id] = {
            value: convertedValue,
            last_updated: new Date(msg.server_timestamp)
          };
          assetModelMessagesByAssetID[assetDetails.asset_id].custom_data[assetDetails.attribute_id] = convertedValue;
        }
  
        if (lastAssetValues[assetDetails.asset_id][assetDetails.attribute_id].value !== convertedValue) {
          assetModelMessagesByAssetID[assetDetails.asset_id].custom_data[assetDetails.attribute_id] = convertedValue;
          lastAssetValues[assetDetails.asset_id][assetDetails.attribute_id].value = convertedValue;
          lastAssetValues[assetDetails.asset_id][assetDetails.attribute_id].last_updated = new Date(msg.server_timestamp);
        } else if (Math.round((((new Date() - lastAssetValues[assetDetails.asset_id][assetDetails.attribute_id].last_updated)  % 86400000) % 3600000) / 60000) >= MAX_DURATION_BETWEEN_UPDATES_IN_MINUTES) {
          assetModelMessagesByAssetID[assetDetails.asset_id].custom_data[assetDetails.attribute_id] = convertedValue;
          lastAssetValues[assetDetails.asset_id][assetDetails.attribute_id].value = convertedValue;
          lastAssetValues[assetDetails.asset_id][assetDetails.attribute_id].last_updated = new Date(msg.server_timestamp);
        } else {
          //console.log('no change in attribute required to send');
        }
        //assetModelMessagesByAssetID[assetDetails.asset_id].custom_data[assetDetails.attribute_id] = convertedValue;
      } else {
        //console.log('skipping node id: ' + nodeID + ' - no mapping found');
      }
    }
  
    // after looping through every node id, publish asset model messages, if the value has changed or we have hit the max duration
    for (var assetID in assetModelMessagesByAssetID) {
      if (Object.keys(assetModelMessagesByAssetID[assetID].custom_data).length > 0) {
          cbClient.publish(OUTGOING_LOCATION_AND_STATUS_TOPIC.replace("<ASSET_ID>", assetID), JSON.stringify(assetModelMessagesByAssetID[assetID]));
          cbClient.publish(OUTGOING_HISTORY_TOPIC.replace("<ASSET_ID>", assetID), JSON.stringify(assetModelMessagesByAssetID[assetID]));
          cbClient.publish(OUTGOING_LIVE_UPDATES_PLATFORM.replace("<ASSET_ID>", assetID), JSON.stringify(assetModelMessagesByAssetID[assetID]));
      } else {
        //console.log('no custom data on asset model message so ignoring');
      }
    }      
  }

  Promise.all([getAssetMap(), getAssetTypes()]).then(function(results) {
    console.log("subscribing to topic: " + OPC_UA_READ_TOPIC);
    cbClient.subscribe(OPC_UA_READ_TOPIC, processMessage).catch(function(reason) {
      console.error('failed to subscribe to opcua read topic:', reason);
      resp.error('failed to subscribe to opcua read topic: ' + reason);
    });

    console.log("subscribing to topic: " + TRIGGER_TOPIC);
    cbClient.subscribe(TRIGGER_TOPIC, handleTrigger).catch(function(reason) {
      console.error('failed to subscribe to trigger topic:', reason);
      resp.error('failed to subscribe to trigger topic: ' + reason);
    });
  }).catch(function (reason) {
    console.error('failed to fetch initial data:', reason);
    resp.error('failed');
  });      
}
  