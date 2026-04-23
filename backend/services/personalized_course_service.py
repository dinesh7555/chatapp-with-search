import uuid
from typing import TypedDict, Annotated, List, Optional
from langgraph.graph import StateGraph, START, END
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

import os
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
MODEL_NAME = "meta-llama/llama-3-8b-instruct" # Or mixtral

llm = ChatOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY,
    model=MODEL_NAME,
)

# 1. State Definition
class Module(TypedDict):
    id: str
    title: str
    description: str

class LearnerProfile(TypedDict):
    goal: str
    time_per_day: str
    timeframe: str
    knowledge_level: str
    learning_style: str

class CourseState(TypedDict):
    topic: str
    learner_profile: Optional[LearnerProfile]
    syllabus: Optional[List[Module]]
    revision_feedback: Optional[str]
    current_module_index: int
    completed_modules: List[str]
    quiz_scores: List[float]
    session_id: str
    
    # Track the current onboarding question index
    onboarding_step: int
    # Hierarchical Syllabus (Chapters -> Topics)
    hierarchical_syllabus: Optional[List[dict]]
    # Temporary storage for chat history or internal thoughts
    messages: Annotated[list, "add"]

# 2. Node Implementations (Skeleton)

from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

# ... existing imports and definitions ...

ONBOARDING_QUESTIONS = [
    {
        "id": "goal",
        "question": "Why do you want to learn {topic}? (e.g., career change, hobby, academic requirement)",
        "options": ["Career Change", "Hobby / Personal Interest", "Academic Requirement", "Upskilling"]
    },
    {
        "id": "time",
        "question": "How much time can you dedicate per day?",
        "options": ["15-30 mins", "1 hour", "2 hours", "4+ hours"]
    },
    {
        "id": "timeframe",
        "question": "In what timeframe do you want to complete it?",
        "options": ["1 week (Crash Course)", "2 weeks", "1 month", "Self-paced"]
    },
    {
        "id": "knowledge",
        "question": "What is your current knowledge level on this topic?",
        "options": ["Absolute Beginner", "Novice (Know basics)", "Intermediate", "Advanced"]
    },
    {
        "id": "style",
        "question": "What is your preferred learning style?",
        "options": ["Reading & Text", "Video Tutorials", "Interactive Quizzes", "Hands-on Projects"]
    }
]

async def onboarding_agent(state: CourseState) -> CourseState:
    print(f"Executing: onboarding_agent for session {state.get('session_id')}")
    topic = state.get("topic", "this topic")
    step = state.get("onboarding_step", 0)
    messages = state.get("messages", [])

    if step < len(ONBOARDING_QUESTIONS):
        q_data = ONBOARDING_QUESTIONS[step]
        question_text = q_data["question"].format(topic=topic)
        options = q_data.get("options", [])
        
        # Append options in a parseable format for the frontend
        formatted_message = f"{question_text}"
        if options:
            formatted_message += f" [[OPTIONS: {', '.join(options)}]]"
            
        print(f"Onboarding step {step}: sending question with options -> {formatted_message}")
        if not messages or (messages and messages[-1].type != "ai"):
            return {"messages": [AIMessage(content=formatted_message)]}
    
    print("Onboarding questions exhausted.")
    return {"messages": [AIMessage(content="Perfect! I have all the details I need. I'm building your personalized syllabus now...")]}

import json

async def profile_builder(state: CourseState) -> CourseState:
    print(f"Executing: profile_builder")
    messages = state.get("messages", [])
    topic = state.get("topic", "")
    
    # Extract only the user answers
    answers = [msg.content for msg in messages if msg.type == "human"]
    
    prompt = f"""
You are an expert educational profiler. Based on the following answers from a student who wants to learn "{topic}", construct a structured LearnerProfile JSON.
Answers:
{answers}

Return ONLY a valid JSON object with these exact keys:
- "goal"
- "time_per_day"
- "timeframe"
- "knowledge_level"
- "learning_style"
"""
    response = await llm.ainvoke([SystemMessage(content=prompt)])
    content = response.content
    
    def extract_json(text):
        try:
            # Try to find the first '{' or '[' and the last '}' or ']'
            start_idx = text.find('{')
            if start_idx == -1: start_idx = text.find('[')
            end_idx = text.rfind('}')
            if end_idx == -1: end_idx = text.rfind(']')
            
            if start_idx != -1 and end_idx != -1:
                return text[start_idx:end_idx+1]
            return text.strip()
        except:
            return text.strip()

    json_str = extract_json(content)
    print(f"Profile Builder raw content snippet: {content[:100]}...")
    
    try:
        profile_data = json.loads(json_str)
        return {"learner_profile": profile_data}
    except Exception as e:
        print(f"Error parsing profile JSON: {e}. Content: {content}")
        # Draft a fallback profile
        fallback = {
            "goal": answers[0] if len(answers) > 0 else "Unknown",
            "time_per_day": answers[1] if len(answers) > 1 else "1 hour",
            "timeframe": answers[2] if len(answers) > 2 else "1 month",
            "knowledge_level": answers[3] if len(answers) > 3 else "beginner",
            "learning_style": answers[4] if len(answers) > 4 else "mixed"
        }
        return {"learner_profile": fallback}

