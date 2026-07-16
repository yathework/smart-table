// data.js
import { data as sourceData } from './data/dataset_1.js';

const BASE_URL = 'https://webinars.webdev.education-services.ru/sp7-api';

export function initData() {
    let sellers;
    let customers;
    let lastResult;
    let lastQuery;
    let serverAvailable = true;

    const mapRecords = (data) => data.map(item => ({
        id: item.receipt_id,
        date: item.date,
        seller: sellers[item.seller_id],
        customer: customers[item.customer_id],
        total: item.total_amount
    }));

    const getIndexes = async () => {
        if (!sellers || !customers) {
            try {
                [sellers, customers] = await Promise.all([
                    fetch(`${BASE_URL}/sellers`).then(res => res.json()),
                    fetch(`${BASE_URL}/customers`).then(res => res.json()),
                ]);
            } catch (e) {
                console.warn('Сервер недоступен, используются локальные данные');
                serverAvailable = false;
                sellers = sourceData.sellers.reduce((acc, s) => {
                    acc[s.id] = { id: s.id, name: `${s.first_name} ${s.last_name}` };
                    return acc;
                }, {});
                customers = sourceData.customers.reduce((acc, c) => {
                    acc[c.id] = { id: c.id, name: `${c.first_name} ${c.last_name}` };
                    return acc;
                }, {});
            }
        }
        return { sellers, customers };
    };

    const getRecords = async (query, isUpdated = false) => {
        if (!serverAvailable) {
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
            console.warn('Ошибка сети, переключение на локальные данные');
            serverAvailable = false;
            if (!sellers || !customers) await getIndexes();
            return getRecords(query, isUpdated);
        }
    };

    return { getIndexes, getRecords };
}