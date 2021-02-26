module.exports = function (api) {
    return {
        "presets": [
            "@babel/preset-env"
        ],
        "plugins": [
            [
                "@babel/plugin-transform-react-jsx",
                {
                    "pragma": "wp.element.createElement"
                }
            ],
            [
                "@wordpress/babel-plugin-makepot",
                {
                    "output": api.env("frontend") ? "languages/the-booking-frontend.pot" : "languages/the-booking-backend.pot"
                }
            ],
            [
                "@babel/plugin-proposal-class-properties"
            ],
            [
                "babel-plugin-transform-imports",
                {
                    "@material-ui/lab"  : {
                        "transform"        : "@material-ui/lab/${member}",
                        "preventFullImport": true
                    },
                    "@material-ui/core" : {
                        "transform"        : "@material-ui/core/${member}",
                        "preventFullImport": true
                    },
                    "@material-ui/icons": {
                        "transform"        : "@material-ui/icons/${member}",
                        "preventFullImport": true
                    },
                    "date-fns"          : {
                        "transform"        : "date-fns/${member}",
                        "preventFullImport": true
                    },
                    "date-fns-tz"       : {
                        "transform"        : "date-fns-tz/${member}",
                        "preventFullImport": true
                    }
                }
            ]
        ]
    };
};

