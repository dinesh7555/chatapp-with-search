from fastapi import APIRouter, Depends, HTTPException, Query
from auth import require_student
from pydantic import BaseModel
from typing import Optional
import uuid
from langchain_core.messages import HumanMessage
from services.personalized_course_service import get_course_agent, generate_lesson_content, generate_quiz_content
from services.chat_service import (
    create_personalized_subject, 
    get_course_module, 
    store_course_module,
    get_course_details,
    get_formalized_syllabus
)

router = APIRouter(prefix="/personalized", tags=["Personalized Courses"])

class StartCourseRequest(BaseModel):
    topic: str

class AnswerRequest(BaseModel):
    answer: str

class ReviewRequest(BaseModel):
    approved: bool
    feedback: Optional[str] = None

@router.post("/start")
async def start_personalized_course(
    req: StartCourseRequest,
    current_user = Depends(require_student)
):
    """Initializes a new LangGraph session for a personalized course."""
    course_id = str(uuid.uuid4())
    
    # Track it in Neo4j as a subject
    create_personalized_subject(current_user.id, course_id, req.topic)
    
    agent = await get_course_agent()
    
    config = {"configurable": {"thread_id": course_id}}
    
    # Initialize state and run until it hits the first break (human-in-the-loop logic)
    initial_state = {
        "topic": req.topic, 
        "onboarding_step": 0,
        "session_id": course_id
    }
    
    result = await agent.ainvoke(initial_state, config=config)
    
    messages = result.get("messages", [])
    last_ai_message = messages[-1].content if messages and messages[-1].type == "ai" else "Why do you want to learn this?"
    
    return {"status": "success", "course_id": course_id, "next_action": "answer_question", "message": last_ai_message}

@router.post("/{course_id}/generate_syllabus")
async def generate_syllabus_endpoint(
    course_id: str,
    current_user = Depends(require_student)
):
    """Triggers the profile and syllabus building phase after onboarding completes."""
    agent = await get_course_agent()
    config = {"configurable": {"thread_id": course_id}}
    
    # We do not pass any state updates; we just invoke to resume the graph.
    # The START node will conditionally route to profile_builder based on onboarding_step.
    result = await agent.ainvoke(None, config=config)
    
    updated_state = result
    if updated_state.get("syllabus"):
        return {"status": "success", "next_action": "review_syllabus", "syllabus": updated_state["syllabus"]}
        
    return {"status": "error", "message": "Failed to generate syllabus."}

@router.post("/{course_id}/answer")
async def answer_onboarding_question(
    course_id: str,
    req: AnswerRequest,
    current_user = Depends(require_student)
):
    """Submits an answer to the current onboarding question and advances the state."""
    agent = await get_course_agent()
    config = {"configurable": {"thread_id": course_id}}
    
    # Get current step
    state_snap = await agent.aget_state(config)
    current_state = state_snap.values
    step = current_state.get("onboarding_step", 0)
    
    # Provide the human response and increment the step
    user_msg = HumanMessage(content=req.answer)
    update = {
        "messages": [user_msg],
        "onboarding_step": step + 1
    }
    
    result = await agent.ainvoke(update, config=config)
    
    # Check if we moved to syllabus generation (profile_builder -> syllabus_generator -> human_checkpoint)
    # The output will pause at human_checkpoint (we use conditional logic)
    # Wait, in LangGraph 0.1/0.2, if it breaks at human_checkpoint, we can check state.
    
    # Check if we moved to syllabus generation
    updated_state = result
    
    if updated_state.get("syllabus"):
        return {"status": "success", "next_action": "review_syllabus", "syllabus": updated_state["syllabus"]}
        
    messages = updated_state.get("messages", [])
    last_ai_message = messages[-1].content if messages and messages[-1].type == "ai" else "Moving on..."

    if "[[COMPLETE]]" in last_ai_message:
        # Clean up the token for display
        clean_message = last_ai_message.replace("[[COMPLETE]]", "").strip()
        return {"status": "success", "next_action": "generate_syllabus", "message": clean_message}
        
    return {"status": "success", "next_action": "answer_question", "message": last_ai_message}

@router.post("/{course_id}/syllabus/review")
async def review_syllabus(
    course_id: str,
    req: ReviewRequest,
    current_user = Depends(require_student)
):
    """Handles student approval or feedback on the generated syllabus."""
    agent = await get_course_agent()
    config = {"configurable": {"thread_id": course_id}}
    
    if req.approved:
        # Move forward, the edge condition says if no feedback, go content_generator
        update = {"revision_feedback": None}
    else:
        # Provide feedback to syllabus_reviser
        update = {"revision_feedback": req.feedback}
        
    result = await agent.ainvoke(update, config=config)
    
    updated_state = result
    
    if req.approved:
        # Formalize the syllabus structure in Neo4j immediately upon approval
        from services.chat_service import formalize_syllabus
        hierarchical = updated_state.get("hierarchical_syllabus", [])
        topic_name = updated_state.get("topic", "Personalized Course")
        
        formalize_syllabus(
            user_id=current_user.id,
            course_id=course_id,
            topic=topic_name,
            hierarchical_syllabus=hierarchical,
            learner_profile=updated_state.get("learner_profile")
        )
        
        return {"status": "success", "next_action": "view_module", "current_module_index": updated_state.get("current_module_index", 0)}
    else:
        return {
            "status": "success", 
            "next_action": "review_syllabus", 
            "syllabus": updated_state.get("syllabus", []),
            "hierarchical_syllabus": updated_state.get("hierarchical_syllabus", [])
        }

