
var createGuid = require('guid').raw;

var couch = require('couch'), c = couch('http://localhost:5984/cryptonomi')
var union = require('union')

var tako = require('tako')
  , request = require('request')
  , path = require('path')
  , app = tako()
  ;

  
app.route('/').file(path.join(__dirname, 'client/index.html'))

app.route('/create/:user/:filename', function ( req, resp) {
    var guid = createGuid()      
    
    var user = req.params.user
    var filename = req.params.filename
    
    if ( ! user || ! filename ) {
        return resp.end( JSON.stringify( { error : "missing required params" } ) )    
    }
    
    var doc = { '_id' : guid, filename : filename, user : user }
    c.post( doc, function( err, info ) {  
        if ( err ) { 
            return resp.end( err )                
        }            
        return resp.end( JSON.stringify( { "guid" : guid } ) )
    })
}).methods('POST')

app.route('/upload/:guid', function (req, resp) {
    
    var guid = req.params.guid
    
    if ( ! guid ) return resp.end( JSON.stringify( { error : "guid missing?" } ) )    
    
    var bufferedStream = new union.BufferedStream()
    req.pipe( bufferedStream )
          
    c.get( guid, function( err, info ) { 
        
        if ( err ) { 
            return resp.end( err )                
        }            
        
        console.log( info )
        var rev = info._rev
        //we want exactly the first revision
        if ( ! rev[0] === '1' || ! rev[1] === '-' ) {
            return response.end( JSON.stringify( { error : 'wtf' } ) )
        }
        
        //made it here, we're good
        var doc_url = 'http://localhost:5984/cryptonomi/' + info._id + '/attachment?rev=' + rev;
        var put = request.put( doc_url )
        bufferedStream.pipe( put )
        put.pipe( resp );                   
    })
    

}).methods('POST'); 

app.route('/filename/:guid',  function (req, resp) {
   
    var guid = req.params.guid
    if ( ! guid ) return resp.end( JSON.stringify( { error: "guid is required" } ) )
    
    c.get( guid, function( err, info ) { 
        if ( err ) { 
            return resp.end( err )                
        }
        
        resp.end( { filename: info.filename } )
    })
})
    
app.route('/download/:guid',  function (req, resp) {
    var guid = req.params['guid']
    
    var couchUrl = 'http://localhost:5984/cryptonomi/' + guid + '/attachment'
    console.log( couchUrl )
    var couchRequest = request(couchUrl)
    couchRequest.pipe(resp)        
}).methods('GET')


app.route('/decrypt/:guid').file(path.join(__dirname, 'client/decrypt.html'))



app.route('/*').files(path.join(__dirname, 'client'))
app.httpServer.listen(6969)
