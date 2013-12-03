var AssetsConfig = {

    assetTypes: {

        MODEL: {
            typeName: "MODEL",
            defaultIconUrl: "assets/icons/default-model-icon.png",
            fileFormats: {

                COLLADA: { //http://www.iana.org/assignments/media-types/model/vnd.collada+xml
                    fileFormatName: "COLLADA",
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
            fileFormats: {

                JPEG: { // RFC-2045, RFC-2046
                    fileFormatName: "JPEG",
                    detailedName: "JPEG Image",
                    mimeTypes: [
                        "image/jpeg"
                    ]
                },

                JP2: { // RFC-3745
                    fileFormatName: "JP2",
                    detailedName: "JPEG 2000",
                    mimeTypes: [
                        "image/jp2"
                    ]
                },

                PNG: { // RFC-2045, RFC-2048
                    fileFormatName: "PNG",
                    detailedName: "Portable Network Graphics",
                    mimeTypes: [
                        "image/png"
                    ]
                },

                GIF: { // RFC-2045, RFC-2046
                    fileFormatName: "GIF",
                    detailedName: "Graphics Interchange Format",
                    mimeTypes: [
                        "image/gif"
                    ]
                },

                SVG: { // RFC-3023
                    fileFormatName: "SVG",
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
            fileFormats: {

                AAC: {
                    fileFormatName: "AAC",
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
                    fileFormatName: "AIFF",
                    detailedName: "Audio Interchange File Format",
                    mimeTypes: [
                        "audio/aiff",
                        "audio/x-aiff"
                    ]
                },

                FLAC: {
                    fileFormatName: "FLAC",
                    detailedName: "Free Lossless Audio Codec",
                    mimeTypes: [
                        "audio/x-flac",
                        "audio/flac"
                    ]
                },

                MPEG: { // RFC-3003
                    fileFormatName: "MPEG",
                    detailedName: "MPEG-1/2 Audio",
                    mimeTypes: [
                        "audio/mpeg"
                    ]
                },

                OGG: { // RFC-5334
                    fileFormatName: "OGG",
                    detailedName: "Ogg",
                    mimeTypes: [
                        "audio/ogg"
                    ]
                },

                WAVE: { // RFC-2361
                    fileFormatName: "WAVE",
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

        VIDEO: {
            typeName: "VIDEO",
            defaultIconUrl: "assets/icons/default-video-icon.png",
            fileFormats: {

                MP4: { // RFC-4337
                    fileFormatName: "MP4",
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
