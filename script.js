// ==UserScript==
// @name         vits-simple-api for SillyTavern
// @namespace    https://github.com/yujianke100/vits-simple-api-for-SillyTavern
// @version      1.0.0
// @license MIT
// @description  Add a button to each chat message to play it using TTS API
// @author       shinshi
// @match        http://*:8080*
// @match http://localhost:8080/*
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    let currentAudio = null;
    let readQuotesOnly = false;
    let toggleSwitches = [];

    // Function to add TTS, Stop buttons, and a Toggle button to each chat message
    function addTTSButton(message) {
        if (!message.querySelector('.mytts-button')) {
            const ttsButton = document.createElement('button');
            ttsButton.innerText = 'TTS';
            ttsButton.classList.add('mytts-button', 'action-button');

            const stopButton = document.createElement('button');
            stopButton.innerText = 'Stop';
            stopButton.classList.add('stop-button', 'action-button');

            const toggleButton = document.createElement('button');
            toggleButton.innerText = readQuotesOnly ? 'Quotes' : 'Full Text';
            toggleButton.classList.add('toggle-button', 'action-button');
            updateToggleButtonStyle(toggleButton);

            const handleToggleChange = () => {
                readQuotesOnly = !readQuotesOnly;
                console.log('Read Quotes Only:', readQuotesOnly);
                toggleSwitches.forEach(btn => {
                    btn.innerText = readQuotesOnly ? 'Quotes' : 'Full Text';
                    updateToggleButtonStyle(btn);
                });
            };

            toggleButton.addEventListener('click', handleToggleChange);

            toggleSwitches.push(toggleButton);

            ttsButton.addEventListener('click', () => {
                console.log('TTS button clicked');
                let messageText = message.querySelector('.mes_text').innerText;
                if (readQuotesOnly) {
                    const quotes = messageText.match(/“([^”]*)”/g);
                    messageText = quotes ? quotes.map(quote => quote.replace(/“|”/g, '')).join(' ') : '';
                }
                console.log('TTS for:', messageText);
                playTTS(messageText, ttsButton);
            });

            stopButton.addEventListener('click', () => {
                if (currentAudio) {
                    currentAudio.pause();
                    currentAudio.currentTime = 0;
                    console.log('Audio stopped');
                    updateTTSButtonStyle(null);
                }
            });

            const buttonsContainer = message.querySelector('.mes_buttons');
            if (buttonsContainer) {
                buttonsContainer.appendChild(toggleButton);
                buttonsContainer.appendChild(ttsButton);
                buttonsContainer.appendChild(stopButton);
                console.log('TTS, Stop buttons, and Toggle button added');
            }
        }
    }

    // Function to update the toggle button style
    function updateToggleButtonStyle(button) {
        if (readQuotesOnly) {
            button.style.backgroundColor = 'green';
            button.style.color = 'white';
        } else {
            button.style.backgroundColor = 'white';
            button.style.color = 'black';
        }
    }

    // Function to update the TTS button style
    function updateTTSButtonStyle(button) {
        document.querySelectorAll('.mytts-button').forEach(btn => {
            btn.style.backgroundColor = btn === button ? 'green' : '';
            btn.style.color = btn === button ? 'white' : '';
        });
    }

    // Function to send text to TTS API and play response
    function playTTS(text, ttsButton) {
        console.log('Sending text to TTS API:', text);
        const apiUrl = `http://127.0.0.1:23456/voice/bert-vits2?text=${encodeURIComponent(text)}&id=0&noise=0.5&noisew=0.5`;

        GM_xmlhttpRequest({
            method: 'GET',
            url: apiUrl,
            responseType: 'blob', // Expecting a binary response
            onload: function(response) {
                // Convert the response Blob to a URL
                const audioUrl = URL.createObjectURL(response.response);
                if (currentAudio) {
                    currentAudio.pause();
                    currentAudio.currentTime = 0;
                }
                currentAudio = new Audio(audioUrl);
                currentAudio.play().catch(e => console.error('Audio play error:', e));
                currentAudio.onplay = () => updateTTSButtonStyle(ttsButton);
                currentAudio.onpause = () => updateTTSButtonStyle(null);
                currentAudio.onended = () => updateTTSButtonStyle(null);
            },
            onerror: function(error) {
                console.error('TTS API Error:', error);
            }
        });
    }

    // Adding CSS styles for the buttons
    const style = document.createElement('style');
    style.innerHTML = `
        .action-button {
            background-color: gray;
            color: white;
            border: none;
            padding: 5px 10px;
            margin: 2px;
            cursor: pointer;
        }

        .action-button:hover {
            background-color: lightgray;
        }

        .mytts-button.playing {
            background-color: green;
        }
    `;
    document.head.appendChild(style);

    // Using MutationObserver to dynamically add buttons to new messages
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.addedNodes) {
                mutation.addedNodes.forEach(node => {
                    if (node.classList && node.classList.contains('mes')) {
                        addTTSButton(node);
                    }
                });
            }
        });
    });

    // Start observing
    const config = { childList: true, subtree: true };
    observer.observe(document.body, config);
})();
