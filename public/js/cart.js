// public/js/cart.js
// Thư viện dùng chung cho mọi trang cần thao tác giỏ hàng (chitiet, giohang, dathang...).
// Giỏ hàng được lưu thật trong MongoDB (collection cart_items), định danh bằng "cartId"
// sinh ngẫu nhiên và lưu trong localStorage của trình duyệt (giỏ hàng ẩn danh).
// Khi dự án có hệ thống đăng nhập thật, chỉ cần thay cartId bằng userId là xong.

const Cart = {
    getCartId() {
        let cartId = localStorage.getItem('cartId');
        if (!cartId) {
            cartId = 'cart-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
            localStorage.setItem('cartId', cartId);
        }
        return cartId;
    },

    async getItems() {
        const res = await fetch(`/api/cart/${this.getCartId()}`);
        if (!res.ok) throw new Error('Không tải được giỏ hàng');
        return res.json();
    },

    async addItem({ productId, productType, name, img, price, variant, color, qty }) {
        const res = await fetch('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cartId: this.getCartId(),
                productId, productType, name, img, price, variant, color, qty
            })
        });
        if (!res.ok) throw new Error('Không thêm được vào giỏ hàng');
        return res.json();
    },

    async updateQty(itemId, qty) {
        const res = await fetch(`/api/cart/${itemId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ qty })
        });
        if (!res.ok) throw new Error('Không cập nhật được số lượng');
        return res.json();
    },

    async setSelected(itemId, selected) {
        const res = await fetch(`/api/cart/${itemId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ selected })
        });
        if (!res.ok) throw new Error('Không cập nhật được trạng thái chọn');
        return res.json();
    },

    async removeItem(itemId) {
        const res = await fetch(`/api/cart/${itemId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Không xoá được sản phẩm');
        return res.json();
    },

    async clear() {
        const res = await fetch(`/api/cart/clear/${this.getCartId()}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Không xoá được giỏ hàng');
        return res.json();
    }
};
