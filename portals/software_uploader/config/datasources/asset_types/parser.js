/**
* The 'parser' variable is the entry point for your parser. Write logic inside of the provided function and return a value
* Constants and utility functions can be created outside of the parser
* The provided ctx parameter is an object that contains data and model information on this item
* @param {context} ctx 
* @returns {rtn} */
parser = (ctx) => {
  return ctx.data.filter(function(assetType){
    return assetType.data.device_type ? true: false;
  })
  .sort(function(a, b){
    if (a.data.device_type < b.data.device_type) return -1;
    if (a.data.device_type > b.data.device_type) return 1;
    return 0;
  });
  return ctx.data
}