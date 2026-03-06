"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { PageLayout } from "../../chat/components/page-layout.js";
import { ClusterIcon, UserIcon } from "../../chat/components/icons.js";
const TABS = [
  { id: "list", label: "Clusters", href: "/clusters/list", icon: ClusterIcon },
  { id: "roles", label: "Roles", href: "/clusters/roles", icon: UserIcon }
];
function ClustersLayout({ session, children }) {
  const [activePath, setActivePath] = useState("");
  useEffect(() => {
    setActivePath(window.location.pathname);
  }, []);
  return /* @__PURE__ */ jsxs(PageLayout, { session, children: [
    /* @__PURE__ */ jsx("div", { className: "mb-6", children: /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold", children: "Clusters" }) }),
    /* @__PURE__ */ jsx("div", { className: "flex gap-1 border-b border-border mb-6 overflow-x-auto", children: TABS.map((tab) => {
      const isActive = activePath === tab.href || activePath.startsWith(tab.href + "/");
      const Icon = tab.icon;
      return /* @__PURE__ */ jsxs(
        "a",
        {
          href: tab.href,
          className: `inline-flex items-center gap-2 px-3 py-2 min-h-[44px] shrink-0 text-sm font-medium border-b-2 transition-colors ${isActive ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"}`,
          children: [
            /* @__PURE__ */ jsx(Icon, { size: 14 }),
            tab.label
          ]
        },
        tab.id
      );
    }) }),
    children
  ] });
}
export {
  ClustersLayout
};
