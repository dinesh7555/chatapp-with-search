from fastapi import APIRouter, Depends ,BackgroundTasks, HTTPException , Query
from schemas import ChatMessage, QuizSubmission
from services.chat_service import (
    create_chat_session,
    store_message,
    get_chat_history,
    update_chat_title_if_empty , 
    get_first_user_messages , 
    get_user_chat_sessions,
    get_all_user_chat_sessions,
    get_chat_topic,
    find_empty_chat_session,
    set_chat_quiz,
    get_chat_quiz,
    clear_chat_quiz,
    set_chat_code_problem,
    get_chat_code_problem,
    clear_chat_code_problem,
    delete_chat_session,
    is_personalized_subject
)
from services.metrics_service import (
    calculate_metrics,
    update_user_topic_state,
    get_user_topic_state
)
from auth import require_student, require_roles
from services.llm_service import stream_ai_response
from services.vector_service import store_embedding, search_similar
# from services.topic_service import extract_topics_llm
from services.title_service import generate_title_from_messages
from fastapi.responses import StreamingResponse
from services.llm_service import (
    generate_quiz_from_history, 
    evaluate_quiz_answers, 
    detect_topic_shift,
    generate_code_problem_from_history,
    evaluate_code_solution
)
import json
from services.activity_service import update_user_activity
from database import SessionLocal

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

SUBJECT_CURRICULUM = {
    "operating_systems": {
        "title": "Operating Systems",
        "units": [
            {
                "id": "os_unit_1",
                "title": "Chapter I: Process Management",
                "topics": ["what-is-os", "process-management", "cpu-scheduling"],
                "quiz": {"id": "os_quiz_1", "title": "Quiz 1"}
            },
            {
                "id": "os_unit_2",
                "title": "Chapter II: Memory Management",
                "topics": ["memory-management", "paging", "segmentation", "virtual-memory"],
                "quiz": {"id": "os_quiz_2", "title": "Quiz 2"}
            },
            {
                "id": "os_unit_3",
                "title": "Chapter III: Deadlocks & Storage",
                "topics": ["deadlocks", "disk-scheduling", "file-systems"],
                "quiz": {"id": "os_quiz_3", "title": "Quiz 3"}
            }
        ]
    },
    "database_management": {
        "title": "Database Management",
        "units": [
            {
                "id": "db_unit_1",
                "title": "Chapter I: SQL Fundamentals",
                "topics": ["sql-queries", "joins-aggregations"],
                "quiz": {"id": "db_quiz_1", "title": "Quiz 1"}
            },
            {
                "id": "db_unit_2",
                "title": "Chapter II: Database Design",
                "topics": ["er-diagrams", "normalization"],
                "quiz": {"id": "db_quiz_2", "title": "Quiz 2"}
            },
            {
                "id": "db_unit_3",
                "title": "Chapter III: Transactions",
                "topics": ["acid-properties", "transactions", "concurrency-control"],
                "quiz": {"id": "db_quiz_3", "title": "Quiz 3"}
            }
        ]
    },
    "computer_networks": {
        "title": "Computer Networks",
        "units": [
            {
                "id": "cn_unit_1",
                "title": "Chapter I: Network Models",
                "topics": ["osi-model", "tcp-ip-model"],
                "quiz": {"id": "cn_quiz_1", "title": "Quiz 1"}
            },
            {
                "id": "cn_unit_2",
                "title": "Chapter II: Network Layers",
                "topics": ["ipv4-ipv6", "routing-algorithms", "http-protocol"],
                "quiz": {"id": "cn_quiz_2", "title": "Quiz 2"}
            }
        ]
    },
    "data_structures": {
        "title": "Data Structures",
        "units": [
            {
                "id": "ds_unit_1",
                "title": "Chapter I: Linear Structures",
                "topics": ["linked-lists", "stacks-queues"],
                "quiz": {"id": "ds_quiz_1", "title": "Quiz 1"}
            },
            {
                "id": "ds_unit_2",
                "title": "Chapter II: Non-Linear Structures",
                "topics": ["trees-graphs", "sorting-algorithms"],
                "quiz": {"id": "ds_quiz_2", "title": "Quiz 2"}
            }
        ]
    },
    "javascript": {
        "title": "JavaScript",
        "units": [
            {
                "id": "js_unit_1",
                "title": "Chapter I: Core Concepts",
                "topics": ["basics", "dom-manipulation"],
                "quiz": {"id": "js_quiz_1", "title": "Quiz 1"}
            },
            {
                "id": "js_unit_2",
                "title": "Chapter II: Async & ES6",
                "topics": ["async-js", "promises-await"],
                "quiz": {"id": "js_quiz_2", "title": "Quiz 2"}
            }
        ]
    },
    "java": {
        "title": "Java Fundamentals",
        "units": [
            {
                "id": "java_unit_1",
                "title": "Chapter I: OOP Foundations",
                "topics": ["basics", "oops"],
                "quiz": {"id": "java_quiz_1", "title": "Quiz 1"}
            },
            {
                "id": "java_unit_2",
                "title": "Chapter II: Advanced Java",
                "topics": ["interfaces-abstract", "exception-handling"],
                "quiz": {"id": "java_quiz_2", "title": "Quiz 2"}
            }
        ]
    }
}

