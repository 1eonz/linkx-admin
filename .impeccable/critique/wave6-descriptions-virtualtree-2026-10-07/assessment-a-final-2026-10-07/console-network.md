# Console / Network Note

On `http://127.0.0.1:4175/components/lxdescriptions`, Playwright response and console listeners reported one error:

`GET http://127.0.0.1:4175/favicon.ico -> 404 (Not Found)`

The request is the VitePress document shell favicon, not an LxCascader, LxDescriptions, LxVirtualTree, or sidebar request. It is recorded as a documentation-shell false positive and excluded from the design issue count. No detector or overlay was run.
