import { useEffect } from "react";
import Crossroads from "./components/Crossroads/Crossroads.jsx";

// body[data-task] is used by styles/base.css for this task's page background.
const TASK_ID = "12";

export default function App() {
  useEffect(() => {
    document.body.dataset.task = TASK_ID;
    return () => { delete document.body.dataset.task; };
  }, []);

  return (
    <main className="page">
      <Crossroads />
    </main>
  );
}
