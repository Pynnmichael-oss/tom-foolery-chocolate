/**
 * Shipping address for a Mischief Society member — collected on the member
 * page (not at checkout: the membership doesn't require shipping, and gift
 * recipients give their own address). US only for now; chocolate doesn't
 * travel well. Shared by the client form and the server action, so no
 * server-only imports here.
 */

export interface ShippingAddress {
  name: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
}

export const EMPTY_ADDRESS: ShippingAddress = {
  name: "",
  address1: "",
  address2: "",
  city: "",
  state: "",
  zip: "",
  phone: "",
};

export const US_STATES: ReadonlyArray<[code: string, name: string]> = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"], ["CA", "California"],
  ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"], ["DC", "District of Columbia"],
  ["FL", "Florida"], ["GA", "Georgia"], ["HI", "Hawaii"], ["ID", "Idaho"], ["IL", "Illinois"],
  ["IN", "Indiana"], ["IA", "Iowa"], ["KS", "Kansas"], ["KY", "Kentucky"], ["LA", "Louisiana"],
  ["ME", "Maine"], ["MD", "Maryland"], ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"],
  ["MS", "Mississippi"], ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"], ["NV", "Nevada"],
  ["NH", "New Hampshire"], ["NJ", "New Jersey"], ["NM", "New Mexico"], ["NY", "New York"],
  ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"], ["OK", "Oklahoma"], ["OR", "Oregon"],
  ["PA", "Pennsylvania"], ["RI", "Rhode Island"], ["SC", "South Carolina"], ["SD", "South Dakota"],
  ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"], ["VT", "Vermont"], ["VA", "Virginia"],
  ["WA", "Washington"], ["WV", "West Virginia"], ["WI", "Wisconsin"], ["WY", "Wyoming"],
];

const LIMITS: Record<keyof ShippingAddress, number> = {
  name: 80,
  address1: 120,
  address2: 120,
  city: 80,
  state: 2,
  zip: 10,
  phone: 30,
};

export type AddressProblems = Partial<Record<keyof ShippingAddress, string>>;

/** Trims every field and returns it with any problems found. */
export function cleanAddress(input: Partial<Record<keyof ShippingAddress, unknown>>): {
  address: ShippingAddress;
  problems: AddressProblems;
} {
  const address = { ...EMPTY_ADDRESS };
  for (const key of Object.keys(EMPTY_ADDRESS) as Array<keyof ShippingAddress>) {
    const v = input[key];
    address[key] = typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "";
  }
  address.state = address.state.toUpperCase();

  const problems: AddressProblems = {};
  if (!address.name) problems.name = "Add the name for the package.";
  if (!address.address1) problems.address1 = "Add a street address.";
  if (!address.city) problems.city = "Add a city.";
  if (!US_STATES.some(([code]) => code === address.state)) problems.state = "Pick a state.";
  if (!/^\d{5}(-\d{4})?$/.test(address.zip)) problems.zip = "Use a 5-digit ZIP code.";
  if (address.phone && !/^[\d\s()+.-]{7,30}$/.test(address.phone)) problems.phone = "Check the phone number.";
  for (const key of Object.keys(LIMITS) as Array<keyof ShippingAddress>) {
    if (address[key].length > LIMITS[key] && !problems[key]) problems[key] = "That's a bit long.";
  }
  return { address, problems };
}

export function formatAddressLines(a: ShippingAddress): string[] {
  return [a.name, a.address1, a.address2, `${a.city}, ${a.state} ${a.zip}`].filter((l) => l && l.trim() !== ",");
}
