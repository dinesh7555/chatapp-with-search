import { useState } from "react";
import { Outlet } from "react-router-dom";
import StudentNavbar from "./StudentNavbar";
import MyNotesPanel from "./MyNotesPanel";
import "./StudentLayout.css";

const StudentLayout = () => {
    const [isNotesPanelOpen, setIsNotesPanelOpen] = useState(false);

    return (
        <div className="student-layout">
            <StudentNavbar setIsNotesPanelOpen={setIsNotesPanelOpen} />
            
            <main className="layout-content">
                <Outlet />
            </main>

            <MyNotesPanel
                isOpen={isNotesPanelOpen}
                onClose={() => setIsNotesPanelOpen(false)}
                subjectId={null}
            />

            {/* Background decorations - global for all student pages */}
            <div className="bg-decoration" aria-hidden="true">
                <div className="bg-circle bg-circle-1" />
                <div className="bg-circle bg-circle-2" />
                <div className="bg-circle bg-circle-3" />
                <div className="bg-grid" />
            </div>
        </div>
    );
};

export default StudentLayout;
