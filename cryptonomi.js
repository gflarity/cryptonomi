

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
    
    c.post( { 'fake' : 1 }, function( err, info ) { 
        
        if ( err ) { 
            return resp.end( err )                
        }            
        
        var doc_url = 'http://localhost:5984/cryptonomi/' + info.id + '/attachment?rev=' + info.rev;
        var put = request.put( doc_url )
        bufferedStream.pipe( put )
        put.pipe( resp );                   
    })
    

}).methods('POST'); 

app.route('/*').files(path.join(__dirname, 'client'))
app.httpServer.listen(6969)
/*

  
var http = require('http')
var request = require('request');

var server = http.createServer(function (req, resp) {
    req.pause();
    c.post( { 'fake' : 1 }, function( err, info ) { 
            
            if ( err ) { 
                return resp.end( err )                
            }
        
        req.pipe( request.post('http://localhost:6970') )
        req.resume()
    })
})
server.listen(6969)
*/