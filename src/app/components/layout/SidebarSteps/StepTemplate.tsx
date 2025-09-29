import type { StepProps } from "@/app/types/stepProps";
import { StepTagAttributes } from "@/app/types/stepTagAttributes";

export default function StepTemplate({/*nextStep, stepBack, setStep*/} : StepProps){
    return (
    <ul 
          {...StepTagAttributes}
        >
          
    </ul>
    );
}
