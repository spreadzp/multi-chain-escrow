export type { Escrow, EscrowEvent, CreateEscrowParams } from "@/shared/types";

export type EscrowAdapterErrorCode =
  | "not_connected"
  | "insufficient_permissions"
  | "escrow_not_found"
  | "network_error"
  | "unknown";

export class EscrowAdapterError extends Error {
  readonly code: EscrowAdapterErrorCode;

  constructor(code: EscrowAdapterErrorCode, message: string) {
    super(message);
    this.name = "EscrowAdapterError";
    this.code = code;
  }
}

export type { EscrowAdapter } from "@/shared/types";
