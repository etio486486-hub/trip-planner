import { convertToBase, type TripExchangeRates } from "./exchange-rates";
import type { ExpenseCurrency } from "./trip-constants";
import type { Expense, TripMember } from "@/types/database";

export type SettlementTransfer = {
  fromName: string;
  toName: string;
  amount: number;
  currency: ExpenseCurrency;
};

export type MemberBalance = {
  userId: string;
  name: string;
  paid: number;
  owed: number;
  balance: number;
};

function memberName(members: TripMember[], userId: string): string {
  const m = members.find((x) => x.user_id === userId);
  return m?.display_name ?? `유저 ${userId.slice(0, 6)}`;
}

/** 지출 기반 멤버별 순잔액 (양수 = 받을 돈, 음수 = 낼 돈) */
export function computeMemberBalances(
  expenses: Expense[],
  members: TripMember[],
  rates: TripExchangeRates
): MemberBalance[] {
  const balances = new Map<string, MemberBalance>();

  for (const m of members) {
    balances.set(m.user_id, {
      userId: m.user_id,
      name: memberName(members, m.user_id),
      paid: 0,
      owed: 0,
      balance: 0,
    });
  }

  const allIds = members.map((m) => m.user_id);

  for (const exp of expenses) {
    const amountBase = convertToBase(
      exp.amount,
      exp.currency as ExpenseCurrency,
      rates
    );
    const payerId = exp.paid_by_user_id;
    if (!payerId) continue;

    const participants =
      exp.is_shared && exp.split_user_ids && exp.split_user_ids.length > 0
        ? exp.split_user_ids.filter((id) => balances.has(id))
        : exp.is_shared
          ? allIds
          : [payerId];

    if (participants.length === 0) continue;

    const share = amountBase / participants.length;

    const payer = balances.get(payerId);
    if (payer) {
      payer.paid += amountBase;
      payer.balance += amountBase;
    }

    for (const pid of participants) {
      const row = balances.get(pid);
      if (row) {
        row.owed += share;
        row.balance -= share;
      }
    }
  }

  return [...balances.values()].sort((a, b) => b.balance - a.balance);
}

/** 최소 송금 횟수로 정산 (기준 통화) */
export function computeSettlementTransfers(
  balances: MemberBalance[],
  baseCurrency: ExpenseCurrency
): SettlementTransfer[] {
  const debtors = balances
    .filter((b) => b.balance < -0.5)
    .map((b) => ({ name: b.name, amount: -b.balance }))
    .sort((a, b) => b.amount - a.amount);

  const creditors = balances
    .filter((b) => b.balance > 0.5)
    .map((b) => ({ name: b.name, amount: b.balance }))
    .sort((a, b) => b.amount - a.amount);

  const transfers: SettlementTransfer[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amount, creditors[j].amount);
    if (pay > 0.5) {
      transfers.push({
        fromName: debtors[i].name,
        toName: creditors[j].name,
        amount: Math.round(pay),
        currency: baseCurrency,
      });
    }
    debtors[i].amount -= pay;
    creditors[j].amount -= pay;
    if (debtors[i].amount < 0.5) i++;
    if (creditors[j].amount < 0.5) j++;
  }

  return transfers;
}

export function totalInBase(
  expenses: Expense[],
  rates: TripExchangeRates
): number {
  return expenses.reduce(
    (sum, exp) =>
      sum +
      convertToBase(exp.amount, exp.currency as ExpenseCurrency, rates),
    0
  );
}
