import * as React from "react";

export type CSSForwardingProps = {
  className?: string;
  style?: React.CSSProperties;
};

export function classNames(
  ...names: Array<string | undefined | null | false>
): string | undefined {
  const namesToInclude = names.filter(
    (n) => typeof n === "string" && n.length > 0
  );
  if (namesToInclude.length === 0) {
    return undefined;
  }
  return namesToInclude.join(" ");
}
