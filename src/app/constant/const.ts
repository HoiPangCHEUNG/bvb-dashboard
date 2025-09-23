export const OVERRIDE_RPC = process.env.NEUTRON_RPC_URL || null; // Use NEUTRON_RPC_URL from .env; fallback to null if not set

export const USDC_DENOM =
  "ibc/B559A80D62249C8AA07A380E2A2BEA6E5CA9A6F079C912C3A9E9B494105E4F81";

export const BVBCONTRACT =
  "neutron17v2cwmaynxhc004uph4rle45feepg0z86wwxkue2kc0t5hx82f2s6gmu73";

export const MARS = {
  ORACLE: "neutron1dwp6m7pdrz6rnhdyrx5ha0acsduydqcpzkylvfgspsz60pj2agxqaqrr7g",
  CREDIT_MANAGER:
    "neutron1qdzn3l4kn7gsjna2tfpg3g3mwd6kunx4p50lfya59k02846xas6qslgs3r",
  PERPS: "neutron1g3catxyv0fk8zzsra2mjc0v4s69a7xygdjt85t54l7ym3gv0un4q2xhaf6",
};

export const MARS_OPEN_FEE_PERCENT = 0.00075;

export const MARS_CLOSE_FEE_PERCENT = 0.00075;

export const CACHE_DIR = "./cache";

export const MARKET_CACHE_TIME = 1000 * 60 * 60 * 1; //1h. No need to re-fetch markets each time

export const MAX_LEVERAGE_CACHE_TIME = 1000 * 60 * 60 * 48; //48h. Basically never change.

export const FUNDING_RATE_CACHE_TIME = 1000 * 60 * 5; //5 mins
