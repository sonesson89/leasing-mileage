import styled from "styled-components";

export const ANON_TUTORIAL_STEPS: string[] = [
  "Enter the total amount of mil (10k) the car has driven since the start of the leasing period",
  "Select the first day of the leasing contract",
  "Enter the yearly mileage limit specified in your leasing contract",
  "Enter the fee you pay per mil driven over the contract limit",
  "Choose how many years your leasing contract runs for",
];

const Bubble = styled.div`
  position: absolute;
  top: calc(100% + 14px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  width: max-content;
  max-width: 260px;
  padding: 0.9rem 1rem;
  background: #1f232b;
  border: 2px solid #efdf24;
  border-radius: 10px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.45);
  text-align: left;
  color: #f5f5f5;

  &::before,
  &::after {
    content: "";
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
  }

  &::before {
    top: -12px;
    border-bottom: 12px solid #efdf24;
  }

  &::after {
    top: -9px;
    border-bottom: 10px solid #1f232b;
  }
`;

const BubbleStep = styled.p`
  margin: 0 0 0.4rem;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #efdf24;
`;

const BubbleText = styled.p`
  margin: 0 0 0.85rem;
  font-size: 0.9rem;
  line-height: 1.4;
`;

const BubbleActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.5rem;

  button {
    padding: 0.45rem 0.8rem;
    border-radius: 4px;
    font-size: 0.82rem;
    font-weight: 700;
    white-space: nowrap;
  }
`;

const NextButton = styled.button`
  background: #efdf24;
  border: 1px solid #efdf24;
  color: #111318;

  &:hover {
    background: #fff04a;
  }
`;

const CancelButton = styled.button`
  background: transparent;
  border: 1px solid #565c68;
  color: #d8dae0;

  &:hover {
    border-color: #efdf24;
    color: #efdf24;
  }
`;

function TutorialBubble({
  step,
  text,
  onNext,
  onCancel,
}: {
  step: number;
  text: string;
  onNext: () => void;
  onCancel: () => void;
}) {
  return (
    <Bubble role="dialog" aria-label="Tutorial">
      <BubbleStep>
        Step {step} of {ANON_TUTORIAL_STEPS.length}
      </BubbleStep>
      <BubbleText>{text}</BubbleText>
      <BubbleActions>
        <CancelButton type="button" onClick={onCancel}>
          Cancel tutorial
        </CancelButton>
        <NextButton type="button" onClick={onNext}>
          {step === ANON_TUTORIAL_STEPS.length ? "Finish" : "Next"}
        </NextButton>
      </BubbleActions>
    </Bubble>
  );
}

function TutorialCancelConfirm({
  onCancelOnly,
  onNeverShowAgain,
}: {
  onCancelOnly: () => void;
  onNeverShowAgain: () => void;
}) {
  return (
    <Bubble role="dialog" aria-label="Cancel tutorial">
      <BubbleText>Cancel the tutorial?</BubbleText>
      <BubbleActions>
        <CancelButton type="button" onClick={onCancelOnly}>
          Cancel
        </CancelButton>
        <NextButton type="button" onClick={onNeverShowAgain}>
          Never show tutorial again
        </NextButton>
      </BubbleActions>
    </Bubble>
  );
}

type TutorialStepProps = {
  stepIndex: number;
  currentStep: number;
  active: boolean;
  cancelConfirm: boolean;
  onNext: () => void;
  onCancel: () => void;
  onCancelOnly: () => void;
  onNeverShowAgain: () => void;
};

/** Renders the tutorial bubble (or its cancel-confirmation) anchored to a single wizard step, or nothing if it isn't the active step. */
export default function TutorialStep({
  stepIndex,
  currentStep,
  active,
  cancelConfirm,
  onNext,
  onCancel,
  onCancelOnly,
  onNeverShowAgain,
}: TutorialStepProps) {
  if (!active || currentStep !== stepIndex) return null;

  if (cancelConfirm) {
    return (
      <TutorialCancelConfirm
        onCancelOnly={onCancelOnly}
        onNeverShowAgain={onNeverShowAgain}
      />
    );
  }

  return (
    <TutorialBubble
      step={stepIndex + 1}
      text={ANON_TUTORIAL_STEPS[stepIndex]}
      onNext={onNext}
      onCancel={onCancel}
    />
  );
}
