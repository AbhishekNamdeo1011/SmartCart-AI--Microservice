 import {tool} from '@langchain/core/tools';
import { z } from 'zod'; 
 import axios from 'axios';

 const searchProduct = tool(async ({ query,token }) => {

    const response = await axios.get(`http://localhost:3001/api/products?q=${query}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return JSON.stringify(response.data);
 },
    {
        name: "search_product",
        description: "Search for products based on a query string. The query should be a natural language description of the product you are looking for.",
        schema: z.object({
            query: z.string().describe("The search query for products."),
        }),
    }
 ); 

 const addProductToCart = tool(async ({ productId, quantity = 1, token }) => {
const response = await axios.post(`http://localhost:3002/api/cart/items`, {
    productId,
    quantity,
}, {
    headers: {
        Authorization: `Bearer ${token}`,
    },
});
return `Added product with ID ${productId} and quantity ${quantity} to the cart.`;
 },{
    name: "add_product_to_cart",
    description: "Add a product to the user's cart. Requires the product ID and quantity.",
    schema: z.object({
        productId: z.string().describe("The ID of the product to add to the cart."),
        quantity: z.number().describe("The quantity of the product to add to the cart.").default(1),
    }),
}); 


 


export { searchProduct, addProductToCart };