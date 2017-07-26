const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");

const PRODUCTION = process.env.NODE_ENV === "production";

const autoprefixBrowsers = [
	"last 5 Chrome versions", // Last 6 months
];

const babelPresets = [
	[
		"env",
		{
			"targets": {
				"browsers": autoprefixBrowsers,
			},
			"useBuiltIns": true,
		},
	],
	"es2015",
];

const postCSSPluginsOptions = () => {
	return [
		require("autoprefixer")({
			browsers: autoprefixBrowsers,
		}),
		require("cssnano")({
			safe: true,
			sourcemap: true,
			autoprefixer: false,
			colormin: { legacy: true },
		}),
	];
};

const basePlugins = [
	new webpack.DefinePlugin({
		"process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
		__DEV_MODE__: JSON.stringify(!PRODUCTION),
	}),
    new webpack.NamedModulesPlugin(),
	new webpack.optimize.CommonsChunkPlugin({
		name: "vendor",
		filename: "vendor.js",
		minChunks: ({resource}) => /node_modules/.test(resource),
	}),
	new HtmlWebpackPlugin({
		template: "./player/html/index.html",
		filename: "index.html",
		inject: false,
		assetRoot: PRODUCTION ? '${ASSET_PATH}' : '.',
		dasmPort: PRODUCTION ? '${DASM_PORT}' : '4834',
	}),
	new ExtractTextPlugin({
		filename: "[name].css",
        disable: !PRODUCTION,
		allChunks: true,
	}),
	// new CopyWebpackPlugin([
	// 	{ from: './src/raw', to: '.' },
	// ]),
];

const devPluginsBefore = [
];

const devPluginsAfter = [
	new webpack.NoEmitOnErrorsPlugin(),
];

const prodPluginsBefore = [
	new CleanWebpackPlugin(["resources/player"], {
		root: __dirname,
		verbose: true,
		dry: false,
		exclude: [],
	}),
];

const prodPluginsAfter = [
	new webpack.optimize.UglifyJsPlugin({
		beautify: false,
		compress: {
			warnings: false,
			sequences: true,
			dead_code: true,
			conditionals: true,
			booleans: true,
			unused: true,
			if_return: true,
			join_vars: true,
			drop_console: true,
			screw_ie8: true,
		},
		output: {
			comments: false,
		},
		comments: false,
		sourceMap: false,
	}),
];

const plugins = []
	.concat(PRODUCTION ? prodPluginsBefore : [])
	.concat(!PRODUCTION ? devPluginsBefore : [])
	.concat(basePlugins)
	.concat(PRODUCTION ? prodPluginsAfter : [])
	.concat(!PRODUCTION ? devPluginsAfter : []);

module.exports = {
	entry: {
		player: [
			"./src/player/tab/Player.ts",
			"./player/css/Player.css",
		],
	},

	output: {
		path: path.join(__dirname, "resources", "player"),
		filename: "[name].js",
		//publicPath: "/",
		//sourceMapFilename: 'assets/[name].js.map',
	},

	devtool: PRODUCTION ? "" : "source-map",

	plugins: plugins,

	devServer: {
		port: process.env.PORT || 8080,
		historyApiFallback: { index: "/" },
	},

	externals: {
	},

	resolve: {
		extensions: [ ".ts", ".js" ],
		modules: [ "node_modules", "src/ts" ],
	},

	module: {
		rules: [
			{
				test: /\.json$/,
				exclude: /node_modules/,
				use: [
					"json-loader",
					"webpack-comment-remover-loader",
				]
			},
			{
				test: /\.ts$/,
				exclude: /node_modules/,
				use: [
					{
						loader: "babel-loader",
						options: {
							presets: babelPresets,
						},
					},
					{
						loader: "ts-loader",
						options: {
							configFileName: "player.tsconfig.json",
						},
					}
				],
			},
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: [
					{
						loader: "babel-loader",
						options: {
							presets: babelPresets,
						},
					},
				],
			},
			{
				test: /\.css$/,
				exclude: /node_modules/,
				loader: ExtractTextPlugin.extract({
					fallback: "style-loader",
					//publicPath: "../",
					use: [
						"css-loader",
						{
							loader: "postcss-loader",
							options: {
								sourceMap: true,
								plugins: postCSSPluginsOptions,
							},
						},
					]
				}),
			},
			{
				test: /assets.+\.(png|jpg|jpeg|gif|svg)$/,
				use: [
					// To inline images if small enough:
					{
						loader: "url-loader",
						query: {
							name: "assets/[path][name].[ext]",
							context: "./src/assets",
							limit: 200,
						}
					},
					{
						loader: "image-webpack-loader",
						options: {
							mozjpeg: {
								quality: 85,
							},
							pngquant: {
								quality: "50-100",
								speed: PRODUCTION ? 1 : 4, // Speed/quality trade-off from 1 (brute-force) to 10 (fastest). The default is 3. Speed 10 has 5% lower quality, but is 8 times faster than the default.
							},
							svgo: {
								plugins: [
									{
										removeTitle: true,
									},
								],
							},
							optipng: {
								optimizationLevel: 1,
							},
						}
					}
					// To always have external images:
					// "file-loader?name=images/[path][name].[ext]&context=./src/images",
				],
			},
		],
	},
};
