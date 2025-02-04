from google.cloud import aiplatform
from langchain.document_loaders import GCSFileLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains import RetrievalQA
from langchain_google_vertexai import VertexAI
from langchain_google_vertexai import VertexAIEmbeddings
from langchain.vectorstores import Chroma
from langchain.prompts import PromptTemplate

# Initialize Google Cloud
aiplatform.init(project='eth-global', location='us-central1')

# Load PDF document from Google Cloud Storage
loader = GCSFileLoader(project_name="eth-global", bucket="contract-store-eth-global", blob="music_revenue_contract.pdf")
pages = loader.load()

# Split into chunks
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200
)
docs = text_splitter.split_documents(pages)

# Set up embeddings
embeddings = VertexAIEmbeddings(model_name="textembedding-gecko@latest")

# Create vector store
vectorstore = Chroma.from_documents(docs, embeddings)

# Set up Vertex AI for LLM
llm = VertexAI(
    model_name="gemini-pro",
    max_output_tokens=500,
    temperature=0.7,
    top_p=0.8,
    top_k=40
)

# Create prompt template
prompt_template = """Use the following pieces of context to answer the question at the end. If you don't know the answer, just say that you don't know, don't try to make up an answer.

{context}

Question: {question}
Answer:"""
PROMPT = PromptTemplate(
    template=prompt_template, input_variables=["context", "question"]
)

# Create RAG chain
qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",
    retriever=vectorstore.as_retriever(),
    return_source_documents=True,
    chain_type_kwargs={"prompt": PROMPT}
)

# Query the chain
response = qa_chain("What is my contract split according to the contract?")
print(response["result"])