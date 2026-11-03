import nextVitals from "eslint-config-next/core-web-vitals";

const config = [...nextVitals, { ignores: [".history/**", ".next/**"] }];

export default config;
