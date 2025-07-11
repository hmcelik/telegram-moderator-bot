// src/services/nlp.js

import axios from 'axios';
import config from '../config/index.js';
import logger from '../services/logger.js';

const apiClient = axios.create({
    baseURL: 'https://api.openai.com/v1',
    headers: {
        'Authorization': `Bearer ${config.nlp.apiKey}`,
        'Content-Type': 'application/json',
    },
});

export const isPromotional = async (text) => {
    try {
        const response = await apiClient.post('/chat/completions', {
            model: "gpt-3.5-turbo",
            messages: [{
                role: "system",
                content: `You are a content classifier. Analyze the following text and determine if it is promotional or spam. Respond with a JSON object containing two keys: "isSpam" (boolean) and "score" (a float between 0 and 1).`
            }, {
                role: "user",
                content: text
            }],
            response_format: { type: "json_object" }
        });

        // ✅ CORRECTED: Just parse and return the raw result from the AI.
        const result = JSON.parse(response.data.choices[0].message.content);
        return result;

    } catch (error) {
        logger.error('Error classifying text with NLP service:', error.response?.data || error.message);
        // Default to non-spam on error to be safe
        return { isSpam: false, score: 0 };
    }
};