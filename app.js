var express = require('express');
var sftools = require('./sf-tools');
var pg = require('pg');

var app = express();

//SF app secret
var SF_CANVASAPP_CLIENT_SECRET = process.env.CANVAS_CONSUMER_SECRET;

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  response.render('pages/index');
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

app.get('/db', function (request, response) {
  pg.connect('postgres://rnsqdefrhkajbe:4a1fdee2b026081ace09775aae302e345011cb18935b247765cd86a019651021@ec2-54-163-240-7.compute-1.amazonaws.com:5432/dbsp4rmd8r5cfn', function(err, client, done) {
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
        return res.redirect('/');
    });
});