@router.get("/{course_id}/content/{module_id}")
async def get_module_content(
    course_id: str,
    module_id: str,
    current_user = Depends(require_student)
):
    """Fetches on-demand content for the specified module."""
    agent = await get_course_agent()
    config = {"configurable": {"thread_id": course_id}}
    
    state_snap = await agent.aget_state(config)
    current_state = state_snap.values
    
    if module_id == "current_module":
        # Collect all AI messages since the last human message (includes both content and quiz)
        messages = current_state.get("messages", [])
        ai_messages = []
        for msg in reversed(messages):
            if msg.type == "human":
                break
            if msg.type == "ai":
                ai_messages.append(msg.content)
                
        # Combine them in original chronological order
        ai_messages.reverse()
        content = "\n\n".join(ai_messages)
        return {"content": content}
        
    # If the user explicitly asks for a non-current module index
    try:
        target_idx = int(module_id)
        
        # 1. Check Cache in Neo4j
        cached = get_course_module(course_id, target_idx)
        if cached:
            # cached is now a dict {"content": "...", "quiz": [...]}
            return {"content": cached["content"], "quiz": cached["quiz"]}
            
        # 2. Cache miss: generate just this module
        topic = current_state.get("topic", "")
        profile = current_state.get("learner_profile", {})
        syl = current_state.get("syllabus", [])
        
        # 3. Fallback to Neo4j if graph state was cleared or lost
        if not topic or not syl:
            details = get_course_details(course_id)
            if details:
                topic = details["topic"]
                profile = details["learner_profile"]
                
                hierarchical = get_formalized_syllabus(course_id)
                if hierarchical:
                    syl = []
                    for chapter in hierarchical:
                        ch_title = chapter.get("chapter_title", "General")
                        for t in chapter.get("topics", []):
                            t["chapter_title"] = ch_title
                            syl.append(t)

        if not syl or target_idx >= len(syl):
            return {"content": "Module not found.", "quiz": []}
            
        module = syl[target_idx]
        
        # Invoke inner decoupled utilities
        ai_content = await generate_lesson_content(topic, module, profile, syl)
        ai_quiz = await generate_quiz_content(module.get("title", "")) # returns list of dicts
        
        # We no longer append quiz to final_content!
        final_content = ai_content
        
        # Determine hierarchy context
        syl = current_state.get("syllabus", [])
        if target_idx < len(syl):
            ch_title = syl[target_idx].get("chapter_title", "General")
            topic_title = syl[target_idx].get("title", f"Topic {target_idx}")
        else:
            ch_title = "General"
            topic_title = f"Topic {target_idx}"
        
        # 3. Store Cache dynamically building the Unit -> Topic tree
        store_course_module(course_id, target_idx, ch_title, topic_title, final_content, ai_quiz)
        
        return {"content": final_content, "quiz": ai_quiz}
        
    except ValueError:
        return {"content": "Invalid module ID requested."}

@router.get("/{course_id}/state")
async def get_course_state(
    course_id: str,
    current_user = Depends(require_student)
):
    """Fetches the current state of the personalized course, including the syllabus."""
    agent = await get_course_agent()
    config = {"configurable": {"thread_id": course_id}}
    
    state_snap = await agent.aget_state(config)
    current_state = state_snap.values
    
    hierarchical = current_state.get("hierarchical_syllabus", [])
    syl = current_state.get("syllabus", [])
    topic = current_state.get("topic")
    
    # Fallback to Neo4j if agent state is lost (e.g. server restart with MemorySaver)
    if not hierarchical:
        from services.chat_service import get_formalized_syllabus
        hierarchical = get_formalized_syllabus(course_id)
        
        # If we found it in Neo4j, reconstruct the flattened syllabus for tracking
        if hierarchical:
            syl = []
            for chapter in hierarchical:
                ch_title = chapter.get("chapter_title", "General")
                for t in chapter.get("topics", []):
                    t["chapter_title"] = ch_title
                    syl.append(t)
    
    return {
        "topic": topic,
        "syllabus": syl,
        "hierarchical_syllabus": hierarchical,
        "current_module_index": current_state.get("current_module_index", 0),
        "completed_modules": current_state.get("completed_modules", [])
    }
