import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

// Initialize the WooCommerce API client
// Note: This should only be used on the server side
export const wcApi = new WooCommerceRestApi({
    url: "https://www.bortolatoefoglia.it",
    consumerKey: process.env.WC_CONSUMER_KEY || "ck_b9e2800992d2dae9b78801d8eb6830c143b8d39b", // Provided by user
    consumerSecret: process.env.WC_CONSUMER_SECRET || "cs_e51919f480984446d4f064e2653aee6c69af24c9", // Provided by user
    version: "wc/v3",
});
