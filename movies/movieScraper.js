
//bechdel.json was obtained from the api call http://bechdeltest.com/api/v1/getAllMovies
const bechdel = require('./bechdel.json');

const apiKey = 'INSERT API KEY'

//Number of movies to fetch
const numMovies = 50;

var fs = require('fs');
var process = require('process');

const axios = require("axios");

//function that makes the api calls and handles rate limiting (one call every 100 miliseconds) to avoid hitting the limit.
const getData = (url, duration = 100) => {
    return new Promise((resolve, reject) => {
        setTimeout(async () => {
            try {
                const response = await axios.get(url);
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

let allMovies = [];
let allPeople = [];
let allCredits = [];

let popularMovies = {
    "total_results": '',
    "results": []
};

let popularMovieApi = 'https://api.themoviedb.org/3/movie/popular?api_key=' + apiKey;


(async () => {

    //Fetch most popular movies 
    for (i = 0; i < numMovies; i++) {
        let query = popularMovieApi + String(i + 1)
        let popular = await getData(query)
        popularMovies.total_results = popular.total_results;
        for (const result of popular.results) {
            let query = 'https://api.themoviedb.org/3/movie/' + result.id + '/external_ids?api_key=' + apiKey;
            let external_id = await getData(query);
            result.imdb_id = external_id.imdb_id
        }
        popularMovies.results = popularMovies.results.concat(popular.results)
    }

    let topMovies= popularMovies.results;

    //only consider movies with bechdel ratings;
    let selectedMovies = topMovies.results.filter((movie, i) => bechdel.find(b => 'tt' + b.imdbid === movie.imdb_id));

    selectedMovies = selectedMovies.filter((m, i) => i < numMovies);

    // iterate through movies; 
    for (const mov of selectedMovies) {

        //get complete movie information
        let apiQuery = 'https://api.themoviedb.org/3/movie/' + mov.id + '?api_key=' + apiKey;
        let movie = await getData(apiQuery);

        allMovies.push(movie);

        let castQuery = 'https://api.themoviedb.org/3/movie/' + movie.id + '/credits?api_key=' + apiKey;
        let credits = await getData(castQuery);

        allCredits.push(credits);

        for (const c of credits.cast) {

            //see if person is already in people table to avoid duplicate api calls.
            let p = allPeople.find(pp => pp.id === c.id);
            if (p === undefined) {
                let personQuery = 'https://api.themoviedb.org/3/person/' + c.id + '?api_key=' + apiKey;
                let castData = await getData(personQuery);
                allPeople.push(castData)
            }
        }

        for (const c of credits.crew) {

            //see if person is already in people table to avoid duplicate api calls.
            let p = allPeople.find(pp => pp.id === c.id);
            if (p === undefined) {
                //for each crew member, get person info
                let personQuery = 'https://api.themoviedb.org/3/person/' + c.id + '?api_key=' + apiKey;
                let crewData = await getData(personQuery);
                allPeople.push(crewData)
            }
        }

        fs.writeFile('movies.json', JSON.stringify(allMovies), 'utf8', (err) => {
            if (err) throw err;
        });

        fs.writeFile('people.json', JSON.stringify(allPeople), 'utf8', (err) => {
            if (err) throw err;
        });

        fs.writeFile('credits.json', JSON.stringify(allCredits), 'utf8', (err) => {
            if (err) throw err;
        });

    }
})();