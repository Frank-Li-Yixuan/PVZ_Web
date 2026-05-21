import type { C2SEventName, S2CEventName } from "./messages";

export type ClientMessageEnvelope<TPayload, TType extends C2SEventName | string = C2SEventName> = {
  type: TType;
  requestId?: string;
  clientSeq: number;
  clientTimeMs: number;
  payload: TPayload;
};

export type ServerMessageEnvelope<TPayload, TType extends S2CEventName | string = S2CEventName> = {
  type: TType;
  requestId?: string;
  serverSeq: number;
  serverTimeMs: number;
  payload: TPayload;
};

export type NetworkConnectionState =
  | "CONNECTED"
  | "DEGRADED"
  | "RECONNECTING"
  | "RECONNECTED"
  | "DISCONNECTED";
