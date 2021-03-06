
var env = process.env.NODE_ENV || 'development'
	, root = '../../../'
 	, config = require(root + 'config/config')[env]
	, history = require(root + 'app/models/db/db_markets')
	, dbutil = require(root + 'util/mongoutil')
	, async = require('async')

 sysLogger = require(root + 'config/winston').getSysLogger()
	

/**
* This removes the listing of finished (passivated) 
* markets which have been marked for logging.  
*/
exports.removePassiveList = function() {
	history.removeAll(function(data, err) {
			sysLogger.notice('<db_clean_prices.removePassiveList> <history.removeAll> Success!'); 
		});  
}  

/**
* Removes all PASSIVATED collections that start with
* the prefix parameter from db. Removes ids from passivation
* list ('price' collection) accordingly. 
* @param {string} prefix - prefix of collection name to delete
* @param {string} db - database name
*/
exports.removePrices = function(prefix, dbname) {
	sysLogger.notice('<db_clean_prices> <removeprices>'); 
	async.waterfall([removeFromDB, removeFromList], function(err,res) {
	    sysLogger.notice('<db_clean_prices> <removePrices> Success!');
	    	
	});
	 
}

/**
* Removes all collections contained in the history table. 
*/
function removeFromDB(callback){
	history.getList(function(data) {
		async.forEach(data, removeItem, function(err) {	
			sysLogger.debug('<db_clean_prices> <removeFromDB> Success!');
		});		
	}); 
	callback();
}

/**
* Removes single collection from DB 
*/
function removeItem(data, callback) {
	dbutil.removeCollection('mid' + data.marketId, callback); 
}


/**
* Removes items from prices collection
*/
function removeFromList(callback) {
	history.removeAll(function(err, numberRemoved) {
		sysLogger.debug('<db_clean_prices> <removeFromList> ' + numberRemoved + ' entry successfully removed.');
		callback();
	});
}


/** 
* Deletes single entry from history by removing 
* it from passive list and its collection from db.
*  @param {string} mid - market ID to be removed.
*/
exports.removeEntry =  function(mid) {
	sysLogger.debug('<db_clean_prices> <removeEntry> mid = ' + mid);
	dbutil.removeCollection('mid' + mid, function(err){
		history.removeEntry(mid, function(err, numberRemoved) {
			sysLogger.debug('<db_clean_prices> <removeEntry> ' + numberRemoved + ' entry successfully removed.');
		}); 	
	});	
}

