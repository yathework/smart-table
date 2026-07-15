// data.js
const BASE_URL = 'https://webinars.webdev.education-services.ru/sp7-api';

export function initData(sourceData) {
    let sellers = null;
    let customers = null;
    let lastResult = null;
    let lastQuery = null;
    let useServer = true;

    const buildLocalIndexes = () => {
        if (!sourceData) throw new Error('sourceData required for local mode');
        sellers = sourceData.sellers.reduce((acc, s) => {
            acc[s.id] = { id: s.id, name: `${s.first_name} ${s.last_name}` };
            return acc;
        }, {});
        customers = sourceData.customers.reduce((acc, c) => {
            acc[c.id] = { id: c.id, name: `${c.first_name} ${c.last_name}` };
            return acc;
        }, {});
        return { sellers, customers };
    };

    const getLocalRecords = (query) => {
        if (!sellers || !customers) buildLocalIndexes();
        const allItems = sourceData.purchase_records.map(item => ({
            receipt_id: item.receipt_id,
            date: item.date,
            seller_id: item.seller_id,
            customer_id: item.customer_id,
            total_amount: item.total_amount
        }));
        const limit = parseInt(query.limit) || 10;
        const page = parseInt(query.page) || 1;
        const start = (page - 1) * limit;
        const itemsSlice = allItems.slice(start, start + limit);
        const mapped = itemsSlice.map(item => ({
            id: item.receipt_id,
            date: item.date,
            seller: sellers[item.seller_id],
            customer: customers[item.customer_id],
            total: item.total_amount
        }));
        return {
            total: allItems.length,
            items: mapped
        };
    };

    const mapRecords = (data) => data.map(item => ({
        id: item.receipt_id,
        date: item.date,
        seller: sellers[item.seller_id],
        customer: customers[item.customer_id],
        total: item.total_amount
    }));

    const getIndexes = async () => {
        if (!useServer) {
            return buildLocalIndexes();
        }
        if (!sellers || !customers) {
            try {
                const [sellersData, customersData] = await Promise.all([
                    fetch(`${BASE_URL}/sellers`).then(res => res.json()),
                    fetch(`${BASE_URL}/customers`).then(res => res.json()),
                ]);
                sellers = sellersData;
                customers = customersData;
            } catch (e) {
                useServer = false;
                return buildLocalIndexes();
            }
        }
        return { sellers, customers };
    };

    const getRecords = async (query, isUpdated = false) => {
        if (!useServer) {
            return getLocalRecords(query);
        }
        const qs = new URLSearchParams(query);
        const nextQuery = qs.toString();
        if (lastQuery === nextQuery && !isUpdated) {
            return lastResult;
        }
        try {
            const response = await fetch(`${BASE_URL}/records?${nextQuery}`);
            if (!response.ok) throw new Error(`Server error: ${response.status}`);
            const records = await response.json();
            lastQuery = nextQuery;
            lastResult = {
                total: records.total,
                items: mapRecords(records.items)
            };
            return lastResult;
        } catch (error) {
            useServer = false;
            if (!sellers || !customers) buildLocalIndexes();
            return getLocalRecords(query);
        }
    };

    return { getIndexes, getRecords, getLocalRecords, buildLocalIndexes };
}