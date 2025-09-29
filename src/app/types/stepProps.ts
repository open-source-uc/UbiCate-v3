export type StepProps = {
  nextStep?: () => void;
  stepBack?: () => void;
  data?: any,
  setStep?: (step: string)=> void;
};