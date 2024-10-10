import { createIcon } from "@chakra-ui/icons";

export const SquareIcon = createIcon({
  displayName: "SquareIcon",
  viewBox: "0 0 14 14",
  // path can also be an array of elements, if you have multiple paths, lines, shapes, etc.
  path: [<rect width="14" height="14" rx="2" fill="white" />],
});
