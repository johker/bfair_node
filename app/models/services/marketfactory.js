/**
 * Usage behavior representation of market ids
 */

var root = '../../../'
 , rtc = require(root + 'app/controllers/configcontroller')




 exports.Market = function (id, name, d, eventId, eventName, countryCode) {
 	sysLogger.debug('<marketfactory> <market> New Market generated with id = ' + id);
 	this.id = id;
 	this.name = name;  	
 	this.openDate = d.getTime();
 	this.eventId = eventId; 	
 	this.eventName = eventName;
 	this.countryCode = countryCode;
 	this.activationTime = Date.now();  	
 	this.priceAvailable = false; // Theoeretical price available

 	
 	this.reqct = 0; // Base ticks since last price request 
 	this.nrct = 0; // Request counts since id has not been retrieved 	
 	
 
 	this.isRequested = function() { 	
 		this.reqct++;
 	}
 	
 	this.resetReqCt = function() {
 		this.reqct = 0;
 	}
 	
 	this.getReqCt = function() {
 		return this.reqct;
 	}
 	
 	this.getId = function() {
 		return this.id;
 	}
 	
 	this.remove = function() {
 		return ++(this.nrct) > rtc.getConfig('api.removeBuffer'); 
 	} 	
 	
 	this.setPassivationTime = function(time) {
 		this.passivationTime = time;
 	}
 	
 	

 }