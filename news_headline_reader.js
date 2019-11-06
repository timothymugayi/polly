const AWS = require('aws-sdk');
const Stream = require('stream');
const Speaker = require('speaker');
const axios = require('axios');
const moment = require('moment');

const NEWS_API_KEY = process.env.NEWS_API_KEY || undefined;

// // Create an Polly client
const Polly = new AWS.Polly({
    signatureVersion: 'v4',
    region: 'us-east-1'
});

// Create the Speaker instance
const Player = new Speaker({
    channels: 1,
    bitDepth: 16,
    sampleRate: 16000
});

const textToSpeechConverter = (params) => {
    return new Promise(function(resolve, reject) {
        Polly.synthesizeSpeech(params, (err, data) => {
            if (err) {
                reject(err);
            } else if (data) {
                if (data.AudioStream instanceof Buffer) {
                    // Initiate the source
                    let bufferStream = new Stream.PassThrough();
                    // convert AudioStream into a readable stream
                    bufferStream.end(data.AudioStream);
                    // Pipe into Player
                    bufferStream.pipe(Player);
                    // listen close event and resolve promise
                    Player.on('close', () => {
                        resolve(true)
                    });
                    // listen error event and resolve promise
                    Player.on('error', (err) => {
                        reject(err);
                    });
                    // listen error event and resolve promise
                    bufferStream.on('error', (err) => {
                        reject(err);
                    });
                }
            }
        });
    });
};

let totalHeadlines = 10;
let query = 'Bangladesh politics';
let yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');
axios.get(`https://newsapi.org/v2/everything?q=${query}&from=${yesterday}&sortBy=relevancy&pageSize=${totalHeadlines}&apiKey=${NEWS_API_KEY}`)
    .then(function (response) {

        console.log(response.data);
        console.log(response.data.articles[0].title);

        let voiceId = 'Justin';
        let params = {
            'Text': response.data.articles[5].description,
            'OutputFormat': 'pcm',
            'VoiceId': voiceId
        };
        console.log(params);
        textToSpeechConverter(params, {});
    })
    .catch(function (error) {
        console.log(error.response.data);
    })
    .finally(function () {
        // always executed
    });

process.on('unhandledRejection', (err) => {
    console.error(err);
    process.exit(1)
});