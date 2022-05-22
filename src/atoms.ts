import { isEqual } from "lodash";
import { atom, SetStateAction, Getter, useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import * as M from "./model";

export const pattern = atomWithStorage<M.Pattern>(
  "pattern",
  M.Pattern.create()
);
export const palette = atomWithStorage<M.Palette>("palette", {});
export const legacyCursor = atomWithStorage<M.Cursor>(
  "cursor",
  M.Cursor.create()
);

export const cursorHistory = atomWithStorage<{
  commits: [M.Cursor] | [M.Cursor, M.Cursor];
  index: 0 | 1;
}>("cursorHistory", {
  commits: [M.Cursor.create()],
  index: 0,
});

export function useCursorHistory(): {
  resetType: "undo" | "redo";
  reset: () => void;
} {
  const [history, setHistory] = useAtom(cursorHistory);
  if (history.index === 0) {
    return {
      resetType: "undo",
      reset() {
        if (history.commits.length === 1) {
          return;
        }
        setHistory({ ...history, index: 1 });
      },
    };
  } else {
    return {
      resetType: "redo",
      reset() {
        setHistory({ ...history, index: 0 });
      },
    };
  }
}

const getCurrentCursor = (get: Getter) => {
  const ch = get(cursorHistory);
  return ch.commits[ch.index]!;
};

export const cursor = atom<M.Cursor, SetStateAction<M.Cursor>>(
  getCurrentCursor,
  (get, set, update) => {
    const ch = get(cursorHistory);
    const currentCursor = getCurrentCursor(get);
    const resolvedUpdate =
      typeof update === "function" ? update(currentCursor) : update;
    if (isEqual(currentCursor, resolvedUpdate)) {
      return;
    }
    if (ch.index === 0) {
      set(cursorHistory, {
        commits: [resolvedUpdate, ch.commits[0]],
        index: 0,
      });
    } /* if (ch.index === 1) */ else {
      // next action was going to be redo
      set(cursorHistory, {
        commits: [resolvedUpdate, ch.commits[1]!],
        index: 0,
      });
    }
  }
);

export const bookmark = atomWithStorage<M.Cursor | null>("bookmark", null);
