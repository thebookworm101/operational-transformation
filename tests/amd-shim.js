// Written by Kris Zyp

var currentModule, defaultCompile = module.constructor.prototype._compile;
module.constructor.prototype._compile = function(content, filename){
  currentModule = this;
  try{
    return defaultCompile.call(this, content, filename);
  }
  finally {
    currentModule = null;
  }
};
define = function (id, injects, factory) {
    if (currentModule == null) {
      throw new Error("define() may only be called during module factory instantiation");
    }
    var module = currentModule;
    var req = function(relativeId){
	if(relativeId.charAt(0) === '.'){
	  relativeId = id.substring(0, id.lastIndexOf('/') + 1) + relativeId;
	  while(lastId !== relativeId){
	    var lastId = relativeId;
	    relativeId = relativeId.replace(/\/[^\/]*\/\.\.\//,'/');
	  }
	  relativeId = relativeId.replace(/\/\.\//g,'/');
	}
	return require(relativeId);
    };
    if (!factory) {
      // two or less arguments
      factory = injects;
      if (factory) {
        // two args
        if (typeof id === "string") {
          if (id !== module.id) {
            throw new Error("Can not assign module to a different id than the current file");
          }
          // default injects
          injects = ["require", "exports", "module"];
        }
        else{
          // anonymous, deps included
          injects = id;
        }
      }
      else {
        // only one arg, just the factory
        factory = id;
        injects = ["require", "exports", "module"];
      }
    }
    id = module.id;
    if (typeof factory !== "function"){
      // we can just provide a plain object
      return module.exports = factory;
    }
    var returned = factory.apply(module.exports, injects.map(function (injection) {
      switch (injection) {
        // check for CommonJS injection variables
        case "require": return req;
        case "exports": return module.exports;
        case "module": return module;
        default:
          // a module dependency
          return req(injection);
      }
    }));
    if(returned){
      // since AMD encapsulates a function/callback, it can allow the factory to return the exports.
      module.exports = returned;
    }
};

require("./" + process.argv.pop());