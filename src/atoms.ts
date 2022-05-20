import { atomWithStorage } from "jotai/utils";
import * as M from "./model";

export const pattern = atomWithStorage<M.Pattern>(
  "pattern",
  M.Pattern.create()
);
export const palette = atomWithStorage<M.Palette>("palette", {});
export const cursor = atomWithStorage<M.Cursor>("cursor", M.Cursor.create());

export const bookmark = atomWithStorage<M.Cursor | null>("bookmark", null);
