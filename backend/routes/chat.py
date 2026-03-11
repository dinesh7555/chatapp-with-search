from fastapi import APIRouter, Depends ,BackgroundTasks, HTTPException , Query
from auth import require_student
from schemas import ChatMessage
from services.chat_service import (
    create_chat_session,
    store_message,
    get_chat_history,
    update_chat_title_if_empty , 
    get_first_user_messages , 
    get_user_chat_sessions,
    get_all_user_chat_sessions,
    get_chat_topic,
    find_empty_chat_session
)
from services.metrics_service import (
    calculate_metrics,
    update_user_topic_state,
    get_user_topic_state
)
from auth import require_student, require_roles
from services.llm_service import get_ai_response_with_context , stream_ai_response
from services.vector_service import store_embedding, search_similar
# from services.topic_service import extract_topics_llm
from services.title_service import generate_title_from_messages
from fastapi.responses import StreamingResponse

router = APIRouter(prefix="/chat", tags=["Chat"])

async def process_message_background(
    chat_id: str,
    user_id: int,
    subject_id: str,
    user_seq: int,
    user_text: str,
    ai_seq: int,
    ai_text: str,
    topic: str = None,
    history: list = None
):
    # 🔹 Topics (UNCHANGED)
    # topics = await extract_topics_llm(user_text)
    # if topics:
    #     link_message_to_topics(
    #         chat_id=chat_id,
    #         user_id=user_id,
    #         subject_id=subject_id,
    #         message_sequence=user_seq,
    #         topics=topics
    #     )

    # 🔹 Generate title ONLY after 3rd user message
    user_messages = get_first_user_messages(
        chat_id=chat_id,
        user_id=user_id,
        subject_id=subject_id,
        limit=3
    )
    if len(user_messages) == 3:
        title = await generate_title_from_messages(user_messages)
        print("=======================")
        print(title)
        update_chat_title_if_empty(
            chat_id=chat_id,
            user_id=user_id,
            subject_id=subject_id,
            title=title
        )
    # 🔹 Embeddings (UNCHANGED)
    await store_embedding(
        user_id=user_id,
        subject_id=subject_id,
        message_id=f"{chat_id}:{user_seq}",
        text=user_text
    )

    await store_embedding(
        user_id=user_id,
        subject_id=subject_id,
        message_id=f"{chat_id}:{ai_seq}",
        text=ai_text
    )

    # 🔹 Calculate and update metrics
    if topic:
        # Pass history to calculate_metrics for contextual scoring
        scores = await calculate_metrics(user_text, subject_id=subject_id, topic=topic, history=history)
        print(f"Metrics for topic '{topic}': {scores}")
        update_user_topic_state(user_id, topic,subject_id,scores)


ALLOWED_SUBJECTS = {
    "chemistry",
    "physics",
    "english",
    "social"
}
# 🔹 Hardcoded topics per subject
SUBJECT_TOPICS = {
    "physics": ["mechanics", "optics"],
    "chemistry": ["organic", "inorganic"],
    "english": ["grammar", "literature"],
    "social": ["history", "geography"]
}

# @router.get("/topics")
# def get_topics(subject_id: str = Query(...), current_user = Depends(require_student)):
#     if subject_id not in ALLOWED_SUBJECTS:
#         raise HTTPException(status_code=400, detail="Invalid subject")
    
#     return {
#         "topics": get_topics_for_subject(subject_id)
#     }

# 🔹 STEP 3: Start a new chat session
# @router.post("/start")
# def start_chat(
#     subject_id: str = Query(...), 
#     topic: str = Query(None),
#     current_user = Depends(require_student)
# ):
#     if subject_id not in ALLOWED_SUBJECTS:
#         raise HTTPException(status_code=400, detail="Invalid subject")

#     # If topic is provided, validate it belongs to the subject
#     if topic:
#         valid_topics = get_topics_for_subject(subject_id)
#         if topic not in valid_topics:
#             raise HTTPException(status_code=400, detail=f"Invalid topic for {subject_id}")

