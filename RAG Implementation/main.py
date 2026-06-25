from fastapi import FastAPI, UploadFile, File, Depends, HTTPException
from pydantic import BaseModel
from rag import load_and_split, index_and_store, make_agent, run_query, model
from sqlalchemy.orm import Session
from database import get_db, Base, engine
from models import User, Document, Conversation, Message
from auth_utils import hash_password, verify_password, create_access_token, get_current_user
from typing import Optional



app =FastAPI()


Base.metadata.create_all(bind=engine)

class QueryRequest(BaseModel):
    query: str
    document_id: int

class SignupRequest(BaseModel):
    email: str
    password: str

class LoginRequest(BaseModel):
    email:str
    password:str

@app.post("/upload")
async def upload_file(
    file:UploadFile=File(), 
    current_user: str=Depends(get_current_user),
    db: Session=Depends(get_db)
    ):

    user = db.query(User).filter(User.email ==  current_user).first()

    # Save file to disk
    contents = await file.read()
    with open(file.filename,"wb") as f:
        f.write(contents)

    #Create Document row
    new_document = Document(filename=file.filename, user_id = user.id)
    db.add(new_document)
    db.commit()
    db.refresh(new_document)
    
    splits = load_and_split(file.filename)
    doc_ids = index_and_store(splits, new_document.id)

    
    return {"message": "PDF uploaded successfully", "chunks": len(splits), "document_id":new_document.id}

@app.post("/ask")
async def ask_query(request:  QueryRequest, 
                    current_user: str = Depends(get_current_user),
                    db: Session= Depends(get_db)
                    ):
    user = db.query(User).filter(User.email == current_user).first()

    #Create conversation
    conversation = db.query(Conversation).filter(
        Conversation.document_id == request.document_id,
        Conversation.user_id == user.id
    ).first()

    if not conversation:
        conversation = Conversation(document_id=request.document_id, user_id=user.id)
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    #Save question as message
    user_message = Message(conversation_id=conversation.id, role="user", content=request.query)
    db.add(user_message)
    db.commit()

    #Load all messages of conversation
    all_messages = db.query(Message).filter(
        Message.conversation_id == conversation.id
    ).order_by(Message.created_at).all()

    history = [{"role": m.role, "content": m.content} for m in all_messages]


    agent=make_agent(model, request.document_id)
    answer = run_query(history, agent)
    ai_message = Message(conversation_id=conversation.id, role="assistant", content=answer)
    db.add(ai_message)
    db.commit()

    return {"answer": answer, "conversation_id": conversation.id}

@app.post("/signup")
async def signup(request: SignupRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        email=request.email,
        hashed_password=hash_password(request.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User created successfully", "user_id": new_user.id}


@app.post("/login")
async def login(request: LoginRequest, db:Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    access_token =create_access_token(data={"sub":user.email})
    return {"access_token":access_token, "token_type":"bearer"}
