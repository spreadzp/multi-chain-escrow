import type { Escrow } from "@/shared/types";
import { EscrowAdapterError } from "../adapter/types";

export interface RoleError {
  role: string;
  required: string;
  actual: string;
}

export function canDeposit(callerAddress: string | null): boolean {
  return callerAddress !== null;
}

export function canRelease(escrow: Escrow, callerAddress: string): boolean {
  return callerAddress === escrow.beneficiary || callerAddress === escrow.resolver;
}

export function canRefund(escrow: Escrow, callerAddress: string): boolean {
  return callerAddress === escrow.depositor && escrow.status === "created";
}

export function assertCanRelease(escrow: Escrow, callerAddress: string): void {
  if (!canRelease(escrow, callerAddress)) {
    throw new EscrowAdapterError(
      "insufficient_permissions",
      `Caller ${callerAddress} cannot release escrow ${escrow.id}: requires beneficiary (${escrow.beneficiary}) or resolver (${escrow.resolver})`,
    );
  }
}

export function assertCanRefund(escrow: Escrow, callerAddress: string): void {
  if (!canRefund(escrow, callerAddress)) {
    const reason =
      escrow.status !== "created"
        ? `escrow status is ${escrow.status} (must be created)`
        : `caller ${callerAddress} is not depositor (${escrow.depositor})`;
    throw new EscrowAdapterError(
      "insufficient_permissions",
      `Caller ${callerAddress} cannot refund escrow ${escrow.id}: ${reason}`,
    );
  }
}