#     chat_id = create_chat_session(
#         user_id=current_user.id, 
#         subject_id=subject_id, 
#         topic=topic
#     )
#     return {
#         "chat_id": chat_id,
#         "topic": topic
#     }
@router.post("/start")
def start_chat(
    subject_id: str = Query(...),
    topic: str = Query(...),
    current_user = Depends(require_student)
):
    if subject_id not in ALLOWED_SUBJECTS:
        raise HTTPException(status_code=400, detail="Invalid subject")

    allowed_topics = SUBJECT_TOPICS.get(subject_id, [])
    if topic not in allowed_topics:
        raise HTTPException(status_code=400, detail="Invalid topic for this subject")

    # 🔹 Check for an existing empty chat session for this topic
    existing_chat_id = find_empty_chat_session(
        user_id=current_user.id,
        subject_id=subject_id,
        topic=topic
    )

    if existing_chat_id:
        return {
            "chat_id": existing_chat_id,
            "subject_id": subject_id,
            "topic": topic,
            "reused": True
        }

    chat_id = create_chat_session(
        user_id=current_user.id,
        subject_id=subject_id,
        topic=topic
    )

    return {
        "chat_id": chat_id,
        "subject_id": subject_id,
        "topic": topic
    }


SUBJECT_PROMPTS = {
    "chemistry": """
You are a Chemistry tutor.
You must ONLY answer Chemistry-related questions.

If the user asks anything outside Chemistry,
you MUST refuse by saying:

"I am the Chemistry assistant and can only answer Chemistry-related questions."

Do not explain further.
Do not answer outside subject.
""",

    "physics": """
You are a Physics tutor.
You must ONLY answer Physics-related questions.

If the user asks anything outside Physics,
you MUST refuse by saying:

"I am the Physics assistant and can only answer Physics-related questions."

Do not explain further.
Do not answer outside subject.
""",

    "english": """
You are an English tutor.
You must ONLY answer English-related questions such as grammar, literature, writing, comprehension.

If the user asks anything outside English,
you MUST refuse by saying:

"I am the English assistant and can only answer English-related questions."

Do not explain further.
Do not answer outside subject.
""",

    "social": """
You are a Social Studies tutor.
You must ONLY answer Social Studies related questions such as history, civics, geography, economics.

If the user asks anything outside Social Studies,
you MUST refuse by saying:

"I am the Social Studies assistant and can only answer Social Studies-related questions."

Do not explain further.
Do not answer outside subject.
"""
}

def build_llm_messages(
    history: list,
    new_message: str,
    semantic_memory: list,
    subject_id: str,
    user_state: dict = None
):
    # 1. CORE SYSTEM ROLE & CONSTRAINTS
    subject_prompt = SUBJECT_PROMPTS.get(subject_id, "You are a helpful tutor.")
    
    # Consolidate core identity and constraints into the first message
    system_content = f"{subject_prompt.strip()}\n\n"
    system_content += "CORE CONSTRAINTS:\n"
    system_content += "- Stay strictly within your subject area.\n"
    system_content += "- Be concise but thorough.\n"
    system_content += "- Use Markdown for formatting (bold, lists, etc.).\n"
    system_content += "- IMPORTANT: Use proper spacing. Ensure there's a double newline before and after every list and header.\n"
    system_content += "- For lists, start each item on a new line with a clear bullet point or number.\n"

    messages = [
        {"role": "system", "content": system_content}
    ]

    # 2. CONTEXTUAL MEMORY (RAG)
    if semantic_memory:
        memory_texts = []
        for item in semantic_memory:
            if isinstance(item, dict):
                memory_texts.append(item.get("text", ""))
            else:
                memory_texts.append(str(item))

        messages.append({
            "role": "system",
            "content": f"CONTEXT FROM PAST DISCUSSIONS:\n{chr(10).join(memory_texts)}"
        })

    # 3. CONVERSATION HISTORY
    for msg in history:
        messages.append({
            "role": "user" if msg["sender"] == "user" else "assistant",
            "content": msg["text"]
        })

    # 4. TUTOR ADAPTIVITY PROTOCOL (Final System Instruction)
    if user_state:
        # Helper to map 0-100 to Qualitative labels
        def get_label(val):
            if val < 30: return "LOW"
            if val < 70: return "MEDIUM"
            return "HIGH"

        mastery = user_state.get("mastery_level", 0)
        confusion = user_state.get("confusion_score", 0)
        stress = user_state.get("stress_score", 0)
        pace = user_state.get("learning_pace", 50)
        misconceptions = user_state.get("misconceptions", [])

        adaptivity_prompt = "### TUTOR ADAPTIVITY PROTOCOL\n"
        adaptivity_prompt += f"STUDENT STATE: Mastery: {get_label(mastery)} | Confusion: {get_label(confusion)} | Stress: {get_label(stress)} | Pace: {get_label(pace)}\n"
        
        directives = []
        if confusion >= 50:
            directives.append("- MANDATORY: The student is confused. Use simpler language, break down complex steps, and use concrete analogies.")
        if stress >= 50:
            directives.append("- MANDATORY: The student is stressed. Be highly encouraging, validate their effort, and avoid overwhelming them.")
        if mastery < 40:
            directives.append("- MANDATORY: Focus on foundational concepts. Avoid advanced jargon without explaining it first.")
        if pace > 75:
            directives.append("- OPTIONAL: The student is a fast learner. You may introduce slightly more advanced connections or depth.")
        if misconceptions:
            directives.append(f"- CRITICAL: Address these misconceptions if they surface: {', '.join(misconceptions)}")

        if directives:
            adaptivity_prompt += "\nREQUIRED BEHAVIORAL CHANGES FOR THIS RESPONSE:\n" + "\n".join(directives)

        messages.append({
            "role": "system",
            "content": adaptivity_prompt
        })

    # 5. CURRENT STUDENT QUERY
    messages.append({
        "role": "user",
        "content": new_message
    })

    return messages