async def syllabus_generator(state: CourseState) -> CourseState:
    print(f"Executing: syllabus_generator")
    profile = state.get("learner_profile", {})
    topic = state.get("topic", "")
    
    prompt = f"""
You are an expert curriculum designer. A student wants to learn "{topic}".
Here is their profile:
Goal: {profile.get('goal')}
Time per day: {profile.get('time_per_day')}
Timeframe: {profile.get('timeframe')}
Current Level: {profile.get('knowledge_level')}
Preferred Style: {profile.get('learning_style')}

Generate a structured syllabus as a JSON array representing Chapters. 
Each Chapter should contain a list of Topics.

Return ONLY a valid JSON array of objects, where each object has:
- "chapter_title": string
- "chapter_description": string
- "topics": array of objects, where each object has:
    - "id": a unique string (e.g. "topic_1")
    - "title": string
    - "description": brief summary of what they will learn
"""
    response = await llm.ainvoke([SystemMessage(content=prompt)])
    content = response.content
    
    def extract_json(text):
        start_idx = text.find('[')
        end_idx = text.rfind(']')
        if start_idx != -1 and end_idx != -1:
            return text[start_idx:end_idx+1]
        return text.strip()

    json_str = extract_json(content)
    print(f"Syllabus Generator raw content snippet: {content[:100]}...")
    
    try:
        raw_syllabus = json.loads(json_str)
        if not isinstance(raw_syllabus, list):
             raise ValueError("Syllabus must be a list")
             
        # Flatten the syllabus back into modules for sequential tracking
        flattened_modules = []
        for chapter in raw_syllabus:
            ch_title = chapter.get("chapter_title", "General")
            topics = chapter.get("topics", [])
            for t in topics:
                t["chapter_title"] = ch_title
                flattened_modules.append(t)
                
        return {"syllabus": flattened_modules, "hierarchical_syllabus": raw_syllabus}
    except Exception as e:
        print(f"Error generating syllabus JSON: {e}. Content: {content}")
        return {"syllabus": [], "hierarchical_syllabus": []}

async def human_checkpoint(state: CourseState) -> CourseState:
    print(f"Executing: human_checkpoint (HITL)")
    # This node primarily acts as a pause. It won't do much natively, 
    # the orchestration logic pauses before or after it.
    return state

