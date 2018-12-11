var Twitter = require('twitter');
var fs = require('fs');

//data from an earlier api call to get all members of the senate. See proPublica_apiCalls.txt to see the exact call. 
let members = require('./senateMembers.json');

var client = new Twitter({
    consumer_key: 'INSERT CONSUMER KEY',
    consumer_secret: 'INSERT CONSUMER SECRET',
    access_token_key: 'INSERT ACCESS TOKEN KEY',
    access_token_secret: 'INSERT ACCESS TOKEN SECRET'
});

let allTweets = [];

//only grab tweets after this date.
let cutoffDate = new Date('2018 11 28');

//only look @ senators who have a twitter_account; 
members = members.filter(m => m.twitter_account);

//for each member, grab their tweets since Nov 28 2018; 
for (const member of members) {

    var params = {
        screen_name: member.twitter_account,
        tweet_mode: 'extended',
        "count": 60
    };

    client.get('statuses/user_timeline', params, function (error, tweets, response) {
        if (!error) {

            //filter to only tweets after Nov 28th 2018.
            tweets = tweets.filter(tweet => new Date(tweet.created_at) > cutoffDate);

            allTweets = allTweets.concat(tweets);

            fs.writeFile('senateTweets.json', JSON.stringify(allTweets), 'utf8', (err) => {
                if (err) throw err;
            });
        } else {
            console.log(error)
        }
    });
}