@router.post("/{chat_id}/message/stream")
async def send_message_stream(
    chat_id: str,
    payload: ChatMessage,
    background_tasks: BackgroundTasks,
    subject_id: str = Query(...),
    current_user = Depends(require_student)
):
    if subject_id not in ALLOWED_SUBJECTS:
        raise HTTPException(status_code=400, detail="Invalid subject")

    # 1️⃣ Fetch history
    history = get_chat_history(chat_id, current_user.id, subject_id)

    # 2️⃣ Semantic memory
    semantic_memory = await search_similar(
        user_id=current_user.id,
        subject_id=subject_id,
        query=payload.message,
        top_k=3
    )

    # 3️⃣ Get Topic & User State
    topic = get_chat_topic(chat_id, current_user.id,subject_id)
    if topic is None and not history:
        # Check if session exists at all even without messages
        # get_chat_topic returning None means session not found for this user/subject
        raise HTTPException(status_code=404, detail="Chat session not found")

    user_state = get_user_topic_state(current_user.id, topic,subject_id) if topic else None

    # 4️⃣ Build prompt
    llm_messages = build_llm_messages(
        history=history,
        new_message=payload.message,
        semantic_memory=semantic_memory,
        subject_id=subject_id,
        user_state=user_state
    )

    # 4️⃣ Store USER message immediately
    try:
        user_seq = store_message(
            chat_id=chat_id,
            user_id=current_user.id,
            subject_id=subject_id,
            sender="user",
            text=payload.message
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    async def event_generator():
        full_response = ""

        async for token in stream_ai_response(llm_messages):
            full_response += token
            yield token

        # 5️⃣ Store AI message after stream ends
        ai_seq = store_message(
            chat_id=chat_id,
            user_id=current_user.id,
            subject_id=subject_id,
            sender="ai",
            text=full_response
        )

        # 6️⃣ Background tasks (unchanged)
        background_tasks.add_task(
            process_message_background,
            chat_id,
            current_user.id,
            subject_id,
            user_seq,
            payload.message,
            ai_seq,
            full_response,
            topic,
            history[-5:] if history else [] # Pass last 5 messages for context
        )


    return StreamingResponse(
        event_generator(),
        media_type="text/plain"
    )


# # 🔹 STEP 5: Fetch chat history
@router.get("/{chat_id}/history")
def chat_history(
    chat_id: str,
    current_user = Depends(require_student),
    subject_id: str = Query(...)
):
    if subject_id not in ALLOWED_SUBJECTS:
        raise HTTPException(status_code=400, detail="Invalid subject")

    history = get_chat_history(chat_id, current_user.id, subject_id)
    return {
        "chat_id": chat_id,
        "subject_id": subject_id,
        "messages": history
    }

@router.get("/sessions")
def list_chat_sessions(subject_id: str = Query(...), current_user = Depends(require_student)):
    if subject_id not in ALLOWED_SUBJECTS:
        raise HTTPException(status_code=400, detail="Invalid subject")
    sessions = get_user_chat_sessions(current_user.id, subject_id)
    return {
        "sessions": sessions
    }

@router.get("/sessions/all")
def list_all_chat_sessions(current_user = Depends(require_student)):
    sessions = get_all_user_chat_sessions(current_user.id)
    return {
        "sessions": sessions
    }

@router.get("/state")
def get_student_topic_state(
    subject_id: str = Query(...),
    topic: str = Query(...),
    student_id: int = Query(None),
    current_user = Depends(require_roles("teacher", "admin"))
):
    if subject_id not in ALLOWED_SUBJECTS:
        raise HTTPException(status_code=400, detail="Invalid subject")
    
    # If student_id is provided, use it. Otherwise use current user's ID
    target_user_id = student_id if student_id is not None else current_user.id

    state = get_user_topic_state(target_user_id, topic, subject_id)
    return state

