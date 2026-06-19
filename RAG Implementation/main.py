from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
from rag import load_and_split, index_and_store, rag_agent, run_query, model

app =FastAPI()
agent = rag_agent(model)

class QueryRequest(BaseModel):
    query: str

@app.post("/upload")
async def upload_file(file:UploadFile=File()):
    contents = await file.read()
    with open(file.filename,"wb") as f:
        f.write(contents)
    
    splits = load_and_split(file.filename)
    doc_ids = index_and_store(splits)
    return {"message": "PDF uploaded successfully", "chunks": len(splits)}

@app.post("/ask")
async def ask_query(request:  QueryRequest):
    out = run_query(request.query, agent)
    return {"answer": out}