async def syllabus_reviser(state: CourseState) -> CourseState:
    print(f"Executing: syllabus_reviser")
    profile = state.get("learner_profile", {})
    topic = state.get("topic", "")
    current_syllabus = state.get("syllabus", [])
    feedback = state.get("revision_feedback", "")
    
    prompt = f"""
You are an expert curriculum designer. You previously generated a syllabus for "{topic}".
The student has provided some feedback to revise it.

Student Profile: {json.dumps(profile)}
Current Syllabus: {json.dumps(current_syllabus)}
Student Feedback: "{feedback}"

Refine and return the updated syllabus based on their feedback.
Generate a structured syllabus as a JSON array representing Chapters.
Each Chapter should contain a list of Topics.

Return ONLY a valid JSON array of objects, where each object has:
- "chapter_title": string
- "chapter_description": string
- "topics": array of objects, where each object has:
    - "id": a unique string (e.g. "topic_1")
    - "title": string
    - "description": brief summary of what they will learn
"""
    response = await llm.ainvoke([SystemMessage(content=prompt)])
    def extract_json(text):
        start_idx = text.find('[')
        end_idx = text.rfind(']')
        if start_idx != -1 and end_idx != -1:
            return text[start_idx:end_idx+1]
        return text.strip()

    json_str = extract_json(response.content)
    print(f"Syllabus Reviser raw content snippet: {response.content[:100]}...")
    
    try:
        raw_syllabus = json.loads(json_str)
        if not isinstance(raw_syllabus, list):
             raise ValueError("Syllabus must be a list")
        
        # Flatten the syllabus back into modules for sequential tracking
        flattened_modules = []
        for chapter in raw_syllabus:
            ch_title = chapter.get("chapter_title", "General")
            topics = chapter.get("topics", [])
            for t in topics:
                t["chapter_title"] = ch_title
                flattened_modules.append(t)
                
        return {"syllabus": flattened_modules, "hierarchical_syllabus": raw_syllabus, "revision_feedback": None}
    except Exception as e:
        print(f"Error revising syllabus: {e}")
        # Notify the user that the revision failed but we kept the previous syllabus
        return {
            "revision_feedback": None,
            "messages": [AIMessage(content="I apologize, but I had trouble understanding the specific curriculum changes you requested. I will proceed with the closest valid syllabus we have.")]
        }

async def generate_lesson_content(topic: str, module: dict, profile: dict, syl: list) -> str:
    prompt = f"""
You are an expert tutor. Create the rich markdown content for the following topic.
Course Topic: {topic}
Chapter Context: {module.get('chapter_title', 'General')}
Target Topic: {module.get('title')}
Description: {module.get('description')}

Student Profile: {json.dumps(profile)}
Full Syllabus Course Map for Context: {json.dumps([{'chapter': m.get('chapter_title'), 'topic': m.get('title')} for m in syl])}

Provide a comprehensive, engaging lesson directly focused on the Target Topic, while ensuring it flows logically within the indicated Chapter Context. Use Markdown.
Include examples and format it beautifully.

IMPORTANT: DO NOT include any interactive elements, quizzes, assessments, or test questions in the markdown content. The quiz will be generated separately and shown via a dedicated interactive modal.
"""
    response = await llm.ainvoke([SystemMessage(content=prompt)])
    return response.content

async def content_generator(state: CourseState) -> CourseState:
    print(f"Executing: content_generator")
    syl = state.get("syllabus", [])
    idx = state.get("current_module_index", 0)
    topic = state.get("topic", "")
    profile = state.get("learner_profile", {})
    
    if idx >= len(syl):
        return state
        
    module = syl[idx]
    content = await generate_lesson_content(topic, module, profile, syl)
    
    return {"messages": [AIMessage(content=content)]}

async def generate_quiz_content(module_title: str) -> list:
    prompt = f"""
Generate a short 3-question multiple choice quiz on the topic: {module_title}.
Crucially, return the result ONLY as a valid JSON array of objects. Do not wrap in markdown or backticks.
Each object in the array must have exactly these keys:
- "question": the question text (string)
- "type": exactly the string "mcq"
- "options": an array of 4 possible answers (array of strings)
- "answer": the exact string of the correct option

Example Format:
[
  {{
    "question": "What is 2+2?",
    "type": "mcq",
    "options": ["1", "2", "3", "4"],
    "answer": "4"
  }}
]
"""
    response = await llm.ainvoke([SystemMessage(content=prompt)])
    content = response.content
    
    def extract_json(text):
        start_idx = text.find('[')
        end_idx = text.rfind(']')
        if start_idx != -1 and end_idx != -1:
            return text[start_idx:end_idx+1]
        return text.strip()

    json_str = extract_json(content)
    try:
        quiz_list = json.loads(json_str)
        if isinstance(quiz_list, list):
            return quiz_list
        return []
    except Exception as e:
        print(f"Error parsing quiz JSON: {e}. Content: {content}")
        return []

async def quiz_node(state: CourseState) -> CourseState:
    print(f"Executing: quiz_node")
    syl = state.get("syllabus", [])
    idx = state.get("current_module_index", 0)
    
    if idx >= len(syl):
        return state
        
    quiz_content = await generate_quiz_content(syl[idx].get('title'))
    return {"messages": [AIMessage(content=quiz_content)]}

