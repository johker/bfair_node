/**
 * Splits queries into batches to overcome TOO_MUCH_DATA restrictions  
 */

  var env = process.env.NODE_ENV || 'development'
	,  root = '../../../'
	, config = require(root + 'config/config')[env]
	, _ = require('underscore')	
	, batchct = 1 // number of batches
	, mbatches = []
	, currbatch = []
	, nextbatch = 0;
	

function increaseBatchCt() {
	batchct++;
	if(batchct > config.api.batch.max) {
		console.log(batchct +', ' + config.api.batch.max);		
		throw new Error('Market ID imit exceeded');
	}
}

function decreaseBatchCt() {
	batchct--;
}
	
exports.getBatchCt = function() {
	return batchct;
}

function containsId(list, obj) {
 	var res = _.find(list, function(val){ 
 		return _.isEqual(obj.id, val.id)
 	});
 	return (_.isObject(res))? true:false;
}

exports.notEmpty = function() {
	return currbatch.length > 0 || mbatches.length > 0;
}

/**
* Returns next batch according to internal counter
*/
exports.getNextBatch = function() {
	if(nextbatch > (mbatches.length - 1) && currbatch.length == 0
		|| nextbatch > (mbatches.length) && currbatch.length != 0) {
		nextbatch = 0;
	} else {
		nextbatch++;
	}
	//sysLogger.debug('<batch> <getNextBatch> nextBatch index = ' + nextbatch);
	if(nextbatch < mbatches.length) {
		return mbatches[nextbatch];
	} else {
		return currbatch;
	}
}
	
/** 
* Add market generated by marketfactory.js to vacant batch. Assumption: no duplicates
*/ 	
exports.addMarket = function(market) {
	sysLogger.debug('<batch> <addMarketId> id = ' + market.getId());
	// add to current batch if possible 
	if(currbatch.length < config.api.batch.size) { 
		currbatch.push(market);
	} else { // create another batch
		mbatches.push(currbatch);
		increaseBatchCt();
		currbatch = []; 
		currbatch.push(market); 
	}	
}



exports.removeMarket = function(market) {
	var mid = market.getId();
	sysLogger.debug('<batch> <removeMarketId> ' + mid);
	
	if(containsId(currbatch,market)) {
		sysLogger.debug('<batch> <removeMarketId> Remove mid ' +  mid + ' from currentBatch');
		currbatch = _.without(currbatch, _.findWhere(currbatch, {id: mid}));
		return; 
	}
	for(var i = mbatches.length -1; i >= 0; i--) {
		if(containsId(mbatches[i], market)) {
			sysLogger.debug('<batch> <removeMarketId> Remove mid ' + mid + 'from batch nr ' + (i+1)  );
			var tempbatch = _.without(mbatches[i], _.findWhere(mbatches[i], {id: mid}));
			// fill hole with last entry of current batch
			if(currbatch.length == 0) {
				currbatch = mbatches[mbatches.length -1];
				mbatches.splice(mbatches.length -1,1);
				decreaseBatchCt();
			}
			tempbatch.push(currbatch[currbatch.length-1]);
			mbatches[i] = tempbatch; 
			currbatch = _.without(currbatch, currbatch[currbatch.length-1]);
		}
	}
}


/**
* Contents of all batches returned as an array for testing purposes
*/
exports.getAllMarkets = function() {
	var mids = [];
	for(var i = 0; i < mbatches.length; i++) {
		for(var j = 0; j < mbatches[i].length; j++)
			mids.push({batch: (i+1), mid: mbatches[i][j]});
	}
	for(var k = 0; k < currbatch.length; k++) {
		mids.push({batch: (i+1) , mid: currbatch[k]});
	}
	return mids;
}


