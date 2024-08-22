import { SupabaseVectorStore } from 'langchain/vectorstores/supabase'; // Manages storage and retrieval of vectorized data from Supabase
import { OpenAIEmbeddings } from 'langchain/embeddings/openai'; // Generates embeddings (vector representations) of text using OpenAI
import { createClient } from '@supabase/supabase-js'; // Creates a client to interact with Supabase

// Retrieve environment variables for API keys and URLs
const openAIApiKey = import.meta.env.VITE_OPENAI_API_KEY;
const sbApiKey = import.meta.env.VITE_SUPABASE_API_KEY;
const sbUrl = import.meta.env.VITE_SUPABASE_URL_LC_CHATBOT;

// Create embeddings using OpenAI's model
const embeddings = new OpenAIEmbeddings({ openAIApiKey });
// Create a Supabase client with the provided URL and API key
const client = createClient(sbUrl, sbApiKey);

// Initialize a vector store in Supabase for storing and retrieving document vectors
const vectorStore = new SupabaseVectorStore(embeddings, {
    client, // The Supabase client used to interact with the database
    tableName: 'documents', // The table where document vectors are stored
    queryName: 'match_documents' // The query used to retrieve matching documents
});

// Create a retriever to find relevant documents based on the embeddings
const retriever = vectorStore.asRetriever();

// Export the retriever so it can be used in other parts of the application
export { retriever };