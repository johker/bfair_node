var root = '../'  
  , mongoose = require('mongoose')
  , User = mongoose.model('User')
  , Account = mongoose.model('Account')
  , bundle = require(root + 'config/resourcebundle')['en']
  , csv = require('csv')
  , fs = require('fs')
  , _ = require('underscore')

  
module.exports = function (app, passport, auth) {

// controllers
var uctrl = require('../app/controllers/usercontroller');
var actrl = require('../app/controllers/accountcontroller');
var apictrl = require('../app/controllers/apicontroller');
var dctrl = require('../app/controllers/datacontroller');


// user routes
app.get('/', uctrl.login);
app.get('/logout', uctrl.logout)
app.post('/users/session', passport.authenticate('local', {failureRedirect: '/', failureFlash: 'Invalid email or password.'}), uctrl.session)
app.get('/users/:userId', uctrl.show)

// Content routes
// app.get('/overview', auth.requiresLogin, uctrl.overview);
// app.get('/data', auth.requiresLogin, dctrl.data);
app.get('/account', auth.requiresLogin, actrl.account);
app.get('/markets', auth.requiresLogin, apictrl.markets);
app.post('/', 
	passport.authenticate('local', { failureRedirect: '/', failureFlash: true }),
	function(req, res) {
		sysLogger.info('<routes> <passport> <authenticate> Authenticated');
		res.redirect('/markets');
});

app.post('/account', 
	function(req, res) {		
		if (req.body.accountId != null) {
			actrl.updateAccount(req, res);			
		}		
});
app.post('/overview',function(req, res) {	});

app.post('/validate', function(req, res) {
	var id = 23; 
	var description = 'Random description';
	app.io.broadcast('evupdate', {evid: id, evdes: description}); 	
	dctrl.validateEntries(req,res, function(values, err) {
		if (err) sysLogger.error('<routes> <validateEntries:callback> ' +err);
		sysLogger.info('<routes> <validateEntries:callback> Entries not validated');
		res.writeHead(200, {'Content-Type': 'application/json'});
		res.write(JSON.stringify(values));
    	res.end(); 
	});
});

app.post('/export', function(req, res) {
	dctrl.exportLogs(req, res);
});

app.post('/delete', function(req, res) {
	dctrl.deleteLogs(req, res);
});

app.post('/detail', function(req, res) {
	apictrl.pricedetail(req, res);
});

app.post('/markets', function(req, res) {
	try {
		apictrl.markets(req, res);
	} catch (ex) {
		sysLogger.error('<routes> <post:markets> ' +  ex);	
	}	
}); 

var selectedId; // has to be set via ajax request

app.post('/history', function(req, res) {
	sysLogger.notice('<routes> <post:history> Market ID : ' +  req.body.marketId);
	sysLogger.info('<routes> <post:history> Operation : ' +  req.body.operation);
	try {	
		if(!_.isUndefined(selectedId)) { // ajax request to set id was successful
			if(req.body.operation == 'export') {
				apictrl.exporthistory(selectedId, res);
				sysLogger.crit('<routes> <post:history> Exporting History for selected ID : ' + selectedId);			
			}
			selectedId = undefined;			
		} else {
			selectedId = req.body.marketId;
			if(req.body.operation == 'delete') {
				sysLogger.notice('<routes> <post:history> Deleting History for selected ID : ' + selectedId);
				apictrl.removehistory( '1.' + selectedId);	
			} else if(req.body.operation == 'deleteall') {
				sysLogger.notice('<routes> <post:history> Deleting complete History');
				apictrl.removecompletehistory();	
			}	
			apictrl.history(req, res);					
		}
	} catch (ex) {
		sysLogger.error('<routes> <post:history> ' +  ex);	
	}	

}); 

}