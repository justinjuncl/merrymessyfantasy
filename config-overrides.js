module.exports = function override(config, env) {
    console.log(config.module)
    config.module.rules.push(
        {
            test: /\.html$/i,
            loader: "html-loader",
        }
    );
    return config;
}
