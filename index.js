const fs = require('fs');
const AWS = require('aws-sdk');
const Stream = require('stream');
const Speaker = require('speaker');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

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

const textToSpeechConverter = (params, configs) => {
    Polly.synthesizeSpeech(params, (err, data) => {
        if (err) {
            throw err;
        } else if (data) {
            if (data.AudioStream instanceof Buffer) {
                // only works with  'OutputFormat': 'pcm'
                // Initiate the source
                let bufferStream = new Stream.PassThrough();
                // convert AudioStream into a readable stream
                bufferStream.end(data.AudioStream);
                // Pipe into Player
                bufferStream.pipe(Player);
            }
        }
    });
};

const url = [
    'https://medium.com/@django.course/quirky-things-programmers-say-98c05b858f72?source=friends_link&sk=3e406922601a0cc9ce528e051d24a1d3',
    'https://medium.com/poetry-after-dark/breath-of-another-85060e466804',
    'https://medium.com/@amirobin259/the-key-strategy-working-together-b6785f842e2d',
    'https://medium.com/@sparshachatterjee36/a-sad-story-dedd9d25970d'
];

puppeteer
    .launch()
    .then(browser => browser.newPage())
    .then(page => {
        return page.goto(url[2]).then(function () {
            return page.content();
        });
    })
    .then(html => {
        const $ = cheerio.load(html);

        let voiceId = 'Justin';
        let story = [];
        let title = $("body h1").text().trim();

        story.push('<speak>');
        let mediumStoryArticle = ['The Title of this medium article is', '<prosody volume=\"loud\">' + title + '</prosody>', 'read by ' + voiceId + '<break strength="strong"/>'].join(' ');
        story.push(mediumStoryArticle);
        $("p").map((_, element) => {
            let text = $(element).text();
            if (text.trim() !== 'Written by') {
                story.push($(element).text());
            }
        });
        story.push('</speak>');

        let params = {
            'Text': story.join(' '),
            'OutputFormat': 'pcm',
            'VoiceId': voiceId,
            'TextType': 'ssml'
        };
        console.log(params);
        textToSpeechConverter(params, {});
    })
    .catch(console.error);