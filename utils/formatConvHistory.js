// Function to format the conversation history into a readable string
export function formatConvHistory(messages) {
    // Iterate over the array of messages and label them alternately as 'Human' and 'AI'.
    // Even-indexed messages are labeled as 'Human', and odd-indexed messages are labeled as 'AI'.
    return messages.map((message, i) => {
        if (i % 2 === 0) {
            return `Human: ${message}`;
        } else {
            return `AI: ${message}`;
        }
    }).join('\n'); // Join all the labeled messages into a single string with each message on a new line
}
