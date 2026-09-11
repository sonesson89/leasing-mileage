import moment from "moment";
import styled from "styled-components";
import type { CarLocation } from "../types";

const Card = styled.div`
  padding: 2em;
  display: flex;
  flex-direction: column;
  min-width: 0;

  h2 {
    margin-top: 0;
  }
`;

const MapFrame = styled.iframe`
  display: block;
  width: 100%;
  max-width: 100%;
  min-height: 320px;
  flex: 1;
  border: 1px solid #444;
  border-radius: 6px;

  @media (max-width: 640px) {
    min-height: 260px;
  }
`;

const LocationUpdated = styled.p`
  margin: 0.75rem 0 0;
  color: #aaa;
  font-size: 0.85rem;
`;

const LocationUnavailable = LocationUpdated;

type CarLocationMapProps = {
  carLocation: CarLocation | null;
};

export default function CarLocationMap({ carLocation }: CarLocationMapProps) {
  const mapUrl = carLocation
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(
        `${carLocation.longitude - 0.01},${carLocation.latitude - 0.006},${carLocation.longitude + 0.01},${carLocation.latitude + 0.006}`,
      )}&layer=mapnik&marker=${encodeURIComponent(
        `${carLocation.latitude},${carLocation.longitude}`,
      )}`
    : null;

  return (
    <Card>
      <h2>Car Location</h2>
      {mapUrl ? (
        <>
          <MapFrame
            src={mapUrl}
            title="Current car location"
            loading="lazy"
          />
          {carLocation?.lastUpdated && (
            <LocationUpdated>
              Last updated {moment(carLocation.lastUpdated).format("L LT")}
            </LocationUpdated>
          )}
        </>
      ) : (
        <LocationUnavailable>Location unavailable</LocationUnavailable>
      )}
    </Card>
  );
}
