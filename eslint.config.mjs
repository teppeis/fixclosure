import { build } from "eslint-config-teppeis";
import { mocha } from "eslint-config-teppeis/configs/mocha";

export default await build(
  { base: "node18", typescript: true },
  {
    ignores: ["lib", "test/fixtures"],
  },
  mocha,
);
