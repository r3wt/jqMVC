### Contributor Style Guidelines:

1. all functions should have opening brace dropped to next line:

```js
app.foobar = function ()
{

};
```

2. convert tabs to spaces before committing to master or opening a PR.

3. all properties on app must be documented using documentation.js syntax.

4. exposing private variables on app should be done via a getter, as is done for `app.view`:

```js

Object.defineProperty(app, "view", { 
    get: function () { 
        return view; 
    } 
});

```

5. Remember the trinity and keep it holy: 
	- The Trinity: Coverage, Performance, File Size in that order.
	- It is ok to sacrifice readability for any of the above reasons. 
	
6. Use comments liberally. if you think it should be commented, feel free to do so. minification zaps these anyway.

7. Respect the community. Be polite and respectful in the issues. Support/Noob issues are allowed until further notice.

8. Test your code to the best of your abilities. Don't commit code that fails for obvious use cases. 
	- For internal functions, you can use jsfiddle to write a quick unit test with the function.
	
9. Versioning Policy
	- Major.Minor.BugFix
	- Major releases break backwards compatibility
	- Minor versions provide minor compatibility changes and/or new functionality.
	- BugFix are versions that fix any bug. the maximum version for a bugfix should be 9, afterwhich it becomes a minor version.
	- You can change the version in `src/version.txt`
	- When building a new version, remove any old builds prior to committing. 
	- always build before commiting. the latest build should always be in the repo, as is.
	
10. Release policy

	- Releases prior to 1.0 should be marked as pre release.
	- Always supply the unminified and minified builds in the release.
	- Write a couple of sentences explaining what has changed. bullet points are best. you can optionally reference commit numbers.
	- Until further notice, do not name builds.
