
 /** Local version of active markets - STORED BY EVENT DATE ASCENDING */
var env = process.env.NODE_ENV || 'development'
 , root = '../../../../'
 , servicedir = root + 'app/models/services/'
 , config = require(root + 'config/config')[env]
 , EventEmitter = require('events').EventEmitter
 , util = require('util')
 , sync = require(servicedir + 'markets/synchronize') 
 , strutils = require(root + 'util/stringutil')
 , listutils = require(root + 'util/listutil')
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
	sysLogger.info('<marketObserver> <getList> size = ' + listutils.count(watchedmarkets));
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
	//console.log(listutils.count(watchedmarkets));
	return listutils.count(watchedmarkets);
}

/**
* Emits event with stale market and remove it from the list. 
*/
MarketObserver.prototype.remove = function(id) {
	var self = this;
	sysLogger.debug('<marketobserver> <remove> id = ' + id + ', date: ' + watchedmarkets[id].event.openDate);	
 	app.io.broadcast('removemarket', watchedmarkets[id]);
 	watchedmarkets[id]['passivationTime'] = Date.now();
 	self.emit('stopLogging', watchedmarkets[id]);	
	delete watchedmarkets[id]; 	
}

/**
* Emits event with new market and adds it to the list.
*/ 
MarketObserver.prototype.add = function(market, id) {
	var self = this;
	watchedmarkets[id] = market;
	sysLogger.debug('<marketobserver> <add> id = ' + id + ', date: ' + market.event.openDate); 
	watchedmarkets[id]['activationTime'] = Date.now();	
	app.io.broadcast('addmarket', watchedmarkets[id]);	
	self.emit('logPrices', market);
             
	                              
}

/**
* Update lastRefresh and totalMatched of exisiting markets. Emit 
* event for every updated market. 
*/
MarketObserver.prototype.update = function(market, id) {
	sysLogger.debug('<marketobserver> <update> id = ' + id); 
	app.io.broadcast('updatemarket', watchedmarkets[id.valueOf()]);	   
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
	console.log(incoming); 
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
     	var dtime = first.description.openDate - second.event.openDate;
     	var did = first.marketId - second.marketId;
     	var res = dtime != 0 ? dtime : did
     	return res; 
     });
}

module.exports = MarketObserver;