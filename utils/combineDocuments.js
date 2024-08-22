// Function to combine the content of multiple documents into a single string
export function combineDocuments(docs) {
    // Map over the array of documents, extract the page content of each document,
    // and join them together with two newlines between each document.
    return docs.map((doc) => doc.pageContent).join('\n\n');
}
