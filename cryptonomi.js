
var createGuid = require('guid').raw;

var couch = require('couch'), c = couch('http://localhost:5984/cryptonomi')
var union = require('union')

var tako = require('tako')
  , request = require('request')
  , path = require('path')
  , app = tako()
  ;

  
app.route('/').file(path.join(__dirname, 'client/index.html'))

app.route('/upload', function (req, resp) {
    
    //we need to hit counch and create the doc first,
    //unforunately this is our only chance to pipe the req
    //so we need to buffer it for now    
    var bufferedStream = new union.BufferedStream()
    req.pipe( bufferedStream )
    var guid = createGuid()
      
    c.post( { '_id' : guid }, function( err, info ) { 
        
        if ( err ) { 
            return resp.end( err )                
        }            
        
        var doc_url = 'http://localhost:5984/cryptonomi/' + info.id + '/attachment?rev=' + info.rev;
        var put = request.put( doc_url )
        bufferedStream.pipe( put )
        put.pipe( resp );                   
    })
    

}).methods('POST'); 

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
