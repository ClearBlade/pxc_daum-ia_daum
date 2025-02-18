!function(){var e={};e.g=function(){if("object"==typeof globalThis)return globalThis;try{return this||new Function("return this")()}catch(e){if("object"==typeof window)return window}}(),e.g.createOpcuaMap=function(e,t){var n=e.params.edge_id,r=e.params.mappings;ClearBladeAsync.Collection("tag_attribute_mapping").upsert({edge_id:n,mappings:r},"edge_id").then((function(e){return t.success(e)})).catch((function(e){
    console.log(e);
    return t.error(e.message)
    }))}}();