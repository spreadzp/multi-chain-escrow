import { describe, it, expect } from "vitest";
import type { Escrow } from "@/shared/types";
import {
  canRelease,
  canRefund,
  canDeposit,
  assertCanRelease,
  assertCanRefund,
  type RoleError,
} from "./roles";
import { EscrowAdapterError } from "../adapter/types";

function makeEscrow(overrides: Partial<Escrow> = {}): Escrow {
  return {
    id: "esc-1",
    chainId: "solana-devnet",
    depositor: "depositor-addr",
    beneficiary: "beneficiary-addr",
    resolver: "resolver-addr",
    amount: "100",
    amountRaw: "1000000000",
    tokenAddress: "token-addr",
    status: "created",
    createdAt: 0,
    updatedAt: 0,
    txHashDeposit: "tx-1",
    ...overrides,
  };
}

describe("canDeposit", () => {
  it("returns false for null address", () => {
    expect(canDeposit(null)).toBe(false);
  });

  it("returns true for any non-null string", () => {
    expect(canDeposit("some-addr")).toBe(true);
    expect(canDeposit("")).toBe(true);
  });
});

describe("canRelease", () => {
  it("returns true for beneficiary", () => {
    const escrow = makeEscrow();
    expect(canRelease(escrow, "beneficiary-addr")).toBe(true);
  });

  it("returns true for resolver", () => {
    const escrow = makeEscrow();
    expect(canRelease(escrow, "resolver-addr")).toBe(true);
  });

  it("returns false for depositor", () => {
    const escrow = makeEscrow();
    expect(canRelease(escrow, "depositor-addr")).toBe(false);
  });

  it("returns false for random address", () => {
    const escrow = makeEscrow();
    expect(canRelease(escrow, "random-addr")).toBe(false);
  });
});

describe("canRefund", () => {
  it("returns true for depositor when status is created", () => {
    const escrow = makeEscrow({ status: "created" });
    expect(canRefund(escrow, "depositor-addr")).toBe(true);
  });

  it("returns false for depositor when status is released", () => {
    const escrow = makeEscrow({ status: "released" });
    expect(canRefund(escrow, "depositor-addr")).toBe(false);
  });

  it("returns false for depositor when status is refunded", () => {
    const escrow = makeEscrow({ status: "refunded" });
    expect(canRefund(escrow, "depositor-addr")).toBe(false);
  });

  it("returns false for beneficiary", () => {
    const escrow = makeEscrow({ status: "created" });
    expect(canRefund(escrow, "beneficiary-addr")).toBe(false);
  });

  it("returns false for resolver", () => {
    const escrow = makeEscrow({ status: "created" });
    expect(canRefund(escrow, "resolver-addr")).toBe(false);
  });

  it("returns false for random address", () => {
    const escrow = makeEscrow({ status: "created" });
    expect(canRefund(escrow, "random-addr")).toBe(false);
  });
});

describe("assertCanRelease", () => {
  it("does not throw for beneficiary", () => {
    const escrow = makeEscrow();
    expect(() => assertCanRelease(escrow, "beneficiary-addr")).not.toThrow();
  });

  it("does not throw for resolver", () => {
    const escrow = makeEscrow();
    expect(() => assertCanRelease(escrow, "resolver-addr")).not.toThrow();
  });

  it("throws EscrowAdapterError with insufficient_permissions for unauthorized", () => {
    const escrow = makeEscrow();
    try {
      assertCanRelease(escrow, "random-addr");
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(EscrowAdapterError);
      expect((err as EscrowAdapterError).code).toBe("insufficient_permissions");
    }
  });
});

describe("assertCanRefund", () => {
  it("does not throw for depositor when status is created", () => {
    const escrow = makeEscrow({ status: "created" });
    expect(() => assertCanRefund(escrow, "depositor-addr")).not.toThrow();
  });

  it("throws EscrowAdapterError with insufficient_permissions for non-depositor", () => {
    const escrow = makeEscrow({ status: "created" });
    try {
      assertCanRefund(escrow, "beneficiary-addr");
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(EscrowAdapterError);
      expect((err as EscrowAdapterError).code).toBe("insufficient_permissions");
    }
  });

  it("throws EscrowAdapterError with insufficient_permissions for depositor when status is released", () => {
    const escrow = makeEscrow({ status: "released" });
    try {
      assertCanRefund(escrow, "depositor-addr");
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(EscrowAdapterError);
      expect((err as EscrowAdapterError).code).toBe("insufficient_permissions");
    }
  });
});

describe("RoleError type", () => {
  it("has role, required, and actual fields", () => {
    const err: RoleError = {
      role: "beneficiary",
      required: "beneficiary or resolver",
      actual: "random-addr",
    };
    expect(err.role).toBe("beneficiary");
    expect(err.required).toBe("beneficiary or resolver");
    expect(err.actual).toBe("random-addr");
  });
});
