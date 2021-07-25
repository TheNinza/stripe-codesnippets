"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripe = void 0;
// Environment Variables (Stripe API Key)
const dotenv_1 = require("dotenv");
if (process.env.NODE_ENV !== "production") {
    dotenv_1.config();
}
// initialising stripe
const stripe_1 = __importDefault(require("stripe"));
exports.stripe = new stripe_1.default(process.env.STRIPE_SECRET, {
    apiVersion: "2020-08-27",
});
// start the api with express
const api_1 = require("./api");
const port = process.env.PORT || 8000;
api_1.app.listen(port, () => {
    console.log("App running on port: " + port);
});
//# sourceMappingURL=index.js.map