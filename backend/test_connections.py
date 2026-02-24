
import sys
import os

def test_mysql():
    print("Testing MySQL connection...")
    try:
        from database import SessionLocal
        db = SessionLocal()
        db.execute("SELECT 1")
        print("✅ MySQL Connection Successful")
        db.close()
    except Exception as e:
        print(f"❌ MySQL Connection Failed: {e}")

def test_neo4j():
    print("Testing Neo4j connection...")
    try:
        from neo4j_db import get_neo4j_session
        with get_neo4j_session() as session:
            session.run("RETURN 1")
        print("✅ Neo4j Connection Successful")
    except Exception as e:
        print(f"❌ Neo4j Connection Failed: {e}")

def test_redis():
    print("Testing Redis connection...")
    try:
        from redis_client import redis_client
        redis_client.ping()
        print("✅ Redis Connection Successful")
    except Exception as e:
        print(f"❌ Redis Connection Failed: {e}")

if __name__ == "__main__":
    test_mysql()
    test_neo4j()
    test_redis()
