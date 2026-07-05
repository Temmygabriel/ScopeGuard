import { createAccount, createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import type { Account, Brief, Profile } from "../types";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

// ---------------------------------------------------------------------
// account + client
// ---------------------------------------------------------------------

export function makeAccount(privateKey?: `0x${string}`): Account {
  const account = privateKey ? createAccount(privateKey) : createAccount();
  return { privateKey: account.privateKey, address: account.address };
}

function getClient(account?: Account) {
  return createClient({
    chain: studionet,
    account: account
      ? ({ address: account.address, privateKey: account.privateKey } as any)
      : undefined,
  });
}

async function read<T>(functionName: string, args: any[] = []): Promise<T> {
  const client = getClient();
  return client.readContract({
    address: CONTRACT_ADDRESS,
    functionName,
    args,
  }) as Promise<T>;
}

async function write(account: Account, functionName: string, args: any[] = []) {
  const client = getClient(account);
  const txHash = await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName,
    args,
  });
  return client.waitForTransactionReceipt({
    hash: txHash,
    status: "FINALIZED",
  });
}

// ---------------------------------------------------------------------
// write methods — one per contract write method, same names
// ---------------------------------------------------------------------

export async function createBrief(
  account: Account,
  freelancerName: string,
  title: string,
  deliverablesText: string,
  price: string,
  deadline: string,
  signDeadline: string
) {
  return write(account, "create_brief", [
    account.address,
    freelancerName,
    title,
    deliverablesText,
    price,
    deadline,
    signDeadline,
  ]);
}

export async function signBrief(account: Account, briefId: string) {
  return write(account, "sign_brief", [briefId, account.address]);
}

export async function cancelBrief(account: Account, briefId: string) {
  return write(account, "cancel_brief", [briefId, account.address]);
}

export async function checkSignExpired(account: Account, briefId: string) {
  return write(account, "check_sign_expired", [briefId, Date.now().toString()]);
}

export async function submitDelivery(
  account: Account,
  briefId: string,
  deliveryText: string,
  deliveryLink: string
) {
  return write(account, "submit_delivery", [
    briefId,
    account.address,
    deliveryText,
    deliveryLink,
  ]);
}

export async function acceptDelivery(account: Account, briefId: string) {
  return write(account, "accept_delivery", [briefId, account.address]);
}

export async function submitDispute(
  account: Account,
  briefId: string,
  disputeText: string,
  disputeLink: string
) {
  return write(account, "submit_dispute", [
    briefId,
    account.address,
    disputeText,
    disputeLink,
  ]);
}

export async function evaluateDispute(account: Account, briefId: string) {
  return write(account, "evaluate_dispute", [briefId]);
}

// ---------------------------------------------------------------------
// view methods — instant, free, no account needed
// ---------------------------------------------------------------------

export async function getBrief(briefId: string): Promise<Brief> {
  return read<Brief>("get_brief", [briefId]);
}

export async function getMyBriefs(address: string): Promise<Brief[]> {
  return read<Brief[]>("get_my_briefs", [address]);
}

export async function getProfile(address: string): Promise<Profile> {
  return read<Profile>("get_profile", [address]);
}

export async function getRecentBriefs(limit: number): Promise<Brief[]> {
  return read<Brief[]>("get_recent_briefs", [limit]);
}
