from sqlalchemy import Column, Integer, String , ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="student", nullable=False)
    student_profile = relationship("StudentProfile", back_populates="user", uselist=False)
    teacher_profile = relationship("TeacherProfile", back_populates="user", uselist=False)  

class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True)

    roll_no = Column(String(50), nullable=True)
    course_id = Column(String(50), nullable=True)
    status = Column(String(20), default="active")
    performance = Column(String(50), nullable=True)  # simple column for now

    user = relationship("User", back_populates="student_profile")

class TeacherProfile(Base):
    __tablename__ = "teacher_profiles"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    subject = Column(String(100), nullable=False)
    department = Column(String(100), nullable=True)
    designation = Column(String(100), nullable=True)

    user = relationship("User", back_populates="teacher_profile")