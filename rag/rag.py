from flask import Flask, request, jsonify
from google.cloud import aiplatform
from langchain.document_loaders import GCSFileLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains import RetrievalQA
from langchain_google_vertexai import VertexAI
from langchain_google_vertexai import VertexAIEmbeddings
from langchain.vectorstores import Chroma
from langchain.prompts import PromptTemplate
from google.cloud import storage


# Initialize Google Cloud
aiplatform.init(project='eth-global', location='us-central1')

# Flask app for handling queries
app = Flask(__name__)


def initialize_agent():
    # Initialize Google Cloud Storage client
    storage_client = storage.Client(project="eth-global")
    
    # Get the bucket
    bucket = storage_client.get_bucket("contract-store-eth-global")
    
    all_docs = []
    
    # List all blobs (files) in the bucket
    blobs = bucket.list_blobs()
    
    for blob in blobs:
        # Load document from Google Cloud Storage
        loader = GCSFileLoader(project_name="eth-global", bucket="contract-store-eth-global", blob=blob.name)
        pages = loader.load()
        
        # Split into chunks
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        docs = text_splitter.split_documents(pages)
        
        all_docs.extend(docs)

    # Set up embeddings and vector store
    embeddings = VertexAIEmbeddings(model_name="textembedding-gecko@latest")
    vectorstore = Chroma.from_documents(all_docs, embeddings)

    return vectorstore


# Initialize vector store and LLM
vectorstore = initialize_agent()
llm = VertexAI(
    model_name="gemini-pro",
    max_output_tokens=500,
    temperature=0.7,
    top_p=0.8,
    top_k=40
)

# Create prompt template for RAG chain
prompt_template = """Use the following pieces of context to answer the question at the end. If you don't know the answer, just say that you don't know, don't try to make up an answer.

{context}

Question: {question}
Answer:"""
PROMPT = PromptTemplate(template=prompt_template, input_variables=["context", "question"])

# Create RAG chain
qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",
    retriever=vectorstore.as_retriever(),
    return_source_documents=True,
    chain_type_kwargs={"prompt": PROMPT}
)

@app.route('/query', methods=['POST'])
def handle_query():
    """
    Endpoint to handle incoming queries.
    """
    data = request.json
    question = data.get('question', '')

    if not question:
        return jsonify({"error": "No question provided"}), 400

    # Run RAG chain on the question
    response = qa_chain(question)
    
    return jsonify({
        "result": response["result"],
        "source_documents": [doc.page_content for doc in response["source_documents"]]
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
