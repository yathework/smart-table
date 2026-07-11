// data.js
const BASE_URL = 'https://webinars.webdev.education-services.ru/sp7-api';

export function initData() {
    let sellers;
    let customers;
    let lastResult;
    let lastQuery;

    const mapRecords = (data) => data.map(item => ({
        id: item.receipt_id,
        date: item.date,
        seller: sellers[item.seller_id],
        customer: customers[item.customer_id],
        total: item.total_amount
    }));

    const getIndexes = async () => {
        if (!sellers || !customers) {
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
        }
        return { sellers, customers };
    };

    const getRecords = async (query, isUpdated = false) => {
        const qs = new URLSearchParams(query);
        const nextQuery = qs.toString();

        if (lastQuery === nextQuery && !isUpdated) {
            return lastResult;
        }

        try {
            const response = await fetch(`${BASE_URL}/records?${nextQuery}`);
            if (!response.ok) {
                console.warn('Server error, keeping previous data');
                return lastResult || { total: 0, items: [] };
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
            console.warn('Network error, keeping previous data', error);
            return lastResult || { total: 0, items: [] };
        }
    };

    return { getIndexes, getRecords };
}