importScripts('core.js');
importScripts('node_modules/eventemitter2/lib/eventemitter2.js');
importScripts('webworker_bridge_emitter.js');
importScripts('Crypto.js');
importScripts('2.5.3-crypto-sha1.js');

ts = function() { return new Date().getTime() };

var bridge = new EEWWBridge( self );
var console = {};
console.log = function ( value ) {
    bridge.pass( 'console.log', value );    
};


encryptArrayBufferToArrayBuffer = function( arrayBuffer, password, onProgress, onEncrypted ) {
    
    var start = ts()
    console.log(  'enc start at ' + start );    
    var original_uint8 = new Uint8Array( arrayBuffer );
    var view_done = ts();
   console.log( 'view took ' + ( view_done - start ) );
    
    var original_string = Crypto.charenc.Binary.bytesToString(original_uint8, onProgress );
    to_string_done = ts();
    console.log( 'to string took ' + ( to_string_done - view_done) );

    var encrypted = sjcl.encrypt("password", original_string, {}, {}, onProgress )
    //var encrypted = Aes.Ctr.encrypt( original_string, "password", 256 );  


    var encryption_done = ts();
    console.log( 'encryption took: ' + ( encryption_done - to_string_done) );

    //take the sha1 of the encrypted string, pass it
    //var sha1 = Crypto.SHA1( encrypted );
    var sha1_done = ts();
     console.log( 'sha1 took: ' + ( sha1_done - encryption_done ) );
    
    var encrypted_bytes = Crypto.charenc.Binary.stringToBytes( encrypted );    
    
    to_bytes_done = ts();
     console.log( 'to_bytes took: ' + ( to_bytes_done - sha1_done ) );
    
    //console.log( sha1 );
    var encrypted_bytes_ab = new ArrayBuffer( encrypted_bytes.length );
    var encrypted_bytes_view = new Uint8Array( encrypted_bytes_ab );
    var new_ab_and_view = ts();
    
    console.log( 'new_ab took: ' + ( new_ab_and_view - to_bytes_done ) );    
    
    //copy it for now
    for ( var i = 0; i < encrypted_bytes.length; i++ ) {
        encrypted_bytes_view[i] = encrypted_bytes[i];
    }

    var view_pop = ts();
    console.log( 'view population took: ' + ( view_pop - new_ab_and_view ) );
    
    return onEncrypted( null, encrypted_bytes_ab );
};

var onEncrypt = function( payload ) {
    
    var arrayBuffer = payload.arrayBuffer;
    var password = payload.password;
    
    var onProgress = function( event ) {
        bridge.pass( 'progress', Math.round( (event.encrypted / event.total) * 1000 ) );
    };
    
    var onEncrypted = function( err, encryptedArrayBuffer, sha1 ) {        
        bridge.pass( 'progress', 1000 );    
        bridge.pass( 'encrypted', { 'arrayBuffer' : encryptedArrayBuffer }, [ arrayBuffer ] );
    }
    
    encryptArrayBufferToArrayBuffer( arrayBuffer, password, onProgress, onEncrypted );
};
bridge.on( 'encrypt', onEncrypt );


decryptArrayBufferToArrayBuffer = function( arrayBuffer, password, onProgress, onDecrypted ) {

    var encrypted_uint8 = new Uint8Array( arrayBuffer );
    var encrypted_string = Crypto.charenc.Binary.bytesToString(encrypted_uint8, onProgress );
    var decrypted = sjcl.decrypt("password", encrypted_string, {}, {}, onProgress );
    var decrypted_bytes = Crypto.charenc.Binary.stringToBytes( decrypted );    
    var decrypted_bytes_ab = new ArrayBuffer( decrypted_bytes.length );
    var decrypted_bytes_view = new Uint8Array( decrypted_bytes_ab );

    //copy it for now
    for ( var i = 0; i < decrypted_bytes.length; i++ ) {
        decrypted_bytes_view[i] = decrypted_bytes[i];
    }

    return onDecrypted( null, decrypted_bytes_ab );
};


var onDecrypt = function( payload ) {
    
    var arrayBuffer = payload.arrayBuffer;
    var password = payload.password;
    
    var onProgress = function( event ) {
        console.log( event )
        bridge.pass( 'progress', Math.round( (event.encrypted / event.total) * 1000 ) );
    };
    
    var onDecrypted = function( err, decryptedArrayBuffer ) {        
        bridge.pass( 'progress', 1000 );    
        bridge.pass( 'decrypted', { 'decryptedArrayBuffer' : decryptedArrayBuffer }, [ decryptedArrayBuffer ] );
    };
    decryptArrayBufferToArrayBuffer( arrayBuffer, password, onProgress, onDecrypted );
};
bridge.on( 'decrypt', onDecrypt );
