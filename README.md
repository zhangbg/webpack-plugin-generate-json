# webpack-plugin-generate-json

Webpack plugin to generating a custom JSON asset. And more feature is : watching file change , supporting generate function config.


### Usage

```js
// webpack.config.js
const GenerateJsonPlugin = require('webpack-plugin-generate-json');
function gernerateJson(path) {
	var json = requireNotByCache(path), newConfig,
		subItems = json['subItems'] || [],
		parentPath = path.slice(0, path.lastIndexOf('\\') + 1), watchList = [path];
	subItems.forEach(function (item) {
		var key = item.id + '_Settings', itemPath = parentPath + 'config-' + item.id + '.json';
		newConfig = requireNotByCache(itemPath) || {};
		json[key] = newConfig;
		watchList.push(itemPath);
	});
	function requireNotByCache(path) {
		var result = {};
		delete require.cache[require.resolve(path)];
		try {
			result = require(path);
		} catch(e) {
			console.log('\x1b[33m' + 'The JSON file is not validated : ' + path);
			result = {};
		}
		return result;
	}
	return {
		json,
		watchList
	};
}

module.exports = {
  // ...
  plugins: [
    // ...
    new GenerateJsonPlugin('./config.json', gernerateJson, path.resolve('./config/config.json'))
  ]
  // ...
};
```

This will create a file `config.json` in webpack's output directory, with contents:
```json
   {
		"config" : "The base config content",
		"subItemId_Settings" : {...}
   }
```

