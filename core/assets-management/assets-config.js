var AssetsConfig = {

    assetTypes: {

        MODEL: {
            typeName: "MODEL",
            defaultIconUrl: "assets/icons/default-model-icon.png",
            subAssetTypes: {

                COLLADA: { //http://www.iana.org/assignments/media-types/model/vnd.collada+xml
                    subAssetTypeName: "COLLADA",
                    detailedName: "Collaborative Design Activity",
                    mimeTypes: [
                        "model/vnd.collada+xml"
                    ]
                }
            }
        },

        IMAGE: {
            typeName: "IMAGE",
            defaultIconUrl: "assets/icons/default-image-icon.png",
            subAssetTypes: {

                JPEG: { // RFC-2045, RFC-2046
                    subAssetTypeName: "JPEG",
                    detailedName: "JPEG Image",
                    mimeTypes: [
                        "image/jpeg"
                    ]
                },

                JP2: { // RFC-3745
                    subAssetTypeName: "JP2",
                    detailedName: "JPEG 2000",
                    mimeTypes: [
                        "image/jp2"
                    ]
                },

                PNG: { // RFC-2045, RFC-2048
                    subAssetTypeName: "PNG",
                    detailedName: "Portable Network Graphics",
                    mimeTypes: [
                        "image/png"
                    ]
                },

                GIF: { // RFC-2045, RFC-2046
                    subAssetTypeName: "GIF",
                    detailedName: "Graphics Interchange Format",
                    mimeTypes: [
                        "image/gif"
                    ]
                },

                SVG: { // RFC-3023
                    subAssetTypeName: "SVG",
                    detailedName: "Scalable Vector Graphics",
                    mimeTypes: [
                        "image/svg+xml"
                    ]
                }
            }
        },

        AUDIO: {
            typeName: "AUDIO",
            defaultIconUrl: "assets/icons/default-audio-icon.png",
            subAssetTypes: {

                AAC: {
                    subAssetTypeName: "AAC",
                    detailedName: "Advanced Audio Coding",
                    mimeTypes: [
                        "audio/aac",
                        "audio/aacp",
                        "audio/x-aac",
                        "audio/x-m4a",
                        "audio/x-m4p",
                        "audio/x-m4b",
                        "audio/x-m4r",
                        "audio/mp4",
                        "audio/3gpp",
                        "audio/3gpp2"
                    ]
                },

                AIFF: {
                    subAssetTypeName: "AIFF",
                    detailedName: "Audio Interchange File Format",
                    mimeTypes: [
                        "audio/aiff",
                        "audio/x-aiff"
                    ]
                },

                FLAC: {
                    subAssetTypeName: "FLAC",
                    detailedName: "Free Lossless Audio Codec",
                    mimeTypes: [
                        "audio/x-flac",
                        "audio/flac"
                    ]
                },

                MPEG: { // RFC-3003
                    subAssetTypeName: "MPEG",
                    detailedName: "MPEG-1/2 Audio",
                    mimeTypes: [
                        "audio/mpeg"
                    ]
                },

                OGG: { // RFC-5334
                    subAssetTypeName: "OGG",
                    detailedName: "Ogg",
                    mimeTypes: [
                        "audio/ogg"
                    ]
                },

                WAVE: { // RFC-2361
                    subAssetTypeName: "WAVE",
                    detailedName: "Waveform Audio File Format",
                    mimeTypes: [
                        "audio/vnd.wave",
                        "audio/x-wav",
                        "audio/wave",
                        "audio/wav"
                    ]
                }
            }

        },

        //TODO add more mime-types
        VIDEO: {
            typeName: "VIDEO",
            defaultIconUrl: "assets/icons/default-video-icon.png",
            subAssetTypes: {

                MP4: { // RFC-4337
                    subAssetTypeName: "MP4",
                    detailedName: "MPEG-4 Part 10",
                    mimeTypes: [
                        "video/mp4"
                    ]
                }
            }
        }

    }

};

exports.AssetsConfig = AssetsConfig;
