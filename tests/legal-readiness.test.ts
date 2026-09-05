import { afterEach, describe, expect, test } from "vitest";
import { getLegalConfig, REQUIRED_LEGAL_ENV } from "../lib/legal-config";

const snapshot = Object.fromEntries(REQUIRED_LEGAL_ENV.map(name => [name, process.env[name]]));
const reviewedSnapshot = process.env.HOUSORA_LEGAL_REVIEWED;
afterEach(() => {
  for (const name of REQUIRED_LEGAL_ENV) {
    const value = snapshot[name];
    if (value === undefined) delete process.env[name]; else process.env[name] = value;
  }
  if (reviewedSnapshot === undefined) delete process.env.HOUSORA_LEGAL_REVIEWED;
  else process.env.HOUSORA_LEGAL_REVIEWED = reviewedSnapshot;
});

describe("legal readiness", () => {
  test("reports every missing required operator value", () => {
    for (const name of REQUIRED_LEGAL_ENV) delete process.env[name];
    const config = getLegalConfig();
    expect(config.ready).toBe(false);
    expect(config.missing).toEqual([...REQUIRED_LEGAL_ENV]);
  });

  test("requires both operator values and an explicit legal-review confirmation", () => {
    for (const name of REQUIRED_LEGAL_ENV) process.env[name] = `configured-${name}`;
    delete process.env.HOUSORA_LEGAL_REVIEWED;
    expect(getLegalConfig()).toMatchObject({ ready: false, missing: [], reviewed: false });
    process.env.HOUSORA_LEGAL_REVIEWED = "true";
    expect(getLegalConfig()).toMatchObject({ ready: true, missing: [] });
  });
});