async def pace_adapter(state: CourseState) -> CourseState:
    print(f"Executing: pace_adapter")
    # Mark module as completed and advance index
    syl = state.get("syllabus", [])
    idx = state.get("current_module_index", 0)
    completed = state.get("completed_modules", []).copy()
    
    if idx < len(syl):
        mod_id = syl[idx].get("id")
        completed.append(mod_id)
        
    return {"completed_modules": completed, "current_module_index": idx + 1}

async def state_store(state: CourseState) -> CourseState:
    print(f"Executing: state_store")
    # We can use this to sync to Neo4j if needed, or SQLite checkpointer handles it
    return state

# 3. Routing Functions
def route_after_onboarding(state: CourseState):
    # If all questions answered -> pause the graph to flush transition message to UX, 
    # then frontend will trigger the profile building separately.
    step = state.get("onboarding_step", 0)
    if step >= len(ONBOARDING_QUESTIONS):
        return END
    return "onboarding_agent" # Pause and wait for next user input

def route_after_checkpoint(state: CourseState):
    feedback = state.get("revision_feedback")
    if feedback:
        return "syllabus_reviser"
    return "content_generator"


# 4. Graph Construction
workflow = StateGraph(CourseState)

workflow.add_node("onboarding_agent", onboarding_agent)
workflow.add_node("profile_builder", profile_builder)
workflow.add_node("syllabus_generator", syllabus_generator)
workflow.add_node("human_checkpoint", human_checkpoint)
workflow.add_node("syllabus_reviser", syllabus_reviser)
workflow.add_node("content_generator", content_generator)
workflow.add_node("quiz_node", quiz_node)
workflow.add_node("pace_adapter", pace_adapter)
workflow.add_node("state_store", state_store)

def route_from_start(state: CourseState):
    step = state.get("onboarding_step", 0)
    if step >= len(ONBOARDING_QUESTIONS):
        return "profile_builder"
    return "onboarding_agent"

# Edges
workflow.add_conditional_edges(START, route_from_start)

# Conditional routing out of onboarding
workflow.add_conditional_edges(
    "onboarding_agent",
    route_after_onboarding,
    {
        "profile_builder": "profile_builder",
        "onboarding_agent": END # Pause for user input
    }
)

workflow.add_edge("profile_builder", "syllabus_generator")
workflow.add_edge("syllabus_generator", "human_checkpoint")

# Conditional routing after checkpoint
workflow.add_conditional_edges(
    "human_checkpoint",
    route_after_checkpoint,
    {
        "syllabus_reviser": "syllabus_reviser",
        "content_generator": "content_generator"
    }
)

workflow.add_edge("syllabus_reviser", "human_checkpoint")

workflow.add_edge("content_generator", "quiz_node")
workflow.add_edge("quiz_node", "pace_adapter")

# Simple logic for now: next module vs end
def route_after_pace(state: CourseState):
    syl = state.get("syllabus", [])
    idx = state.get("current_module_index", 0)
    if idx < len(syl):
        # Move to next module -> Wait for user trigger? Yes, we break.
        return END
    return "state_store"

workflow.add_conditional_edges(
    "pace_adapter",
    route_after_pace,
    {
        END: END,
        "state_store": "state_store"
    }
)

workflow.add_edge("state_store", END)

# (Will attach AsyncSqliteSaver from the caller)
# We can't easily compile an async saver synchronously at module level if we want to use a shared connection,
# but we can do it via a factory or just provide a memory saver for now or pass the checkpointer in the route.
# We will expose a setup function.

from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver

# Global agent reference
_compiled_agent = None
_saver_context = None

async def get_course_agent():
    global _compiled_agent, _saver_context
    if _compiled_agent is None:
        # Ensure the checkpoints directory exists
        os.makedirs("./checkpoints", exist_ok=True)
        
        # Using AsyncSqliteSaver for persistent state since the graph is invoked asynchronously
        _saver_context = AsyncSqliteSaver.from_conn_string("./checkpoints/checkpoints.db")
        checkpointer = await _saver_context.__aenter__()
        
        # Ensure tables are setup
        await checkpointer.setup()
        
        _compiled_agent = workflow.compile(
            checkpointer=checkpointer,
            interrupt_after=["human_checkpoint"]
        )
    return _compiled_agent

# Fallback for simple use
course_agent_memory = workflow.compile()
