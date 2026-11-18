"use server";

import { cleanAddress, formatAddressLines, type AddressProblems, type ShippingAddress } from "@/lib/mischief-society/address";
import { readMemberToken } from "@/lib/mischief-society/member-links";
import { getMembership, saveMemberAddress } from "@/lib/mischief-society/members";

export type SaveAddressResult =
  | { ok: true; address: ShippingAddress; lines: string[] }
  | { ok: false; error: string; problems?: AddressProblems };

/**
 * Saves a member's shipping address. The private link token is the only
 * credential: it's re-verified here on every save, never trusted from the
 * page alone. Always returns a result (never throws) so the form can show
 * a real message.
 */
export async function saveAddressAction(
  token: string,
  input: Partial<Record<keyof ShippingAddress, unknown>>
): Promise<SaveAddressResult> {
  const ids = readMemberToken(token);
  if (!ids) return { ok: false, error: "This member link isn't valid. Request a new one from the welcome page." };

  const { address, problems } = cleanAddress(input);
  if (Object.keys(problems).length) {
    return { ok: false, error: "Check the highlighted fields.", problems };
  }

  try {
    const membership = await getMembership(ids.orderGid, ids.lineGid);
    if (!membership) {
      return { ok: false, error: "We couldn't find this membership. Reply to any Society email and we'll sort it out." };
    }
    await saveMemberAddress(membership, address);
    return { ok: true, address, lines: formatAddressLines(address) };
  } catch (error) {
    console.error("[mischief-society] saving member address failed:", error);
    return { ok: false, error: "We couldn't save that just now. Please try again in a moment." };
  }
}
