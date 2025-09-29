import "./css/StepButton.css"
import { useSidebar } from "../context/SidebarContext";

type StepButtonProps = {
    step: string;
    icon: string;
    text: string;
}

export default function StepButton({ step, icon, text }: StepButtonProps) {

  const { setQueryParam } = useSidebar();

  return (
   <button
          type="button"
          className="ucbtn ucbtn-warning"
          onClick={ () => setQueryParam('menu', step)}
        >
          <span className="material-icons" aria-hidden="true">
            {icon}
          </span>
            {text}
    </button>
  );
}

