import { atomWithStorage } from "jotai/utils";
import * as M from "./model";

export const pattern = atomWithStorage<M.Pattern>(
  "pattern",
  M.Pattern.create()
);
export const palette = atomWithStorage<M.Palette>("palette", {});
export const cursor = atomWithStorage<M.Cursor>("cursor", {
  row: 0,
  column: 0,
  direction: "ltr",
});
