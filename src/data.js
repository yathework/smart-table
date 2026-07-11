// data.js
const BASE_URL = 'https://webinars.webdev.education-services.ru/sp7-api';

export function initData(sourceData) {
    let sellers;
    let customers;
    let lastResult;
    let lastQuery;
    let useLocalFallback = false;

    const mapRecords = (data) => data.map(item => ({
        id: item.receipt_id,
        date: item.date,
        seller: sellers[item.seller_id],
        customer: customers[item.customer_id],
        total: item.total_amount
    }));

    const buildLocalIndexes = () => {
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

    const getIndexes = async () => {
        if (useLocalFallback) {
            return buildLocalIndexes();
        }
        if (!sellers || !customers) {
            try {
                const [sellersRes, customersRes] = await Promise.all([
                    fetch(`${BASE_URL}/sellers`).then(res => res.json()),
                    fetch(`${BASE_URL}/customers`).then(res => res.json()),
                ]);
                sellers = Object.entries(sellersRes).reduce((acc, [id, name]) => {
                    acc[id] = { id: Number(id), name };
                    return acc;
                }, {});
                customers = Object.entries(customersRes).reduce((acc, [id, name]) => {
                    acc[id] = { id: Number(id), name };
                    return acc;
                }, {});
            } catch (e) {
                console.warn('Сервер недоступен, переключаемся на локальные данные');
                useLocalFallback = true;
                return buildLocalIndexes();
            }
        }
        return { sellers, customers };
    };

    const getRecords = async (query, isUpdated = false) => {
        if (useLocalFallback) {
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
                customer: sellers[item.customer_id],
                total: item.total_amount
            }));
            return {
                total: allItems.length,
                items: mapped
            };
        }

        const qs = new URLSearchParams(query);
        const nextQuery = qs.toString();

        if (lastQuery === nextQuery && !isUpdated) {
            return lastResult;
        }

        try {
            const response = await fetch(`${BASE_URL}/records?${nextQuery}`);
            if (!response.ok) {
                console.warn('Server error, switching to local data');
                useLocalFallback = true;
                return getRecords(query, isUpdated);
            }
            const recordsData = await response.json();
            const records = recordsData.items || [];

            lastQuery = nextQuery;
            lastResult = {
                total: recordsData.total ?? records.length,
                items: mapRecords(records)
            };
            return lastResult;
        } catch (error) {
            console.warn('Network error, switching to local data');
            useLocalFallback = true;
            return getRecords(query, isUpdated);
        }
    };

    return { getIndexes, getRecords };
}