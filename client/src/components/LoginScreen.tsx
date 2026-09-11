import { useState } from "react";
import styled from "styled-components";
import SourceFooter from "./SourceFooter";

const LoginShell = styled.main`
  min-height: calc(100vh - 8rem);
  display: grid;
  place-items: center;
  position: relative;
  isolation: isolate;

  &::before {
    content: "";
    position: fixed;
    inset: 0;
    z-index: -1;
    background:
      linear-gradient(120deg, rgba(239, 223, 36, 0.11), transparent 42%),
      repeating-linear-gradient(
        135deg,
        transparent 0 38px,
        rgba(255, 255, 255, 0.025) 38px 39px
      ),
      #111318;
  }

  @media (max-width: 640px) {
    min-height: calc(100vh - 6rem);
  }
`;

const LoginStack = styled.div`
  width: min(100%, 410px);
`;

const LoginPanel = styled.section`
  width: 100%;
  box-sizing: border-box;
  padding: 2.25rem;
  text-align: left;
  background: #191c22;
  border: 1px solid #343842;
  border-top: 4px solid #efdf24;
  border-radius: 6px;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.38);

  h1 {
    margin: 0;
    font-size: 1.85rem;
    line-height: 1.1;
  }

  @media (max-width: 640px) {
    padding: 1.5rem;
  }
`;

const LoginBrand = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const BrandMark = styled.span`
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border: 2px solid #efdf24;
  color: #efdf24;
  font-size: 1.4rem;
  font-weight: 800;
`;

const Eyebrow = styled.p`
  margin: 0 0 0.2rem;
  color: #efdf24;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
`;

const LoginIntro = styled.p`
  margin: 1.5rem 0;
  color: #b7bbc4;
`;

const LoginForm = styled.form`
  display: grid;
  gap: 0.65rem;

  label {
    margin: 0.55rem 0 0;
    color: #d8dae0;
    font-weight: 600;
  }

  input {
    width: 100%;
    box-sizing: border-box;
    padding: 0.78rem 0.85rem;
    border: 1px solid #474c57;
    border-radius: 4px;
    background: #101217;
    color: #f5f5f5;
    font: inherit;

    &:focus {
      outline: 2px solid #efdf24;
      outline-offset: 1px;
      border-color: transparent;
    }
  }
`;

const LoginError = styled.p`
  margin: 0.55rem 0 0;
  padding: 0.7rem 0.8rem;
  color: #ffb4ae;
  background: rgba(220, 70, 60, 0.14);
  border-left: 3px solid #e65b50;
  font-size: 0.9rem;
`;

const LoginButton = styled.button`
  width: 100%;
  margin-top: 1rem;
  padding: 0.85rem 1rem;
  border-radius: 4px;
  background: #efdf24;
  color: #111318;
  font-weight: 800;

  &:hover:not(:disabled) {
    border-color: #fff078;
    background: #fff04a;
  }

  &:disabled {
    cursor: wait;
    opacity: 0.68;
  }
`;

const LoginDivider = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 1rem 0;
  color: #858b96;
  font-size: 0.78rem;
  text-transform: uppercase;

  &::before,
  &::after {
    content: "";
    height: 1px;
    flex: 1;
    background: #343842;
  }
`;

const DemoButton = styled.button`
  width: 100%;
  margin-top: 0.65rem;
  padding: 0.8rem 1rem;
  border: 1px solid #565c68;
  border-radius: 4px;
  background: transparent;
  color: #d8dae0;
  font-weight: 700;

  &:hover {
    border-color: #efdf24;
    color: #efdf24;
  }
`;

const AnonButton = styled(DemoButton)`
  margin-top: 0;
`;

const LoginBackButton = styled.button`
  width: 100%;
  margin-top: 0.75rem;
  padding: 0.5rem 0;
  border: none;
  background: transparent;
  color: #a8adb7;
  font-size: 0.85rem;
  text-align: left;

  &:hover {
    color: #efdf24;
  }
`;

const PrivacyNote = styled.p`
  margin: 1rem 0 0;
  color: #858b96;
  font-size: 0.78rem;
`;

type LoginScreenProps = {
  onLogin: (email: string, password: string) => Promise<void>;
  onDemo: () => void;
  onAnon: () => void;
};

export default function LoginScreen({
  onLogin,
  onDemo,
  onAnon,
}: LoginScreenProps) {
  const [showCredentialsForm, setShowCredentialsForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoggingIn(true);
    setLoginError("");

    try {
      await onLogin(email, password);
      setPassword("");
    } catch (error) {
      setLoginError(
        error instanceof Error
          ? error.message
          : "Renault authentication failed.",
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <LoginShell>
      <LoginStack>
        <LoginPanel>
          <LoginBrand>
            <BrandMark aria-hidden="true">R</BrandMark>
            <div>
              <Eyebrow>Leasing dashboard</Eyebrow>
              <h1>Mileage Calculator</h1>
            </div>
          </LoginBrand>
          <LoginIntro>
            You may sign in with youre Renault account, in which case real
            vehicle data will be used, or continue without an account and enter
            your mileage manually.
          </LoginIntro>

          {showCredentialsForm ? (
            <>
              <LoginForm onSubmit={handleSubmit}>
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="username"
                  required
                />

                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />

                {loginError && (
                  <LoginError role="alert">{loginError}</LoginError>
                )}

                <LoginButton type="submit" disabled={isLoggingIn}>
                  {isLoggingIn ? "Signing in..." : "Sign in"}
                </LoginButton>
              </LoginForm>
              <LoginBackButton
                type="button"
                onClick={() => setShowCredentialsForm(false)}
              >
                ← Back
              </LoginBackButton>
              <PrivacyNote>
                Your password is sent directly to this server and is not stored.
              </PrivacyNote>
            </>
          ) : (
            <>
              <LoginButton
                type="button"
                onClick={() => setShowCredentialsForm(true)}
              >
                Login using Renault credentials
              </LoginButton>
              <DemoButton type="button" onClick={onDemo}>
                Demo with mocked Renault API data
              </DemoButton>
              <LoginDivider>
                <span>or</span>
              </LoginDivider>
              <AnonButton type="button" onClick={onAnon}>
                Continue without logging in
              </AnonButton>
            </>
          )}
        </LoginPanel>
        <SourceFooter compact />
      </LoginStack>
    </LoginShell>
  );
}
