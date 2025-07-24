/**
 * @fileoverview Manages all interactions with the OpenAI API for natural language processing.
 * Its primary function is to classify message text as promotional spam or not.
 */

import axios from 'axios';
import config from '../config/index.js';
import logger from '../services/logger.js';

// Create a pre-configured Axios instance for making API requests to OpenAI.
const apiClient = axios.create({
    baseURL: 'https://api.openai.com/v1',
    headers: {
        'Authorization': `Bearer ${config.nlp.apiKey}`,
        'Content-Type': 'application/json',
    },
});

/**
 * Analyzes message text to determine if it is promotional spam.
 *
 * This function uses OpenAI's GPT-3.5-turbo model with a carefully crafted
 * system prompt to get a structured JSON response indicating whether the message
 * is spam and a corresponding confidence score.
 *
 * @param {string} text - The message content to analyze.
 * @param {string[]} [whitelistedKeywords=[]] - A list of keywords to provide as context to the AI.
 * @returns {Promise<{isSpam: boolean, score: number}>} A promise that resolves to an object
 * containing the classification result. Returns a non-spam result on API error.
 */
export const isPromotional = async (text, whitelistedKeywords = []) => {
    // This system prompt is engineered to guide the AI in distinguishing between
    // legitimate community discussion and unsolicited spam within a crypto context.
    let systemContent = `You are a moderator for a cryptocurrency and Web3 community Telegram chat. Your task is to analyze messages and determine if they are promotional spam.

    You must distinguish between legitimate "hype" or community discussion versus actual unwanted spam.

    - ACCEPTABLE (low score): Messages discussing price, potential gains (e.g., "100x", "to the moon"), partnerships, or general project enthusiasm.
    - SPAM (high score): Messages containing unsolicited links to other projects, requests for DMs, phishing attempts, impersonating admins, or obvious scams.

    Respond with a JSON object containing "isSpam" (boolean) and "score" (a float from 0 to 1).`;

    // If context keywords are provided and bypass mode is off, add them to the prompt.
    if (whitelistedKeywords.length > 0 && !config.keywordWhitelistBypass) {
        const keywordList = whitelistedKeywords.join(', ');
        systemContent += `\n\nIMPORTANT CONTEXT: The following topics are whitelisted and should be considered acceptable unless the message is an obvious scam: [${keywordList}].`;
        logger.info(`Sending keywords to AI for context: [${keywordList}]`);
    }

    try {
        const response = await apiClient.post('/chat/completions', {
            model: "gpt-3.5-turbo",
            messages: [{
                role: "system",
                content: systemContent
            }, {
                role: "user",
                content: text
            }],
            // Force the model to output a JSON object.
            response_format: { type: "json_object" }
        });

        // Parse the JSON string from the response content.
        const result = JSON.parse(response.data.choices[0].message.content);
        return result;

    } catch (error) {
        logger.error('Error classifying text with NLP service:', error.response?.data || error.message);
        // Return a default "not spam" response to prevent incorrectly penalizing users on API failure.
        return { isSpam: false, score: 0 };
    }
};