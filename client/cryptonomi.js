if ( window ) {
    window.requestFileSystem =  window.webkitRequestFileSystem
}
else {
    window = {};    
}

var onError = function(e) {
                var msg = '';
                switch (e.code) {
                case FileError.QUOTA_EXCEEDED_ERR:
                    msg = 'QUOTA_EXCEEDED_ERR';
                    break;
                case FileError.NOT_FOUND_ERR:
                    msg = 'NOT_FOUND_ERR';
                    break;
                case FileError.SECURITY_ERR:
                    msg = 'SECURITY_ERR';
                    break;
                case FileError.INVALID_MODIFICATION_ERR:
                    msg = 'INVALID_MODIFICATION_ERR';
                    break;
                case FileError.INVALID_STATE_ERR:
                    msg = 'INVALID_STATE_ERR';
                    break;
                default:
                    msg = 'Unknown Error';
                    break;
                }
                console.log('Error: ' + msg);
};
            
            
cryptonomi = {};
cryptonomi.saveBlob = function ( blob, fileName, onSaved ) {
    
    var reader = new FileReader();
    reader.onload = function(event) {
        var original_ab = event.target.result;

        window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
        var on_fs = function(fs) {
        
            var onFileEntry = function(fileEntry) {
                
                var onFileWriter =  function(fileWriter) {
                    
                    fileWriter.onwriteend = function(e) {
                        console.log('Write completed.');
                        return onSaved();
                    };

                    fileWriter.onerror = function(e) {
                        console.log('Write failed: ' + e.toString());
                        return onSaved( e );
                    };
                    
                    // Create a new Blob and write it to log.txt.
                    var bb = new BlobBuilder();
                    bb.append(event.target.result);
                    fileWriter.write(bb.getBlob());
                };
                fileEntry.createWriter( onFileWriter, onError);
            };
            var options = { create: true }
            fs.root.getFile( fileName, options, onFileEntry, onError );            
        };
        window.requestFileSystem(window.TEMPORARY, 500 * 1024 * 1024, on_fs, onError );
    };
    
    reader.onprogress = function(event) {
        //console.log(event);
    };
    reader.readAsArrayBuffer(blob);
    
};

cryptonomi.saveFile = function( file, onSaved ) {
    cryptonomi.saveBlob( file, file.fileName, onSaved );       
};


cryptonomi.deleteFile = function( file, onDeleted ) {
    window.requestFileSystem(window.TEMPORARY, 500*1024*1024, function(fs) { 
        fs.root.getFile(file.fileName, {create: false}, function(fileEntry) {

            fileEntry.remove(function() {
            console.log('File removed.');
        }, onError);

        }, onError);
    }, onError);
};

cryptonomi.encryptToFile = function( blob, password, onProgress, onEncrypted ) {
                var reader = new FileReader();
                reader.onerror = function( e ) {
                    
                    console.log(e);   
                };
                reader.onloadend = function(e) {
                    console.log(e);

                    var onFileSystem = function(fs) {   
                        var arrayBuffer = e.target.result;             
                        var original_uint8 = new Uint8Array( arrayBuffer );
                        var original_string = Crypto.charenc.Binary.bytesToString(original_uint8);
                        var start = new Date().getTime();
                        console.log( 'starting encryption' );

                        var encrypted = sjcl.encrypt("password", original_string, {}, {}, onProgress )
                        //var encrypted = Aes.Ctr.encrypt( original_string, "password", 256 );  

                        var end = new Date().getTime();


                        //var encrypted = Crypto.AES.encrypt( original_string, "password", { mode: new Crypto.mode.CBC } );                
                        console.log( 'encrypted completed in: ' + (end-start) + ' ms' );
                        /*console.log( "first took: " + ( new Date().getTime() - first_start ) );
                        */
                        var encrypted_bytes = Crypto.charenc.Binary.stringToBytes( encrypted );
                        var sha1 = Crypto.SHA1( encrypted );
                        //console.log( sha1 );
                        var encrypted_bytes_ab = new ArrayBuffer( encrypted_bytes.length );
                        var encrypted_bytes_view = new Uint8Array( encrypted_bytes_ab );
                        
                        //copy it for now
                        for ( var i = 0; i < encrypted_bytes.length; i++ ) {
                            encrypted_bytes_view[i] = encrypted_bytes[i];
                        }
        
                        var bb = new BlobBuilder;                        
                        bb.append( encrypted_bytes_ab );
                        
                        
                        var onBlobSaved = function( err ) {                        
                          console.log( 'encryped blob saved as /' + sha1  );
                          return onEncrypted( err );
                        };
                        cryptonomi.saveBlob( bb.getBlob(), sha1, onBlobSaved );
                    
                   };
                   window.requestFileSystem(window.TEMPORARY, 50*1024*1024, onFileSystem, onError )
                }
                reader.readAsArrayBuffer( blob );           
                
};

cryptonomi.encryptArrayBufferToArrayBuffer = function( arrayBuffer, password, onProgress, onEncrypted ) {
    
            
    var original_uint8 = new Uint8Array( arrayBuffer );
    var original_string = Crypto.charenc.Binary.bytesToString(original_uint8);
    var start = new Date().getTime();
    console.log( 'starting encryption' );
    
    var encrypted = sjcl.encrypt("password", original_string, {}, {}, onProgress )
    //var encrypted = Aes.Ctr.encrypt( original_string, "password", 256 );  
    
    var end = new Date().getTime();
    
    
    //var encrypted = Crypto.AES.encrypt( original_string, "password", { mode: new Crypto.mode.CBC } );                
    console.log( 'encrypted completed in: ' + (end-start) + ' ms' );
    /*console.log( "first took: " + ( new Date().getTime() - first_start ) );
    */
    var encrypted_bytes = Crypto.charenc.Binary.stringToBytes( encrypted );
    var sha1 = Crypto.SHA1( encrypted );
    //console.log( sha1 );
    var encrypted_bytes_ab = new ArrayBuffer( encrypted_bytes.length );
    var encrypted_bytes_view = new Uint8Array( encrypted_bytes_ab );
    
    //copy it for now
    for ( var i = 0; i < encrypted_bytes.length; i++ ) {
        encrypted_bytes_view[i] = encrypted_bytes[i];
    }

    return onEncrypted( null, encrypted_bytes_ab );
                
};

cryptonomi.clearFS = function( onCleared ) {
    window.requestFileSystem(window.TEMPORARY, 1024*1024*1024, function(fs) {
    fs.root.getDirectory('', {}, function(dirEntry) {

        dirEntry.removeRecursively(function() {
            console.log('Directory removed.');
            return onCleared();
        }, onError);

        }, onError);
    }, onError);
}