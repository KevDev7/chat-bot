// Old Index.js Code for Data Processing and Storage
// import dotenv from 'dotenv';
// dotenv.config();

// import { promises as fs } from 'fs';
// import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
// import { createClient } from '@supabase/supabase-js'
// import { SupabaseVectorStore } from 'langchain/vectorstores/supabase'
// import { OpenAIEmbeddings } from 'langchain/embeddings/openai'

// async function run() {
//   try {
//     // Read the file content using fs.readFile
//     const text = await fs.readFile('scrimba-info.txt', 'utf-8');

//     const splitter = new RecursiveCharacterTextSplitter({
//       chunkSize: 500,
//       separators: ['\n\n', '\n', ' ', ''], // default setting
//       chunkOverlap: 50
//     });

//     const output = await splitter.createDocuments([text]);
    
//     const sbApiKey = process.env.SUPABASE_API_KEY
//     const sbUrl = process.env.SUPABASE_URL_LC_CHATBOT
//     const openAIApiKey = process.env.OPENAI_API_KEY

//     const client = createClient(sbUrl, sbApiKey)

//     await SupabaseVectorStore.fromDocuments(
//       output,
//       new OpenAIEmbeddings({ openAIApiKey }),
//       {
//          client,
//          tableName: 'documents',
//       }
//     )
//   } catch (err) {
//     console.log(err);
//   }
// }

// run();

// Import necessary modules and functions
import { ChatOpenAI } from 'langchain/chat_models/openai'; // OpenAI chat model for generating AI responses
import { PromptTemplate } from 'langchain/prompts'; // Template to structure AI prompts
import { StringOutputParser } from 'langchain/schema/output_parser'; // Parses output from the AI into strings
import { retriever } from '/utils/retriever'; // Custom function to retrieve relevant documents from the database
import { combineDocuments } from '/utils/combineDocuments'; // Combines documents into a single string
import { RunnablePassthrough, RunnableSequence } from "langchain/schema/runnable"; // Handles sequences of operations
import { formatConvHistory } from '/utils/formatConvHistory'; // Formats conversation history for use in prompts

// Attach an event listener to handle form submissions (user input)
document.addEventListener('submit', (e) => {
    e.preventDefault(); // Prevent the form from submitting the traditional way (reloading the page)
    progressConversation(); // Invoke the function to process the conversation
});

// Retrieve the OpenAI API key from environment variables
const openAIApiKey = import.meta.env.VITE_OPENAI_API_KEY;
// Initialize the OpenAI chat model with the API key
const llm = new ChatOpenAI({ openAIApiKey });

// Template to convert user questions into standalone questions using previous conversation history
const standaloneQuestionTemplate = `Given some conversation history (if any) and a question, convert the question to a standalone question. 
conversation history: {conv_history}
question: {question} 
standalone question:`;
const standaloneQuestionPrompt = PromptTemplate.fromTemplate(standaloneQuestionTemplate);

// Template for generating the AI's response based on the context and conversation history
const answerTemplate = `You are a helpful and enthusiastic support bot who can answer a given question about Scrimba based on the context provided and the conversation history. Try to find the answer in the context. If the answer is not given in the context, find the answer in the conversation history if possible. If you really don't know the answer, say "I'm sorry, I don't know the answer to that." And direct the questioner to email help@scrimba.com. Don't try to make up an answer. Always speak as if you were chatting to a friend.
context: {context}
conversation history: {conv_history}
question: {question}
answer: `;
const answerPrompt = PromptTemplate.fromTemplate(answerTemplate);

// Chain for processing the standalone question through the OpenAI model and parsing the output
const standaloneQuestionChain = standaloneQuestionPrompt
    .pipe(llm) // Use the OpenAI model to process the prompt
    .pipe(new StringOutputParser()); // Parse the model's response as a string

// Sequence to retrieve relevant documents based on the standalone question and combine them into a single context
const retrieverChain = RunnableSequence.from([
    prevResult => prevResult.standalone_question, // Extract the standalone question from the previous result
    retriever, // Retrieve relevant documents from the database
    combineDocuments // Combine the retrieved documents into a single string
]);

// Chain for generating the final AI response based on the context and formatted question
const answerChain = answerPrompt
    .pipe(llm) // Use the OpenAI model to generate an answer
    .pipe(new StringOutputParser()); // Parse the model's response as a string

// Sequence that combines all the steps: processing the question, retrieving context, and generating the answer
const chain = RunnableSequence.from([
    {
        standalone_question: standaloneQuestionChain, // Convert the input question into a standalone question
        original_input: new RunnablePassthrough() // Pass the original input through unchanged
    },
    {
        context: retrieverChain, // Retrieve and combine relevant context documents
        question: ({ original_input }) => original_input.question, // Extract the original question
        conv_history: ({ original_input }) => original_input.conv_history // Extract the conversation history
    },
    answerChain // Generate the final AI response
]);

// Initialize an empty array to store the conversation history
const convHistory = [];

// Function to handle the progression of the conversation when the user submits a question
async function progressConversation() {
    // Get user input and the chatbot conversation container
    const userInput = document.getElementById('user-input');
    const chatbotConversation = document.getElementById('chatbot-conversation-container');
    const question = userInput.value; // Capture the user's question
    userInput.value = ''; // Clear the input field

    // Add the user's question to the conversation as a human speech bubble
    const newHumanSpeechBubble = document.createElement('div');
    newHumanSpeechBubble.classList.add('speech', 'speech-human');
    chatbotConversation.appendChild(newHumanSpeechBubble);
    newHumanSpeechBubble.textContent = question;
    chatbotConversation.scrollTop = chatbotConversation.scrollHeight;

    // Invoke the AI processing chain to get the AI's response
    const response = await chain.invoke({
        question: question,
        conv_history: formatConvHistory(convHistory) // Format the conversation history for the AI
    });
    convHistory.push(question); // Add the user's question to the conversation history
    convHistory.push(response); // Add the AI's response to the conversation history

    // Add the AI's response to the conversation as an AI speech bubble
    const newAiSpeechBubble = document.createElement('div');
    newAiSpeechBubble.classList.add('speech', 'speech-ai');
    chatbotConversation.appendChild(newAiSpeechBubble);
    newAiSpeechBubble.textContent = response;
    chatbotConversation.scrollTop = chatbotConversation.scrollHeight;
}