import styled from "styled-components";

const FooterEl = styled.footer<{ $compact?: boolean }>`
  margin-top: ${(p) => (p.$compact ? "1rem" : "2rem")};
  padding: ${(p) => (p.$compact ? "0" : "1.25rem 0 0.25rem")};
  border-top: ${(p) => (p.$compact ? "0" : "1px solid #343842")};
  text-align: center;
`;

const SourceLink = styled.a`
  display: inline-flex;
  max-width: 100%;
  align-items: center;
  gap: 0.55rem;
  padding: 0.65rem 0.9rem;
  border: 1px solid #454a54;
  border-radius: 4px;
  background: #191c22;
  color: #d8dae0;
  font-size: 0.85rem;
  font-weight: 600;
  text-decoration: none;

  img {
    width: 18px;
    height: 18px;
    filter: brightness(0) invert(1);
  }

  &:hover {
    border-color: #efdf24;
    color: #efdf24;
  }
`;

type SourceFooterProps = {
  /** Tighter spacing variant used when the footer sits inside the login panel */
  compact?: boolean;
};

export default function SourceFooter({ compact }: SourceFooterProps) {
  return (
    <FooterEl $compact={compact}>
      <SourceLink
        href="https://github.com/sonesson89/leasing-mileage"
        target="_blank"
        rel="noreferrer"
      >
        <img
          src="https://github.githubassets.com/favicons/favicon.svg"
          alt=""
          aria-hidden="true"
        />
        View source on GitHub
      </SourceLink>
    </FooterEl>
  );
}
