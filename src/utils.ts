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

export function pluralize(
  singular: string,
  plural: string
): (n: number) => string {
  return (n) => (n === 1 ? singular : plural);
}

export function flipHoriz(
  dir: "ltr" | "rtl",
  shouldFlip: boolean = true
): "ltr" | "rtl" {
  if (!shouldFlip) {
    return dir;
  }
  return dir === "ltr" ? "rtl" : "ltr";
}

export function flipVert(
  dir: "ascending" | "descending",
  shouldFlip: boolean = true
): "ascending" | "descending" {
  if (!shouldFlip) {
    return dir;
  }
  return dir === "ascending" ? "descending" : "ascending";
}
