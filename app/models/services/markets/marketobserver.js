
 /** Local version of active markets - STORED BY EVENT DATE ASCENDING */
var root = '../../../../'
 , servicedir = root + 'app/models/services/'
 , rtc = require(root + 'app/controllers/configcontroller')
 , EventEmitter = require('events').EventEmitter
 , util = require('util')
 , sync = require(servicedir + 'markets/synchronize') 
 , strutils = require(root + 'util/stringutil')
 , listutils = require(root + 'util/listutil')
 , marketfactory = require(servicedir + 'marketfactory') 
 , watchedmarkets = {}
 , mid = 'marketId'




/**
* MarketObserver Constructor 
*/
var MarketObserver = function MarketObserver () {
 };
 
util.inherits(MarketObserver, EventEmitter);
 
/**
* Return locally stored markets list
* TODO: use undescore
*/
MarketObserver.prototype.getList = function() {
	sysLogger.debug('<marketObserver> <getList> size = ' + listutils.count(watchedmarkets));
	var innerArray = [];
	for (property in watchedmarkets) {
	    innerArray.push(watchedmarkets[property]);
	}
	return innerArray;
}

/**
* Return locally stored markets list size
*/
MarketObserver.prototype.getSize = function() {
	return listutils.count(watchedmarkets);
}

/**
* Emits event with stale market and remove it from the list +
* if not-retrieved limit exceeded. 
*/
MarketObserver.prototype.remove = function(id) {
	var self = this;
	sysLogger.debug('<marketobserver> <remove> id = ' + id + ', date: ' + watchedmarkets[id].openDate);	
	if(watchedmarkets[id].remove()) {
		app.io.broadcast('removemarket', watchedmarkets[id]);
 		watchedmarkets[id].setPassivationTime(Date.now());
 		self.emit('stopLogging', watchedmarkets[id]);	
		delete watchedmarkets[id];
	}	 	
}

/**
* Emits event with new market and adds it to the list.
*/ 
MarketObserver.prototype.add = function(market, id) {
	var self = this;
	var openDate = strutils.parseBetfairDate(market.event.openDate);
	tz = strutils.adjustTimezone(openDate);
	watchedmarkets[id] = new marketfactory.Market(id, market.marketName, tz, market.event.id, market.event.name, market.event.countryCode);
	sysLogger.debug('<marketobserver> <add> id = ' + id + ', Open date: ' + openDate); 
	app.io.broadcast('addmarket', watchedmarkets[id]);	
	self.emit('newMarket', watchedmarkets[id]);
             
	                              
}



/**
* Synchronize and find the delta of markets by its id
*/ 
MarketObserver.prototype.synchronize = function(incoming) {
	var self = this;	
	if(incoming == undefined) {
		sysLogger.debug('<marketobserver> <synchronize> incoming == undefined'); 
		return; 
	}	
	sync.markets(watchedmarkets, incoming, mid, self);  
    init = false;	
}


/**
* Sort incoming markets by eventDate ascending, by marketId
* ascending for equal eventDates
* DEPRECATED : done by sort parameter
*/
MarketObserver.prototype.sort = function(markets) {
	markets.sort(function(first, second) {
     	var dtime = first.event.openDate - second.event.openDate;
     	var did = first.marketId - second.marketId;
     	var res = dtime != 0 ? dtime : did
     	return res; 
     });
}

module.exports = MarketObserver;