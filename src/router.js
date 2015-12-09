//router
router.interval = null;
router.currentId = "";
router.currentParameters = {};

router.capabilities = {
	hash: hasHashState,
	pushState: hasPushState,
	timer: !hasHashState && !hasPushState
};

router.checkRoute = function(url) 
{
	return getParameters(parseUrl(url)).length > 0;
};

// get the current parameters for either a specified url or the current one if parameters is ommited
router.parameters = function(url)
{
	// parse the url so that we handle a unified url
	var currentUrl = parseUrl(url);

	// get the list of actions for the current url
	var list = getParameters(currentUrl);

	// if the list is empty, return an empty object
	if (list.length == 0) {
		router.currentParameters = {};
	} else {
		router.currentParameters = list[0].data;// if we got results, return the first one. at least for now
	}

	return router.currentParameters;
};
//endrouter