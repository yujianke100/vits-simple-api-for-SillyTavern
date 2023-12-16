// ==UserScript==
// @name         vits-simple-api for SillyTavern
// @namespace    https://github.com/yujianke100/vits-simple-api-for-SillyTavern
// @version      0.1
// @license MIT
// @description  Add a button to each chat message to play it using TTS API
// @author       shinshi
// @match        *://*:*8000/*
// @grant        GM_xmlhttpRequest
// ==/UserScript==
 
(function() {
    'use strict';
 
    // Function to add TTS button to each chat message
    function addTTSButton(message) {
        if (!message.querySelector('.tts-button')) {
            const button = document.createElement('button');
            button.innerText = 'TTS';
            button.classList.add('tts-button');
 
            button.addEventListener('click', () => {
                console.log('TTS button clicked');
                const messageText = message.querySelector('.mes_text').innerText;
                console.log('TTS for:', messageText);
                playTTS(messageText);
            });
 
            const buttonsContainer = message.querySelector('.mes_buttons');
            if (buttonsContainer) {
                buttonsContainer.appendChild(button);
                console.log('TTS button added');
            }
        }
    }
 
    // Function to send text to TTS API and play response
    function playTTS(text) {
        console.log('Sending text to TTS API:', text);
        const apiUrl = `http://127.0.0.1:23456/voice/bert-vits2?text=${encodeURIComponent(text)}&id=0&noise=0.5&noisew=0.5`;
 
        GM_xmlhttpRequest({
            method: 'GET',
            url: apiUrl,
            responseType: 'blob', // 重要：期望一个二进制响应
            onload: function(response) {
                // 将响应的 Blob 转换为 URL
                const audioUrl = URL.createObjectURL(response.response);
                const audio = new Audio(audioUrl);
                audio.play().catch(e => console.error('Audio play error:', e));
            },
            onerror: function(error) {
                console.error('TTS API Error:', error);
            }
        });
    }
 
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
