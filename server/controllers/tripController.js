var elasticClient = require('../config/elasticsearch');

module.exports = {
  /**
    Returns the mean temperature/ humidity/...
    from start to end date, for a given zipcode
    which is set to 94107 for now, the only
    available zipcode in San Francisco.
  */
  dateActivity: function(req, res, next){
    var zipcode = req.body.zipcode || 94107;
    var start_date = req.body.start_date || "12/12/2013 00:00";
    console.log("START DATE",start_date);
    var end_date = req.body.end_date || "12/13/2013 00:00";
    var field = req.body.field || "start_terminal";
    elasticClient.search({
      index: 'bikeshare',
      type: 'trip',
      body: { 
        "query": {
          "filtered": {
            "filter": {
              "range": {
                "start_date": {
                  "lte": end_date,
                  "gte": start_date
                }
              }
            }
          }
        },
        "aggs": {
          "activity_per_hour" : {
            "date_histogram" : {
              "field" : "start_date", 
              "interval" : "hour"
            }
          } 
        }
      }
    }).then(function (resp) {
      var hits = resp.hits.hits;
      console.log("TRIP ",resp);
      res.json(resp);
    }, function (err) {
      res.json({"message": "oh no"})
      console.trace(err.message);
    });
  },
  stationActivity: function (req, res, next) {
    var zipcode = req.body.zipcode || 94107;
    var start_date = req.body.start_date || "12/12/2013 00:00";
    console.log("START DATE",start_date);
    var end_date = req.body.end_date || "12/13/2013 00:00";
    var field = req.body.field || "start_terminal";
    elasticClient.search({
      index: 'bikeshare',
      type: 'trip',
      body: { 
        "query": {
          "filtered": {
            "filter": {
              "range": {
                "start_date": {
                  "lte": end_date,
                  "gte": start_date
                }
              }
            }
          }
        },
        "aggs": {
          // "sort" : [
          //     {"start_terminal" : {"order" : "asc"}}
          // ],
          "activity_per_station": {
            "terms": {
              "field": field,
              "size": 700,
               "order": {
                 "_count": "desc"
               }
            },
            "aggs" : {
              "activity_per_hour" : { "date_histogram" : { "field" : "start_date", "interval" : "hour"} }
            }
          }
        }
      }
    }).then(function (resp) {
      var hits = resp.hits.hits;
      console.log("TRIP ",resp);
      res.json(resp);
    }, function (err) {
      res.json({"message": "oh no"})
      console.trace(err.message);
    });
  },
  bikesAvailable: function (req, res, next) {
    var zipcode = req.body.zipcode || 94107;
    var start_date = req.body.start_date || "2014/02/09 00:00:00";
    console.log("START DATE",start_date);
    var end_date = req.body.end_date || "2014/02/09 00:00:05";
    var field = req.body.field || "start_terminal";
    elasticClient.search({
      index: 'bikeshare',
      type: 'rebalancing',
      body: { 
          "aggs": {
            "first_daily_event": {
              "filter": {
                "bool": {
                  "must": {
                    "and": [{
                      "range": {
                          "time": {
                              "gte": start_date,
                              "lte": end_date
                          }
                      }
                  },
                  {
                      "range": {
                          "station_id": {
                              "gte": "41",
                              "lte": "82"
                          }
                      }
                  }]
              }
          }
      },
      "aggs": {
          "station_group": {
              "terms": {
                  "field": "station_id"
              },
              "aggs": {
                  "lowest_score_top_hits": {
                    "top_hits": {
                      "size":1,
                      "sort": [{"time": {"order": "asc"}}]
                    }
                  }
                }
              }
            }
          }
        }
      }
    }).then(function (resp) {
      var hits = resp.hits.hits;
      console.log("TRIP ",resp);
      res.json(resp);
    }, function (err) {
      res.json({"message": "oh no"})
      console.trace(err.message);
    });
  }


};