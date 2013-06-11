var util = require('./util'),
    dot = require('dot');

function template(format, varname) {
    var settings = {};

    for (var i in dot.templateSettings) {
        settings[i] = dot.templateSettings[i];
    }

    settings.interpolate = /\{\{([^?][\s\S]+?\}?)\}\}/g;
    settings.varname = varname;

    var fn = dot.template(format, settings);
    fn.__template = true;

    return fn;
}

type.primitive = primitive;
type.union = union;
type.collection = collection;
type.literal = literal;

module.exports = type;

var anonId = 0,
    typeId = 0;

function anonName(prefix) {
    prefix = prefix || 'anonymous';
    return prefix + '_' + (anonId++);
}

// return a constructor. optionally provide it with a name

function type(name, spec) {
    if (arguments.length === 1 && typeof name == 'object') {
        spec = name;
        name = anonName();
    }

    spec = spec || {};

    // spec info
    var specLength = 0,
        attrNames = [],
        customCtor,
        formatter,
        inspector;

    for (var i in spec) {
        attrNames.push(i);
        specLength++;
    }

    function ctor() {
        // allow for construction without `new`
        if (!(this instanceof ctor)) {
            return new ctor(arguments);
        }

        var args = [].slice.call(util.isArgs(arguments[0]) ? arguments[0] : arguments);

        // allow for custom constructors
        if (customCtor) {
            return customCtor.apply(this, args);
        }

        // short circuit check for 0-field types
        if ((specLength === 0 && args.length !== 0) || (args.length !== 1)) {
            throw new Error("Invalid constructor length. Found " + args.length + ", expected " + (specLength ? 1 : 0));
        }

        if (specLength === 0) {
            return;
        }

        var arg = args[0],
            t;

        // allow for 1-field types to accept the field without an obj wrapper
        if (specLength === 1 && (arg === null || ((t = typeof arg) !== 'object') || (t === 'object' && !arg.hasOwnProperty(attrNames[0])))) {
            var tmp = {};
            tmp[attrNames[0]] = arg;

            arg = tmp;
        }

        if (specLength && (typeof arg !== 'object' || arg === null)) {
            throw new Error("Expect constructor argument to be object with keys: " + attrNames.map(util.inspect).join(', ') + "." + util.inspect(arg) + " found instead");
        }

        for (var i in arg) {
            set(this, i, arg[i]);
        }
    }

    function get(obj, key) {
        return obj[key];
    }

    function set(obj, key, value) {
        var c = spec[key];

        if (!c) {
            throw new Error("Field " + key + " not found in spec for type " + name);
        }

        obj[key] = value instanceof c ? value : c.call(obj, value);
    }

    ctor.__type__ = name;
    ctor.__fields__ = spec;
    ctor.__id__ = typeId++;

    ctor.setField = function(key, value)
    {
        var n = spec.hasOwnProperty(key);

        spec[key] = value;

        if (n)
        {
            attrNames.push(key);
            specLength++;
        }

        return ctor;
    };

    ctor.inspect = function() {
        if (arguments.length && typeof arguments[0] == 'function') {
            inspector = arguments[0];
            return ctor;
        }

        return name;
    };

    ctor.match = function(args) {
        if (args && typeof args === 'object') {
            var used = 0;

            for (var k in args) {
                if (args.hasOwnProperty(k)) {
                    if (!spec.hasOwnProperty(k)) {
                        return false;
                    }

                    used++;
                }
            }

            return used === specLength;
        }

        return false;
    };

    ctor.format = function(fmt) {
        formatter = fmt;
        return ctor;
    };

    ctor.ctor = function(fn) {
        customCtor = fn;
        return ctor;
    };

    ctor.prototype.inspect = function() {
        if (inspector) {
            return inspector.call(this);
        }

        var that = this;

        return name + '(' + attrNames.map(function(n) {
            return util.inspect(get(that, n) || undefined);
        }).join(', ') + ')';
    };

    ctor.prototype.toString = function() {
        var g = get.bind(null, this);

        if (formatter) {
            if (typeof formatter !== 'function') {
                formatter = template(formatter, attrNames.join(', '));
            }

            if (formatter.__template) {
                return formatter.apply(this, attrNames.map(g));
            }

            return formatter.call(this);
        }

        var val = g(attrNames[0]);
        return val === void 0 || val === null ? '' : String(val);
    };

    return ctor;
}

