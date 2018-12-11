var fs = require('fs');

const axios = require("axios");
const apiKey = 'INSERT USER API KEY HERE';

//function that makes the api calls and handles rate limiting (one call every 100 miliseconds) to avoid hitting the limit.
const getData = (url, params = {}, duration = 100) => {
    return new Promise((resolve, reject) => {
        setTimeout(async () => {
            try {
                const response = await axios.get(url, params);
                const data = response.data;
                resolve(data);

            } catch (error) {
                console.log('error', error.message);
                process.exit(1);
                reject();
            }
        }, duration);
    });
};

//data from an earlier api call to get all members of the senate. See proPublica_apiCalls.txt to see the exact call. 
const members = require('./senateMembers.json');

let contributions = [];
(async () => {
    // for each member, grab their independent contributions in 2018; 
    for (const member of members) {
        let url = 'https://api.propublica.org/campaign-finance/v1/2018/candidates/' + member.fec_candidate_id + '/independent_expenditures.json';

        let config = {
            headers: {
                'X-API-Key': apiKey
            }
        }
        let data = await getData(url, config);

        if (data.results) {
            contributions = contributions.concat(data.results);

            //write out a file with all contributions
            fs.writeFile('allContributions.json', JSON.stringify(contributions), 'utf8', (err) => {
                if (err) throw err;
            });
        } 
    }

})();