ALLOWED_SUBJECTS = set(SUBJECT_CURRICULUM.keys())

# Derive flat SUBJECT_TOPICS for backward compatibility with other routes
SUBJECT_TOPICS = {
    subject_id: [topic for unit in data["units"] for topic in unit["topics"]]
    for subject_id, data in SUBJECT_CURRICULUM.items()
}

@router.post("/start")
def start_chat(
    subject_id: str = Query(...),
    topic: str = Query(...),
    current_user = Depends(require_student)
):
    subject_id = subject_id.replace(" ", "_").lower()
    is_pers = is_personalized_subject(subject_id)
    
    if subject_id not in ALLOWED_SUBJECTS and not is_pers:
        raise HTTPException(status_code=400, detail=f"Invalid subject: {subject_id}")

    # Only validate topic against hardcoded list if it's not a personalized course
    if not is_pers:
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
    "database_management": """
You are a Database Management Systems (DBMS) tutor.
You must ONLY answer Database-related questions such as SQL, normalization, indexing, transactions, and concurrency control.

If the user asks anything outside Database Management,
you MUST refuse by saying:

"I am the Database Management assistant and can only answer Database-related questions."

Do not explain further.
Do not answer outside subject.
""",

    "operating_systems": """
You are an Operating Systems (OS) tutor.
You must ONLY answer OS-related questions such as process management, memory management, file systems, and scheduling algorithms.

If the user asks anything outside Operating Systems,
you MUST refuse by saying:

"I am the Operating Systems assistant and can only answer OS-related questions."

Do not explain further.
Do not answer outside subject.
""",

    "computer_networks": """
You are a Computer Networks tutor.
You must ONLY answer Networking-related questions such as the OSI model, TCP/IP, routing, switching, and common protocols (HTTP, DNS, etc.).

If the user asks anything outside Computer Networks,
you MUST refuse by saying:

"I am the Computer Networks assistant and can only answer networking-related questions."

Do not explain further.
Do not answer outside subject.
""",

    "data_structures": """
You are a Data Structures and Algorithms (DSA) tutor.
You must ONLY answer DSA-related questions such as arrays, linked lists, stacks, queues, trees, graphs, and algorithm analysis.

If the user asks anything outside Data Structures and Algorithms,
you MUST refuse by saying:

"I am the Data Structures assistant and can only answer DSA-related questions."

Do not explain further.
Do not answer outside subject.
""",

    "javascript": """
You are a JavaScript tutor.
You must ONLY answer JavaScript-related questions such as syntax, DOM manipulation, async programming, etc.

If the user asks anything outside JavaScript,
you MUST refuse by saying:

"I am the JavaScript assistant and can only answer JavaScript-related questions."

Do not explain further.
Do not answer outside subject.
""",

    "java": """
You are a Java tutor.
You must ONLY answer Java-related questions such as syntax, OOPs concepts (Inheritance, Polymorphism, Encapsulation, Abstraction), collections, exception handling, etc.

If the user asks anything outside Java,
you MUST refuse by saying:

"I am the Java assistant and can only answer Java-related questions."

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
    system_content += "- ANTI-REPETITION: Do NOT repeat the same explanations, definitions, or bullet points if they have already appeared in the conversation history or the context below.\n"
    system_content += "- PROGRESSIVE LEARNING: If the student understands a concept, acknowledge it and move forward. Do NOT re-lecture on topics already covered unless the student clearly shows a misconception.\n"
    system_content += "- STUDY AND LEARN MODE: You are an active tutor. After answering the user's query, you MUST ask a relevant follow-up question to test their understanding.\n"
    system_content += "- If the user is answering a previous question of yours, evaluate their answer, explain any misconceptions, and ask another follow-up question to deepen their knowledge. Promote active recall.\n"

    messages = [
        {"role": "system", "content": system_content}
    ]

    # 2. CONTEXTUAL MEMORY (RAG)
    if semantic_memory:
        memory_texts = []
        # Limit to top 2 to reduce redundancy
        for item in semantic_memory[:2]:
            if isinstance(item, dict):
                text = item.get("text", "")
                if text: memory_texts.append(text)
            else:
                memory_texts.append(str(item))

        if memory_texts:
            messages.append({
                "role": "system",
                "content": f"CONTEXT FROM PAST DISCUSSIONS (Reference only if new): \n{chr(10).join(memory_texts)}"
            })

    # 3. CONVERSATION HISTORY
    for msg in history:
        messages.append({
            "role": "user" if msg["sender"] == "user" else "assistant",
            "content": msg["text"]
        })

    # 4. TUTOR ADAPTIVITY PROTOCOL (Final System Instruction)
    if not user_state:
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
    if subject_id not in ALLOWED_SUBJECTS and not is_personalized_subject(subject_id):
        raise HTTPException(status_code=400, detail="Invalid subject")

    # 1️⃣ Fetch history and check quiz status
    history = get_chat_history(chat_id, current_user.id, subject_id)
    
    quiz_data_db = get_chat_quiz(chat_id)
    if quiz_data_db["quiz_status"] == "pending":
        raise HTTPException(status_code=403, detail="Please complete the pending quiz to continue.")
    
    code_data_db = get_chat_code_problem(chat_id)
    if code_data_db["code_problem_status"] == "pending":
        raise HTTPException(status_code=403, detail="Please complete the pending code problem to continue.")

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

    # 5️⃣ DETECT TOPIC SHIFT / CONCLUSION (Auto-Quiz Trigger)
    is_pers = is_personalized_subject(subject_id)
    if not is_pers and len(history) >= 4:
        is_shift = await detect_topic_shift(history, payload.message)
        if is_shift:
            # Trigger generation for the PREVIOUS history only (exclude current message)
            recent_history = history[-20:]
            if subject_id == "javascript":
                code_problem = await generate_code_problem_from_history(recent_history, subject_id)
                if code_problem:
                    set_chat_code_problem(chat_id, json.dumps(code_problem))
                    return StreamingResponse(
                        iter(["[SYSTEM:CODE_PROBLEM_TRIGGER] I see you're shifting topics. Let's test your JavaScript skills with a quick coding challenge!"]),
                        media_type="text/plain"
                    )
                else:
                    # If code generation fails, we don't fall back to quiz for JS
                    pass
            elif subject_id == "java":
                code_problem = await generate_code_problem_from_history(recent_history, subject_id)
                if code_problem:
                    set_chat_code_problem(chat_id, json.dumps(code_problem))
                    return StreamingResponse(
                        iter(["[SYSTEM:CODE_PROBLEM_TRIGGER] I see you're shifting topics. Let's test your Java skills with a quick coding challenge!"]),
                        media_type="text/plain"
                    )
                else:
                    pass
            else:
                quiz_data = await generate_quiz_from_history(recent_history, subject_id)
                if quiz_data:
                    quiz_json_str = json.dumps(quiz_data)
                    set_chat_quiz(chat_id, quiz_json_str)
                    
                    # Intercept stream and return quiz notification
                    return StreamingResponse(
                        iter(["[SYSTEM:QUIZ_TRIGGER] I see you're ready to move on. Before we continue, let's review what we've learned so far!"]),
                        media_type="text/plain"
                    )

    # 4️⃣ Store USER message immediately (if no quiz triggered)
    try:
        user_seq = store_message(
            chat_id=chat_id,
            user_id=current_user.id,
            subject_id=subject_id,
            sender="user",
            text=payload.message
        )
        
        # ✅ Trigger Activity/Streak Update
        db = SessionLocal()
        try:
            update_user_activity(db, current_user.id, is_heartbeat=False)
        except Exception as e:
            print(f"[Activity Error] Failed to update activity in chat: {e}")
        finally:
            db.close()

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
    if subject_id not in ALLOWED_SUBJECTS and not is_personalized_subject(subject_id):
        raise HTTPException(status_code=400, detail="Invalid subject")

    history = get_chat_history(chat_id, current_user.id, subject_id)
    quiz_data = get_chat_quiz(chat_id)
    code_data = get_chat_code_problem(chat_id)
    return {
        "chat_id": chat_id,
        "subject_id": subject_id,
        "messages": history,
        "quiz_status": quiz_data["quiz_status"],
        "code_problem_status": code_data["code_problem_status"]
    }

@router.post("/{chat_id}/generate-questions")
async def generate_chat_questions(
    chat_id: str,
    subject_id: str = Query(...),
    current_user = Depends(require_student)
):
    if subject_id not in ALLOWED_SUBJECTS and not is_personalized_subject(subject_id):
        raise HTTPException(status_code=400, detail="Invalid subject")
    
    if is_personalized_subject(subject_id):
        raise HTTPException(status_code=403, detail="Quizzes are managed by the course curriculum for personalized subjects.")

    # Check current status
    quiz_data_db = get_chat_quiz(chat_id)
    if quiz_data_db["quiz_status"] == "pending":
        return {"status": "pending", "message": "A quiz is already pending for this session."}

    history = get_chat_history(chat_id, current_user.id, subject_id)
    
    if not history or len(history) < 2:
        raise HTTPException(status_code=400, detail="Not enough context to generate questions.")

    recent_history = history[-20:]
    if subject_id == "javascript":
        code_problem = await generate_code_problem_from_history(recent_history, subject_id)
        if code_problem:
            set_chat_code_problem(chat_id, json.dumps(code_problem))
            return {"status": "success", "message": "Code challenge generated.", "type": "code"}
        else:
            raise HTTPException(status_code=500, detail="Failed to generate code challenge.")
    
    if subject_id == "java":
        code_problem = await generate_code_problem_from_history(recent_history, subject_id)
        if code_problem:
            set_chat_code_problem(chat_id, json.dumps(code_problem))
            return {"status": "success", "message": "Code challenge generated.", "type": "code"}
        else:
            raise HTTPException(status_code=500, detail="Failed to generate code challenge.")

    quiz_data = await generate_quiz_from_history(recent_history, subject_id)
    
    if quiz_data:
        quiz_json_str = json.dumps(quiz_data)
        set_chat_quiz(chat_id, quiz_json_str)
        return {"status": "success", "message": "Quiz generated.", "type": "quiz"}
    else:
        raise HTTPException(status_code=500, detail="Failed to generate quiz.")

@router.get("/{chat_id}/questions")
async def get_chat_questions(
    chat_id: str,
    subject_id: str = Query(...),
    current_user = Depends(require_student)
):
    if subject_id not in ALLOWED_SUBJECTS and not is_personalized_subject(subject_id):
        raise HTTPException(status_code=400, detail="Invalid subject")
    
    quiz_data_db = get_chat_quiz(chat_id)
    if quiz_data_db["quiz_status"] != "pending" or not quiz_data_db["pending_quiz"]:
        return {"quiz": []}
    
    quiz_json = json.loads(quiz_data_db["pending_quiz"])
    return {"quiz": quiz_json}

@router.post("/{chat_id}/submit-quiz")
async def submit_chat_quiz(
    chat_id: str,
    payload: QuizSubmission,
    subject_id: str = Query(...),
    current_user = Depends(require_student)
):
    if subject_id not in ALLOWED_SUBJECTS and not is_personalized_subject(subject_id):
        raise HTTPException(status_code=400, detail="Invalid subject")

    quiz_data_db = get_chat_quiz(chat_id)
    if quiz_data_db["quiz_status"] != "pending":
        raise HTTPException(status_code=400, detail="No pending quiz to submit.")

    # Evaluate using LLM - payload.answers is the list of dicts
    feedback = await evaluate_quiz_answers(payload.answers, subject_id)

    # Store AI feedback in chat
    try:
        store_message(
            chat_id=chat_id,
            user_id=current_user.id,
            subject_id=subject_id,
            sender="ai",
            text=f"### Quiz Evaluation\n\n{feedback}"
        )
        clear_chat_quiz(chat_id)
        # ✅ Trigger Activity Update
        db = SessionLocal()
        try:
            update_user_activity(db, current_user.id, is_heartbeat=False)
        except Exception as e:
            print(f"[Activity Error] Failed to update activity in quiz: {e}")
        finally:
            db.close()

        return {"status": "success", "message": "Quiz evaluated and saved.", "feedback": feedback}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/sessions")
def list_chat_sessions(subject_id: str = Query(...), current_user = Depends(require_student)):
    if subject_id not in ALLOWED_SUBJECTS and not is_personalized_subject(subject_id):
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
    if subject_id not in ALLOWED_SUBJECTS and not is_personalized_subject(subject_id):
        raise HTTPException(status_code=400, detail="Invalid subject")
    
    # If student_id is provided, use it. Otherwise use current user's ID
    target_user_id = student_id if student_id is not None else current_user.id

    state = get_user_topic_state(target_user_id, topic, subject_id)
    return state

@router.get("/{chat_id}/code-problem")
async def get_code_problem(
    chat_id: str,
    subject_id: str = Query(...),
    current_user = Depends(require_student)
):
    if subject_id not in ["javascript", "java"]:
        raise HTTPException(status_code=400, detail="Code problems are only available for JavaScript and Java.")
    
    code_data_db = get_chat_code_problem(chat_id)
    if code_data_db["code_problem_status"] != "pending" or not code_data_db["pending_code_problem"]:
        return {"problem": None}
    
    problem_json = json.loads(code_data_db["pending_code_problem"])
    return {"problem": problem_json}

@router.post("/{chat_id}/submit-code")
async def submit_code(
    chat_id: str,
    payload: dict, # Expecting {"code": "..."}
    subject_id: str = Query(...),
    current_user = Depends(require_student)
):
    if subject_id not in ["javascript", "java"]:
        raise HTTPException(status_code=400, detail="Code problems are only available for JavaScript and Java.")

    code_data_db = get_chat_code_problem(chat_id)
    if code_data_db["code_problem_status"] != "pending":
        raise HTTPException(status_code=400, detail="No pending code problem to submit.")

    problem = json.loads(code_data_db["pending_code_problem"])
    feedback = await evaluate_code_solution(problem, payload.get("code", ""), subject_id)

    # Store AI feedback in chat
    try:
        store_message(
            chat_id=chat_id,
            user_id=current_user.id,
            subject_id=subject_id,
            sender="ai",
            text=f"### Coding Challenge Feedback\n\n{feedback}"
        )
        clear_chat_code_problem(chat_id)
        # ✅ Trigger Activity Update
        db = SessionLocal()
        try:
            update_user_activity(db, current_user.id, is_heartbeat=False)
        except Exception as e:
            print(f"[Activity Error] Failed to update activity in code: {e}")
        finally:
            db.close()

        return {"status": "success", "message": "Code evaluated and saved.", "feedback": feedback}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.delete("/{chat_id}")
def delete_chat(chat_id: str, current_user = Depends(require_student)):
    try:
        # The service function checks if the chat belongs to the user
        delete_chat_session(chat_id, current_user.id)
        return {"status": "success", "message": "Chat session deleted."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