function primitive(type) {
    return function(value) {
        var t = typeof value;

        if (type === String && t === 'string' ||
            type === Number && t === 'number' ||
            type === Boolean && t === 'boolean') {
            return value;
        }

        throw new Error(util.inspect(value) + " must be instance of " + type);
    };
}

var argCache = {},
    numberCache = {},
    stringCache = {},
    uuid = 0,
    guidProp= '__arg_id__',
    guidDesc = {       
        writable:    false,   
        configurable: false,  
        enumerable:  false,   
        value: null           
    };

//taken from ember
//see EMBER_LICENSE
function argId(obj) {
    // special cases where we don't want to add a key to object                           
    if (obj === void 0) return "(undefined)";                                          
    if (obj === null) return "(null)";                                                    
                                                                                        
    var ret;                                                                              
    var type = typeof obj;                                                                
                                                                                        
    // Don't allow prototype changes to String etc. to change the guidFor                 
    switch (type) {                                                                        
    case 'number':                                                                      
        ret = numberCache[obj];                                                           
        if (!ret) ret = numberCache[obj] = 'nu'+obj;                                      
        return ret;                                                                       
                                                                                        
    case 'string':                                                                      
        ret = stringCache[obj];                                                           
        if (!ret) ret = stringCache[obj] = 'st'+(uuid++);                                 
        return ret;                                                                       
                                                                                        
    case 'boolean':                                                                     
        return obj ? '(true)' : '(false)';                                                
                                                                                        
    default:                                                                            
        if (obj[guidProp]) return obj[guidProp];                                          
        if (obj === Object) return '(Object)';                                            
        if (obj === Array)  return '(Array)';                                             
        ret = 'obj'+(uuid++);                                                           
        guidDesc.value = ret;
        Object.defineProperty(obj, guidProp, guidDesc);
        return ret;                                                                       
    }                                                                                     
}

function argsId(args) {
    return [].map.call(args, argId).join('|');
}

function tryType(type, args, cache) {
    var id = argsId(args),
        tid = type.__id__;

    if (cache && cache[tid] && cache[tid][id] === false) {
        return void 0;
    }

    try {
        return type.apply(null, args);
    } catch (err) {
        if (cache) {
            if (!cache[tid]) {
                cache[tid] = {};
            }

            cache[tid][id] = false;
        }

        return void 0;
    }
}

function union(name) {
    var types = [].slice.call(arguments, 1);

    if (typeof name !== 'string') {
        types.unshift(name);
        name = anonName('union(' + types.map(function(t) {
            return t.__type__;
        }).join('|') + ')');
    }

    var t = type(name).ctor(function() {
        var i,
            fit,
            obj;

        if (arguments.length === 1) {
            for (i in types) {
                if (arguments[0] instanceof types[i]) {
                    return arguments[0];
                }

                if (!fit && types[i].match(arguments[0])) {
                    fit = types[i];
                }
            }
        }

        if (fit && (obj = tryType(fit, arguments, argCache))) {
            return obj;
        }

        for (i in types) {
            if ((obj = tryType(types[i], arguments, argCache))) {
                return obj;
            }
        }

        throw new TypeError("No types matched arguments for union type " + name + " and arguments " + util.inspect(arguments, false, null));
    });

    t.__add_type__ = function(type) {
        types.push(type);
        t[type.__type__] = type;
    };

    t.__union_types__ = types;

    for (var i in types) {
        t[types[i].__type__] = types[i];
    }

    return t;
}

function literal(value) {
    return type('"' + value + '"').ctor(function(val) {
        if (value !== val) {
            throw new TypeError("Must be " + value);
        }
    }).format(function() {
        return value;
    });
}

function collection(name, childType, surrounds, delim) {
    if (typeof name !== 'string') {
        delim = surrounds;
        surrounds = childType;
        childType = name;
        name = anonName();
    }

    surrounds = surrounds === void 0 ? '' : surrounds;
    delim = delim === void 0 ? ', ' : delim;

    var t = type(name).ctor(function() {
        var args = arguments.length == 1 && util.isArray(arguments[0]) ?
            arguments[0] : [].slice.call(arguments);

        this.__vals = args.map(function(v) {
            if (v instanceof childType) {
                return v;
            }

            return childType(v);
        });
    }).inspect(function() {
        return this.constructor.__type__ + '(' +
            this.__vals.map(function(v) {
                return v.inspect();
            }).join(', ') +
        ')';
    }).format(function() {
        return (surrounds[0] || '') + this.__vals.join(delim) + (surrounds[1] || '');
    });

    t.__collection_type__ = childType;

    return t;
}
