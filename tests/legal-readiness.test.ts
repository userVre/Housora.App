import { afterEach, describe, expect, test } from "vitest";
import { getLegalConfig, REQUIRED_LEGAL_ENV } from "../lib/legal-config";

const snapshot = Object.fromEntries(REQUIRED_LEGAL_ENV.map(name => [name, process.env[name]]));
afterEach(() => {
  for (const name of REQUIRED_LEGAL_ENV) {
    const value = snapshot[name];
    if (value === undefined) delete process.env[name]; else process.env[name] = value;
  }
});

describe("legal readiness", () => {
  test("reports every missing required operator value", () => {
    for (const name of REQUIRED_LEGAL_ENV) delete process.env[name];
    const config = getLegalConfig();
    expect(config.ready).toBe(false);
    expect(config.missing).toEqual([...REQUIRED_LEGAL_ENV]);
  });

  test("becomes ready only when all required values exist", () => {
    for (const name of REQUIRED_LEGAL_ENV) process.env[name] = `configured-${name}`;
    expect(getLegalConfig()).toMatchObject({ ready: true, missing: [] });
  });
});
