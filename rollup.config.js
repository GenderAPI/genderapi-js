export default {
    input: "src/genderapi.js",
    output: [
        {
            file: "dist/genderapi.esm.js",
            format: "esm"
        },
        {
            file: "dist/genderapi.umd.js",
            format: "umd",
            name: "GenderAPI"
        }
    ]
}
