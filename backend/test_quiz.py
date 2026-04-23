import asyncio
from services.personalized_course_service import generate_quiz_content

async def run():
    out = await generate_quiz_content("Introduction to Machine Learning")
    print(out)

asyncio.run(run())
