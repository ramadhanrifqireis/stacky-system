const JSONDriver = require('./JSONDriver');

const db = new JSONDriver('database/core/orders.json', { active: [], history: [] });

class Order {
    static getActive() {
        return db.read().active || [];
    }

    static getHistory() {
        return db.read().history || [];
    }

    static addActive(orderData) {
        const data = db.read();
        if (!data.active) data.active = [];
        
        data.active.push(orderData);
        db.write(data);
        return true;
    }

    static moveActiveToHistory(orderId, status, extraFields = {}) {
        const data = db.read();
        if (!data.active) return null;

        const idx = data.active.findIndex(o => o.id === orderId);
        if (idx !== -1) {
            const order = data.active[idx];
            order.status = status;
            Object.assign(order, extraFields); // e.g. receipt_data untuk struk Itemku
            
            if (!data.history) data.history = [];
            data.history.unshift(order); // Masuk history paling atas
            data.active.splice(idx, 1);  // Hapus dari active
            
            db.write(data);
            return order;
        }
        return null;
    }

    static markAsNotified(orderId) {
        const data = db.read();
        const order = data.active.find(o => o.id === orderId);
        if (order) {
            order.notified = true;
            db.write(data);
        }
    }

    /** Update order di active (untuk delay: status, resume_at, receipt_data) */
    static updateActive(orderId, updates) {
        const data = db.read();
        if (!data.active) return null;
        const idx = data.active.findIndex(o => o.id === orderId);
        if (idx === -1) return null;
        Object.assign(data.active[idx], updates);
        db.write(data);
        return data.active[idx];
    }
}

module.exports = Order;