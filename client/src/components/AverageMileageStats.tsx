import styled from "styled-components";
import { fmtMil } from "../utils/format";

const Card = styled.div`
  padding: 2em;

  h3 {
    margin-bottom: 0.8em;
  }
`;

const Stats = styled.div`
  display: flex;
  gap: 2em;
  justify-content: center;
  flex-wrap: wrap;
`;

const Stat = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const StatValue = styled.span`
  font-size: 1.6rem;
  font-weight: 600;
`;

const StatLabel = styled.span`
  font-size: 0.85rem;
  color: #888;
  margin-top: 0.2em;
`;

type AverageMileageStatsProps = {
  perDay: number | null;
  perMonth: number | null;
  perYear: number | null;
};

export default function AverageMileageStats({
  perDay,
  perMonth,
  perYear,
}: AverageMileageStatsProps) {
  return (
    <Card>
      <h3>Average Mileage</h3>
      <Stats>
        <Stat>
          <StatValue>{fmtMil(perDay)} mil</StatValue>
          <StatLabel>per day</StatLabel>
        </Stat>
        <Stat>
          <StatValue>{fmtMil(perMonth)} mil</StatValue>
          <StatLabel>per month</StatLabel>
        </Stat>
        <Stat>
          <StatValue>{fmtMil(perYear)} mil</StatValue>
          <StatLabel>per year</StatLabel>
        </Stat>
      </Stats>
    </Card>
  );
}
