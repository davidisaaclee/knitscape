import { atom } from "jotai";
import * as M from "./model";

export const pattern = atom<M.Pattern>([]);
export const palette = atom<M.Palette>({});
export const cursor = atom<M.Cursor>({
  row: 0,
  column: 0,
  direction: "ltr",
});
