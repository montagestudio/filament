/**
 * Contains the configuration for the Asset Management:
 * - Supported Asset Categories.
 * - Supported Mime-Types.
 * - Default icon url for each Asset Category.
 **/

//TODO add more mime-types and Asset Category?

var AssetsConfig = {

    assetCategories: {

        MODEL: {
            categoryName: "MODEL",
            defaultIconUrl: "assets/icons/default-model-icon.svg",
            mimeTypes: [
                "model/vnd.collada+xml",
                "model/gltf-bundle",
                "model/gltf"
            ],
            templates: [
                "model/vnd.collada+xml"
            ],
            hidden: [
                // no one are hidden for the demo
            ]
        },

        IMAGE: {
            categoryName: "IMAGE",
            defaultIconUrl: "assets/icons/default-image-icon.svg",
            mimeTypes: [
                "image/jpeg",
                "image/jp2",
                "image/png",
                "image/gif",
                "image/svg+xml"
            ]
        },

        AUDIO: {
            categoryName: "AUDIO",
            defaultIconUrl: "assets/icons/default-audio-icon.svg",
            mimeTypes: [
                "audio/aac",
                "audio/mp4",
                "audio/mpeg",
                "audio/x-flac",
                "audio/x-aiff",
                "audio/x-wav"
            ]

        },

        VIDEO: {
            categoryName: "VIDEO",
            defaultIconUrl: "assets/icons/default-video-icon.svg",
            mimeTypes: [
                "video/mp4",
                "video/3gpp",
                "video/3gpp2",
                "video/quicktime",
                "video/mpeg"
            ]
        }

    }

};

exports.AssetsConfig = AssetsConfig;
