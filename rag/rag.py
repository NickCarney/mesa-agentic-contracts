from flask import Flask, request, jsonify, send_file
from langchain.docstore.document import Document
from google.cloud import aiplatform
from langchain.document_loaders import GCSFileLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains import RetrievalQA
from langchain_google_vertexai import VertexAI
from langchain_google_vertexai import VertexAIEmbeddings
from langchain.vectorstores import Chroma
from langchain.prompts import PromptTemplate
from google.cloud import storage
import tempfile

# Initialize Google Cloud
aiplatform.init(project='eth-global', location='us-central1')

# Flask app for handling queries
app = Flask(__name__)

# Initialize Google Cloud Storage client
storage_client = storage.Client(project="eth-global")
bucket = storage_client.get_bucket("contract-store-eth-global")
all_docs = []  # Global variable for documents
processed_documents = []

def initialize_agent():
    global all_docs  # Declare we're using the global variable
    global processed_documents
    # List all blobs (files) in the bucket
    blobs = bucket.list_blobs()
    
    for blob in blobs:
        # Load document from Google Cloud Storage
        loader = GCSFileLoader(project_name="eth-global", bucket="contract-store-eth-global", blob=blob.name)
        pages = loader.load()

        metadata = blob.metadata
        jurisdiction = metadata.get('jurisdiction', '')
        
        # Split into chunks
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        docs = text_splitter.split_documents(pages)
        
        # Add documents to global all_docs
        all_docs.extend(docs)
        
        # Add pages with metadata
        for page in pages:
            processed_documents.append(Document(page_content=page.page_content, metadata={"source": blob.name, "jurisdiction": jurisdiction}))


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

@app.route('/contract', methods=['POST'])
def get_contract():
    """
    Endpoint to return the appropriate PDF contract based on the jurisdiction.
    """
    data = request.json
    jurisdiction = data.get('jurisdiction', '')

    if not jurisdiction:
        return jsonify({"error": "No jurisdiction provided"}), 400

    # Find the contract file for the given jurisdiction
    contract_document = None
    for doc in processed_documents:
        if jurisdiction.lower() in doc.metadata['jurisdiction'].lower():
            contract_document = doc
            break
    
    if not contract_document:
        return jsonify({"error": f"No contract found for jurisdiction: {jurisdiction}"}), 404

    # Get the original file name
    original_file_name = contract_document.metadata['source']

    # Download the contract file from GCS
    blob = bucket.blob(original_file_name)
    _, temp_local_filename = tempfile.mkstemp()
    blob.download_to_filename(temp_local_filename)
    
    # Send the file
    return send_file(temp_local_filename, mimetype='application/pdf', as_attachment=True, download_name=f"{jurisdiction}_contract.pdf")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
