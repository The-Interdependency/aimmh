import { defineMsdmdCollection } from "./.agents/skills/msdmd/collection";

export default defineMsdmdCollection({
  "declarations": [],
  "edges": [],
  "gaps": [
    {
      "file": "aimmh_lib/, backend/, frontend/",
      "missing": [
        "MODULE_BUILD"
      ],
      "reason": "Source files carry zero msdmd blocks (2026-07-26 audit); ratios seals exist on some files but block adoption has not started."
    }
  ],
  "repo": "The-Interdependency/aimmh"
});
