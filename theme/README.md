# Tripoli Ghost Theme

[Theme Documentation](https://aspirethemes.com/docs/tripoli)

---

## DC Modifications

### 1. Nested navigation
Nested navigation (child and grandchild links) has been implemented for the top (primary) navigation bar. Ghost Admin does not provide a native way to specify hierarchy, so hierarchy is encoded with marker query parameters in each navigation URL.

These marker parameters are used only by the theme. Handlebars uses them to hide child/grandchild items before JavaScript runs, and JavaScript builds the dropdowns and removes the marker parameters from the final clickable links.

- To denote that a navigation item has children, append `?nav-has-children`.
- To denote that a navigation item is a child, append `?nav-child`.
- To denote that a child item also has children, use both markers: `?nav-child&nav-has-children`.
- To denote that a navigation item is a grandchild, append `?nav-grandchild`.

No values are required for these parameters, only keys. The order of navigation items in Ghost Admin matters: place each parent before its children, and each child before its grandchildren.

**Example navigation menu:**
| Title | Path |
|---|---|
| Entry 1 | `/entry-1?nav-has-children` |
| Entry 1A | `/entry-1a?nav-child` |
| Entry 1B | `/entry-1b?nav-child` |
| Entry 2 | `/entry-2?nav-has-children` |
| Entry 2A | `/entry-2a?nav-child&nav-has-children` |
| Entry 2AA | `/entry-2aa?nav-grandchild` |
| Entry 2AB | `/entry-2ab?nav-grandchild` |
| Entry 2B | `/entry-2b?nav-child&nav-has-children` |
| Entry 2BA | `/entry-2ba?nav-grandchild` |
| Entry 2C | `/entry-2c?nav-child` |
| Entry 2D | `/entry-2d?nav-child` |
| Entry 3 | `/entry-3?nav-has-children` |

---