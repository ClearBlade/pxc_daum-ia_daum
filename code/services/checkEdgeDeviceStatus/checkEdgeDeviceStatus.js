// interface TagAttributeMapping {
//   edge_id: string;
//   mappings: Record<string, Record<string, string>>;
// }

// interface JoinSchema {
//   id: string;
//   device_type: string;
//   schema: string;
//   type: string;
// }

const nodes = [];
var edge_device_types = [];

const fetchExistingMaps = function (node_id) {
  const collection = ClearBladeAsync.Collection('tag_attribute_mapping');
  const query = ClearBladeAsync.Query().equalTo('edge_id', node_id);

  return collection.fetch(query);
};

const getSchema = function (asset_ids) {
  return ClearBladeAsync.Database().query("SELECT assets.id, type, asset_types.device_type, asset_types.schema \
    FROM assets JOIN asset_types on assets.type=asset_types.id \
    WHERE assets.id IN (" +
      asset_ids
        .map(function (id) {
          return "'" + id + "'";
        })
        .join(',') +
      ')'
  );
};

//Return all of the nodes in the asset tree
const traverse = function (node_id, tree) {
  if (!nodes.includes(node_id)) nodes.push(node_id);
  if (tree.nodes[node_id].children.length === 0) return [node_id];
  tree.nodes[node_id].children.forEach(function (id) { 
    return traverse(id, tree);
  });
  return [];
};

const parseNodes = function (tree, edge_device) {
  return new Promise(function (resolve, reject) {
    traverse(tree.rootID, tree);
    getSchema([tree.rootID].concat(nodes))
      .then(function (data) {
        //Filter the assets to non-edge assets with asset_type schema fields, return an array of objects 
        const joinSchemas = data
          .filter(function (d) { 
            return d.id !== edge_device && JSON.parse(d.schema).length !== 0
          })
          .map(function (data) {
            data.schema = JSON.parse(data.schema).map(function (attr) {
              return attr.attribute_name
            });
            return data;
          });

        resolve(joinSchemas);
      })
      .catch(function (error) {
        console.error('Error in parseNodes');
        console.error(JSON.stringify(error));
        reject(error);
      });
  });
};

function checkEdgeDeviceStatus(req, resp) {
  // Check for exisiting Mappings
  // If yes -> return those mappings
  // If not -> check if edge device type exists & schema has attribute name asset_prefix
  const response = { edge_type_exists: false, attribute_prefix_exists: true, mappings: {}, edge_device: {} };
  const tree = req.params.tree;
  const children = tree.nodes[tree.rootID].children; //One child should have edge device type

  if (children.length === 0) {
    resp.error(response);
  }

  //Retrieve all the children of the root node
  getSchema(children)
    .then(function (data) {

      if (data.length === 0) {
        resp.error(response);
      }

      edge_device_types = data.filter(function (d){ 
        return d.device_type === 'edge';
      });

      if (edge_device_types.length === 0) {
        resp.error(response);
      }

      return Promise.all([parseNodes(tree, edge_device_types[0].id), fetchExistingMaps(edge_device_types[0].id)]);
    })
    .then(function (data) {
      const nodes = data[0];
      const mappings = data[1];

      if (mappings.TOTAL > 0) {
        console.debug("mappings");
        console.debug(mappings);

        resp.success({
          edge_type_exists: true,
          attribute_prefix_exists: true,
          edge_device: edge_device_types[0],
          mappings: mappings.DATA[0].mappings,
          siblings: nodes,
        });
      }

      const attrs = JSON.parse(edge_device_types[0].schema).filter(function (s) {
        return s.attribute_name === 'asset_prefix';
      });

      resp.success({
        edge_type_exists: true,
        attribute_prefix_exists: true,
        edge_device: edge_device_types[0],
        siblings: nodes,
      });
    })
    .catch(function (error) {
      console.error("An error has occurred during processing:");
      console.error(JSON.stringify(error));
      resp.error(response);
    })
}
