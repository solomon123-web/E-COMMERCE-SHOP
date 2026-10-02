import { describe, expect, it } from 'vitest';
import { createUserAccount, loginUser, getCatalog, addItemToCart, createOrder, getStats, } from '../src/store';
describe('ecommerce backend', () => {
    it('registers a user with a secure hash and a customer role', async () => {
        const user = await createUserAccount({
            name: 'Jane Doe',
            email: 'jane@example.com',
            password: 'Passw0rd!',
        });
        expect(user.email).toBe('jane@example.com');
        expect(user.passwordHash).toBeTruthy();
        expect(user.role).toBe('customer');
    });
    it('logs in with the correct credentials', async () => {
        const token = await loginUser({
            email: 'jane@example.com',
            password: 'Passw0rd!',
        });
        expect(token).toBeTypeOf('string');
        expect(token.length).toBeGreaterThan(20);
    });
    it('returns the catalog and product details', async () => {
        const catalog = await getCatalog();
        expect(catalog.length).toBeGreaterThan(0);
        expect(catalog[0].slug).toBeTruthy();
    });
    it('adds an item to the cart and creates an order with stock validation', async () => {
        const added = await addItemToCart('guest', 1, 2);
        expect(added.quantity).toBe(2);
        const order = await createOrder({
            userEmail: 'jane@example.com',
            items: [{ productId: 1, quantity: 1 }],
            shippingAddress: {
                fullName: 'Jane Doe',
                phone: '1234567890',
                address: '5 Market Street',
                city: 'Austin',
                state: 'Texas',
                country: 'USA',
                postalCode: '73301',
            },
        });
        expect(order.total).toBeGreaterThan(0);
        expect(order.paymentStatus).toBe('paid');
    });
    it('returns stats for the dashboard', async () => {
        const stats = await getStats();
        expect(stats.totalProducts).toBeGreaterThan(0);
        expect(stats.totalCustomers).toBeGreaterThan(0);
    });
});
