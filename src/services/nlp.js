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

export const isPromotional = async (text, whitelistedKeywords = []) => {
    // Advanced prompt engineering for crypto communities
    let systemContent = `You are a moderator for a cryptocurrency and Web3 community Telegram chat. Your task is to analyze messages and determine if they are promotional spam.

    You must distinguish between legitimate "hype" or community discussion versus actual unwanted spam.

    - ACCEPTABLE (low score): Messages discussing price, potential gains (e.g., "100x", "to the moon"), partnerships, or general project enthusiasm.
    - SPAM (high score): Messages containing unsolicited links to other projects, requests for DMs, phishing attempts, impersonating admins, or obvious scams.

    Respond with a JSON object containing "isSpam" (boolean) and "score" (a float from 0 to 1).`;

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
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(response.data.choices[0].message.content);
        return result;

    } catch (error) {
        logger.error('Error classifying text with NLP service:', error.response?.data || error.message);
        return { isSpam: false, score: 0 };
    }
};