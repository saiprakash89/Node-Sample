var express = require('express');
var bodyParser = require('body-parser');
var sftools = require('./sf-tools');
var pg = require('pg');

var app = express();

//SF app secret
var SF_CANVASAPP_CLIENT_SECRET = process.env.CANVAS_CONSUMER_SECRET;

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

app.use(bodyParser());

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  console.log('********************** GET Signed Request: ' + JSON.stringify(request.body));
  response.render('pages/index');
});

app.post('/', function(request, response) {
  console.log('********************** POST Signed Request: ' + JSON.stringify(request.body));
  sftools.canvasCallback(request.body, SF_CANVASAPP_CLIENT_SECRET, function(error, canvasRequest){
        if(error){
            response.statusCode = 400;
            console.log('*******ERROR : ' + error);
            response.writeHead(200, {"Context-Type": "text/plain"}); //writeHead is used to set the header of the response
			response.write("Some plain text can be here " + error); //write allows you to write your response in the format mentioned above
			response.end();//return response.render('error',{error: error});
        }
        //saves the token details into session
        sftools.saveCanvasDetailsInSession(request,canvasRequest);
        return response.redirect('/');
    });
  //response.render('pages/index');
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

app.get('/db', function (request, response) {
  pg.connect('postgres://zmfgqjwgcpaexh:c8a939a0a627de249b5ecc3a27d5926cd405cc0231b932c147d48e477bef6b1f@ec2-54-83-47-194.compute-1.amazonaws.com:5432/d84onlgvnolscr', function(err, client, done) {
    client.query('SELECT * FROM test_table ORDER by id ASC', function(err, result) {
      done();
      if (err)
       { console.error(err); response.send("Error " + err); }
      else
       { response.render('pages/db', {results: result.rows} ); }
    });
  });
});

//canvas callback
app.post('/canvas/callback', function(req,res){
    sftools.canvasCallback(req.body, SF_CANVASAPP_CLIENT_SECRET, function(error, canvasRequest){
        if(error){
            res.statusCode = 400;
            return res.render('error',{error: error});
        }
        //saves the token details into session
        sftools.saveCanvasDetailsInSession(req,canvasRequest);
        console.log('********************** Request Body: ' + req.body);
        console.log('********************** Signed Request: ' + req.signed_request);
        return res.redirect('/');
    });
});

//Test
app.get('/test', function(req, res){
	pg.connect('postgres://zmfgqjwgcpaexh:c8a939a0a627de249b5ecc3a27d5926cd405cc0231b932c147d48e477bef6b1f@ec2-54-83-47-194.compute-1.amazonaws.com:5432/d84onlgvnolscr', function(err, client, done) {
		client.query('SELECT * FROM test_table WHERE id = ' + req.query.id, function(err, result) {
			if(err) {
				console.log('Error occurred while trying to access the record with id: ' + req.query.id + ' ' + err);
				res.send('Error ' + err);
			} else {
				console.log('******Rows returned: ' + result.rows[0].name);
				res.render('pages/test', {id: req.query.id, selectList: result.rows[0].name});
			}
		});
	});
	//res.render('pages/test', {id: req.query.id} );
	console.log('********* Query Parameter: ' + req.query.id);
});

app.post('/test', function(req, res){
	console.log('********* POST Request: ' + req.body.selectList);
	pg.connect('postgres://zmfgqjwgcpaexh:c8a939a0a627de249b5ecc3a27d5926cd405cc0231b932c147d48e477bef6b1f@ec2-54-83-47-194.compute-1.amazonaws.com:5432/d84onlgvnolscr', function(err, client, done) {
		client.query('UPDATE test_table SET name = \'' + req.body.selectList + '\' WHERE id = ' + req.body.orderId, function(err, result) {
			if(err) {
				console.log('Error occurred while trying to update the record with id: ' + req.body.orderId + ' ' + err);
				res.send('Error ' + err);
			} else {
				console.log('Redirecting to test with ID: ' + req.body.orderId);
				return res.redirect('/test?id=' + req.body.orderId);
			}
		});
	});
	//return res.redirect('/test');
});