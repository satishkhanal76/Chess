import ClassicalVariant from "./ClassicalVariant.js";
import FourOFourVariant from "./FourOFourVariant.js";
import TwoQueenVariant from "./TwoQueenVariant.js";

const VARIANT_CREATORS = {
  classical: () => new ClassicalVariant("classical"),
  "two-queen": () => new TwoQueenVariant("two-queen"),
  "404-variant": () => new FourOFourVariant("404-variant"),
};

export default class VariantFactory {
  static create(variantName = "classical") {
    const createVariant = VARIANT_CREATORS[variantName] || VARIANT_CREATORS.classical;
    return createVariant();
  }
}
