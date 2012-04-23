
//borrowed from node.js, it's subject to MIT LICENSE
var inherits = function(ctor, superCtor) {
  ctor.super_ = superCtor;
  ctor.prototype = Object.create(superCtor.prototype, {
    constructor: {
      value: ctor,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
};
//end borrowed

var EEWWBridge = function( self ) {   
    
    //call super
    EventEmitter2.apply( this, [] );
    
    this.self = self;
    that = this;
    this.self.onmessage = function( ww_event ) {
        var message = ww_event.data;
        EventEmitter2.prototype.emit.apply( that,  [ message.event, message.payload ] );           
    };
    
};
inherits( EEWWBridge, EventEmitter2 );

//we override emit so that it passes it off to the remote emitter, not local
EEWWBridge.prototype.pass = function( event, payload, transferables ) {

    //second argument to emit is always a list of transferables or undef
    this.self.postMessage( { 'event' : event, 'payload' : payload }, transferables );  
        
 };

