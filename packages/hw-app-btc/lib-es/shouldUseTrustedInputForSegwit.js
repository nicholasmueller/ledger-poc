import semver from "semver";
export function shouldUseTrustedInputForSegwit({
  version,
  name
}) {
  if (name === "Decred") return false;
  if (name === "Exchange") return true;
  return semver.gte(version, "1.4.0");
}
//# sourceMappingURL=shouldUseTrustedInputForSegwit.js.map