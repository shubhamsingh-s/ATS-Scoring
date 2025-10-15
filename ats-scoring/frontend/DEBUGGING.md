Debugging the blank page and extension-origin errors

1) Reproduce in a clean profile / incognito
- Open your browser in Incognito/Private mode (extensions are typically disabled) and navigate to the dev server (http://localhost:3000 or the port react-scripts selects).
- If the blank page or `content-all.js` error disappears, an extension is the likely cause.

2) Disable extensions selectively
- Temporarily disable all extensions. Re-enable them one-by-one to find the culprit (focus on ad-blockers, grammar checkers, or privacy tools).

3) Clear localStorage
- Sometimes corrupted auth state in `localStorage` can cause parse errors. In DevTools -> Application -> Local Storage, clear the `token` and `user` keys.

4) Check the browser console
- Filter for "Errors" and inspect stack traces. If the top frames point to `content-*.js` or similar, that indicates an extension.

5) Run the dev server and inspect terminal
- In the project `frontend` folder run:

```cmd
cd /d "c:\Users\shubh\OneDrive\Desktop\ats-scoring\ats-scoring\frontend"
npm start
```

- If port 3000 is used, accept to run on another port.

6) If the app still shows blank after checking extensions and localStorage
- Reload again, then open DevTools -> Console and Network. Look for any failing network requests or exceptions from your app bundle (files under `static/js` rather than `content-*.js`).

7) If you'd like, the repository has a defensive ErrorBoundary and unhandledrejection handler added to avoid showing a blank page. We can also scan the provider code for top-level async failures.

Contact me with the DevTools console output (full stack) if this doesn't resolve it and I'll patch the exact failing module.